import React, { useState } from 'react';
import { soundEngine } from '../audio/soundEngine';

interface BreakerSwitchProps {
  label: string;
  sublabel?: string;
  onActivate: () => void;
  disabled?: boolean;
  compact?: boolean;
}

export const BreakerSwitch: React.FC<BreakerSwitchProps> = ({
  label,
  sublabel,
  onActivate,
  disabled = false,
  compact = false,
}) => {
  const [isPulled, setIsPulled] = useState(false);

  const handlePull = () => {
    if (disabled || isPulled) return;
    setIsPulled(true);
    soundEngine.playBreakerThunk();
    onActivate();
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-[#0a0d18]/90 border border-[#263252] px-3 py-2 shadow-[2px_2px_0px_#000]">
        <div className="text-left">
          <div className="text-[11px] text-amber-200/90 font-['Silkscreen'] tracking-wider">
            {label}
          </div>
          {sublabel && (
            <div className="text-[10px] text-slate-400 font-['VT323']">
              {sublabel}
            </div>
          )}
        </div>

        <button
          onClick={handlePull}
          disabled={disabled || isPulled}
          className={`group relative h-9 px-3 border transition-all cursor-pointer select-none flex items-center gap-2 ${
            isPulled
              ? 'bg-[#121520] border-[#22293d] text-slate-600'
              : 'bg-[#1b233a] hover:bg-[#253050] border-[#44537d] text-amber-300 shadow-[1px_1px_0px_#000]'
          }`}
        >
          <span className="font-['Silkscreen'] text-[10px] tracking-wider">
            {isPulled ? 'OFF' : 'SHUT DOWN'}
          </span>
          <div className="relative w-5 h-5 bg-[#0b0e18] border border-[#2b354f] flex items-center p-0.5">
            <div
              className={`w-2 h-4 transition-all duration-300 ${
                isPulled
                  ? 'translate-x-2 bg-slate-600'
                  : 'translate-x-0 bg-amber-400 group-hover:bg-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.6)]'
              }`}
            />
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-3 sm:p-4 bg-[#0d111d]/95 border-2 border-[#222b44] shadow-[3px_3px_0px_#06080f] max-w-xs mx-auto">
      <div className="text-center mb-2.5">
        <div className="text-xs text-amber-200/90 font-['Silkscreen'] tracking-widest uppercase">
          {label}
        </div>
        {sublabel && (
          <div className="text-[11px] text-slate-400 font-['VT323'] mt-0.5">
            {sublabel}
          </div>
        )}
      </div>

      {/* Chunky retro switch box */}
      <button
        onClick={handlePull}
        disabled={disabled || isPulled}
        className={`group relative w-36 h-12 border-2 transition-all cursor-pointer select-none flex items-center justify-between px-3 ${
          isPulled
            ? 'bg-[#151821] border-[#2b334a] text-slate-500'
            : 'bg-[#1f273d] hover:bg-[#283350] border-[#4a5880] text-amber-300 shadow-[2px_2px_0px_#070a12]'
        }`}
      >
        <span className="font-['Silkscreen'] text-xs tracking-wider">
          {isPulled ? 'OFF' : 'SHUT DOWN'}
        </span>

        {/* Physical toggle lever visual */}
        <div className="relative w-7 h-7 bg-[#101420] border border-[#333d59] p-0.5 flex items-center">
          <div
            className={`w-3.5 h-5 transition-all duration-300 ${
              isPulled
                ? 'translate-x-2.5 bg-slate-600'
                : 'translate-x-0 bg-amber-400 group-hover:bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
            }`}
          />
        </div>
      </button>
    </div>
  );
};
