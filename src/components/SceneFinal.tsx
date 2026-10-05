import React, { useEffect, useRef, useState } from 'react';
import { pixelRenderer } from '../canvas/pixelArtRenderer';
import { soundEngine } from '../audio/soundEngine';
import { PixelButton } from './PixelButton';

interface SceneFinalProps {
  onRestart: () => void;
}

export const SceneFinal: React.FC<SceneFinalProps> = ({ onRestart }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [revealAlpha, setRevealAlpha] = useState(0);
  const [textStage, setTextStage] = useState<0 | 1 | 2>(0);
  const [showRestart, setShowRestart] = useState(false);

  useEffect(() => {
    // 1. Remain in pitch darkness for 4 seconds while natural audio breathes
    const darknessTimer = setTimeout(() => {
      // 2. Slowly fade in over 5 seconds
      const fadeStartTime = performance.now();
      const fadeDuration = 4500;

      const fadeInterval = setInterval(() => {
        const elapsed = performance.now() - fadeStartTime;
        const progress = Math.min(1.0, elapsed / fadeDuration);
        setRevealAlpha(progress);

        if (progress >= 1.0) {
          clearInterval(fadeInterval);
        }
      }, 50);

      // 3. First minimal poetic line: "It's quiet now."
      setTimeout(() => {
        setTextStage(1);
        soundEngine.playQuietNightChime();
      }, 5500);

      // 4. Second line: "Once the artificial noise disappears, other things start to appear."
      setTimeout(() => {
        setTextStage(2);
      }, 10500);

      // 5. Allow restart after enjoying the quiet
      setTimeout(() => {
        setShowRestart(true);
      }, 15000);
    }, 4200);

    return () => clearTimeout(darknessTimer);
  }, []);

  // Animation loop for peaceful night
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
          pixelRenderer.renderQuietParkFinal(ctx, time, revealAlpha);
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [revealAlpha]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none bg-[#030408]">
      {/* 16:9 Canvas Viewport */}
      <canvas
        ref={canvasRef}
        width={480}
        height={270}
        className="w-full h-full object-cover pixelated"
      />

      {/* Atmospheric vignette */}
      <div className="absolute inset-0 vignette-overlay pointer-events-none" />

      {/* Gentle Poetic Text & Closure */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 sm:pb-12 pointer-events-none z-10">
        <div className="max-w-md mx-auto text-center px-6 space-y-3">
          {textStage >= 1 && (
            <p className="text-sm sm:text-base text-slate-200 font-['VT323'] tracking-widest transition-opacity duration-1000 opacity-95">
              It's quiet now.
            </p>
          )}

          {textStage >= 2 && (
            <p className="text-xs sm:text-sm text-slate-400 font-['VT323'] tracking-wider transition-opacity duration-1000 opacity-80 pt-1">
              Once the artificial noise disappears, other things start to appear.
            </p>
          )}

          {showRestart && (
            <div className="pt-6 pointer-events-auto transition-opacity duration-1000 opacity-90">
              <PixelButton onClick={onRestart} variant="ghost" size="sm">
                Begin Anew
              </PixelButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
