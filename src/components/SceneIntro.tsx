import React, { useEffect, useRef } from 'react';
import { pixelRenderer } from '../canvas/pixelArtRenderer';
import { soundEngine } from '../audio/soundEngine';
import { PixelButton } from './PixelButton';

interface SceneIntroProps {
  onStart: () => void;
}

export const SceneIntro: React.FC<SceneIntroProps> = ({ onStart }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
          pixelRenderer.renderMainPark(ctx, time, {
            carouselLit: true,
            carouselRiding: true,
            coasterLit: true,
            coasterRiding: false,
            ferrisLit: true,
            ferrisRiding: true,
            darknessFactor: 0.1,
          });
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleEnter = () => {
    soundEngine.init();
    onStart();
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* 16:9 Canvas Background */}
      <canvas
        ref={canvasRef}
        width={480}
        height={270}
        className="w-full h-full object-cover pixelated"
      />

      {/* Atmospheric dark gradient vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#060814]/90 via-[#060814]/40 to-[#060814]/60 pointer-events-none" />

      {/* Title & Introduction Card */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
        <div className="max-w-xl mx-auto space-y-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl md:text-4xl text-[#fff3d6] font-['Silkscreen'] tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              WHEN THE LIGHTS GO OUT
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-['VT323'] tracking-wider">
              A gentle story about the final night of an amusement park.
            </p>
          </div>

          <div className="pt-6">
            <PixelButton onClick={handleEnter} size="lg">
              Enter the Park
            </PixelButton>
          </div>

          <div className="pt-4 text-[11px] text-slate-400 font-['VT323'] tracking-widest opacity-80">
            Audio on · Recommended with headphones
          </div>
        </div>
      </div>
    </div>
  );
};
