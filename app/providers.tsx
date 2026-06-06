'use client';

import React, { useEffect } from 'react';
import { PlayerProvider } from '@/context/PlayerContext';
import { useAppStore } from '@/lib/store/useAppStore';

export function Providers({ children }: { children: React.ReactNode }) {
  const fetchUser = useAppStore((state) => state.fetchUser);
  const fetchPlaylists = useAppStore((state) => state.fetchPlaylists);
  const fetchLikedCount = useAppStore((state) => state.fetchLikedCount);
  const fetchLikedSongs = useAppStore((state) => state.fetchLikedSongs);
  const user = useAppStore((state) => state.user);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (user) {
      fetchPlaylists();
      fetchLikedCount();
      fetchLikedSongs();
    }
  }, [user, fetchPlaylists, fetchLikedCount, fetchLikedSongs]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => registration.unregister());
        });
      }
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => {
            if (key.startsWith('flowtunes-cache')) {
              caches.delete(key);
            }
          });
        });
      }
      return;
    }

    if ('serviceWorker' in navigator && !('workbox' in window)) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('[PWA] Service Worker registered with scope:', registration.scope);
          },
          (err) => {
            console.error('[PWA] Service Worker registration failed:', err);
          }
        );
      });
    }
  }, []);

  return (
    <PlayerProvider>
      {children}
    </PlayerProvider>
  );
}
