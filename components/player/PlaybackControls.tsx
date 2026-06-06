import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1 } from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  shuffleMode: boolean;
  repeatMode: 'none' | 'one' | 'all';
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  shuffleMode,
  repeatMode,
  onTogglePlay,
  onNext,
  onPrev,
  onToggleShuffle,
  onToggleRepeat,
}) => {
  return (
    <div className="flex items-center gap-5">
      <button
        onClick={onToggleShuffle}
        className={`relative p-1.5 rounded-full hover:bg-neutral-800 transition-colors duration-200 ${
          shuffleMode ? 'text-violet-400' : 'text-neutral-400 hover:text-white'
        }`}
        title="Shuffle"
      >
        <Shuffle size={18} />
        {shuffleMode && (
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-violet-400 rounded-full" />
        )}
      </button>

      <button
        onClick={onPrev}
        className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors duration-200"
        title="Previous"
      >
        <SkipBack size={20} />
      </button>

      <button
        onClick={onTogglePlay}
        className="p-3 bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg shadow-violet-500/10"
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause size={22} fill="black" /> : <Play size={22} fill="black" className="translate-x-px" />}
      </button>

      <button
        onClick={onNext}
        className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors duration-200"
        title="Next"
      >
        <SkipForward size={20} />
      </button>

      <button
        onClick={onToggleRepeat}
        className={`relative p-1.5 rounded-full hover:bg-neutral-800 transition-colors duration-200 ${
          repeatMode !== 'none' ? 'text-violet-400' : 'text-neutral-400 hover:text-white'
        }`}
        title={`Repeat: ${repeatMode === 'one' ? 'One' : repeatMode === 'all' ? 'All' : 'Off'}`}
      >
        {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
        {repeatMode !== 'none' && (
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-violet-400 rounded-full" />
        )}
      </button>
    </div>
  );
};
