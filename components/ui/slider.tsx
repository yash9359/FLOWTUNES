import React from 'react';

interface SliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({ min, max, value, onChange, className = '' }) => {
  const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <div className={`relative flex items-center select-none touch-none w-full group ${className}`}>
      <div className="relative w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-linear-to-r from-violet-500 to-indigo-500 rounded-full group-hover:from-violet-400 group-hover:to-indigo-400"
          style={{ width: `${percent}%` }}
        />
      </div>
      
      <div 
        className="absolute top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ left: `${percent}%` }}
      />

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
      />
    </div>
  );
};
