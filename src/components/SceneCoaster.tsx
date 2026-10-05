import React, { useEffect, useRef, useState } from 'react';
import { pixelRenderer } from '../canvas/pixelArtRenderer';
import { soundEngine } from '../audio/soundEngine';
import { BreakerSwitch } from './BreakerSwitch';
import { PixelButton } from './PixelButton';

interface SceneCoasterProps {
  isAlreadyShutdown: boolean;
  carouselShutdown: boolean;
  ferrisShutdown: boolean;
  onCompleteShutdown: () => void;
  onReturnToPark: () => void;
}

type CoasterPhase =
  | 'APPROACH'
  | 'CLIMBING'
  | 'PEAK_PAUSE'
  | 'LOOKING_UP'
  | 'LOOKING_DOWN'
  | 'DROPPING'
  | 'STATION_STOP'
  | 'SHUTTING_DOWN'
  | 'COMPLETED';

export const SceneCoaster: React.FC<SceneCoasterProps> = ({
  isAlreadyShutdown,
  carouselShutdown,
  ferrisShutdown,
  onCompleteShutdown,
  onReturnToPark,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<CoasterPhase>(
    isAlreadyShutdown ? 'COMPLETED' : 'APPROACH'
  );
  const [dropProgress, setDropProgress] = useState(0);

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

          switch (phase) {
            case 'APPROACH':
            case 'STATION_STOP':
            case 'SHUTTING_DOWN':
            case 'COMPLETED':
              pixelRenderer.renderMainPark(ctx, time, {
                carouselLit: !carouselShutdown,
                carouselRiding: false,
                coasterLit: phase !== 'COMPLETED' && !isAlreadyShutdown,
                coasterRiding: false,
                ferrisLit: !ferrisShutdown,
                ferrisRiding: !ferrisShutdown,
                darknessFactor: isAlreadyShutdown ? 0.6 : 0.3,
              });
              break;

            case 'CLIMBING':
            case 'PEAK_PAUSE':
              pixelRenderer.renderCoasterClimb(ctx, time, 0);
              break;

            case 'LOOKING_UP':
              pixelRenderer.renderCoasterLookUp(ctx, time);
              break;

            case 'LOOKING_DOWN':
              pixelRenderer.renderCoasterLookDown(ctx, time, carouselShutdown, !ferrisShutdown);
              break;

            case 'DROPPING':
              pixelRenderer.renderCoasterDrop(ctx, time, dropProgress);
              break;
          }
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [phase, dropProgress, carouselShutdown, ferrisShutdown, isAlreadyShutdown]);

  // Climb logic
  const handleStartRide = () => {
    setPhase('CLIMBING');
    soundEngine.startCoasterClanking();

    // Climb for 4 seconds then hold at peak
    setTimeout(() => {
      soundEngine.stopCoasterClanking();
      setPhase('PEAK_PAUSE');
    }, 4200);
  };

  // Drop logic
  const handleStartDrop = () => {
    setPhase('DROPPING');
    soundEngine.playCoasterDropRush();

    let progress = 0;
    const dropInterval = setInterval(() => {
      progress += 0.05;
      setDropProgress(progress);
      if (progress >= 1.0) {
        clearInterval(dropInterval);
        setPhase('STATION_STOP');
      }
    }, 120);
  };

  const handleShutdownCoaster = () => {
    setPhase('SHUTTING_DOWN');
    soundEngine.playBreakerThunk();

    setTimeout(() => {
      soundEngine.updateAtmosphereAfterCoaster();
      setPhase('COMPLETED');
      onCompleteShutdown();
    }, 1500);
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
      <div className="absolute inset-0 vignette-overlay pointer-events-none" />

      {/* Top Header */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
        <div className="bg-[#0b0e1b]/85 border border-[#232d4b] px-3 py-1.5 text-xs text-rose-300 font-['Silkscreen'] tracking-wider">
          [ ROLLER COASTER ]
        </div>
        <PixelButton
          onClick={onReturnToPark}
          variant="ghost"
          size="sm"
          className="pointer-events-auto"
        >
          ← Return to Park
        </PixelButton>
      </div>

      {/* Contextual controls docked along the BOTTOM EDGE (Center screen remains completely clear) */}
      <div className="absolute bottom-3 left-4 right-4 z-10 pointer-events-none flex items-end justify-center">
        {phase === 'APPROACH' && (
          <div className="pointer-events-auto bg-[#0b0f1d]/92 border border-[#2d3a60] p-3 text-center max-w-md w-full flex items-center justify-between gap-4 shadow-[3px_3px_0px_#000]">
            <p className="text-left text-xs text-slate-300 font-['VT323'] tracking-wider flex-1">
              The weathered timber track twists high into the dark.
              The lift chain hums with anticipation.
            </p>
            <PixelButton onClick={handleStartRide} size="sm">
              Ride
            </PixelButton>
          </div>
        )}

        {phase === 'CLIMBING' && (
          <div className="bg-[#080b14]/92 border border-[#23293e] px-4 py-2 text-center text-xs text-amber-200 font-['VT323'] tracking-widest animate-pulse shadow-[2px_2px_0px_#000]">
            Climbing higher... Clack... Clack... Clack...
          </div>
        )}

        {/* AT THE PEAK: Held for contemplation with Look Up / Look Down at the bottom */}
        {phase === 'PEAK_PAUSE' && (
          <div className="pointer-events-auto bg-[#080c18]/95 border border-[#263557] px-4 py-3 text-center max-w-lg w-full flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[3px_3px_0px_#000]">
            <div className="text-left text-xs text-slate-200 font-['VT323'] tracking-wider">
              Suspended between the sky and the ground.
            </div>
            <div className="flex items-center gap-2">
              <PixelButton
                onClick={() => setPhase('LOOKING_UP')}
                variant="secondary"
                size="sm"
              >
                Look Up
              </PixelButton>
              <PixelButton
                onClick={() => setPhase('LOOKING_DOWN')}
                variant="secondary"
                size="sm"
              >
                Look Down
              </PixelButton>
              <PixelButton
                onClick={handleStartDrop}
                variant="primary"
                size="sm"
              >
                Continue
              </PixelButton>
            </div>
          </div>
        )}

        {phase === 'LOOKING_UP' && (
          <div className="pointer-events-auto bg-[#050711]/95 border border-[#1b2540] px-4 py-3 text-center max-w-lg w-full flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[3px_3px_0px_#000]">
            <p className="text-left text-xs text-slate-200 font-['VT323'] tracking-widest flex-1">
              The moon feels unusually close tonight. Infinite stars whisper in the clear silence.
            </p>
            <div className="flex items-center gap-2">
              <PixelButton
                onClick={() => setPhase('PEAK_PAUSE')}
                variant="secondary"
                size="sm"
              >
                Back
              </PixelButton>
              <PixelButton
                onClick={() => setPhase('LOOKING_DOWN')}
                variant="secondary"
                size="sm"
              >
                Look Down
              </PixelButton>
              <PixelButton
                onClick={handleStartDrop}
                variant="primary"
                size="sm"
              >
                Continue
              </PixelButton>
            </div>
          </div>
        )}

        {phase === 'LOOKING_DOWN' && (
          <div className="pointer-events-auto bg-[#050711]/95 border border-[#1b2540] px-4 py-3 text-center max-w-lg w-full flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[3px_3px_0px_#000]">
            <p className="text-left text-xs text-slate-200 font-['VT323'] tracking-widest flex-1">
              Below, the paths weave among the sleeping attractions.
              {carouselShutdown ? ' The dark carousel rests in peace.' : ' The carousel still spins below.'}
            </p>
            <div className="flex items-center gap-2">
              <PixelButton
                onClick={() => setPhase('PEAK_PAUSE')}
                variant="secondary"
                size="sm"
              >
                Back
              </PixelButton>
              <PixelButton
                onClick={() => setPhase('LOOKING_UP')}
                variant="secondary"
                size="sm"
              >
                Look Up
              </PixelButton>
              <PixelButton
                onClick={handleStartDrop}
                variant="primary"
                size="sm"
              >
                Continue
              </PixelButton>
            </div>
          </div>
        )}

        {phase === 'DROPPING' && (
          <div className="text-center text-xs text-white font-['Silkscreen'] tracking-widest drop-shadow-[0_2px_4px_#000]">
            * WIND ROARING *
          </div>
        )}

        {phase === 'STATION_STOP' && (
          <div className="pointer-events-auto w-full max-w-lg flex items-center justify-between gap-3 bg-[#0b0f1d]/92 border border-[#2d3a60] p-2.5 shadow-[3px_3px_0px_#000]">
            <div className="text-left text-xs text-amber-100/90 font-['VT323'] tracking-wider px-1">
              The coaster glides gently back to the wooden platform.
            </div>
            <BreakerSwitch
              compact
              label="Track Power"
              sublabel="Disengage coaster grid"
              onActivate={handleShutdownCoaster}
            />
          </div>
        )}

        {phase === 'SHUTTING_DOWN' && (
          <div className="bg-[#080b14]/92 border border-[#23293e] px-4 py-2 text-center text-xs text-slate-300 font-['VT323'] tracking-widest animate-pulse shadow-[2px_2px_0px_#000]">
            Heavy clunk. The track floodlights extinguish. The motors fall silent.
          </div>
        )}

        {phase === 'COMPLETED' && (
          <div className="pointer-events-auto bg-[#070912]/95 border border-[#1b2236] p-3 text-center max-w-md w-full flex items-center justify-between gap-3 shadow-[3px_3px_0px_#000]">
            <div className="text-left">
              <p className="text-xs sm:text-sm text-amber-200/90 font-['VT323'] tracking-widest">
                The lift motor has ceased. The wooden tracks rest in the cool dark.
              </p>
              <p className="text-[11px] text-slate-400 font-['VT323']">
                A subtle breeze through the pine trees is now audible.
              </p>
            </div>
            <PixelButton onClick={onReturnToPark} size="sm">
              Return to Park
            </PixelButton>
          </div>
        )}
      </div>
    </div>
  );
};
