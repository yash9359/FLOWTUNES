'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Song } from '@/types';
import { Play, Disc, Calendar, Music, Share2 } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { useAppStore } from '@/lib/store/useAppStore';

export default function AlbumPage() {
  const searchParams = useSearchParams();
  const albumId = searchParams.get('id');
  const albumName = searchParams.get('name') || 'Unknown Album';
  const artistName = searchParams.get('artist') || 'Unknown Artist';
  
  const { currentSong, playSong } = usePlayer();

  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!albumId) return;
    const fetchAlbumSongs = async () => {
      const store = useAppStore.getState();
      const cacheKey = `${albumName} ${artistName}`;
      const cached = store.getCachedSearch(cacheKey);
      if (cached) {
        setResults(cached);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(cacheKey)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          store.setCachedSearch(cacheKey, data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAlbumSongs();
  }, [albumId, albumName, artistName]);

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
        <span className="text-xs text-neutral-400">Loading album...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-20">
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
        <div className="w-48 h-48 md:w-56 md:h-56 bg-neutral-900 border border-white/10 shadow-2xl rounded-xl overflow-hidden shrink-0">
          {songs[0]?.thumbnailUrl ? (
            <img src={songs[0].thumbnailUrl} alt={albumName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-700">
              <Disc size={80} />
            </div>
          )}
        </div>
        <div className="flex flex-col items-center md:items-start gap-3">
          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-[0.2em]">Album</span>
          <h1 className="text-3xl md:text-5xl font-black text-white text-center md:text-left leading-tight">{albumName}</h1>
          <div className="flex items-center gap-2 text-neutral-400 text-sm font-semibold">
            <span className="text-white hover:underline cursor-pointer">{artistName}</span>
            <span className="text-neutral-600">•</span>
            <span>{songs.length} tracks</span>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={handlePlayAll}
              className="px-8 py-3 bg-white text-black hover:bg-neutral-200 rounded-full font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Play size={20} fill="black" /> Play Album
            </button>
            <button className="p-3 bg-neutral-900 border border-white/10 text-white rounded-full hover:bg-neutral-800 transition-colors">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col border border-white/5 rounded-2xl overflow-hidden bg-neutral-900/10">
          <div className="hidden md:flex items-center px-6 py-3 border-b border-white/5 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
            <span className="w-12">#</span>
            <span className="flex-1">Title</span>
            <span className="w-32 text-right">Duration</span>
          </div>

          {songs.length === 0 ? (
            <div className="p-12 text-center text-neutral-500 text-sm">No tracks found for this album.</div>
          ) : (
            songs.map((song, i) => {
              const isCurrent = currentSong?.id === song.id;
              return (
                <div
                  key={song.id}
                  onClick={() => playSong(song, songs)}
                  className={`flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-all cursor-pointer group ${
                    isCurrent ? 'bg-violet-500/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="text-xs font-bold text-neutral-600 w-6 group-hover:hidden">
                      {i + 1}
                    </span>
                    <div className="hidden group-hover:flex w-6 items-center">
                      <Play size={12} fill="currentColor" className={isCurrent ? 'text-violet-400' : 'text-white'} />
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-sm font-bold truncate ${isCurrent ? 'text-violet-400' : 'text-white'}`}>
                        {song.title}
                      </h4>
                      <p className="text-[10px] text-neutral-500 truncate md:hidden">{artistName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 text-xs font-bold text-neutral-500">
                    <span className="hidden md:block w-32 text-right font-mono">
                      {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                    </span>
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
