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
  const [speed, setSpeed] = useState<number>(isAlreadyShutdown ? 0 : 1.0);
  const [isLit, setIsLit] = useState<boolean>(!isAlreadyShutdown);
  const [reflectionText, setReflectionText] = useState<string>('');

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
          pixelRenderer.renderCarouselRide(
            ctx,
            time,
            isLit,
            phase === 'SHUTTING_DOWN',
            speed
          );
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isLit, phase, speed]);

  const handleStartRide = () => {
    setPhase('RIDING');
    setSpeed(1.0);
  };

  const handleTriggerShutdown = () => {
    setPhase('SHUTTING_DOWN');

    // Gradually decelerate carousel speed
    const slowdownTimer = setInterval(() => {
      setSpeed((prev) => {
        if (prev <= 0.05) {
          clearInterval(slowdownTimer);
          return 0;
        }
        return prev * 0.75;
      });
    }, 400);

    // Audio shutdown (waltz slows down, fades out, breaker click)
    soundEngine.shutDownCarousel(() => {
      setIsLit(false);
      setSpeed(0);
      setPhase('COMPLETED');
      setReflectionText('That was nice. It is okay that it is over.');
      onCompleteShutdown();
    });
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none">
      {/* 16:9 Viewport Canvas */}
      <canvas
        ref={canvasRef}
        width={480}
        height={270}
        className="w-full h-full object-cover pixelated"
      />

      {/* Atmospheric vignette */}
      <div className="absolute inset-0 vignette-overlay" />

      {/* HUD & Overlay controls */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 z-10 pointer-events-none">
        {/* Top Header / Title */}
        <div className="flex items-center justify-between">
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

        {/* Phase-specific interactions */}
        <div className="flex flex-col items-center justify-center w-full my-auto pointer-events-auto">
          {phase === 'APPROACH' && (
            <div className="bg-[#0b0f1d]/90 border border-[#2d3a60] p-4 text-center max-w-sm space-y-4 shadow-[4px_4px_0px_#000]">
              <p className="text-xs text-slate-300 font-['VT323'] tracking-wider">
                The painted carousel horses gleam under the incandescent garland.
                The organ waltz spins around in gentle circles.
              </p>
              <div className="flex justify-center gap-3">
                <PixelButton onClick={handleStartRide} size="md">
                  Ride
                </PixelButton>
              </div>
            </div>
          )}

          {phase === 'RIDING' && (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-[#0b0f1d]/85 border border-[#3b4b7c] px-4 py-2 text-center text-xs text-amber-100 font-['VT323'] tracking-wider">
                Warm lights, painted stirrups, and the simple joy of round and round.
              </div>
              <BreakerSwitch
                label="Attraction Control"
                sublabel="Gently bring the carousel to a stop"
                onActivate={handleTriggerShutdown}
              />
            </div>
          )}

          {phase === 'SHUTTING_DOWN' && (
            <div className="bg-[#080b14]/90 border border-[#23293e] px-5 py-3 text-center text-xs text-slate-300 font-['VT323'] tracking-widest animate-pulse">
              The gears slow down... The lights extinguish one by one...
            </div>
          )}

          {phase === 'COMPLETED' && (
            <div className="bg-[#070912]/92 border border-[#1b2236] p-5 text-center max-w-md space-y-4 shadow-[4px_4px_0px_#000]">
              <p className="text-sm sm:text-base text-amber-200/90 font-['VT323'] tracking-widest">
                {reflectionText || 'The carousel sits quiet and still in the cool night.'}
              </p>
              <p className="text-xs text-slate-400 font-['VT323'] tracking-wider">
                In the distance, the faint chirp of a cricket can now be heard.
              </p>
              <PixelButton onClick={onReturnToPark} size="md">
                Return to Park
              </PixelButton>
            </div>
          )}
        </div>

        {/* Bottom subtle note */}
        <div className="text-center text-[11px] text-slate-500 font-['VT323']">
          {phase === 'RIDING' ? 'Enjoy the final ride' : ''}
        </div>
      </div>
    </div>
  );
};
