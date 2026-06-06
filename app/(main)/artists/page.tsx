'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Song, Artist } from '@/types';
import { Play, Pause, User, Music, Share2 } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { useAppStore } from '@/lib/store/useAppStore';
import { motion } from 'framer-motion';

export default function ArtistPage() {
  const searchParams = useSearchParams();
  const artistId = searchParams.get('id');
  const artistName = searchParams.get('name') || 'Unknown Artist';
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();

  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!artistId) return;
    const fetchArtistSongs = async () => {
      const store = useAppStore.getState();
      const cached = store.getCachedSearch(artistName);
      if (cached) {
        setResults(cached);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(artistName)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          store.setCachedSearch(artistName, data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchArtistSongs();
  }, [artistId, artistName]);

  const songs: Song[] = results?.songs || [];

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playSong(songs[0], songs);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-700 border-t-violet-500 animate-spin" />
        <span className="text-xs text-neutral-400">Loading artist profile...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-20">
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
        <div className="w-48 h-48 md:w-56 md:h-56 rounded-full bg-neutral-900 border border-white/5 shadow-2xl overflow-hidden flex items-center justify-center shrink-0">
          {songs[0]?.thumbnailUrl ? (
            <img src={songs[0].thumbnailUrl} alt={artistName} className="w-full h-full object-cover opacity-60 grayscale-[50%]" />
          ) : (
            <User size={80} className="text-neutral-700" />
          )}
        </div>
        <div className="flex flex-col items-center md:items-start gap-3">
          <div className="flex items-center gap-2 px-2 py-1 bg-violet-500/10 border border-violet-500/20 rounded-lg">
            <User size={12} className="text-violet-400" />
            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Verified Artist</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white text-center md:text-left">{artistName}</h1>
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={handlePlayAll}
              className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-full font-bold shadow-lg shadow-violet-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Play size={20} fill="white" /> Play Mix
            </button>
            <button className="p-3 bg-neutral-900 border border-white/10 text-white rounded-full hover:bg-neutral-800 transition-colors">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Music size={20} className="text-violet-400" /> Popular Tracks
        </h2>
        
        <div className="flex flex-col border border-white/5 rounded-2xl overflow-hidden bg-neutral-900/10">
          {songs.length === 0 ? (
            <div className="p-12 text-center text-neutral-500 text-sm">No tracks found for this artist.</div>
          ) : (
            songs.map((song, i) => {
              const isCurrent = currentSong?.id === song.id;
              return (
                <div
                  key={song.id}
                  onClick={() => playSong(song, songs)}
                  className={`flex items-center justify-between p-3 md:p-4 hover:bg-white/5 transition-all cursor-pointer group ${
                    isCurrent ? 'bg-violet-500/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="text-xs font-bold text-neutral-600 w-4 text-right group-hover:hidden">
                      {i + 1}
                    </span>
                    <div className="hidden group-hover:flex w-4 items-center justify-center">
                      <Play size={12} fill="currentColor" className={isCurrent ? 'text-violet-400' : 'text-white'} />
                    </div>
                    <img src={song.thumbnailUrl} className="w-10 h-10 object-cover rounded-md" />
                    <div className="min-w-0">
                      <h4 className={`text-sm font-bold truncate ${isCurrent ? 'text-violet-400' : 'text-white'}`}>
                        {song.title}
                      </h4>
                      <p className="text-[10px] text-neutral-500 truncate">{song.album || 'Single'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 text-xs font-bold text-neutral-500">
                    <span className="hidden md:block">{Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
