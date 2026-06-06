import React from 'react';
import { Slider } from '../ui/slider';

interface ProgressBarProps {
  progress: number;
  duration: number;
  onSeek: (time: number) => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, duration, onSeek }) => {
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center gap-3 w-full">
      <span className="text-xs text-neutral-400 select-none w-10 text-right">
        {formatTime(progress)}
      </span>
      <Slider
        min={0}
        max={duration || 100}
        value={progress}
        onChange={onSeek}
        className="flex-1 py-2"
      />
      <span className="text-xs text-neutral-400 select-none w-10">
        {formatTime(duration)}
      </span>
    </div>
  );
};
