import React, { useEffect, useRef, useState } from 'react';
import { pixelRenderer } from '../canvas/pixelArtRenderer';
import { ParkState } from '../types';

interface SceneEntranceProps {
  parkState: ParkState;
  onSelectRide: (ride: 'carousel' | 'coaster' | 'ferris') => void;
  onProceedToEnding: () => void;
}

export const SceneEntrance: React.FC<SceneEntranceProps> = ({
  parkState,
  onSelectRide,
  onProceedToEnding,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredRide, setHoveredRide] = useState<string | null>(null);

  // Compute darkness level based on shutdown progress
  const shutdownCount =
    (parkState.carousel.shutdown ? 1 : 0) +
    (parkState.coaster.shutdown ? 1 : 0) +
    (parkState.ferris.shutdown ? 1 : 0);

  const darknessFactor = shutdownCount * 0.33;
  const allClosed = shutdownCount === 3;

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
            carouselLit: !parkState.carousel.shutdown,
            carouselRiding: !parkState.carousel.shutdown,
            coasterLit: !parkState.coaster.shutdown,
            coasterRiding: !parkState.coaster.shutdown,
            ferrisLit: !parkState.ferris.shutdown,
            ferrisRiding: !parkState.ferris.shutdown,
            darknessFactor: darknessFactor,
          });
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [parkState, darknessFactor]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none">
      {/* 16:9 Canvas Viewport */}
      <canvas
        ref={canvasRef}
        width={480}
        height={270}
        className="w-full h-full object-cover pixelated"
      />

      {/* Atmospheric subtle vignette */}
      <div className="absolute inset-0 vignette-overlay" />

      {/* Interactive Contextual Hotspots over Attractions */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Attraction 1: Merry-go-round (Left) */}
        <div className="absolute left-[8%] sm:left-[10%] top-[45%] pointer-events-auto">
          <button
            onClick={() => onSelectRide('carousel')}
            onMouseEnter={() => setHoveredRide('carousel')}
            onMouseLeave={() => setHoveredRide(null)}
            className={`px-3 py-1.5 font-['Silkscreen'] text-[11px] sm:text-xs transition-all border cursor-pointer ${
              parkState.carousel.shutdown
                ? 'bg-[#0f1422]/80 border-[#23293e] text-slate-500 hover:text-slate-300'
                : 'bg-[#221c17]/90 hover:bg-[#3d2f23] border-[#f4a261] text-[#ffe6a7] shadow-[2px_2px_0px_#000]'
            }`}
          >
            {parkState.carousel.shutdown ? '[ Carousel · Closed ]' : '[ Merry-Go-Round ]'}
          </button>
        </div>

        {/* Attraction 2: Roller Coaster (Center-Right) */}
        <div className="absolute left-[40%] sm:left-[44%] top-[34%] pointer-events-auto">
          <button
            onClick={() => onSelectRide('coaster')}
            onMouseEnter={() => setHoveredRide('coaster')}
            onMouseLeave={() => setHoveredRide(null)}
            className={`px-3 py-1.5 font-['Silkscreen'] text-[11px] sm:text-xs transition-all border cursor-pointer ${
              parkState.coaster.shutdown
                ? 'bg-[#0f1422]/80 border-[#23293e] text-slate-500 hover:text-slate-300'
                : 'bg-[#211624]/90 hover:bg-[#3c2543] border-[#e76f51] text-[#ffddd2] shadow-[2px_2px_0px_#000]'
            }`}
          >
            {parkState.coaster.shutdown ? '[ Roller Coaster · Closed ]' : '[ Roller Coaster ]'}
          </button>
        </div>

        {/* Attraction 3: Ferris Wheel (Right) */}
        <div className="absolute right-[8%] sm:right-[12%] top-[38%] pointer-events-auto">
          <button
            onClick={() => onSelectRide('ferris')}
            onMouseEnter={() => setHoveredRide('ferris')}
            onMouseLeave={() => setHoveredRide(null)}
            className={`px-3 py-1.5 font-['Silkscreen'] text-[11px] sm:text-xs transition-all border cursor-pointer ${
              parkState.ferris.shutdown
                ? 'bg-[#0f1422]/80 border-[#23293e] text-slate-500 hover:text-slate-300'
                : 'bg-[#121f2d]/90 hover:bg-[#1a344d] border-[#48cae4] text-[#caf0f8] shadow-[2px_2px_0px_#000]'
            }`}
          >
            {parkState.ferris.shutdown ? '[ Ferris Wheel · Closed ]' : '[ Ferris Wheel ]'}
          </button>
        </div>
      </div>

      {/* Bottom Status / Guidance bar */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="bg-[#080b14]/80 border border-[#1e2538] px-3 py-1.5 text-[11px] text-slate-300 font-['VT323'] tracking-wider">
          {hoveredRide === 'carousel' && (
            parkState.carousel.shutdown ? 'The carousel sits quiet and motionless in the dark.' : 'A warm, spinning carousel with cheerful waltz music.'
          )}
          {hoveredRide === 'coaster' && (
            parkState.coaster.shutdown ? 'The wooden roller coaster tracks rest silently against the stars.' : 'The towering coaster climbs high into the nighttime air.'
          )}
          {hoveredRide === 'ferris' && (
            parkState.ferris.shutdown ? 'The giant wheel stands still in the moonlight.' : 'The grand Ferris wheel overlooks the sleeping valley.'
          )}
          {!hoveredRide && (
            allClosed
              ? 'All rides have been closed down.'
              : 'Choose an attraction to ride one final time.'
          )}
        </div>

        {allClosed && (
          <button
            onClick={onProceedToEnding}
            className="pointer-events-auto px-4 py-1.5 bg-[#1b2640] hover:bg-[#26375f] border-2 border-[#48cae4] text-[#caf0f8] font-['Silkscreen'] text-xs cursor-pointer shadow-[2px_2px_0px_#000] tracking-wider animate-pulse"
          >
            [ The Park is Quiet ]
          </button>
        )}
      </div>
    </div>
  );
};
