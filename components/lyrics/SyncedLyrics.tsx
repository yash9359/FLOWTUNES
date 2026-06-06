'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useAppStore } from '@/lib/store/useAppStore';
import { Music, X, AlignLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface LyricsLine {
  time: number;
  text: string;
}

interface SyncedLyricsProps {
  onClose: () => void;
}

export const SyncedLyrics: React.FC<SyncedLyricsProps> = ({ onClose }) => {
  const { currentSong, progress, seek } = usePlayer();
  const [lyrics, setLyrics] = useState<LyricsLine[]>([]);
  const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
  const [isInstrumental, setIsInstrumental] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const activeIndexRef = useRef<number>(-1);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!currentSong) return;

    const fetchLyrics = async () => {
      setIsLoading(true);
      setLyrics([]);
      setPlainLyrics(null);
      setIsInstrumental(false);

      const store = useAppStore.getState();
      const cached = store.getCachedLyrics(currentSong.id);
      if (cached) {
        if (cached.instrumental) {
          setIsInstrumental(true);
        } else if (cached.synced) {
          parseLrc(cached.synced);
        } else if (cached.plain) {
          setPlainLyrics(cached.plain);
        }
        setIsLoading(false);
        return;
      }

      try {
        const title = encodeURIComponent(currentSong.title);
        const artist = encodeURIComponent(currentSong.artist);
        const duration = currentSong.duration;
        const res = await fetch(`/api/lyrics?title=${title}&artist=${artist}&duration=${duration}&id=${currentSong.id}`);
        
        if (res.ok) {
          const data = await res.json();
          
          store.setCachedLyrics(currentSong.id, {
            synced: data.synced || null,
            plain: data.plain || null,
            instrumental: !!data.instrumental
          });

          if (data.instrumental) {
            setIsInstrumental(true);
          } else if (data.synced) {
            parseLrc(data.synced);
          } else if (data.plain) {
            setPlainLyrics(data.plain);
          }
        }
      } catch (error) {
        console.error('[Lyrics UI] Fetch lyrics failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLyrics();
  }, [currentSong]);

  const parseLrc = (lrcText: string) => {
    const lines = lrcText.split('\n');
    const parsedLines: LyricsLine[] = [];
    const timeReg = /\[(\d+):(\d+)(?:\.(\d+))?\]/g;

    for (const line of lines) {
      const text = line.replace(timeReg, '').trim();
      timeReg.lastIndex = 0;
      const matches = [...line.matchAll(timeReg)];
      
      for (const match of matches) {
        const min = parseInt(match[1]);
        const sec = parseInt(match[2]);
        const ms = match[3] ? parseInt(match[3]) : 0;
        const time = min * 60 + sec + (ms > 99 ? ms / 1000 : ms / 100);
        parsedLines.push({ time, text });
      }
    }

    parsedLines.sort((a, b) => a.time - b.time);
    
    setLyrics(parsedLines.filter(line => line.text !== ''));
  };

  let currentActiveIndex = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (progress >= lyrics[i].time) {
      currentActiveIndex = i;
    } else {
      break;
    }
  }

  useEffect(() => {
    if (currentActiveIndex !== -1 && currentActiveIndex !== activeIndexRef.current) {
      activeIndexRef.current = currentActiveIndex;
      const activeLineEl = lineRefs.current[currentActiveIndex];
      const containerEl = scrollContainerRef.current;
      
      if (activeLineEl && containerEl) {
        const containerHeight = containerEl.clientHeight;
        const lineOffsetTop = activeLineEl.offsetTop;
        const lineHeight = activeLineEl.clientHeight;
        
        containerEl.scrollTo({
          top: lineOffsetTop - containerHeight / 2 + lineHeight / 2,
          behavior: 'smooth',
        });
      }
    }
  }, [currentActiveIndex]);

  if (!currentSong) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className="fixed inset-0 z-60 bg-neutral-950/95 backdrop-blur-3xl flex flex-col md:bottom-22"
    >
      <div
        className="flex items-center justify-between px-6 pb-4 md:p-6 border-b border-white/5 bg-black/30 shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 1.25rem)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <AlignLeft className="text-violet-400 shrink-0" size={20} />
          <div className="min-w-0">
            <h3 className="font-bold text-white text-sm md:text-base leading-none truncate max-w-45 sm:max-w-xs">{currentSong.title}</h3>
            <span className="text-xs text-neutral-400 truncate block max-w-45 sm:max-w-xs mt-1">{currentSong.artist}</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors shrink-0 ml-3 active:scale-90"
        >
          <X size={20} />
        </button>
      </div>

      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-6 py-12 flex flex-col gap-6 md:gap-8 items-center text-center scrollbar-none select-none"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-neutral-400">
            <div className="w-8 h-8 rounded-full border-2 border-neutral-700 border-t-violet-500 animate-spin" />
            <span className="text-xs tracking-wider">Retrieving synced lyrics...</span>
          </div>
        ) : isInstrumental ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-neutral-400">
            <Music size={48} className="text-violet-500 animate-pulse" />
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white/80">Instrumental</h2>
            <span className="text-xs text-neutral-500">No lyrics available for this track</span>
          </div>
        ) : lyrics.length > 0 ? (
          lyrics.map((line, index) => {
            const isActive = index === currentActiveIndex;
            return (
              <div
                key={index}
                ref={(el) => { lineRefs.current[index] = el; }}
                onClick={() => seek(line.time)}
                className={`cursor-pointer transition-all duration-300 text-lg md:text-3xl font-extrabold max-w-2xl leading-snug tracking-tight px-4 py-2 rounded-xl hover:bg-white/5 active:scale-95 ${
                  isActive 
                    ? 'text-white scale-105 drop-shadow-[0_0_12px_rgba(139,92,246,0.3)]' 
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {line.text}
              </div>
            );
          })
        ) : plainLyrics ? (
          <div className="whitespace-pre-line text-neutral-300 text-sm md:text-lg max-w-xl leading-relaxed py-10">
            {plainLyrics}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-neutral-500">
            <Music size={32} />
            <span className="text-sm">No lyrics found for this track</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
