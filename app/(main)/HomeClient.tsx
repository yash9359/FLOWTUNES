'use client';

import React from 'react';
import Link from 'next/link';
import { Song, Artist, Album } from '@/types';
import { usePlayer } from '@/context/PlayerContext';
import { Play, Flame, Music, History, Heart, Disc, Radio } from 'lucide-react';
import { motion } from 'framer-motion';
import { AddToPlaylistMenu } from '@/components/ui/AddToPlaylistMenu';

interface HomeClientProps {
  recommendations: Song[];
  trendingSongs: Song[];
  newReleases: Song[];
  recentlyPlayed: Song[];
  artists: Artist[];
  albums: Album[];
}

export default function HomeClient({
  recommendations,
  trendingSongs,
  newReleases,
  recentlyPlayed,
  artists,
  albums,
}: HomeClientProps) {
  const { playSong } = usePlayer();

  const handlePlayCollection = (song: Song, collection: Song[]) => {
    playSong(song, collection);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-10 pb-10"
    >
      {recommendations.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <Radio className="text-violet-500 animate-pulse" size={22} /> Made For You
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendations.slice(0, 4).map((song, idx) => (
              <motion.div
                key={`rec-${song.id}-${idx}`}
                variants={itemVariants}
                onClick={() => handlePlayCollection(song, recommendations)}
                className="flex items-center gap-4 bg-neutral-900/30 border border-white/5 hover:border-violet-500/20 rounded-xl p-3 cursor-pointer hover:bg-neutral-800/40 hover:scale-[1.01] transition-all group relative overflow-hidden"
              >
                {song.thumbnailUrl && (
                  <img
                    src={song.thumbnailUrl}
                    alt={song.title}
                    className="w-16 h-16 object-cover rounded-lg shadow border border-white/5 shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-white truncate group-hover:text-violet-400 transition-colors">
                    {song.title}
                  </h3>
                  <p className="text-[10px] text-neutral-400 truncate mt-1">{song.artist}</p>
                </div>
                <div
                  className="absolute top-3 right-3 z-20 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  onClick={e => e.stopPropagation()}
                >
                  <AddToPlaylistMenu song={song} direction="down" />
                </div>

                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-violet-600 hover:bg-violet-500 text-white p-2 rounded-full shadow-lg pointer-events-none">
                  <Play size={14} fill="currentColor" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {recentlyPlayed.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <History className="text-neutral-400" size={22} /> Recently Played
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {recentlyPlayed.map((song, idx) => (
              <motion.div
                key={`recent-${song.id}-${idx}`}
                variants={itemVariants}
                onClick={() => handlePlayCollection(song, recentlyPlayed)}
                className="flex flex-col bg-neutral-900/20 border border-white/5 rounded-xl p-3 cursor-pointer hover:bg-neutral-800/40 transition-all group relative"
              >
                <div className="aspect-square w-full rounded-lg overflow-hidden relative mb-3 border border-white/5">
                  {song.thumbnailUrl ? (
                    <img
                      src={song.thumbnailUrl}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-neutral-500">
                      <Music size={24} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <button className="bg-white text-black p-3 rounded-full hover:scale-105 transition-transform shadow-lg">
                      <Play size={18} fill="black" className="translate-x-px" />
                    </button>
                  </div>
                  <div className="absolute top-1.5 right-1.5 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-black/60 rounded-full hover:bg-black/80 backdrop-blur-sm" onClick={e => e.stopPropagation()}>
                    <AddToPlaylistMenu song={song} direction="down" />
                  </div>
                </div>
                <h3 className="text-xs font-bold text-white truncate max-w-full leading-snug">{song.title}</h3>
                <p className="text-[10px] text-neutral-400 truncate mt-1">{song.artist}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
          <Flame className="text-orange-500" size={22} /> Trending Songs
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {trendingSongs.map((song, idx) => (
            <motion.div
              key={`trending-${song.id}-${idx}`}
              variants={itemVariants}
              onClick={() => handlePlayCollection(song, trendingSongs)}
              className="flex flex-col bg-neutral-900/20 border border-white/5 rounded-xl p-3 cursor-pointer hover:bg-neutral-800/40 transition-all group relative"
            >
              <div className="aspect-square w-full rounded-lg overflow-hidden relative mb-3 border border-white/5">
                {song.thumbnailUrl ? (
                  <img
                    src={song.thumbnailUrl}
                    alt={song.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-neutral-500">
                    <Music size={24} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <button className="bg-white text-black p-3 rounded-full hover:scale-105 transition-transform shadow-lg">
                    <Play size={18} fill="black" className="translate-x-px" />
                  </button>
                </div>
                <div className="absolute top-1.5 right-1.5 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-black/60 rounded-full hover:bg-black/80 backdrop-blur-sm" onClick={e => e.stopPropagation()}>
                  <AddToPlaylistMenu song={song} direction="down" />
                </div>
              </div>
              <h3 className="text-xs font-bold text-white truncate max-w-full leading-snug">{song.title}</h3>
              <p className="text-[10px] text-neutral-400 truncate mt-1">{song.artist}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
          <Disc className="text-violet-500 animate-spin-slow" size={22} /> New Releases
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {newReleases.map((song, idx) => (
            <motion.div
              key={`new-${song.id}-${idx}`}
              variants={itemVariants}
              onClick={() => handlePlayCollection(song, newReleases)}
              className="flex flex-col bg-neutral-900/20 border border-white/5 rounded-xl p-3 cursor-pointer hover:bg-neutral-800/40 transition-all group relative"
            >
              <div className="aspect-square w-full rounded-lg overflow-hidden relative mb-3 border border-white/5">
                {song.thumbnailUrl ? (
                  <img
                    src={song.thumbnailUrl}
                    alt={song.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-neutral-500">
                    <Music size={24} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <button className="bg-white text-black p-3 rounded-full hover:scale-105 transition-transform shadow-lg">
                    <Play size={18} fill="black" className="translate-x-px" />
                  </button>
                </div>
                <div className="absolute top-1.5 right-1.5 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-black/60 rounded-full hover:bg-black/80 backdrop-blur-sm" onClick={e => e.stopPropagation()}>
                  <AddToPlaylistMenu song={song} direction="down" />
                </div>
              </div>
              <h3 className="text-xs font-bold text-white truncate max-w-full leading-snug">{song.title}</h3>
              <p className="text-[10px] text-neutral-400 truncate mt-1">{song.artist}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {artists.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl md:text-2xl font-black text-white">Popular Artists</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {artists.map((artist) => (
              <Link
                key={artist.id}
                href={`/artists?id=${artist.id}&name=${encodeURIComponent(artist.name)}`}
                className="flex flex-col items-center text-center p-2 rounded-xl hover:bg-neutral-900/40 transition-all cursor-pointer group"
              >
                <motion.div
                  variants={itemVariants}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden mb-3 border border-white/5 relative"
                >
                  {artist.thumbnailUrl ? (
                    <img
                      src={artist.thumbnailUrl}
                      alt={artist.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-neutral-500">
                      <Music size={24} />
                    </div>
                  )}
                </motion.div>
                <h3 className="text-xs font-bold text-white truncate max-w-full group-hover:text-violet-400 transition-colors">
                  {artist.name}
                </h3>
                <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Artist</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {albums.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <Disc className="text-violet-400" size={22} /> Popular Albums
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {albums.map((album) => (
              <Link
                key={album.id}
                href={`/albums?id=${album.id}&name=${encodeURIComponent(album.title)}&artist=${encodeURIComponent(album.artistName || '')}`}
                className="flex flex-col bg-neutral-900/20 border border-white/5 rounded-xl p-3 cursor-pointer hover:bg-neutral-800/40 transition-all group relative"
              >
                <motion.div
                  variants={itemVariants}
                  className="aspect-square w-full rounded-lg overflow-hidden relative mb-3 border border-white/5"
                >
                  {album.thumbnailUrl ? (
                    <img
                      src={album.thumbnailUrl}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-neutral-500">
                      <Music size={24} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <button className="bg-white text-black p-3 rounded-full hover:scale-105 transition-transform shadow-lg">
                      <Play size={18} fill="black" className="translate-x-px" />
                    </button>
                  </div>
                </motion.div>
                <h3 className="text-xs font-bold text-white truncate max-w-full leading-snug group-hover:text-violet-400 transition-colors">
                  {album.title}
                </h3>
                <p className="text-[10px] text-neutral-400 truncate mt-1">{album.artistName}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
