import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { ParkState } from '../types';

interface AudioHeaderProps {
  parkState: ParkState;
  onReset?: () => void;
}

export const AudioHeader: React.FC<AudioHeaderProps> = ({ parkState }) => {
  const [isMuted, setIsMuted] = useState(soundEngine.getMuted());

  const handleToggleMute = () => {
    const next = soundEngine.toggleMute();
    setIsMuted(next);
  };

  // Count remaining operating rides
  const shutdownCount =
    (parkState.carousel.shutdown ? 1 : 0) +
    (parkState.coaster.shutdown ? 1 : 0) +
    (parkState.ferris.shutdown ? 1 : 0);

  return (
    <header className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-slate-400 font-['Silkscreen'] select-none">
      {/* Title & Subtle State */}
      <div className="flex items-center gap-3">
        <span className="text-slate-200 tracking-wider">WHEN THE LIGHTS GO OUT</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span className="text-slate-400 hidden sm:inline">
          {shutdownCount === 0 && 'The park is open'}
          {shutdownCount === 1 && '1 attraction closed'}
          {shutdownCount === 2 && '2 attractions closed'}
          {shutdownCount === 3 && 'All attractions silent'}
        </span>
      </div>

      {/* Audio toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleToggleMute}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors p-1"
        >
          {isMuted ? (
            <>
              <VolumeX className="w-4 h-4 text-rose-400" />
              <span className="text-[11px] hidden sm:inline">Sound Off</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-[11px] hidden sm:inline">Sound On</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
