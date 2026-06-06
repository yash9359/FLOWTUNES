'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/useAppStore';
import { Playlist } from '@/types';
import { Library, PlusCircle, Trash2, Heart, ListMusic, Globe, Lock, ArrowRight, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LibraryPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const user = useAppStore(state => state.user);
  const playlists = useAppStore(state => state.playlists);
  const likedCount = useAppStore(state => state.likedCount);
  const isLoading = useAppStore(state => state.isUserLoading || state.isPlaylistsLoading || state.isLikedLoading);
  const logout = useAppStore(state => state.logout);
  const createPlaylist = useAppStore(state => state.createPlaylist);
  const deletePlaylist = useAppStore(state => state.deletePlaylist);

  const handleSignOut = async () => {
    await logout();
    window.location.href = '/auth/login';
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || !user) return;

    setModalLoading(true);
    const success = await createPlaylist(newPlaylistName, newPlaylistDesc, isPublic);
    setModalLoading(false);

    if (success) {
      setNewPlaylistName('');
      setNewPlaylistDesc('');
      setIsPublic(false);
      setShowCreateModal(false);
    }
  };

  const handleDeletePlaylist = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this playlist?') || !user) return;
    await deletePlaylist(id);
  };

  const userEmail = user?.email || null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-700 border-t-violet-500 animate-spin" />
        <span className="text-xs text-neutral-400">Loading your library...</span>
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
        <Library size={48} className="text-neutral-700" />
        <h2 className="text-xl font-bold text-white">Your FlowTunes Library</h2>
        <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
          Create playlists, check history, and manage your favorites. Please log in to manage your library.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 select-none pb-10">
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
          <Library className="text-violet-400" size={26} /> Your Library
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-500/10 hover:scale-[1.02] active:scale-95"
        >
          <PlusCircle size={16} /> Create Playlist
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <Link 
          href="/liked"
          className="md:col-span-2 bg-linear-to-br from-violet-700/60 to-indigo-900/60 hover:from-violet-700/70 hover:to-indigo-900/70 border border-white/5 hover:border-violet-500/20 p-6 rounded-2xl cursor-pointer shadow-lg shadow-violet-500/5 group flex flex-col justify-between min-h-40"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
              <Heart size={24} fill="white" className="text-white" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/50 group-hover:text-white/80 transition-colors flex items-center gap-1">
              View All <ArrowRight size={10} />
            </span>
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Liked Songs</h3>
            <p className="text-xs text-white/70 mt-1">{likedCount} favorited {likedCount === 1 ? 'track' : 'tracks'}</p>
          </div>
        </Link>

        <div 
          onClick={() => setShowCreateModal(true)}
          className="bg-neutral-900/30 hover:bg-neutral-900/50 border border-dashed border-white/10 hover:border-violet-500/20 p-6 rounded-2xl cursor-pointer flex flex-col items-center justify-center text-center gap-3 transition-colors"
        >
          <PlusCircle size={32} className="text-neutral-500 hover:text-white transition-colors" />
          <div>
            <h4 className="text-xs font-bold text-neutral-300">Create New Playlist</h4>
            <p className="text-[10px] text-neutral-500 mt-1">Group your favorite tracks by vibe or genre</p>
          </div>
        </div>

      </div>

      <div className="flex flex-col gap-4 mt-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ListMusic size={20} className="text-neutral-400" /> Custom Playlists
        </h2>
        
        {playlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-neutral-900/10 border border-white/5 rounded-2xl text-neutral-500">
            <ListMusic size={36} className="text-neutral-700" />
            <h3 className="font-bold text-neutral-300 mt-3">No Playlists created</h3>
            <p className="text-xs mt-1">Get started by creating your first music playlist shelf</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {playlists.map((playlist) => (
              <Link
                key={playlist.id}
                href={`/playlists/${playlist.id}`}
                className="flex flex-col bg-neutral-900/20 border border-white/5 rounded-2xl p-4 hover:bg-neutral-800/30 transition-all cursor-pointer group relative"
              >
                <div className="aspect-square w-full rounded-xl bg-neutral-950/60 flex items-center justify-center text-neutral-500 border border-white/5 mb-3.5 relative overflow-hidden group-hover:bg-neutral-950/40 transition-colors">
                  <ListMusic size={40} className="group-hover:scale-105 transition-transform text-neutral-600 group-hover:text-violet-400" />
                  
                  <button
                    onClick={(e) => handleDeletePlaylist(e, playlist.id)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/90 text-neutral-400 hover:text-red-400 rounded-full transition-all md:opacity-0 md:group-hover:opacity-100 opacity-100 shadow flex items-center justify-center"
                    title="Delete Playlist"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <h3 className="text-xs font-bold text-white truncate max-w-full leading-snug group-hover:text-violet-400 transition-colors">
                  {playlist.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-2 text-[9px] text-neutral-500 font-bold uppercase tracking-wider">
                  {playlist.is_public ? (
                    <>
                      <Globe size={10} className="text-violet-500/80" /> Public
                    </>
                  ) : (
                    <>
                      <Lock size={10} className="text-neutral-500" /> Private
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {userEmail && (
        <div className="mt-8 bg-neutral-900/30 border border-white/5 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 md:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-linear-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow border border-white/10 shrink-0">
              {userEmail[0].toUpperCase()}
            </div>
            <div className="min-w-0 text-left">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider leading-none">Signed in as</p>
              <p className="text-xs font-semibold text-white truncate max-w-50 mt-1">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 active:scale-95 text-red-400 rounded-xl text-xs font-bold transition-all w-full sm:w-auto cursor-pointer"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      )}

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-900 border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl flex flex-col gap-4"
            >
              <div className="flex justify-between items-center select-none">
                <h3 className="font-bold text-white text-base">Create New Playlist</h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-neutral-500 hover:text-white"
                >
                  <XIcon size={18} />
                </button>
              </div>

              <form onSubmit={handleCreatePlaylist} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Playlist Title</label>
                  <input
                    type="text"
                    required
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="e.g. Chill Mix, Lofi Work Study"
                    className="px-3.5 py-2 bg-neutral-950 border border-white/5 focus:border-violet-500 rounded-xl text-sm focus:outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Description (Optional)</label>
                  <textarea
                    value={newPlaylistDesc}
                    onChange={(e) => setNewPlaylistDesc(e.target.value)}
                    placeholder="Describe what these tunes represent..."
                    rows={2}
                    className="px-3.5 py-2 bg-neutral-950 border border-white/5 focus:border-violet-500 rounded-xl text-sm focus:outline-none transition-colors resize-none"
                  />
                </div>

                <div className="flex items-center justify-between py-1 border-t border-b border-white/5 my-1">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Globe size={12} className="text-violet-500" /> Public Playlist
                    </h4>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Allow other platform users to discover it</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-800 text-violet-500 focus:ring-violet-500 bg-neutral-950 cursor-pointer accent-violet-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 mt-2 select-none">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-5 py-2 bg-white text-black text-xs font-bold rounded-xl hover:bg-neutral-200 transition-colors disabled:opacity-50"
                  >
                    {modalLoading ? 'Creating...' : 'Create Playlist'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function XIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  );
}
