'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, User, Compass, LogOut, ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedGradientText } from '@/components/ui/AnimatedGradientText';

export const Header: React.FC = () => {
  const router = useRouter();
  const [greeting, setGreeting] = useState('Welcome');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  
  const supabase = createClient();

  const user = useAppStore(state => state.user);
  const logout = useAppStore(state => state.logout);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

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
  }, [user]);

  const handleSignOut = async () => {
    await logout();
    setShowDropdown(false);
    window.location.href = '/auth/login';
  };

  return (
    <header className="w-full h-16 px-6 md:px-8 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between sticky top-0 z-30 select-none">
      <div className="hidden md:flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="p-1.5 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-full transition-colors"
          title="Go Back"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => router.forward()}
          className="p-1.5 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-full transition-colors"
          title="Go Forward"
        >
          <ChevronRight size={18} />
        </button>
        <AnimatedGradientText className="text-sm font-bold ml-4">
          {greeting}
        </AnimatedGradientText>
      </div>

      <div className="flex md:hidden items-center gap-2">
        <div
          className="h-7 w-7 rounded-lg flex items-center justify-center shadow shadow-vibe-accent/20 transition-all duration-500"
          style={{ backgroundImage: 'linear-gradient(135deg, var(--vibe-accent), rgba(var(--vibe-accent-rgb), 0.6))' }}
        >
          <Compass className="text-white h-4.5 w-4.5 animate-spin-slow" />
        </div>
        <span className="text-base font-black tracking-tight text-white">
          Flow<span className="text-vibe-accent transition-colors duration-500">Tunes</span>
        </span>
      </div>

      <div className="relative">
        <button
          onClick={() => setShowDropdown(prev => !prev)}
          className="flex items-center gap-2 focus:outline-none"
        >
          {userEmail ? (
            <div className="flex items-center gap-2">
              {userName && (
                <span className="text-xs text-neutral-300 hidden sm:inline font-semibold">
                  {userName}
                </span>
              )}
              <div
                className="w-8 h-8 rounded-full text-white font-bold flex items-center justify-center text-xs shadow-lg border border-white/10 select-none transition-transform hover:scale-105 active:scale-95 duration-500"
                style={{ backgroundImage: 'linear-gradient(135deg, var(--vibe-accent), rgba(var(--vibe-accent-rgb), 0.6))' }}
              >
                {(userName || userEmail)[0].toUpperCase()}
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-neutral-900 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/5 hover:bg-neutral-800">
              <User size={16} />
            </div>
          )}
        </button>

        <AnimatePresence>
          {showDropdown && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowDropdown(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2.5 w-52 rounded-xl bg-neutral-900 border border-white/10 shadow-2xl p-2 z-50 flex flex-col gap-1 text-sm select-none"
              >
                {userEmail ? (
                  <>
                    <div className="px-2.5 py-2 border-b border-white/5 mb-1.5 min-w-0">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Signed in as</p>
                      {userName && (
                        <p className="text-xs font-bold text-white truncate mt-1">{userName}</p>
                      )}
                      <p className="text-[10px] text-neutral-400 truncate mt-1">{userEmail}</p>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          router.push('/admin');
                        }}
                        className="flex items-center gap-2.5 w-full text-left px-2.5 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-white/5 transition-colors font-semibold"
                      >
                        <ShieldAlert size={15} className="text-vibe-accent" />
                        Admin Panel
                      </button>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2.5 w-full text-left px-2.5 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors font-bold"
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <div className="px-2.5 py-2 border-b border-white/5 mb-1.5 text-center">
                      <p className="text-xs font-bold text-white">Welcome to FlowTunes</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        router.push('/auth/login');
                      }}
                      className="flex items-center justify-center w-full py-2 rounded-lg bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-colors"
                    >
                      Log In
                    </button>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        router.push('/auth/signup');
                      }}
                      className="flex items-center justify-center w-full py-2 rounded-lg border border-white/10 text-white font-bold text-xs hover:bg-white/5 transition-colors mt-1"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
