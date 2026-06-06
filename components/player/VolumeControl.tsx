import React from 'react';
import { Volume2, Volume1, VolumeX, Volume } from 'lucide-react';
import { Slider } from '../ui/slider';

interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (value: number) => void;
  onToggleMute: () => void;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
}) => {
  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX size={18} className="text-neutral-400" />;
    if (volume < 0.3) return <Volume size={18} className="text-neutral-400" />;
    if (volume < 0.7) return <Volume1 size={18} className="text-neutral-400" />;
    return <Volume2 size={18} className="text-neutral-400" />;
  };

  return (
    <div className="flex items-center gap-2 group w-32">
      <button 
        onClick={onToggleMute}
        className="hover:text-white transition-colors duration-200 p-1 rounded-full hover:bg-neutral-800"
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {getVolumeIcon()}
      </button>
      <Slider
        min={0}
        max={1}
        value={isMuted ? 0 : volume}
        onChange={onVolumeChange}
        className="py-2"
      />
    </div>
  );
};
