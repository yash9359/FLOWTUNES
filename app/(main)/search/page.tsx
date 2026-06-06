'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Song, Artist, Album } from '@/types';
import { usePlayer } from '@/context/PlayerContext';
import { useAppStore } from '@/lib/store/useAppStore';
import { Search, X, Play, Clock, Music, Disc, User, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AddToPlaylistMenu } from '@/components/ui/AddToPlaylistMenu';

export default function SearchPage() {
  const { currentSong, playSong } = usePlayer();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'songs' | 'artists' | 'albums'>('all');
  
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  
  const suggestionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 350);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      const store = useAppStore.getState();
      const cached = store.getCachedSuggestions(debouncedQuery);
      if (cached) {
        setSuggestions(cached);
        return;
      }

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&suggestions=true`);
        if (res.ok) {
          const data = await res.json();
          const suggestionsList = data.suggestions || [];
          setSuggestions(suggestionsList);
          store.setCachedSuggestions(debouncedQuery, suggestionsList);
        }
      } catch (e) {
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSongs([]);
      setArtists([]);
      setAlbums([]);
      return;
    }

    const executeSearch = async () => {
      const store = useAppStore.getState();
      const cached = store.getCachedSearch(debouncedQuery);
      if (cached) {
        setSongs(cached.songs || []);
        setArtists(cached.artists || []);
        setAlbums(cached.albums || []);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (res.ok) {
          const data = await res.json();
          const songsList = data.songs || [];
          const artistsList = data.artists || [];
          const albumsList = data.albums || [];
          setSongs(songsList);
          setArtists(artistsList);
          setAlbums(albumsList);
          store.setCachedSearch(debouncedQuery, { songs: songsList, artists: artistsList, albums: albumsList });
        }
      } catch (error) {
        console.error('[Search Page] Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    executeSearch();
  }, [debouncedQuery]);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const topResult = songs.length > 0 ? songs[0] : null;

  return (
    <div className="flex flex-col gap-6 select-none max-w-7xl mx-auto pb-10">
      
      <div className="relative w-full max-w-xl" ref={suggestionRef}>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-neutral-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            value={query}
            onFocus={() => setShowSuggestions(true)}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to listen to?"
            className="w-full pl-11 pr-11 py-3 bg-neutral-900/60 border border-white/5 focus:border-violet-500 rounded-full text-sm focus:outline-none transition-colors"
          />
          {query && (
            <button 
              onClick={() => { setQuery(''); setDebouncedQuery(''); }}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-14 left-0 right-0 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl p-2 z-50 max-h-64 overflow-y-auto"
            >
              {suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setQuery(suggestion);
                    setShowSuggestions(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg cursor-pointer flex items-center gap-2"
                >
                  <Search size={12} className="text-neutral-500" />
                  {suggestion}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {query && (
        <div className="flex items-center gap-2">
          {(['all', 'songs', 'artists', 'albums'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all duration-200 border ${
                activeFilter === filter 
                  ? 'bg-white text-black border-white' 
                  : 'bg-neutral-900/40 text-neutral-400 border-white/5 hover:text-white hover:border-white/10'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-neutral-700 border-t-violet-500 animate-spin" />
          <span className="text-xs text-neutral-400">Searching FlowTunes catalog...</span>
        </div>
      ) : !query ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-neutral-500 select-none">
          <Music size={48} className="text-neutral-700" />
          <div className="text-center">
            <h3 className="font-bold text-neutral-300">Search FlowTunes</h3>
            <p className="text-xs mt-1">Discover tracks, artists, albums and playlists</p>
          </div>
        </div>
      ) : songs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-neutral-500">
          <Search size={48} className="text-neutral-700" />
          <h3 className="font-bold text-neutral-300">No results found for "{query}"</h3>
          <p className="text-xs">Check spelling or search for another track keyword</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {activeFilter === 'all' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {topResult && (
                <div className="lg:col-span-2 flex flex-col gap-3">
                  <h2 className="text-lg font-bold text-white">Top Result</h2>
                  <div 
                    onClick={() => playSong(topResult, songs)}
                    className="flex flex-col gap-4 bg-neutral-900/30 border border-white/5 rounded-2xl p-5 hover:bg-neutral-800/40 cursor-pointer group relative overflow-hidden transition-all"
                  >
                    {topResult.thumbnailUrl && (
                      <img
                        src={topResult.thumbnailUrl}
                        alt={topResult.title}
                        className="w-28 h-28 object-cover rounded-xl shadow-lg border border-white/5"
                      />
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-white truncate max-w-full leading-snug group-hover:text-violet-400 transition-colors">
                        {topResult.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider bg-neutral-800 px-2 py-0.5 rounded">Song</span>
                        <span className="text-xs text-neutral-400 truncate">{topResult.artist}</span>
                      </div>
                    </div>
                    <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-all bg-white text-black p-4 rounded-full shadow-2xl hover:scale-105 active:scale-95">
                      <Play size={20} fill="black" className="translate-x-px" />
                    </div>
                  </div>
                </div>
              )}

              <div className="lg:col-span-3 flex flex-col gap-3">
                <h2 className="text-lg font-bold text-white">Songs</h2>
                <div className="flex flex-col gap-1 bg-neutral-900/20 border border-white/5 rounded-2xl p-3">
                  {songs.slice(0, 4).map((song, index) => {
                    const isActive = currentSong?.id === song.id;
                    return (
                      <div
                        key={song.id}
                        onClick={() => playSong(song, songs)}
                        className={`flex items-center justify-between p-2 rounded-xl cursor-pointer hover:bg-neutral-800/30 group ${
                          isActive ? 'bg-violet-950/20' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {song.thumbnailUrl && (
                            <img
                              src={song.thumbnailUrl}
                              alt={song.title}
                              className="w-10 h-10 object-cover rounded-lg shrink-0 border border-white/5"
                            />
                          )}
                          <div className="min-w-0">
                            <h4 className={`text-xs font-semibold truncate ${isActive ? 'text-violet-400' : 'text-white'}`}>
                              {song.title}
                            </h4>
                            <p className="text-[10px] text-neutral-400 truncate mt-1">{song.artist}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-neutral-400 shrink-0 pr-2" onClick={e => e.stopPropagation()}>
                          <AddToPlaylistMenu song={song} />
                          <span>{formatDuration(song.duration)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {(activeFilter === 'all' || activeFilter === 'songs') && songs.length > 0 && activeFilter !== 'all' && (
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-bold text-white">All Matching Songs</h2>
              <div className="flex flex-col bg-neutral-900/20 border border-white/5 rounded-2xl p-3">
                {songs.map((song, idx) => (
                  <div
                    key={song.id}
                    onClick={() => playSong(song, songs)}
                    className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer hover:bg-neutral-800/30 group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-neutral-500 text-xs w-4 text-center font-bold">{idx + 1}</span>
                      {song.thumbnailUrl && (
                        <img
                          src={song.thumbnailUrl}
                          alt={song.title}
                          className="w-10 h-10 object-cover rounded-lg border border-white/5"
                        />
                      )}
                      <div>
                        <h4 className="text-xs font-semibold text-white group-hover:text-violet-400 transition-colors">{song.title}</h4>
                        <p className="text-[10px] text-neutral-400 mt-1">{song.artist}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-neutral-500 pr-2" onClick={e => e.stopPropagation()}>
                      <AddToPlaylistMenu song={song} />
                      <span>{formatDuration(song.duration)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(activeFilter === 'all' || activeFilter === 'artists') && artists.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-bold text-white">Artists</h2>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {artists.map((artist) => (
                  <Link
                    key={artist.id}
                    href={`/artists?id=${artist.id}&name=${encodeURIComponent(artist.name)}`}
                    className="flex flex-col items-center text-center p-3 bg-neutral-900/20 border border-white/5 hover:bg-neutral-800/30 rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border border-white/5 shrink-0">
                      {artist.thumbnailUrl ? (
                        <img
                          src={artist.thumbnailUrl}
                          alt={artist.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-neutral-500">
                          <User size={20} />
                        </div>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-white truncate max-w-full group-hover:text-violet-400 transition-colors">{artist.name}</h4>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {(activeFilter === 'all' || activeFilter === 'albums') && albums.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-bold text-white">Albums</h2>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {albums.map((album) => (
                  <Link
                    key={album.id}
                    href={`/albums?id=${album.id}&name=${encodeURIComponent(album.title)}&artist=${encodeURIComponent(album.artistName || '')}`}
                    className="flex flex-col p-3 bg-neutral-900/20 border border-white/5 hover:bg-neutral-800/30 rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="aspect-square w-full rounded-lg overflow-hidden mb-3 border border-white/5 shrink-0 relative">
                      {album.thumbnailUrl ? (
                        <img
                          src={album.thumbnailUrl}
                          alt={album.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-neutral-500">
                          <Disc size={20} />
                        </div>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-white truncate max-w-full group-hover:text-violet-400 transition-colors leading-tight">{album.title}</h4>
                    {album.artistName && <p className="text-[10px] text-neutral-400 truncate mt-1">{album.artistName}</p>}
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
