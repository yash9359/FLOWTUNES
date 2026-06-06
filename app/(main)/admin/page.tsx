'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Song, Playlist } from '@/types';
import { ShieldAlert, BarChart3, Users, Music, ListMusic, Trash2, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfileItem {
  id: string;
  name: string | null;
  email: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    usersCount: 0,
    songsCount: 0,
    playlistsCount: 0,
  });
  
  const [cachedSongs, setCachedSongs] = useState<Song[]>([]);
  const [usersList, setUsersList] = useState<ProfileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchAdminData = async () => {
    try {
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: songsCount } = await supabase
        .from('songs')
        .select('*', { count: 'exact', head: true });

      const { count: playlistsCount } = await supabase
        .from('playlists')
        .select('*', { count: 'exact', head: true });

      setStats({
        usersCount: usersCount || 0,
        songsCount: songsCount || 0,
        playlistsCount: playlistsCount || 0,
      });

      const { data: songsData } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (songsData) {
        setCachedSongs(songsData.map(s => ({
          id: s.id,
          title: s.title,
          artist: s.artist,
          duration: s.duration,
          thumbnailUrl: s.thumbnail_url || undefined,
        })));
      }

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (profilesData) {
        setUsersList(profilesData);
      }

    } catch (e: any) {
      setError(e.message || 'Failed to fetch admin dashboard statistics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [supabase]);

  const handleDeleteSong = async (songId: string) => {
    if (!confirm('Are you sure you want to delete this song from database cache?')) return;
    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', songId);

    if (!error) {
      setCachedSongs(prev => prev.filter(s => s.id !== songId));
      setStats(prev => ({ ...prev, songsCount: Math.max(0, prev.songsCount - 1) }));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user profile? This won\'t delete their Supabase Auth record unless configured in auth, but will delete their profile data.')) return;
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (!error) {
      setUsersList(prev => prev.filter(u => u.id !== userId));
      setStats(prev => ({ ...prev, usersCount: Math.max(0, prev.usersCount - 1) }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-700 border-t-violet-500 animate-spin" />
        <span className="text-xs text-neutral-400">Loading admin control center...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2.5 rounded-xl font-semibold max-w-md mx-auto mt-10">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-10 select-none">
      
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
          <ShieldAlert className="text-violet-400" size={26} /> Admin Panel
        </h1>
        <p className="text-xs text-neutral-400 mt-1">FlowTunes catalog management and analytics dashboard</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        <div className="bg-neutral-900/30 border border-white/5 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-600/15 text-violet-400 flex items-center justify-center">
            <Users size={22} />
          </div>
          <div>
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Total Users</p>
            <h3 className="text-2xl font-black text-white mt-0.5">{stats.usersCount}</h3>
          </div>
        </div>

        <div className="bg-neutral-900/30 border border-white/5 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-600/15 text-violet-400 flex items-center justify-center">
            <Music size={22} />
          </div>
          <div>
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Cached Songs</p>
            <h3 className="text-2xl font-black text-white mt-0.5">{stats.songsCount}</h3>
          </div>
        </div>

        <div className="bg-neutral-900/30 border border-white/5 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-600/15 text-violet-400 flex items-center justify-center">
            <ListMusic size={22} />
          </div>
          <div>
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Playlists</p>
            <h3 className="text-2xl font-black text-white mt-0.5">{stats.playlistsCount}</h3>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
            <Users size={16} /> Recent Users
          </h2>
          <div className="bg-neutral-900/20 border border-white/5 rounded-2xl p-4 flex flex-col gap-2 overflow-x-auto">
            {usersList.length === 0 ? (
              <p className="text-xs text-neutral-500 text-center py-6">No users signed up yet</p>
            ) : (
              usersList.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-2 hover:bg-neutral-800/20 rounded-xl text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white truncate">{user.name || 'Anonymous'}</p>
                    <p className="text-[10px] text-neutral-500 truncate mt-0.5">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-neutral-500 ml-4">
                    <span className="flex items-center gap-1 text-[10px]">
                      <Calendar size={10} /> {new Date(user.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-1.5 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors"
                      title="Delete profile"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
            <Music size={16} /> Cached Song Catalog
          </h2>
          <div className="bg-neutral-900/20 border border-white/5 rounded-2xl p-4 flex flex-col gap-2 overflow-x-auto">
            {cachedSongs.length === 0 ? (
              <p className="text-xs text-neutral-500 text-center py-6">No songs cached in database yet</p>
            ) : (
              cachedSongs.map((song) => (
                <div key={song.id} className="flex items-center justify-between p-2 hover:bg-neutral-800/20 rounded-xl text-xs">
                  <div className="min-w-0 flex-1 flex items-center gap-3">
                    {song.thumbnailUrl && (
                      <img
                        src={song.thumbnailUrl}
                        alt={song.title}
                        className="w-8 h-8 object-cover rounded-lg shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate leading-none">{song.title}</p>
                      <p className="text-[10px] text-neutral-500 truncate mt-1">{song.artist}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSong(song.id)}
                    className="p-1.5 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors ml-4 shrink-0"
                    title="Delete song cache"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
