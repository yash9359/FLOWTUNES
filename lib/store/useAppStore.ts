import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Song, Playlist, Artist, Album } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

const supabase = createClient();

interface AppState {
  user: any | null;
  isUserLoading: boolean;
  playlists: Playlist[];
  isPlaylistsLoading: boolean;
  likedSongs: Song[];
  likedCount: number;
  isLikedLoading: boolean;
  homeData: any | null;
  isHomeLoading: boolean;
  searchCache: Record<string, { songs: Song[]; artists: Artist[]; albums: Album[] }>;
  suggestionsCache: Record<string, string[]>;
  streamUrlCache: Record<string, { url: string; timestamp: number }>;
  artistSongsCache: Record<string, Song[]>;
  lyricsCache: Record<string, { synced: string | null; plain: string | null; instrumental: boolean }>;

  // Actions
  setUser: (user: any) => void;
  fetchUser: () => Promise<any>;
  fetchPlaylists: () => Promise<void>;
  fetchLikedSongs: () => Promise<void>;
  fetchLikedCount: () => Promise<void>;
  fetchHomeData: () => Promise<void>;
  createPlaylist: (name: string, description?: string, isPublic?: boolean) => Promise<Playlist | null>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  updatePlaylist: (playlistId: string, name: string, description?: string, isPublic?: boolean) => Promise<void>;
  likeSong: (song: Song) => Promise<void>;
  unlikeSong: (songId: string) => Promise<void>;
  logout: () => Promise<void>;
  clearLocalState: () => void;
  getCachedSearch: (query: string) => { songs: Song[]; artists: Artist[]; albums: Album[] } | null;
  setCachedSearch: (query: string, results: { songs: Song[]; artists: Artist[]; albums: Album[] }) => void;
  getCachedSuggestions: (query: string) => string[] | null;
  setCachedSuggestions: (query: string, suggestions: string[]) => void;
  getCachedStreamUrl: (songId: string) => string | null;
  setCachedStreamUrl: (songId: string, url: string) => void;
  clearCachedStreamUrl: (songId: string) => void;
  getCachedArtistSongs: (artistName: string) => Song[] | null;
  setCachedArtistSongs: (artistName: string, songs: Song[]) => void;
  getCachedLyrics: (songId: string) => { synced: string | null; plain: string | null; instrumental: boolean } | null;
  setCachedLyrics: (songId: string, data: { synced: string | null; plain: string | null; instrumental: boolean }) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
    immer((set, get) => ({
      user: null,
      isUserLoading: true,
      playlists: [],
      isPlaylistsLoading: false,
      likedSongs: [],
      likedCount: 0,
      isLikedLoading: false,
      homeData: null,
      isHomeLoading: false,
      searchCache: {},
      suggestionsCache: {},
      streamUrlCache: {},
      artistSongsCache: {},
      lyricsCache: {},

      setUser: (user) => {
        set((state) => {
          state.user = user;
          state.isUserLoading = false;
        });
      },

      fetchUser: async () => {
        set((state) => {
          state.isUserLoading = true;
        });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          set((state) => {
            state.user = user;
            state.isUserLoading = false;
          });
          return user;
        } catch (error) {
          console.error('[Store] Fetch user failed:', error);
          set((state) => {
            state.user = null;
            state.isUserLoading = false;
          });
          return null;
        }
      },

      fetchPlaylists: async () => {
        const { user } = get();
        if (!user) return;
        set((state) => {
          state.isPlaylistsLoading = true;
        });
        try {
          const { data } = await supabase
            .from('playlists')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          set((state) => {
            state.playlists = data || [];
            state.isPlaylistsLoading = false;
          });
        } catch (error) {
          console.error('[Store] Fetch playlists failed:', error);
          set((state) => {
            state.isPlaylistsLoading = false;
          });
        }
      },

      fetchLikedSongs: async () => {
        const { user } = get();
        if (!user) return;
        set((state) => {
          state.isLikedLoading = true;
        });
        try {
          const { data, error } = await supabase
            .from('liked_songs')
            .select('song_id, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error || !data || data.length === 0) {
            set((state) => {
              state.likedSongs = [];
              state.isLikedLoading = false;
            });
            return;
          }

          const songIds = data.map(item => item.song_id);
          const { data: songDetails } = await supabase
            .from('songs')
            .select('*')
            .in('id', songIds);

          if (!songDetails) {
            set((state) => {
              state.likedSongs = [];
              state.isLikedLoading = false;
            });
            return;
          }

          const orderedSongs: Song[] = [];
          songIds.forEach(id => {
            const found = songDetails.find(s => s.id === id);
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

          set((state) => {
            state.likedSongs = orderedSongs;
            state.isLikedLoading = false;
          });
        } catch (error) {
          console.error('[Store] Fetch liked songs failed:', error);
          set((state) => {
            state.isLikedLoading = false;
          });
        }
      },

      fetchLikedCount: async () => {
        const { user } = get();
        if (!user) return;
        try {
          const { count } = await supabase
            .from('liked_songs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          set((state) => {
            state.likedCount = count || 0;
          });
        } catch (error) {
          console.error('[Store] Fetch liked count failed:', error);
        }
      },

      fetchHomeData: async () => {
        set((state) => {
          state.isHomeLoading = true;
        });
        try {
          const res = await fetch('/api/home');
          if (res.ok) {
            const data = await res.json();
            set((state) => {
              state.homeData = data;
              state.isHomeLoading = false;
            });
          } else {
            throw new Error('Failed to fetch home data');
          }
        } catch (error) {
          console.error('[Store] Fetch home data failed:', error);
          set((state) => {
            state.isHomeLoading = false;
          });
        }
      },

      createPlaylist: async (name, description = '', isPublic = false) => {
        const { user, playlists } = get();
        if (!user) return null;

        try {
          const { data, error } = await supabase
            .from('playlists')
            .insert({
              user_id: user.id,
              name: name.trim(),
              description: description.trim() || null,
              is_public: isPublic,
            })
            .select()
            .single();

          if (data && !error) {
            set((state) => {
              state.playlists.unshift(data);
            });
            return data;
          }
          return null;
        } catch (error) {
          console.error('[Store] Create playlist failed:', error);
          return null;
        }
      },

      deletePlaylist: async (playlistId) => {
        const { user, playlists } = get();
        if (!user) return;

        set((state) => {
          state.playlists = state.playlists.filter(p => p.id !== playlistId);
        });

        try {
          await supabase
            .from('playlists')
            .delete()
            .eq('id', playlistId);
        } catch (error) {
          console.error('[Store] Delete playlist failed:', error);
          // refetch
          const { fetchPlaylists } = get();
          fetchPlaylists();
        }
      },

      updatePlaylist: async (playlistId, name, description = '', isPublic = false) => {
        const { user } = get();
        if (!user) return;

        set((state) => {
          const idx = state.playlists.findIndex(p => p.id === playlistId);
          if (idx !== -1) {
            state.playlists[idx].name = name.trim();
            state.playlists[idx].description = description.trim() || undefined;
            state.playlists[idx].is_public = isPublic;
          }
        });

        try {
          await supabase
            .from('playlists')
            .update({
              name: name.trim(),
              description: description.trim() || null,
              is_public: isPublic
            })
            .eq('id', playlistId);
        } catch (error) {
          console.error('[Store] Update playlist failed:', error);
          const { fetchPlaylists } = get();
          fetchPlaylists();
        }
      },

      likeSong: async (song) => {
        const { user, likedSongs, likedCount } = get();
        if (!user) return;

        // Optimistic update
        set((state) => {
          if (!state.likedSongs.some(s => s.id === song.id)) {
            state.likedSongs.unshift(song);
            state.likedCount += 1;
          }
        });

        try {
          // 1. Cache song in DB
          await supabase.from('songs').upsert({
            id: song.id,
            title: song.title,
            artist: song.artist,
            duration: song.duration,
            thumbnail_url: song.thumbnailUrl || null,
          }, { onConflict: 'id' });

          // 2. Add to liked_songs
          const { error } = await supabase.from('liked_songs').insert({
            user_id: user.id,
            song_id: song.id,
          });

          if (error) throw error;
        } catch (error) {
          console.error('[Store] Like song failed:', error);
          // Rollback
          const { fetchLikedSongs, fetchLikedCount } = get();
          fetchLikedSongs();
          fetchLikedCount();
        }
      },

      unlikeSong: async (songId) => {
        const { user } = get();
        if (!user) return;

        // Optimistic update
        set((state) => {
          state.likedSongs = state.likedSongs.filter(s => s.id !== songId);
          state.likedCount = Math.max(0, state.likedCount - 1);
        });

        try {
          const { error } = await supabase
            .from('liked_songs')
            .delete()
            .eq('user_id', user.id)
            .eq('song_id', songId);

          if (error) throw error;
        } catch (error) {
          console.error('[Store] Unlike song failed:', error);
          const { fetchLikedSongs, fetchLikedCount } = get();
          fetchLikedSongs();
          fetchLikedCount();
        }
      },

      logout: async () => {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.error('[Store] Supabase signOut error:', e);
        }
        const { clearLocalState } = get();
        clearLocalState();
      },

      clearLocalState: () => {
        set((state) => {
          state.user = null;
          state.playlists = [];
          state.likedSongs = [];
          state.likedCount = 0;
          state.homeData = null;
          state.searchCache = {};
          state.suggestionsCache = {};
          state.streamUrlCache = {};
          state.artistSongsCache = {};
          state.lyricsCache = {};
        });
      },

      getCachedSearch: (query) => {
        const key = query.trim().toLowerCase();
        return get().searchCache[key] || null;
      },
      setCachedSearch: (query, results) => {
        const key = query.trim().toLowerCase();
        set((state) => {
          state.searchCache[key] = results;
          const keys = Object.keys(state.searchCache);
          if (keys.length > 50) {
            delete state.searchCache[keys[0]];
          }
        });
      },
      getCachedSuggestions: (query) => {
        const key = query.trim().toLowerCase();
        return get().suggestionsCache[key] || null;
      },
      setCachedSuggestions: (query, suggestions) => {
        const key = query.trim().toLowerCase();
        set((state) => {
          state.suggestionsCache[key] = suggestions;
          const keys = Object.keys(state.suggestionsCache);
          if (keys.length > 100) {
            delete state.suggestionsCache[keys[0]];
          }
        });
      },
      getCachedStreamUrl: (songId) => {
        const entry = get().streamUrlCache[songId];
        if (!entry) return null;
        if (Date.now() - entry.timestamp > 3600000) {
          return null;
        }
        return entry.url;
      },
      setCachedStreamUrl: (songId, url) => {
        set((state) => {
          state.streamUrlCache[songId] = { url, timestamp: Date.now() };
          const keys = Object.keys(state.streamUrlCache);
          if (keys.length > 100) {
            delete state.streamUrlCache[keys[0]];
          }
        });
      },
      clearCachedStreamUrl: (songId) => {
        set((state) => {
          delete state.streamUrlCache[songId];
        });
      },
      getCachedArtistSongs: (artistName) => {
        const key = artistName.trim().toLowerCase();
        return get().artistSongsCache[key] || null;
      },
      setCachedArtistSongs: (artistName, songs) => {
        const key = artistName.trim().toLowerCase();
        set((state) => {
          state.artistSongsCache[key] = songs;
          const keys = Object.keys(state.artistSongsCache);
          if (keys.length > 50) {
            delete state.artistSongsCache[keys[0]];
          }
        });
      },
      getCachedLyrics: (songId) => {
        return get().lyricsCache[songId] || null;
      },
      setCachedLyrics: (songId, data) => {
        set((state) => {
          state.lyricsCache[songId] = data;
          const keys = Object.keys(state.lyricsCache);
          if (keys.length > 50) {
            delete state.lyricsCache[keys[0]];
          }
        });
      }
    })),
    {
      name: 'flowtunes-storage',
      // Persist only the lists and cache, not user session or loading states
      partialize: (state) => ({
        playlists: state.playlists,
        likedSongs: state.likedSongs,
        likedCount: state.likedCount,
        homeData: state.homeData,
        searchCache: state.searchCache,
        suggestionsCache: state.suggestionsCache,
        streamUrlCache: state.streamUrlCache,
        artistSongsCache: state.artistSongsCache,
        lyricsCache: state.lyricsCache,
      }),
    }
  ),
  { name: 'FlowTunesStore' }
));

// Custom hook to prevent SSR hydration mismatches in Next.js
export function useHydratedStore<T>(selector: (state: AppState) => T, defaultValue: T): T {
  const storeValue = useAppStore(selector);
  const [value, setValue] = useState<T>(defaultValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValue(storeValue);
    setHydrated(true);
  }, [storeValue]);

  return hydrated ? value : defaultValue;
}
