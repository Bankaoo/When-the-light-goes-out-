import React, { useEffect, useRef, useState } from 'react';
import { pixelRenderer } from '../canvas/pixelArtRenderer';
import { soundEngine, SoundLayerVolumes } from '../audio/soundEngine';
import { PixelButton } from './PixelButton';
import { Sliders, Sparkles, RotateCcw } from 'lucide-react';

interface SceneFinalProps {
  onRestart: () => void;
}

export const SceneFinal: React.FC<SceneFinalProps> = ({ onRestart }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [revealAlpha, setRevealAlpha] = useState(0);
  const [textStage, setTextStage] = useState<0 | 1 | 2>(0);
  const [showMixer, setShowMixer] = useState(false);
  const [canOpenMixer, setCanOpenMixer] = useState(false);

  // Live layer levels state
  const [levels, setLevels] = useState<SoundLayerVolumes>({
    wind: 0.15,
    insects: 0.35,
    nightBird: 0.45,
    leaves: 0.3,
    music: 0.0,
    machinery: 0.0,
  });

  useEffect(() => {
    // 1. Remain in pitch darkness for 3.8 seconds while natural audio breathes
    const darknessTimer = setTimeout(() => {
      // 2. Slowly fade in over 4.5 seconds
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

      // 3. First poetic line: "It's quiet now."
      setTimeout(() => {
        setTextStage(1);
      }, 5000);

      // 4. Second poetic line: "Once the artificial noise disappears, other things start to appear."
      setTimeout(() => {
        setTextStage(2);
      }, 9500);

      // 5. Enable the Soundscape Mixer
      setTimeout(() => {
        setCanOpenMixer(true);
      }, 12500);
    }, 3800);

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

  const handleSliderChange = (layer: keyof SoundLayerVolumes, val: number) => {
    const next = { ...levels, [layer]: val };
    setLevels(next);
    soundEngine.setLayerVolume(layer, val);
  };

  const handleResetToPeace = () => {
    const peacePreset: SoundLayerVolumes = {
      wind: 0.15,
      insects: 0.35,
      nightBird: 0.45,
      leaves: 0.3,
      music: 0.0,
      machinery: 0.0,
    };
    setLevels(peacePreset);
    Object.keys(peacePreset).forEach((k) => {
      soundEngine.setLayerVolume(k as keyof SoundLayerVolumes, peacePreset[k as keyof SoundLayerVolumes]);
    });
  };

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

      {/* Contextual controls docked along the BOTTOM EDGE */}
      <div className="absolute bottom-3 left-4 right-4 z-10 pointer-events-none flex flex-col items-center">
        {/* Poetic minimal lines */}
        <div className="text-center px-4 mb-2 max-w-lg">
          {textStage >= 1 && (
            <p className="text-xs sm:text-sm text-slate-200 font-['VT323'] tracking-widest transition-opacity duration-1000 opacity-95">
              It's quiet now.
            </p>
          )}

          {textStage >= 2 && (
            <p className="text-[11px] sm:text-xs text-slate-400 font-['VT323'] tracking-wider transition-opacity duration-1000 opacity-80 pt-0.5">
              Once the artificial noise disappears, other things start to appear.
            </p>
          )}
        </div>

        {/* Action bar (Mixer Toggle & Restart) */}
        {canOpenMixer && (
          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 transition-opacity duration-700">
            <PixelButton
              onClick={() => setShowMixer(!showMixer)}
              variant={showMixer ? 'primary' : 'secondary'}
              size="sm"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showMixer ? 'Hide Sound Mixer' : 'Adjust Soundscape'}</span>
            </PixelButton>

            <PixelButton onClick={onRestart} variant="ghost" size="sm">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Begin Anew</span>
            </PixelButton>
          </div>
        )}

        {/* Retro Nocturnal Sound Mixer Panel */}
        {showMixer && (
          <div className="pointer-events-auto mt-2 bg-[#090d18]/95 border-2 border-[#222e4d] p-3 rounded-none shadow-[3px_3px_0px_#000] w-full max-w-2xl text-left transition-all">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1b253f]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-[11px] text-slate-200 font-['Silkscreen'] tracking-wider">
                  NIGHT SOUNDSCAPE MIXER
                </span>
              </div>
              <button
                onClick={handleResetToPeace}
                className="text-[10px] text-slate-400 hover:text-slate-200 font-['VT323'] cursor-pointer"
              >
                [ Reset to Peaceful Night ]
              </button>
            </div>

            {/* Mixer Grid: Natural vs Artificial */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-[10px] font-['VT323'] text-slate-300">
              {/* Natural 1: Wind */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-slate-400">
                  <span>Night Wind</span>
                  <span>{Math.round(levels.wind * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={levels.wind}
                  onChange={(e) => handleSliderChange('wind', parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 h-1 bg-[#151c2e] cursor-pointer"
                />
              </div>

              {/* Natural 2: Insects */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-slate-400">
                  <span>Crickets & Insects</span>
                  <span>{Math.round(levels.insects * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={levels.insects}
                  onChange={(e) => handleSliderChange('insects', parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 h-1 bg-[#151c2e] cursor-pointer"
                />
              </div>

              {/* Natural 3: Night Birds */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-slate-400">
                  <span>Distant Night Birds</span>
                  <span>{Math.round(levels.nightBird * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={levels.nightBird}
                  onChange={(e) => handleSliderChange('nightBird', parseFloat(e.target.value))}
                  className="w-full accent-blue-400 h-1 bg-[#151c2e] cursor-pointer"
                />
              </div>

              {/* Natural 4: Leaves */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-slate-400">
                  <span>Rustling Leaves</span>
                  <span>{Math.round(levels.leaves * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={levels.leaves}
                  onChange={(e) => handleSliderChange('leaves', parseFloat(e.target.value))}
                  className="w-full accent-teal-400 h-1 bg-[#151c2e] cursor-pointer"
                />
              </div>

              {/* Artificial 1: Carousel Music */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-amber-300">
                  <span>Carousel Organ</span>
                  <span>{Math.round(levels.music * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={levels.music}
                  onChange={(e) => handleSliderChange('music', parseFloat(e.target.value))}
                  className="w-full accent-amber-400 h-1 bg-[#151c2e] cursor-pointer"
                />
              </div>

              {/* Artificial 2: Machinery */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-amber-300">
                  <span>Park Machinery</span>
                  <span>{Math.round(levels.machinery * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={levels.machinery}
                  onChange={(e) => handleSliderChange('machinery', parseFloat(e.target.value))}
                  className="w-full accent-rose-400 h-1 bg-[#151c2e] cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
