'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store/useAppStore';
import { Song, Playlist } from '@/types';
import { usePlayer } from '@/context/PlayerContext';
import { createClient } from '@/lib/supabase/client';
import { ListMusic, Play, Clock, X, Plus, Search, Globe, Lock, Edit2, Check, Trash2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params.id as string;

  const { currentSong, playSong } = usePlayer();
  const supabase = createClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPublic, setEditPublic] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const user = useAppStore(state => state.user);
  const isUserLoading = useAppStore(state => state.isUserLoading);
  const deletePlaylistAction = useAppStore(state => state.deletePlaylist);
  const updatePlaylistAction = useAppStore(state => state.updatePlaylist);

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isPlaylistLoading, setIsPlaylistLoading] = useState(true);
  const [isSongsLoading, setIsSongsLoading] = useState(true);

  useEffect(() => {
    const fetchPlaylistDetails = async () => {
      setIsPlaylistLoading(true);
      try {
        const { data, error } = await supabase
          .from('playlists')
          .select('*')
          .eq('id', playlistId)
          .single();

        if (!error && data) {
          setPlaylist(data);
          setEditName(data.name);
          setEditDesc(data.description || '');
          setEditPublic(data.is_public);
        } else {
          setPlaylist(null);
        }
      } catch (e) {
        console.error(e);
        setPlaylist(null);
      } finally {
        setIsPlaylistLoading(false);
      }
    };

    fetchPlaylistDetails();
  }, [playlistId]);

  useEffect(() => {
    const fetchPlaylistSongs = async () => {
      setIsSongsLoading(true);
      try {
        const { data: mappingData, error: mappingErr } = await supabase
          .from('playlist_songs')
          .select('song_id, position')
          .eq('playlist_id', playlistId)
          .order('position', { ascending: true });

        if (mappingErr || !mappingData || mappingData.length === 0) {
          setSongs([]);
          return;
        }

        const songIds = mappingData.map(item => item.song_id);

        const { data: songDetails } = await supabase
          .from('songs')
          .select('*')
          .in('id', songIds);

        if (!songDetails) {
          setSongs([]);
          return;
        }

        const orderedSongs: Song[] = [];
        mappingData.forEach(map => {
          const found = songDetails.find(s => s.id === map.song_id);
          if (found) {
            orderedSongs.push({
              id: found.id,
              title: found.title,
              artist: found.artist,
              artistId: found.artist_id || undefined,
              album: found.album || undefined,
              albumId: found.album_id || undefined,
              duration: found.duration,
              thumbnailUrl: found.thumbnail_url || undefined,
            });
          }
        });
        setSongs(orderedSongs);
      } catch (e) {
        console.error(e);
        setSongs([]);
      } finally {
        setIsSongsLoading(false);
      }
    };

    fetchPlaylistSongs();
  }, [playlistId]);

  const isOwner = user && playlist ? playlist.user_id === user.id : false;
  const isLoading = isUserLoading || isPlaylistLoading || isSongsLoading;

  const handleUpdatePlaylist = async () => {
    if (!editName.trim() || !playlist) return;

    setPlaylist(prev => prev ? {
      ...prev,
      name: editName.trim(),
      description: editDesc.trim() || undefined,
      is_public: editPublic
    } : null);
    setIsEditing(false);

    await updatePlaylistAction(playlistId, editName, editDesc, editPublic);
  };

  const handleAddSong = async (song: Song) => {
    if (!playlist) return;
    try {
      await supabase.from('songs').upsert({
        id: song.id,
        title: song.title,
        artist: song.artist,
        duration: song.duration,
        thumbnail_url: song.thumbnailUrl || null,
      }, { onConflict: 'id' });

      const nextPosition = songs.length + 1;
      const { error } = await supabase
        .from('playlist_songs')
        .insert({
          playlist_id: playlistId,
          song_id: song.id,
          position: nextPosition
        });

      if (!error) {
        setSongs(prev => [...prev, song]);
        setSearchResults(prev => prev.filter(s => s.id !== song.id));
      }
    } catch (e) {
      console.error('[Playlist detail] Add song failed:', e);
    }
  };

  const handleRemoveSong = async (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    setSongs(prev => prev.filter(s => s.id !== songId));

    await supabase
      .from('playlist_songs')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('song_id', songId);
  };

  const songsRef = React.useRef(songs);
  songsRef.current = songs;

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(prev => prev.length === 0 ? prev : []);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      const store = useAppStore.getState();
      const cached = store.getCachedSearch(searchQuery);
      if (cached) {
        setSearchResults((cached.songs || []).filter(s => !songsRef.current.some(exist => exist.id === s.id)));
        setSearchLoading(false);
        return;
      }

      setSearchLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          const songsList: Song[] = data.songs || [];
          setSearchResults(songsList.filter(s => !songsRef.current.some(exist => exist.id === s.id)));
          store.setCachedSearch(searchQuery, data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playSong(songs[0], songs);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!confirm('Are you sure you want to delete this playlist? This action is irreversible.')) return;
    await deletePlaylistAction(playlistId);
    router.push('/library');
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
        <span className="text-xs text-neutral-400">Loading playlist details...</span>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
        <X size={48} className="text-red-500" />
        <h2 className="text-xl font-bold text-white">Playlist Not Found</h2>
        <p className="text-xs text-neutral-400 max-w-sm">
          The playlist is either private or deleted.
        </p>
        <button 
          onClick={() => router.push('/library')}
          className="mt-2 text-xs font-bold text-violet-400 hover:underline"
        >
          Return to Library
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 select-none pb-10">
      
      <button 
        onClick={() => router.push('/library')}
        className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={14} /> Back to Library
      </button>

      <div className="flex flex-col sm:flex-row items-end gap-6 bg-linear-to-b from-neutral-900/40 to-transparent p-6 rounded-3xl border border-white/5 relative overflow-hidden">
        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-neutral-950/60 flex items-center justify-center border border-white/5 shrink-0">
          <ListMusic size={64} className="text-violet-500" />
        </div>
        
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1">
            {playlist.is_public ? <Globe size={10} /> : <Lock size={10} />}
            {playlist.is_public ? 'Public Playlist' : 'Private Playlist'}
          </span>
          
          {isEditing ? (
            <div className="flex flex-col gap-2 w-full max-w-xl">
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Playlist name"
                className="text-2xl sm:text-4xl font-black bg-neutral-950 border border-white/10 px-3 py-1 rounded-xl focus:border-violet-500 focus:outline-none"
              />
              <input
                type="text"
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                placeholder="Add description..."
                className="text-xs text-neutral-400 bg-neutral-950 border border-white/10 px-3 py-1 rounded-xl focus:border-violet-500 focus:outline-none"
              />
              <div className="flex items-center gap-4 mt-1">
                <label className="text-xs text-neutral-400 flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editPublic}
                    onChange={e => setEditPublic(e.target.checked)}
                    className="accent-violet-500 rounded border-neutral-800 focus:ring-violet-500 cursor-pointer"
                  />
                  Public Access
                </label>
                <div className="flex gap-2">
                  <button 
                    onClick={handleUpdatePlaylist}
                    className="p-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
                  >
                    <Check size={14} />
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded-lg transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="group relative">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl sm:text-5xl font-black text-white leading-none truncate max-w-100">
                  {playlist.name}
                </h1>
                {isOwner && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                    title="Edit details"
                  >
                    <Edit2 size={16} />
                  </button>
                )}
              </div>
              {playlist.description && (
                <p className="text-xs text-neutral-400 mt-2 italic">{playlist.description}</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2 text-xs text-neutral-400 font-semibold select-none">
            <span>By Creator</span>
            <span>•</span>
            <span>{songs.length} {songs.length === 1 ? 'song' : 'songs'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {songs.length > 0 && (
            <button
              onClick={handlePlayAll}
              className="bg-white hover:bg-neutral-200 text-black px-6 py-3 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 hover:scale-[1.03] active:scale-95 transition-all"
            >
              <Play size={16} fill="black" />
              Play Playlist
            </button>
          )}
        </div>
        {isOwner && (
          <button
            onClick={handleDeletePlaylist}
            className="flex items-center gap-1.5 text-neutral-500 hover:text-red-400 text-xs font-bold transition-colors p-2"
          >
            <Trash2 size={14} /> Delete Playlist
          </button>
        )}
      </div>

      {songs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-neutral-900/10 border border-white/5 rounded-2xl text-neutral-500">
          <ListMusic size={32} className="text-neutral-700 animate-pulse" />
          <h3 className="font-bold text-neutral-300 mt-2">Playlist is empty</h3>
          <p className="text-xs mt-1">Use the search finder below to add tracks immediately</p>
        </div>
      ) : (
        <div className="flex flex-col bg-neutral-900/20 border border-white/5 rounded-2xl p-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 px-4 text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <span className="w-5 text-center shrink-0">#</span>
              <span>Title</span>
            </div>
            <div className="flex items-center gap-8 shrink-0 pr-4">
              <Clock size={14} className="mr-6" />
              {isOwner && <span className="w-8"></span>}
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

                  <div className="flex items-center gap-8 shrink-0 pr-4 text-xs text-neutral-400">
                    <span className="mr-6">{formatDuration(song.duration)}</span>
                    {isOwner && (
                      <button
                        onClick={(e) => handleRemoveSong(e, song.id)}
                        className="md:opacity-0 md:group-hover:opacity-100 opacity-100 hover:text-red-400 p-1.5 rounded-full hover:bg-neutral-800 transition-all shrink-0 w-8 flex items-center justify-center"
                        title="Remove from Playlist"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isOwner && (
        <div className="flex flex-col gap-4 mt-8 border-t border-white/5 pt-8">
          <div>
            <h3 className="text-lg font-bold text-white">Let's add some songs to your playlist</h3>
            <p className="text-xs text-neutral-400 mt-1">Search the FlowTunes catalog to append items</p>
          </div>
          
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-neutral-500">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search for songs or artists..."
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-900/60 border border-white/5 focus:border-violet-500 rounded-xl text-sm focus:outline-none transition-colors"
            />
          </div>

          {searchLoading ? (
            <div className="flex items-center gap-2 text-xs text-neutral-500 py-4 pl-2">
              <div className="w-4 h-4 border-2 border-neutral-700 border-t-violet-500 animate-spin rounded-full" />
              Searching catalogue...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="flex flex-col bg-neutral-900/10 border border-white/5 rounded-2xl p-2 max-w-2xl max-h-72 overflow-y-auto">
              {searchResults.map((song) => (
                <div 
                  key={song.id}
                  className="flex items-center justify-between p-2 hover:bg-neutral-800/40 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {song.thumbnailUrl && (
                      <img
                        src={song.thumbnailUrl}
                        alt={song.title}
                        className="w-9 h-9 object-cover rounded-lg shrink-0 border border-white/5"
                      />
                    )}
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-white truncate leading-snug">{song.title}</h4>
                      <p className="text-[10px] text-neutral-400 truncate mt-0.5">{song.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 pr-2">
                    <span className="text-[10px] text-neutral-500 font-semibold">{formatDuration(song.duration)}</span>
                    <button
                      onClick={() => handleAddSong(song)}
                      className="p-1.5 bg-white text-black hover:bg-violet-600 hover:text-white rounded-lg transition-all shadow hover:scale-[1.02] active:scale-95"
                      title="Add to Playlist"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery && (
            <p className="text-xs text-neutral-500 py-4 pl-2">No matching songs found.</p>
          )}

        </div>
      )}

    </div>
  );
}
