'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Music } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full gap-6 select-none">
      <div className="relative flex items-center justify-center">
        <motion.div
          className="absolute w-24 h-24 rounded-full border border-violet-500/30 bg-violet-500/5 filter blur-sm"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <motion.div
          className="w-16 h-16 rounded-full border-2 border-transparent border-t-violet-500 border-r-indigo-500"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        <div className="absolute text-violet-400">
          <motion.div
            animate={{
              y: [2, -2, 2],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Music size={24} />
          </motion.div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1.5 text-center">
        <h3 className="font-bold text-neutral-200 tracking-wide text-sm">
          Loading FlowTunes
        </h3>
        <p className="text-[10px] text-neutral-400 font-medium tracking-wider uppercase animate-pulse">
          Tuning your flow...
        </p>
      </div>

      <div className="fixed top-0 left-0 right-0 h-0.5 bg-neutral-900 overflow-hidden z-100 md:left-60">
        <motion.div
          className="h-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-indigo-500"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
    </div>
  );
}
