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

      {/* Title & Boss Message Card */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
        <div className="max-w-md w-full mx-auto space-y-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl text-[#fff3d6] font-['Silkscreen'] tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              WHEN THE LIGHTS GO OUT
            </h1>
          </div>

          {/* Simple routine message from the boss */}
          <div className="bg-[#0b0f1d]/95 border-2 border-[#2b385a] p-4 text-left shadow-[3px_3px_0px_#000]">
            <div className="flex items-center justify-between border-b border-[#1c2640] pb-1.5 mb-2.5">
              <span className="text-[11px] text-amber-300 font-['Silkscreen'] tracking-wider">
                Shift Memo
              </span>
              <span className="text-[10px] text-slate-400 font-['VT323']">
                22:45
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 font-['VT323'] leading-relaxed tracking-wider">
              "Hey, I'm heading back first. Can you close up all the facilities before you leave? Make sure everything is switched off."
            </p>
          </div>

          <div className="pt-2">
            <PixelButton onClick={handleEnter} size="md">
              Begin Closing Shift
            </PixelButton>
          </div>
        </div>
      </div>
    </div>
  );
};
