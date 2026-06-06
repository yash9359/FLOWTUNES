'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Compass, Mail, Lock, UserPlus, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?verified=true`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        if (data?.session) {
          window.location.href = '/';
        } else {
          setSuccessMsg('Registration successful! Please check your email inbox to verify your account.');
          setName('');
          setEmail('');
          setPassword('');
        }
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-neutral-900/40 border border-white/5 backdrop-blur-xl p-8 rounded-2xl shadow-2xl flex flex-col gap-6"
      >
        <div className="flex flex-col items-center gap-2 text-center select-none">
          <div className="h-12 w-12 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20 mb-2">
            <Compass className="text-white h-7 w-7 animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Create Account</h2>
          <p className="text-xs text-neutral-400">Join FlowTunes to unlock premium streaming features</p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2.5 rounded-xl font-semibold">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-2.5 rounded-xl font-semibold flex flex-col gap-1.5 items-center text-center">
            <ShieldCheck size={24} className="text-emerald-400 mb-1" />
            {successMsg}
          </div>
        )}

        {!successMsg && (
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-2.5 bg-neutral-950 border border-white/5 rounded-xl text-sm focus:border-violet-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-950 border border-white/5 rounded-xl text-sm focus:border-violet-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-500">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-950 border border-white/5 rounded-xl text-sm focus:border-violet-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-white hover:bg-neutral-200 text-black font-bold rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all duration-200 disabled:opacity-50"
            >
              <UserPlus size={16} />
              {loading ? 'Registering...' : 'Create Account'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-neutral-400">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-violet-400 hover:underline font-bold">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
