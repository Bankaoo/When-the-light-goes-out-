import React, { useEffect, useRef, useState } from 'react';
import { pixelRenderer } from '../canvas/pixelArtRenderer';
import { soundEngine } from '../audio/soundEngine';
import { BreakerSwitch } from './BreakerSwitch';
import { PixelButton } from './PixelButton';

interface SceneCarouselProps {
  isAlreadyShutdown: boolean;
  onCompleteShutdown: () => void;
  onReturnToPark: () => void;
}

type CarouselSubPhase = 'APPROACH' | 'RIDING' | 'SHUTTING_DOWN' | 'COMPLETED';

export const SceneCarousel: React.FC<SceneCarouselProps> = ({
  isAlreadyShutdown,
  onCompleteShutdown,
  onReturnToPark,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<CarouselSubPhase>(
    isAlreadyShutdown ? 'COMPLETED' : 'APPROACH'
  );
  const [isLit, setIsLit] = useState<boolean>(!isAlreadyShutdown);
  const [reflectionText, setReflectionText] = useState<string>('');

  // Smooth frame-based deceleration state refs
  const speedRef = useRef<number>(isAlreadyShutdown ? 0 : 1.0);
  const shutdownStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let animId: number;
    let startTime = performance.now();

    const loop = (now: number) => {
      const time = (now - startTime) / 1000;

      // Smooth mechanical deceleration with cubic ease-out
      if (phase === 'SHUTTING_DOWN') {
        if (!shutdownStartTimeRef.current) {
          shutdownStartTimeRef.current = now;
        }
        const elapsed = (now - shutdownStartTimeRef.current) / 1000;
        const duration = 4.2;
        const progress = Math.min(1.0, elapsed / duration);
        // Inertia curve: starts gliding, smoothly coasts down to absolute zero
        speedRef.current = Math.max(0, Math.pow(1 - progress, 2.2));
      } else if (phase === 'COMPLETED') {
        speedRef.current = 0;
      } else if (phase === 'RIDING') {
        speedRef.current = 1.0;
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          pixelRenderer.renderCarouselRide(
            ctx,
            time,
            isLit,
            phase === 'SHUTTING_DOWN',
            speedRef.current
          );
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isLit, phase]);

  const handleStartRide = () => {
    setPhase('RIDING');
    speedRef.current = 1.0;
  };

  const handleTriggerShutdown = () => {
    setPhase('SHUTTING_DOWN');
    shutdownStartTimeRef.current = null;

    soundEngine.shutDownCarousel(() => {
      setIsLit(false);
      speedRef.current = 0;
      setPhase('COMPLETED');
      setReflectionText('That was nice. It is okay that it is over.');
      onCompleteShutdown();
    });
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none">
      <canvas
        ref={canvasRef}
        width={480}
        height={270}
        className="w-full h-full object-cover pixelated"
      />

      <div className="absolute inset-0 vignette-overlay pointer-events-none" />

      {/* Top Header */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
        <div className="bg-[#0b0e1b]/85 border border-[#232d4b] px-3 py-1.5 text-xs text-amber-200/90 font-['Silkscreen'] tracking-wider">
          [ MERRY-GO-ROUND ]
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

      {/* Contextual controls docked along the BOTTOM EDGE */}
      <div className="absolute bottom-3 left-4 right-4 z-10 pointer-events-none flex items-end justify-center">
        {phase === 'APPROACH' && (
          <div className="pointer-events-auto bg-[#0b0f1d]/92 border border-[#2d3a60] p-3 text-center max-w-md w-full flex items-center justify-between gap-4 shadow-[3px_3px_0px_#000]">
            <p className="text-left text-xs text-slate-300 font-['VT323'] tracking-wider flex-1">
              The painted carousel horses gleam under incandescent lights.
              The calliope organ waltz plays gently.
            </p>
            <PixelButton onClick={handleStartRide} size="sm">
              Ride
            </PixelButton>
          </div>
        )}

        {phase === 'RIDING' && (
          <div className="pointer-events-auto w-full max-w-lg flex items-center justify-between gap-3 bg-[#0b0f1d]/92 border border-[#2d3a60] p-2.5 shadow-[3px_3px_0px_#000]">
            <div className="text-left text-xs text-amber-100/90 font-['VT323'] tracking-wider px-1">
              Warm lights, painted stirrups, and the simple joy of round and round.
            </div>
            <BreakerSwitch
              compact
              label="Attraction Control"
              sublabel="Gently bring to a stop"
              onActivate={handleTriggerShutdown}
            />
          </div>
        )}

        {phase === 'SHUTTING_DOWN' && (
          <div className="bg-[#080b14]/92 border border-[#23293e] px-4 py-2 text-center text-xs text-slate-300 font-['VT323'] tracking-widest animate-pulse shadow-[2px_2px_0px_#000]">
            The gears slow down... The lights extinguish one by one...
          </div>
        )}

        {phase === 'COMPLETED' && (
          <div className="pointer-events-auto bg-[#070912]/95 border border-[#1b2236] p-3 text-center max-w-md w-full flex items-center justify-between gap-3 shadow-[3px_3px_0px_#000]">
            <div className="text-left">
              <p className="text-xs sm:text-sm text-amber-200/90 font-['VT323'] tracking-widest">
                {reflectionText || 'The carousel sits quiet and still in the cool night.'}
              </p>
              <p className="text-[11px] text-slate-400 font-['VT323']">
                In the distance, the faint chirp of a cricket can now be heard.
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
