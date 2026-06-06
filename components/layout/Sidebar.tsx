'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, Heart, PlusCircle, ShieldAlert, LogOut, Compass } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || null);
        const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
        setUserName(meta?.full_name || meta?.name || null);
        const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || 'admin@flowtunes.com').split(',');
        setIsAdmin(adminEmails.includes(user.email || ''));
      } else {
        setUserEmail(null);
        setUserName(null);
        setIsAdmin(false);
      }
    };

    checkUser();
  }, [pathname, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/library', label: 'Library', icon: Library },
    { href: '/liked', label: 'Liked Songs', icon: Heart },
  ];

  return (
    <aside className="w-64 bg-black h-screen border-r border-white/5 flex flex-col justify-between p-6 select-none shrink-0 sticky top-0">
      <div className="flex flex-col gap-8">
        <Link href="/" className="flex items-center gap-2.5 px-2">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20"
            style={{ backgroundImage: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            <Compass className="text-white h-5.5 w-5.5 animate-spin-slow" />
          </div>
          <span className="text-xl font-black tracking-tight text-white bg-clip-text">
            Flow<span className="text-violet-400">Tunes</span>
          </span>
        </Link>

        <nav className="flex flex-col gap-1.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold group ${
                  isActive 
                    ? 'text-white shadow-sm border border-violet-500/20' 
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
                }`}
                style={
                  isActive
                    ? { backgroundImage: 'linear-gradient(90deg, rgba(124,58,237,0.25), rgba(79,70,229,0.1))' }
                    : undefined
                }
              >
                <Icon size={18} className={`transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-violet-400' : 'text-neutral-400 group-hover:text-white'}`} />
                {link.label}
              </Link>
            );
          })}
          
          {isAdmin && (
            <Link
              href="/admin"
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold group ${
                pathname.startsWith('/admin')
                  ? 'text-white shadow-sm border border-violet-500/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
              }`}
              style={
                pathname.startsWith('/admin')
                  ? { backgroundImage: 'linear-gradient(90deg, rgba(124,58,237,0.25), rgba(79,70,229,0.1))' }
                  : undefined
              }
            >
              <ShieldAlert size={18} className="text-violet-400" />
              Admin Panel
            </Link>
          )}
        </nav>
      </div>

      <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
        {userEmail ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 px-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[11px] shadow"
                style={{ backgroundImage: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
              >
                {(userName || userEmail)[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-neutral-500 truncate leading-none">Logged in as</p>
                {userName && (
                  <p className="text-[11px] text-white font-bold truncate mt-0.5">{userName}</p>
                )}
                <p className="text-[9px] text-neutral-500 truncate mt-0.5">{userEmail}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/5 transition-all text-[11px] font-bold w-full mt-1"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <a
              href="/auth/login"
              className="flex items-center justify-center py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold transition-all shadow-md hover:scale-[1.02]"
            >
              Log In
            </a>
            <a
              href="/auth/signup"
              className="flex items-center justify-center py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-white text-xs font-bold transition-all hover:bg-neutral-900"
            >
              Sign Up
            </a>
          </div>
        )}
      </div>
    </aside>
  );
};
