'use client';

import React, { useState, useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { ProgressBar } from './ProgressBar';
import { VolumeControl } from './VolumeControl';
import { PlaybackControls } from './PlaybackControls';
import { createClient } from '@/lib/supabase/client';
import { Heart, ListMusic, AlignLeft, Tv, Volume2, X, ChevronUp, ChevronDown, MonitorPlay, Play, Pause, SkipForward, SkipBack, Shuffle, Repeat } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/lib/store/useAppStore';
import { AddToPlaylistMenu } from '@/components/ui/AddToPlaylistMenu';

interface MusicPlayerProps {
  onToggleLyrics: () => void;
  showLyrics: boolean;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ onToggleLyrics, showLyrics }) => {
  const {
    currentSong,
    isPlaying,
    volume,
    isMuted,
    progress,
    duration,
    queue,
    shuffleMode,
    repeatMode,
    isMobileExpanded,
    setIsMobileExpanded,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    removeFromQueue,
  } = usePlayer();

  const [showQueue, setShowQueue] = useState(false);
  
  const user = useAppStore(state => state.user);
  const likedSongs = useAppStore(state => state.likedSongs);
  const likeSong = useAppStore(state => state.likeSong);
  const unlikeSong = useAppStore(state => state.unlikeSong);

  const isLiked = currentSong ? likedSongs.some(s => s.id === currentSong.id) : false;

  const toggleLike = async () => {
    if (!currentSong) return;
    if (!user) {
      alert('Please log in to like songs.');
      return;
    }

    if (isLiked) {
      await unlikeSong(currentSong.id);
    } else {
      await likeSong(currentSong);
    }
  };

  if (!currentSong) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 hidden md:block border-t border-white/10 bg-black/60 backdrop-blur-xl px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-4 w-1/3 min-w-60">
            {currentSong.thumbnailUrl && (
              <img
                src={currentSong.thumbnailUrl}
                alt={currentSong.title}
                className="w-14 h-14 object-cover rounded-md shadow-md border border-white/5"
              />
            )}
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold text-white truncate max-w-50" title={currentSong.title}>
                {currentSong.title}
              </h4>
              <p className="text-xs text-neutral-400 truncate max-w-50">
                {currentSong.artist}
              </p>
            </div>
            
            <div className="flex items-center gap-2 ml-2">
              <button
                onClick={toggleLike}
                className={`hover:scale-110 active:scale-95 transition-all p-1 rounded-full hover:bg-neutral-800 ${
                  isLiked ? 'text-violet-500' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
              </button>

              <AddToPlaylistMenu song={currentSong} direction="up" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 w-1/3 flex-1 max-w-150">
            <PlaybackControls
              isPlaying={isPlaying}
              shuffleMode={shuffleMode}
              repeatMode={repeatMode}
              onTogglePlay={togglePlay}
              onNext={next}
              onPrev={prev}
              onToggleShuffle={toggleShuffle}
              onToggleRepeat={toggleRepeat}
            />
            <ProgressBar
              progress={progress}
              duration={duration}
              onSeek={seek}
            />
          </div>

          <div className="flex items-center justify-end gap-4 w-1/3 min-w-60">
            <button
              onClick={onToggleLyrics}
              className={`p-1.5 rounded-full hover:bg-neutral-800 transition-colors ${
                showLyrics ? 'text-violet-400' : 'text-neutral-400 hover:text-white'
              }`}
              title="Lyrics"
            >
              <AlignLeft size={18} />
            </button>
            <button
              onClick={() => setShowQueue(prev => !prev)}
              className={`p-1.5 rounded-full hover:bg-neutral-800 transition-colors ${
                showQueue ? 'text-violet-400' : 'text-neutral-400 hover:text-white'
              }`}
              title="Queue"
            >
              <ListMusic size={18} />
            </button>
            <VolumeControl
              volume={volume}
              isMuted={isMuted}
              onVolumeChange={setVolume}
              onToggleMute={toggleMute}
            />
          </div>

        </div>
      </div>

      <div className={`fixed left-0 right-0 md:hidden transition-all duration-300 ${isMobileExpanded ? 'inset-0 z-50' : 'bottom-16 z-40 px-2 pb-1'}`}>
        <AnimatePresence>
          {!isMobileExpanded ? (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={() => setIsMobileExpanded(true)}
              className="flex items-center justify-between bg-neutral-900/90 border border-white/5 backdrop-blur-xl px-4 py-2.5 rounded-xl shadow-lg cursor-pointer"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {currentSong.thumbnailUrl && (
                  <img
                    src={currentSong.thumbnailUrl}
                    alt={currentSong.title}
                    className="w-10 h-10 object-cover rounded-md"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-white truncate">{currentSong.title}</h4>
                  <p className="text-[10px] text-neutral-400 truncate">{currentSong.artist}</p>
                </div>
              </div>
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <button onClick={togglePlay} className="p-2 text-white">
                  {isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" />}
                </button>
                <button onClick={next} className="p-2 text-neutral-400 hover:text-white">
                  <SkipForward size={18} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-0 bg-neutral-950 z-50 flex flex-col justify-between px-6 py-8"
            >
              <div className="flex items-center justify-between">
                <button onClick={() => setIsMobileExpanded(false)} className="text-neutral-400 hover:text-white p-2">
                  <ChevronDown size={24} />
                </button>
                <div className="text-center">
                  <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Playing From Queue</span>
                  <h5 className="text-xs font-semibold text-white max-w-50 truncate">{currentSong.album || 'FlowTunes'}</h5>
                </div>
                <button 
                  onClick={() => {
                    setIsMobileExpanded(false);
                    onToggleLyrics();
                  }}
                  className={`p-2 ${showLyrics ? 'text-violet-400' : 'text-neutral-400'}`}
                >
                  <AlignLeft size={20} />
                </button>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center my-6">
                {currentSong.thumbnailUrl && (
                  <motion.img
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    src={currentSong.thumbnailUrl}
                    alt={currentSong.title}
                    className="w-72 h-72 object-cover rounded-xl shadow-2xl border border-white/10 shadow-violet-500/5"
                  />
                )}
              </div>

              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-white truncate max-w-60">{currentSong.title}</h2>
                    <p className="text-sm text-neutral-400 truncate max-w-60">{currentSong.artist}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleLike}
                      className={`p-2 rounded-full ${isLiked ? 'text-violet-500' : 'text-neutral-400'}`}
                    >
                      <Heart size={22} fill={isLiked ? 'currentColor' : 'none'} />
                    </button>
                    <AddToPlaylistMenu song={currentSong} direction="up" />
                  </div>
                </div>

                <ProgressBar
                  progress={progress}
                  duration={duration}
                  onSeek={seek}
                />

                <div className="flex items-center justify-between px-6 pb-4">
                  <button
                    onClick={toggleShuffle}
                    className={`p-2 ${shuffleMode ? 'text-violet-400' : 'text-neutral-400'}`}
                  >
                    <Shuffle size={20} />
                  </button>
                  <button onClick={prev} className="p-2 text-white">
                    <SkipBack size={24} />
                  </button>
                  <button
                    onClick={togglePlay}
                    className="p-4 bg-white text-black rounded-full"
                  >
                    {isPlaying ? <Pause size={26} fill="black" /> : <Play size={26} fill="black" className="translate-x-px" />}
                  </button>
                  <button onClick={next} className="p-2 text-white">
                    <SkipForward size={24} />
                  </button>
                  <button
                    onClick={toggleRepeat}
                    className={`p-2 ${repeatMode !== 'none' ? 'text-violet-400' : 'text-neutral-400'}`}
                  >
                    <Repeat size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showQueue && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-0 right-0 bottom-22 z-30 w-80 bg-neutral-900/95 border-l border-white/10 backdrop-blur-xl p-6 overflow-y-auto hidden md:block"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-white flex items-center gap-2">
                <ListMusic size={20} /> Playback Queue
              </h3>
              <button onClick={() => setShowQueue(false)} className="text-neutral-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            {queue.length === 0 ? (
              <p className="text-xs text-neutral-500 mt-10 text-center">Queue is empty</p>
            ) : (
              <div className="flex flex-col gap-2">
                {queue.map((song, i) => (
                  <div 
                    key={`${song.id}-${i}`}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs group transition-colors ${
                      currentSong.id === song.id ? 'bg-violet-950/40 text-violet-300' : 'hover:bg-neutral-800/50 text-neutral-300'
                    }`}
                  >
                    <span className="truncate flex-1 max-w-45 font-semibold">{song.title}</span>
                    <button 
                      onClick={() => removeFromQueue(song.id)}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
