'use client';

import React from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { Song } from '@/types';
import { usePlayer } from '@/context/PlayerContext';
import { Heart, Play, Clock, X } from 'lucide-react';
import { AddToPlaylistMenu } from '@/components/ui/AddToPlaylistMenu';

export default function LikedSongsPage() {
  const { currentSong, playSong } = usePlayer();
  const user = useAppStore(state => state.user);
  const songs = useAppStore(state => state.likedSongs);
  const isLoading = useAppStore(state => state.isLikedLoading || state.isUserLoading);
  const unlikeSong = useAppStore(state => state.unlikeSong);

  const handleUnlike = async (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    await unlikeSong(songId);
  };

  const userEmail = user?.email || null;

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playSong(songs[0], songs);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-700 border-t-violet-500 animate-spin" />
        <span className="text-xs text-neutral-400">Loading liked collection...</span>
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
        <Heart size={48} className="text-neutral-700" />
        <h2 className="text-xl font-bold text-white">Liked Songs Collection</h2>
        <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
          Sync and log your favorite music tracks. Please log in to manage your collection.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 select-none pb-10">
      <div className="flex flex-col sm:flex-row items-end gap-6 bg-linear-to-b from-violet-950/20 to-transparent p-6 rounded-3xl border border-white/5 relative overflow-hidden">
        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-linear-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-500/20 shrink-0">
          <Heart size={64} fill="currentColor" className="text-white" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Playlist</span>
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-none">Liked Songs</h1>
          <div className="flex items-center gap-2 mt-2 text-xs text-neutral-400">
            <span className="font-bold text-white">{userEmail}</span>
            <span>•</span>
            <span>{songs.length} {songs.length === 1 ? 'song' : 'songs'}</span>
          </div>
        </div>
      </div>

      {songs.length > 0 && (
        <div className="flex items-center gap-4">
          <button
            onClick={handlePlayAll}
            className="bg-white hover:bg-neutral-200 text-black px-6 py-3 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 hover:scale-[1.03] active:scale-95 transition-all"
          >
            <Play size={16} fill="black" />
            Play Songs
          </button>
        </div>
      )}

      {songs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-neutral-500">
          <Heart size={40} className="text-neutral-700 animate-pulse" />
          <div className="text-center">
            <h3 className="font-bold text-neutral-300">No Liked Songs yet</h3>
            <p className="text-xs mt-1">Tap the heart icon on any song card to save songs here</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col bg-neutral-900/20 border border-white/5 rounded-2xl p-4 overflow-x-auto">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 px-4 text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <span className="w-5 text-center shrink-0">#</span>
              <span>Title</span>
            </div>
            <div className="flex items-center gap-8 shrink-0 pr-4">
              <span className="hidden sm:inline w-28 text-right pr-6">Album</span>
              <Clock size={14} className="mr-6" />
              <span className="w-8"></span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {songs.map((song, idx) => {
              const isActive = currentSong?.id === song.id;
              return (
                <div
                  key={song.id}
                  onClick={() => playSong(song, songs)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer hover:bg-neutral-800/30 group transition-colors ${
                    isActive ? 'bg-violet-950/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <span className={`w-5 text-center shrink-0 text-xs font-semibold ${isActive ? 'text-violet-400 font-bold' : 'text-neutral-500'}`}>
                      {idx + 1}
                    </span>
                    {song.thumbnailUrl && (
                      <img
                        src={song.thumbnailUrl}
                        alt={song.title}
                        className="w-10 h-10 object-cover rounded-lg shrink-0 border border-white/5"
                      />
                    )}
                    <div className="min-w-0 pr-4">
                      <h4 className={`text-xs font-semibold truncate ${isActive ? 'text-violet-400' : 'text-white'}`}>
                        {song.title}
                      </h4>
                      <p className="text-[10px] text-neutral-400 truncate mt-1">{song.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-8 shrink-0 pr-4 text-xs text-neutral-400">
                    <span className="hidden sm:inline w-28 text-right truncate pr-6 text-neutral-500 leading-none" title={song.album || 'FlowTunes'}>
                      {song.album || 'FlowTunes'}
                    </span>
                    <span className="mr-2 sm:mr-6">{formatDuration(song.duration)}</span>
                    <div onClick={e => e.stopPropagation()} className="shrink-0">
                      <AddToPlaylistMenu song={song} direction="down" />
                    </div>
                    <button
                      onClick={(e) => handleUnlike(e, song.id)}
                      className="md:opacity-0 md:group-hover:opacity-100 opacity-100 hover:text-red-400 p-1.5 rounded-full hover:bg-neutral-800 transition-all shrink-0 w-8 flex items-center justify-center"
                      title="Remove from Liked"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
