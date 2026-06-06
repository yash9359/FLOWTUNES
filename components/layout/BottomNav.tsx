'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, Heart } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { isMobileExpanded } = usePlayer();

  const tabs = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/library', label: 'Library', icon: Library },
    { href: '/liked', label: 'Liked', icon: Heart },
  ];

  if (isMobileExpanded) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/85 backdrop-blur-xl border-t border-white/5 py-2 px-6 flex justify-between items-center md:hidden">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${
              isActive ? 'text-violet-400' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Icon size={20} className={isActive ? 'scale-110 text-violet-400' : 'text-neutral-400'} />
            <span className="text-[9px] font-semibold tracking-wide select-none">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
