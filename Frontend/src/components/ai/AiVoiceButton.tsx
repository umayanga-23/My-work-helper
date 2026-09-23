import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { clsx } from 'clsx';

interface AiVoiceButtonProps {
  isListening: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AiVoiceButton: React.FC<AiVoiceButtonProps> = ({
  isListening,
  onToggle,
  disabled = false,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  return (
    <div className="relative inline-flex items-center justify-center">
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-xl bg-rose-500/30 animate-ping" />
          <span className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-rose-500/20 to-amber-500/20 animate-pulse" />
        </>
      )}

      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        title={isListening ? 'Listening... Click to stop' : 'Click to Speak (Voice Command)'}
        className={clsx(
          'relative rounded-xl flex items-center justify-center transition-all cursor-pointer select-none active:scale-95 disabled:opacity-40',
          sizeClasses,
          isListening
            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 ring-2 ring-rose-400 animate-pulse'
            : 'bg-[#F3FBF7] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] hover:bg-[#E8F7EF] dark:hover:bg-[#1A3326] border border-[#DCE9E1] dark:border-[#20372B]',
          className
        )}
      >
        {isListening ? (
          <MicOff className={iconSizes} />
        ) : (
          <Mic className={iconSizes} />
        )}
      </button>
    </div>
  );
};
