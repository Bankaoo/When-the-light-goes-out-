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

    // Drop duration
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
      <div className="absolute inset-0 vignette-overlay" />

      {/* Overlay controls */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 z-10 pointer-events-none">
        {/* Top Header */}
        <div className="flex items-center justify-between">
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

        {/* Phase interactions */}
        <div className="flex flex-col items-center justify-center w-full my-auto pointer-events-auto">
          {phase === 'APPROACH' && (
            <div className="bg-[#0b0f1d]/90 border border-[#2d3a60] p-4 text-center max-w-sm space-y-4 shadow-[4px_4px_0px_#000]">
              <p className="text-xs text-slate-300 font-['VT323'] tracking-wider">
                The weathered timber track twists high into the dark.
                The lift chain hums with anticipation.
              </p>
              <div className="flex justify-center gap-3">
                <PixelButton onClick={handleStartRide} size="md">
                  Ride
                </PixelButton>
              </div>
            </div>
          )}

          {phase === 'CLIMBING' && (
            <div className="bg-[#080b14]/90 border border-[#23293e] px-5 py-3 text-center text-xs text-amber-200 font-['VT323'] tracking-widest animate-pulse">
              Climbing higher... Clack... Clack... Clack...
            </div>
          )}

          {/* AT THE PEAK: Held for contemplation with Look Up / Look Down */}
          {phase === 'PEAK_PAUSE' && (
            <div className="bg-[#080c18]/92 border border-[#263557] p-5 text-center max-w-md space-y-4 shadow-[4px_4px_0px_#000]">
              <div className="text-xs sm:text-sm text-slate-200 font-['VT323'] tracking-widest">
                The coaster balances motionlessly at the summit.
                Suspended between the sky and the ground.
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-1">
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
            <div className="bg-[#050711]/90 border border-[#1b2540] p-4 text-center max-w-md space-y-3 shadow-[4px_4px_0px_#000]">
              <p className="text-xs sm:text-sm text-slate-200 font-['VT323'] tracking-widest">
                The moon feels unusually close tonight.
                Infinite stars whisper in the clear silence.
              </p>
              <div className="flex justify-center gap-2">
                <PixelButton
                  onClick={() => setPhase('PEAK_PAUSE')}
                  variant="secondary"
                  size="sm"
                >
                  Back to Track
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
            <div className="bg-[#050711]/90 border border-[#1b2540] p-4 text-center max-w-md space-y-3 shadow-[4px_4px_0px_#000]">
              <p className="text-xs sm:text-sm text-slate-200 font-['VT323'] tracking-widest">
                Below, the paths weave among the sleeping attractions.
                {carouselShutdown ? ' The dark carousel rests in the corner.' : ' The carousel still spins below.'}
              </p>
              <div className="flex justify-center gap-2">
                <PixelButton
                  onClick={() => setPhase('PEAK_PAUSE')}
                  variant="secondary"
                  size="sm"
                >
                  Back to Track
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
            <div className="bg-transparent text-center text-sm text-white font-['Silkscreen'] tracking-widest drop-shadow-[0_2px_4px_#000]">
              * WIND ROARING *
            </div>
          )}

          {phase === 'STATION_STOP' && (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-[#0b0f1d]/85 border border-[#3b4b7c] px-4 py-2 text-center text-xs text-amber-100 font-['VT323'] tracking-wider">
                The coaster glides gently back to the wooden platform.
              </div>
              <BreakerSwitch
                label="Lift Motor & Track Lights"
                sublabel="Disengage coaster power grid"
                onActivate={handleShutdownCoaster}
              />
            </div>
          )}

          {phase === 'SHUTTING_DOWN' && (
            <div className="bg-[#080b14]/90 border border-[#23293e] px-5 py-3 text-center text-xs text-slate-300 font-['VT323'] tracking-widest animate-pulse">
              Heavy clunk. The track floodlights extinguish.
            </div>
          )}

          {phase === 'COMPLETED' && (
            <div className="bg-[#070912]/92 border border-[#1b2236] p-5 text-center max-w-md space-y-4 shadow-[4px_4px_0px_#000]">
              <p className="text-sm sm:text-base text-amber-200/90 font-['VT323'] tracking-widest">
                The lift motor has ceased. The wooden tracks rest in the cool dark.
              </p>
              <p className="text-xs text-slate-400 font-['VT323'] tracking-wider">
                The breeze through the pine trees is now louder than any machine.
              </p>
              <PixelButton onClick={onReturnToPark} size="md">
                Return to Park
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
