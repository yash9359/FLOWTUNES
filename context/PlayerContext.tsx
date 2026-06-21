'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Song } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/useAppStore';
import { extractColorsFromImage, getDefaultColors } from '@/lib/vibe';

type RepeatMode = 'none' | 'one' | 'all';

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  progress: number;
  duration: number;
  playbackError: string | null;
  queue: Song[];
  queueIndex: number;
  shuffleMode: boolean;
  repeatMode: RepeatMode;
  isMobileExpanded: boolean;
  setIsMobileExpanded: (expanded: boolean) => void;
  playSong: (song: Song, newQueue?: Song[]) => void | Promise<void>;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  clearPlaybackError: () => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (songId: string) => void;
  clearQueue: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevSongIdRef = useRef<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const savedVolume = localStorage.getItem('flowtunes_volume');
    const savedMuted = localStorage.getItem('flowtunes_muted') === 'true';
    if (savedVolume) setVolumeState(parseFloat(savedVolume));
    setIsMuted(savedMuted);
  }, []);

  useEffect(() => {
    const updateVibeColors = async () => {
      if (!currentSong || !currentSong.thumbnailUrl) {
        const defaults = getDefaultColors();
        const root = document.documentElement;
        root.style.setProperty('--vibe-accent', defaults.accent);
        root.style.setProperty('--vibe-accent-rgb', defaults.accentRgb);
        root.style.setProperty('--vibe-accent-hover', defaults.accentHover);
        root.style.setProperty('--vibe-accent-muted', defaults.accentMuted);
        root.style.setProperty('--vibe-glow', defaults.glow);
        root.style.setProperty('--vibe-bg-glow', defaults.bgGlow);
        return;
      }

      try {
        const colors = await extractColorsFromImage(currentSong.thumbnailUrl);
        const root = document.documentElement;
        root.style.setProperty('--vibe-accent', colors.accent);
        root.style.setProperty('--vibe-accent-rgb', colors.accentRgb);
        root.style.setProperty('--vibe-accent-hover', colors.accentHover);
        root.style.setProperty('--vibe-accent-muted', colors.accentMuted);
        root.style.setProperty('--vibe-glow', colors.glow);
        root.style.setProperty('--vibe-bg-glow', colors.bgGlow);
      } catch (err) {
        console.warn('[Vibe] Failed to update dynamic colors:', err);
      }
    };

    updateVibeColors();
  }, [currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const [clientStreamUrl, setClientStreamUrl] = useState<string | null>(null);
  const [streamSongId, setStreamSongId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentSong) {
      setClientStreamUrl(null);
      setStreamSongId(null);
      return;
    }

    // Immediately pause existing audio and clear stream URL to prevent the old song from leaking
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setClientStreamUrl(null);
    setStreamSongId(null);

    let active = true;

    const resolveStream = async () => {
      setPlaybackError(null);
      
      const store = useAppStore.getState();
      const cachedUrl = store.getCachedStreamUrl(currentSong.id);
      if (cachedUrl) {
        if (!active) return;
        console.log(`[Player] Success: Serving cached stream URL for ${currentSong.id}`);
        setClientStreamUrl(cachedUrl);
        setStreamSongId(currentSong.id);
        return;
      }
      
      const cleanSongTitle = currentSong.title
        .replace(/\(From\s+.*\)|\[From\s+.*\]|\(Official.*\)|\[Official.*\]|\(Video.*\)|\[Video.*\]|\(Lyrics.*\)|\[Lyrics.*\]|\(Full.*\)|\[Full.*\]|OST|Remix|New Song|Video Jukebox|Audio Song| - Topic|#\S+/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
        
      const searchTerms = `${cleanSongTitle} ${currentSong.artist}`.replace(/Unknown Artist|Various Artists/gi, '').trim();

      try {
        const res = await fetch(`https://jio-savan-api-omega.vercel.app/song/get/?id=${currentSong.id}`).then(r => r.json());
        if (!active) return;
        if (res && res.media_url) {
          const secureUrl = res.media_url.replace('http://', 'https://');
          console.log(`[Player] Success: ID match from JioSaavn API`);
          store.setCachedStreamUrl(currentSong.id, secureUrl);
          setClientStreamUrl(secureUrl);
          setStreamSongId(currentSong.id);
          return;
        }
      } catch (e) {}

      if (!active) return;
      console.log('[Player] ID failed, trying Content-Match for:', searchTerms);
      try {
        const sRes = await fetch(`https://jio-savan-api-omega.vercel.app/song/?query=${encodeURIComponent(searchTerms)}`).then(r => r.json());
        if (!active) return;
        const match = Array.isArray(sRes) ? sRes[0] : null;
        if (match && match.media_url) {
          const secureUrl = match.media_url.replace('http://', 'https://');
          console.log(`[Player] Success: Content-Match from JioSaavn API`);
          store.setCachedStreamUrl(currentSong.id, secureUrl);
          setClientStreamUrl(secureUrl);
          setStreamSongId(currentSong.id);
          return;
        }
      } catch (e) {}

      if (!active) return;
      if (currentSong.id.length === 11) {
        const pipedInstances = ['https://pipedapi.kavin.rocks', 'https://pipedapi.moomoo.me', 'https://api.piped.privacydev.net'];
        for (const inst of pipedInstances) {
          try {
            const pRes = await fetch(`${inst}/streams/${currentSong.id}`).then(r => r.json());
            if (!active) return;
            if (pRes.audioStreams?.length > 0) {
              pRes.audioStreams.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
              const secureUrl = pRes.audioStreams[0].url.replace('http://', 'https://');
              console.log(`[Player] Success: Piped instance ${inst}`);
              store.setCachedStreamUrl(currentSong.id, secureUrl);
              setClientStreamUrl(secureUrl);
              setStreamSongId(currentSong.id);
              return;
            }
          } catch (e) {}
        }
      }

      if (!active) return;
      console.warn('[Player] All client strategies failed, using server proxy.');
      const fallbackUrl = `/api/stream?v=${currentSong.id}&title=${encodeURIComponent(currentSong.title)}&artist=${encodeURIComponent(currentSong.artist)}&cb=v2`;
      store.setCachedStreamUrl(currentSong.id, fallbackUrl);
      setClientStreamUrl(fallbackUrl);
      setStreamSongId(currentSong.id);
    };

    resolveStream();

    return () => {
      active = false;
    };
  }, [currentSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !clientStreamUrl || streamSongId !== currentSong?.id) return;

    if (currentSong) {
      if (currentSong.id !== prevSongIdRef.current) {
        prevSongIdRef.current = currentSong.id;
        audio.load();
      }
    }

    if (isPlaying) {
      audio.play().catch(err => {
        console.warn('Playback interrupted:', err);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong, clientStreamUrl, streamSongId]);

  const user = useAppStore(state => state.user);

  useEffect(() => {
    if (!currentSong || !user) return;

    const logHistory = async () => {
      await supabase.from('recently_played').insert({
        user_id: user.id,
        song_id: currentSong.id,
      });
    };
    logHistory();
  }, [currentSong, user, supabase]);

  const playSong = async (song: Song, newQueue?: Song[]) => {
    setPlaybackError(null);
    let enrichedQueue = newQueue ? [...newQueue] : [song];

    if (enrichedQueue.length < 5 && song.artist && song.artist.toLowerCase() !== 'unknown artist') {
      try {
        const primaryArtist = song.artist.split(',')[0].trim();
        const store = useAppStore.getState();
        let relatedSongs = store.getCachedArtistSongs(primaryArtist);

        if (!relatedSongs) {
          const res = await fetch(`https://jio-savan-api-omega.vercel.app/song/?query=${encodeURIComponent(primaryArtist)}`).then(r => r.json());
          if (Array.isArray(res) && res.length > 0) {
            relatedSongs = res.map((item: any) => ({
              id: item.id,
              title: item.song,
              artist: item.primary_artists || item.singers || 'Unknown Artist',
              artistId: item.primary_artists_id || undefined,
              album: item.album || undefined,
              albumId: item.albumid || undefined,
              duration: item.duration ? parseInt(item.duration, 10) : 180,
              thumbnailUrl: item.image || undefined,
              streamUrl: item.media_url || undefined,
              provider: 'JioSaavn'
            }));
            store.setCachedArtistSongs(primaryArtist, relatedSongs);
          }
        }

        if (relatedSongs && relatedSongs.length > 0) {
          relatedSongs.forEach(rs => {
            if (!enrichedQueue.some(eq => eq.id === rs.id)) {
              enrichedQueue.push(rs);
            }
          });
        }
      } catch (e) {
        console.warn('[PlayerContext] Failed to enrich queue with artist songs:', e);
      }
    }

    setQueue(enrichedQueue);
    const idx = enrichedQueue.findIndex(s => s.id === song.id);
    setQueueIndex(idx !== -1 ? idx : 0);
    setCurrentSong(song);
    setIsPlaying(true);
    setProgress(0);
  };

  const togglePlay = () => {
    if (!currentSong && queue.length > 0) {
      setQueueIndex(0);
      setCurrentSong(queue[0]);
      setIsPlaying(true);
      return;
    }
    setIsPlaying(prev => !prev);
  };

  const next = () => {
    if (queue.length === 0) return;

    let nextIndex = queueIndex;
    if (shuffleMode) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = queueIndex + 1;
      if (nextIndex >= queue.length) {
        nextIndex = repeatMode === 'all' ? 0 : queue.length - 1;
      }
    }

    if (nextIndex < queue.length && nextIndex !== queueIndex) {
      setQueueIndex(nextIndex);
      setCurrentSong(queue[nextIndex]);
      setIsPlaying(true);
      setProgress(0);
    } else if (repeatMode === 'all' && queue.length > 0) {
      setQueueIndex(0);
      setCurrentSong(queue[0]);
      setIsPlaying(true);
      setProgress(0);
    } else {
      setIsPlaying(false);
    }
  };

  const prev = () => {
    if (queue.length === 0) return;

    let prevIndex = queueIndex;
    if (progress > 5) {
      seek(0);
      return;
    }

    if (shuffleMode) {
      prevIndex = Math.floor(Math.random() * queue.length);
    } else {
      prevIndex = queueIndex - 1;
      if (prevIndex < 0) {
        prevIndex = repeatMode === 'all' ? queue.length - 1 : 0;
      }
    }

    if (prevIndex >= 0 && prevIndex !== queueIndex) {
      setQueueIndex(prevIndex);
      setCurrentSong(queue[prevIndex]);
      setIsPlaying(true);
      setProgress(0);
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const setVolume = (vol: number) => {
    const clampedVol = Math.max(0, Math.min(1, vol));
    setVolumeState(clampedVol);
    localStorage.setItem('flowtunes_volume', clampedVol.toString());
    if (clampedVol > 0) {
      setIsMuted(false);
      localStorage.setItem('flowtunes_muted', 'false');
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => {
      const nextMuted = !prev;
      localStorage.setItem('flowtunes_muted', nextMuted.toString());
      return nextMuted;
    });
  };

  const toggleShuffle = () => {
    setShuffleMode(prev => !prev);
  };

  const toggleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'none') return 'all';
      if (prev === 'all') return 'one';
      return 'none';
    });
  };

  const addToQueue = (song: Song) => {
    setQueue(prev => {
      if (prev.some(s => s.id === song.id)) return prev;
      return [...prev, song];
    });
    if (queue.length === 0) {
      setQueueIndex(0);
      setCurrentSong(song);
    }
  };

  const removeFromQueue = (songId: string) => {
    setQueue(prev => {
      const filtered = prev.filter(s => s.id !== songId);
      const matchIndex = prev.findIndex(s => s.id === songId);
      if (matchIndex === queueIndex) {
        if (filtered.length > 0) {
          const nextIdx = matchIndex >= filtered.length ? 0 : matchIndex;
          setQueueIndex(nextIdx);
          setCurrentSong(filtered[nextIdx]);
        } else {
          setQueueIndex(-1);
          setCurrentSong(null);
          setIsPlaying(false);
        }
      } else if (matchIndex < queueIndex) {
        setQueueIndex(queueIndex - 1);
      }
      return filtered;
    });
  };

  const clearQueue = () => {
    setQueue([]);
    setQueueIndex(-1);
    setCurrentSong(null);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    if (repeatMode === 'one') {
      seek(0);
      if (audioRef.current) audioRef.current.play();
    } else {
      next();
    }
  };

  const handleAudioError = () => {
    if (!clientStreamUrl) return;
    if (currentSong) {
      console.warn(`[Player] Playback error for ${currentSong.id}, clearing cached stream URL`);
      useAppStore.getState().clearCachedStreamUrl(currentSong.id);
    }
    const err = audioRef.current?.error;
    if (!err) {
      setPlaybackError('Playback error occurred. Please try another track.');
      return;
    }
    switch (err.code) {
      case MediaError.MEDIA_ERR_ABORTED:
        setPlaybackError('Playback was aborted.');
        break;
      case MediaError.MEDIA_ERR_NETWORK:
        setPlaybackError('Network error while loading the track.');
        break;
      case MediaError.MEDIA_ERR_DECODE:
        setPlaybackError('Audio decode error.');
        break;
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        setPlaybackError('Track source not supported.');
        break;
      default:
        setPlaybackError('Playback error occurred.');
        break;
    }
  };

  const clearPlaybackError = () => setPlaybackError(null);

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        volume,
        isMuted,
        progress,
        duration,
        playbackError,
        queue,
        queueIndex,
        shuffleMode,
        repeatMode,
        isMobileExpanded,
        setIsMobileExpanded,
        playSong,
        togglePlay,
        next,
        prev,
        seek,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        clearPlaybackError,
        addToQueue,
        removeFromQueue,
        clearQueue,
        audioRef,
      }}
    >
      {children}
      {currentSong && (
        <audio
          ref={audioRef}
          src={clientStreamUrl || undefined} 
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onError={handleAudioError}
        />
      )}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
