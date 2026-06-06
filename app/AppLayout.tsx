'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { MusicPlayer } from '@/components/player/MusicPlayer';
import { SyncedLyrics } from '@/components/lyrics/SyncedLyrics';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [showLyrics, setShowLyrics] = useState(false);
  const pathname = usePathname();
  const [pageTransitioning, setPageTransitioning] = useState(false);

  useEffect(() => {
    setPageTransitioning(true);
    const timer = setTimeout(() => {
      setPageTransitioning(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div className="flex bg-neutral-950 text-white min-h-screen font-sans selection:bg-violet-500/30 selection:text-white relative">
      
      <AnimatePresence>
        {pageTransitioning && (
          <motion.div
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: [0, 0.6, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            className="fixed top-0 left-0 right-0 h-0.75 bg-linear-to-r from-violet-500 via-fuchsia-500 to-indigo-500 z-9999 md:left-60 origin-left shadow-[0_0_8px_rgba(139,92,246,0.5)]"
          />
        )}
      </AnimatePresence>

      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 pb-36 md:pb-24">
        <Header />
        
        <main className={`flex-1 overflow-y-auto px-6 py-6 md:px-8 transition-opacity duration-300 ${pageTransitioning ? 'opacity-85' : 'opacity-100'}`}>
          {children}
        </main>

        <AnimatePresence>
          {showLyrics && (
            <SyncedLyrics onClose={() => setShowLyrics(false)} />
          )}
        </AnimatePresence>

        <MusicPlayer 
          onToggleLyrics={() => setShowLyrics(prev => !prev)} 
          showLyrics={showLyrics} 
        />

        <BottomNav />
      </div>
    </div>
  );
}
