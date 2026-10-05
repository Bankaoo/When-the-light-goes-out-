import React, { useState } from 'react';
import { soundEngine } from '../audio/soundEngine';

interface BreakerSwitchProps {
  label: string;
  sublabel?: string;
  onActivate: () => void;
  disabled?: boolean;
}

export const BreakerSwitch: React.FC<BreakerSwitchProps> = ({
  label,
  sublabel,
  onActivate,
  disabled = false,
}) => {
  const [isPulled, setIsPulled] = useState(false);

  const handlePull = () => {
    if (disabled || isPulled) return;
    setIsPulled(true);
    soundEngine.playBreakerThunk();
    onActivate();
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-[#0d111d] border-2 border-[#222b44] shadow-[3px_3px_0px_#06080f] max-w-xs mx-auto">
      <div className="text-center mb-3">
        <div className="text-xs text-amber-200/90 font-['Silkscreen'] tracking-widest uppercase">
          {label}
        </div>
        {sublabel && (
          <div className="text-[11px] text-slate-400 font-['VT323'] mt-1">
            {sublabel}
          </div>
        )}
      </div>

      {/* Chunky retro switch box */}
      <button
        onClick={handlePull}
        disabled={disabled || isPulled}
        className={`group relative w-36 h-14 border-2 transition-all cursor-pointer select-none flex items-center justify-between px-3 ${
          isPulled
            ? 'bg-[#151821] border-[#2b334a] text-slate-500'
            : 'bg-[#1f273d] hover:bg-[#283350] border-[#4a5880] text-amber-300 shadow-[2px_2px_0px_#070a12]'
        }`}
      >
        <span className="font-['Silkscreen'] text-xs tracking-wider">
          {isPulled ? 'OFF' : 'SHUT DOWN'}
        </span>

        {/* Physical toggle lever visual */}
        <div className="relative w-8 h-8 bg-[#101420] border border-[#333d59] p-1 flex items-center">
          <div
            className={`w-4 h-6 transition-all duration-300 ${
              isPulled
                ? 'translate-x-3 bg-slate-600'
                : 'translate-x-0 bg-amber-400 group-hover:bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
            }`}
          />
        </div>
      </button>
    </div>
  );
};
