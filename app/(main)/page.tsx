'use client';

import React from 'react';
import HomeClient from './HomeClient';
import { useAppStore } from '@/lib/store/useAppStore';
import { Song, Artist, Album } from '@/types';
import { Radio } from 'lucide-react';

export default function HomePage() {
  const homeData = useAppStore(state => state.homeData);
  const isLoading = useAppStore(state => state.isHomeLoading);
  const fetchHomeData = useAppStore(state => state.fetchHomeData);

  React.useEffect(() => {
    if (!homeData && !isLoading) {
      fetchHomeData();
    }
  }, [homeData, isLoading, fetchHomeData]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-10 pb-10 select-none max-w-7xl mx-auto animate-pulse">
        <div className="flex flex-col gap-4">
          <div className="h-6 w-48 bg-neutral-900 rounded-lg" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 bg-neutral-900/40 p-3 rounded-xl border border-white/5 h-22 animate-pulse" />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="h-6 w-36 bg-neutral-900 rounded-lg" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col bg-neutral-900/30 p-3 rounded-xl border border-white/5 gap-3 animate-pulse">
                <div className="aspect-square w-full bg-neutral-900 rounded-lg" />
                <div className="h-3 w-3/4 bg-neutral-900 rounded" />
                <div className="h-2.5 w-1/2 bg-neutral-900 rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="h-6 w-40 bg-neutral-900 rounded-lg" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col bg-neutral-900/30 p-3 rounded-xl border border-white/5 gap-3 animate-pulse">
                <div className="aspect-square w-full bg-neutral-900 rounded-lg" />
                <div className="h-3 w-3/4 bg-neutral-900 rounded" />
                <div className="h-2.5 w-1/2 bg-neutral-900 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!homeData) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
        <Radio className="text-neutral-600 animate-bounce" size={48} />
        <h3 className="font-bold text-neutral-300">Offline mode active</h3>
        <p className="text-xs text-neutral-500 max-w-sm">
          Could not load the catalog recommendations. Try checking your internet connection or search for specific tracks.
        </p>
      </div>
    );
  }

  return (
    <HomeClient
      recommendations={homeData.recommendations}
      trendingSongs={homeData.trendingSongs}
      newReleases={homeData.newReleases}
      recentlyPlayed={homeData.recentlyPlayed}
      artists={homeData.artists}
      albums={homeData.albums}
    />
  );
}
