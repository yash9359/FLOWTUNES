'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { createClient } from '@/lib/supabase/client';
import { Song, Playlist } from '@/types';
import { Plus, ListMusic, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddToPlaylistMenuProps {
  song: Song;
  direction?: 'up' | 'down';
}

export const AddToPlaylistMenu: React.FC<AddToPlaylistMenuProps> = ({ song, direction = 'down' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [addingToId, setAddingToId] = useState<string | null>(null);
  const [addedToId, setAddedToId] = useState<string | null>(null);

  const supabase = createClient();

  const user = useAppStore(state => state.user);
  const playlists = useAppStore(state => state.playlists);

  const handleAdd = async (e: React.MouseEvent, playlistId: string) => {
    e.stopPropagation();
    if (!user || addingToId) return;

    setAddingToId(playlistId);

    try {
      await supabase.from('songs').upsert({
        id: song.id,
        title: song.title,
        artist: song.artist,
        duration: song.duration,
        thumbnail_url: song.thumbnailUrl || null,
      }, { onConflict: 'id' });

      const { data: currentSongs } = await supabase
        .from('playlist_songs')
        .select('song_id')
        .eq('playlist_id', playlistId);

      const nextPosition = (currentSongs?.length || 0) + 1;

      const { error } = await supabase
        .from('playlist_songs')
        .insert({
          playlist_id: playlistId,
          song_id: song.id,
          position: nextPosition
        });

      if (!error) {
        setAddedToId(playlistId);
        setTimeout(() => setAddedToId(null), 2000);
      }
    } catch (err) {
      console.error('[Add to Playlist] Error adding song:', err);
    } finally {
      setAddingToId(null);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(prev => !prev);
        }}
        className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
        title="Add to Playlist"
      >
        <Plus size={14} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            />
            <motion.div
              initial={direction === 'up' 
                ? { opacity: 0, y: -5, scale: 0.95 } 
                : { opacity: 0, y: 5, scale: 0.95 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={direction === 'up' 
                ? { opacity: 0, y: -5, scale: 0.95 } 
                : { opacity: 0, y: 5, scale: 0.95 }
              }
              transition={{ duration: 0.12 }}
              className={`absolute right-0 w-48 rounded-xl bg-neutral-900 border border-white/10 shadow-2xl p-2 z-50 flex flex-col gap-1 text-xs select-none max-h-56 overflow-y-auto ${
                direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-1.5'
              }`}
            >
              <div className="px-2 py-1 border-b border-white/5 mb-1 text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                Add to Playlist
              </div>
              {playlists.length === 0 ? (
                <p className="text-[10px] text-neutral-500 px-2 py-3 text-center">No playlists found. Create one in Library!</p>
              ) : (
                playlists.map((pl) => {
                  const isAdding = addingToId === pl.id;
                  const isAdded = addedToId === pl.id;

                  return (
                    <button
                      key={pl.id}
                      onClick={(e) => handleAdd(e, pl.id)}
                      disabled={isAdding}
                      className="flex items-center justify-between w-full text-left px-2 py-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/5 transition-colors font-semibold group disabled:opacity-50"
                    >
                      <span className="truncate flex-1 pr-2">{pl.name}</span>
                      {isAdding ? (
                        <Loader2 size={12} className="animate-spin text-neutral-500" />
                      ) : isAdded ? (
                        <Check size={12} className="text-green-400 font-bold" />
                      ) : (
                        <ListMusic size={12} className="text-neutral-500 group-hover:text-violet-400 transition-colors" />
                      )}
                    </button>
                  );
                })
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
