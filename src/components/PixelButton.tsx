import React from 'react';
import { soundEngine } from '../audio/soundEngine';

interface PixelButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PixelButton: React.FC<PixelButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  className = '',
  size = 'md',
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    soundEngine.playButtonChime();
    onClick();
  };

  const baseStyles =
    'relative inline-flex items-center justify-center font-["Silkscreen"] transition-all active:translate-y-0.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 select-none';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs tracking-wider',
    md: 'px-5 py-2.5 text-xs sm:text-sm tracking-widest',
    lg: 'px-7 py-3.5 text-sm sm:text-base tracking-widest',
  };

  const variantStyles = {
    primary:
      'bg-[#1e2746] hover:bg-[#2b3762] text-[#f1faee] border-2 border-[#4a5d96] shadow-[2px_2px_0px_#090d1a] hover:shadow-[3px_3px_0px_#090d1a]',
    secondary:
      'bg-[#121626] hover:bg-[#1c223c] text-[#a8b8db] border-2 border-[#2b3558] shadow-[2px_2px_0px_#050811]',
    danger:
      'bg-[#541212] hover:bg-[#781818] text-[#ffdddd] border-2 border-[#a83232] shadow-[2px_2px_0px_#220606]',
    ghost:
      'bg-transparent hover:bg-[#1a2035]/60 text-[#cbd5e1] border border-[#334155]/60',
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
};
