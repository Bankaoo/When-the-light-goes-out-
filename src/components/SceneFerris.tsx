import React, { useEffect, useRef, useState } from 'react';
import { pixelRenderer } from '../canvas/pixelArtRenderer';
import { soundEngine } from '../audio/soundEngine';
import { BreakerSwitch } from './BreakerSwitch';
import { PixelButton } from './PixelButton';

interface SceneFerrisProps {
  isAlreadyShutdown: boolean;
  onCompleteShutdown: () => void;
  onReturnToPark: () => void;
  onProceedToQuietEnding: () => void;
}

type FerrisAltitude = 'GROUND' | 'LOW' | 'MIDDLE' | 'HIGH' | 'PEAK';
type FerrisPhase =
  | 'APPROACH'
  | 'ASCENDING'
  | 'PEAK'
  | 'DESCENDING'
  | 'GROUND_EXIT'
  | 'SHUTTING_DOWN'
  | 'COMPLETED';

export const SceneFerris: React.FC<SceneFerrisProps> = ({
  isAlreadyShutdown,
  onCompleteShutdown,
  onReturnToPark,
  onProceedToQuietEnding,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [altitude, setAltitude] = useState<FerrisAltitude>('GROUND');
  const [phase, setPhase] = useState<FerrisPhase>(
    isAlreadyShutdown ? 'COMPLETED' : 'APPROACH'
  );
  const [isLit, setIsLit] = useState<boolean>(!isAlreadyShutdown);

  useEffect(() => {
    let animId: number;
    let startTime = performance.now();

    const loop = (now: number) => {
      const time = (now - startTime) / 1000;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = false;

          if (phase === 'APPROACH' || phase === 'COMPLETED') {
            pixelRenderer.renderMainPark(ctx, time, {
              carouselLit: false,
              carouselRiding: false,
              coasterLit: false,
              coasterRiding: false,
              ferrisLit: isLit,
              ferrisRiding: false,
              darknessFactor: 0.7,
            });
          } else {
            pixelRenderer.renderFerrisWheelRide(ctx, time, altitude, isLit);
          }
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [altitude, phase, isLit]);

  // Ascending flow through stages: GROUND -> LOW -> MIDDLE -> HIGH -> PEAK
  const handleStartAscent = () => {
    setPhase('ASCENDING');
    setAltitude('LOW');

    setTimeout(() => {
      setAltitude('MIDDLE');
    }, 2500);

    setTimeout(() => {
      setAltitude('HIGH');
    }, 5000);

    setTimeout(() => {
      setAltitude('PEAK');
      setPhase('PEAK');
      soundEngine.playQuietNightChime();
    }, 7500);
  };

  const handleDescend = () => {
    setPhase('DESCENDING');
    setAltitude('HIGH');

    setTimeout(() => {
      setAltitude('MIDDLE');
    }, 2200);

    setTimeout(() => {
      setAltitude('LOW');
    }, 4400);

    setTimeout(() => {
      setAltitude('GROUND');
      setPhase('GROUND_EXIT');
    }, 6600);
  };

  const handleShutdownFerris = () => {
    setPhase('SHUTTING_DOWN');
    soundEngine.playBreakerThunk();

    setTimeout(() => {
      setIsLit(false);
      soundEngine.updateAtmosphereAfterFerris();
      setPhase('COMPLETED');
      onCompleteShutdown();

      // Seamlessly transition into the final quiet darkness sequence after 2.5 seconds
      setTimeout(() => {
        onProceedToQuietEnding();
      }, 2500);
    }, 1800);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none">
      {/* 16:9 Canvas Viewport */}
      <canvas
        ref={canvasRef}
        width={480}
        height={270}
        className="w-full h-full object-cover pixelated"
      />

      {/* Atmospheric vignette */}
      <div className="absolute inset-0 vignette-overlay" />

      {/* Overlay UI */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 z-10 pointer-events-none">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="bg-[#0b0e1b]/85 border border-[#232d4b] px-3 py-1.5 text-xs text-cyan-300 font-['Silkscreen'] tracking-wider">
            [ FERRIS WHEEL ]
          </div>
          {phase !== 'SHUTTING_DOWN' && phase !== 'COMPLETED' && (
            <PixelButton
              onClick={onReturnToPark}
              variant="ghost"
              size="sm"
              className="pointer-events-auto"
            >
              ← Return to Park
            </PixelButton>
          )}
        </div>

        {/* Phase interactions */}
        <div className="flex flex-col items-center justify-center w-full my-auto pointer-events-auto">
          {phase === 'APPROACH' && (
            <div className="bg-[#0b0f1d]/90 border border-[#2d3a60] p-4 text-center max-w-sm space-y-4 shadow-[4px_4px_0px_#000]">
              <p className="text-xs text-slate-300 font-['VT323'] tracking-wider">
                The park around has grown quiet and dark.
                The Ferris wheel stands alone, a circle of gentle light against the stars.
              </p>
              <div className="flex justify-center gap-3">
                <PixelButton onClick={handleStartAscent} size="md">
                  Ride
                </PixelButton>
              </div>
            </div>
          )}

          {phase === 'ASCENDING' && (
            <div className="bg-[#080b14]/90 border border-[#23293e] px-5 py-3 text-center text-xs text-cyan-200 font-['VT323'] tracking-widest animate-pulse">
              Rising slowly... {altitude === 'LOW' && 'Leaving the ground behind...'}
              {altitude === 'MIDDLE' && 'The lights below shrink into embers...'}
              {altitude === 'HIGH' && 'Entering the stillness of the upper air...'}
            </div>
          )}

          {/* AT THE PEAK: Contemplative, peaceful, timeless */}
          {phase === 'PEAK' && (
            <div className="bg-[#050811]/92 border border-[#233559] p-5 text-center max-w-md space-y-4 shadow-[4px_4px_0px_#000]">
              <div className="space-y-1.5">
                <p className="text-sm sm:text-base text-cyan-100 font-['VT323'] tracking-widest">
                  At the peak.
                </p>
                <p className="text-xs sm:text-sm text-slate-300 font-['VT323'] tracking-wider">
                  The amusement park has gone quiet.
                  I can finally hear the night.
                </p>
              </div>
              <div className="flex justify-center pt-2">
                <PixelButton onClick={handleDescend} size="md">
                  Descend
                </PixelButton>
              </div>
            </div>
          )}

          {phase === 'DESCENDING' && (
            <div className="bg-[#080b14]/90 border border-[#23293e] px-5 py-3 text-center text-xs text-slate-300 font-['VT323'] tracking-widest animate-pulse">
              Descending gently back to earth...
              Wind murmurs through the dark trees...
            </div>
          )}

          {phase === 'GROUND_EXIT' && (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-[#0b0f1d]/85 border border-[#3b4b7c] px-4 py-2 text-center text-xs text-cyan-100 font-['VT323'] tracking-wider">
                The gondola touches the wooden dock.
                The final ride is complete.
              </div>
              <BreakerSwitch
                label="Master Generator"
                sublabel="Extinguish the final park lights"
                onActivate={handleShutdownFerris}
              />
            </div>
          )}

          {phase === 'SHUTTING_DOWN' && (
            <div className="bg-[#080b14]/90 border border-[#23293e] px-5 py-3 text-center text-xs text-slate-300 font-['VT323'] tracking-widest animate-pulse">
              The rim lights fade sequentially... Total quiet descends...
            </div>
          )}

          {phase === 'COMPLETED' && (
            <div className="bg-[#070912]/92 border border-[#1b2236] p-5 text-center max-w-md space-y-4 shadow-[4px_4px_0px_#000]">
              <p className="text-sm sm:text-base text-cyan-200/90 font-['VT323'] tracking-widest">
                The last light has gone out.
              </p>
              <PixelButton onClick={onProceedToQuietEnding} size="md">
                Into the Quiet
              </PixelButton>
            </div>
          )}
        </div>

        {/* Bottom subtle note */}
        <div className="text-center text-[11px] text-slate-500 font-['VT323']" />
      </div>
    </div>
  );
};
