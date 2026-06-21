import { NextResponse } from 'next/server';
import { getRecommendationsForUser } from '@/lib/recommendations';
import { createClient } from '@/lib/supabase/server';
import { Song } from '@/types';

export const dynamic = 'force-dynamic';

let cachedTrending: any = null;
let cachedNewReleases: any = null;
let lastFetchTime = 0;
const CACHE_TTL = 30 * 60 * 1000;

const mapJioSaavnSong = (item: any): Song => ({
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
});

export async function GET() {
  try {
    const now = Date.now();

    const recommendationsPromise = getRecommendationsForUser();

    let trendingSongs: Song[] = [];
    let newReleases: Song[] = [];
    let artists: any[] = [];
    let albums: any[] = [];

    if (cachedTrending && cachedNewReleases && (now - lastFetchTime < CACHE_TTL)) {
      console.log('[Home API Route] Serving trending & new releases from cache');
      trendingSongs = cachedTrending.songs;
      newReleases = cachedNewReleases.songs;
      artists = cachedTrending.artists;
      albums = cachedTrending.albums;
    } else {
      console.log('[Home API Route] Cache miss. Querying JioSaavn API...');
      
      const [tRes1, tRes2, nrRes1, nrRes2] = await Promise.all([
        fetch('https://jio-savan-api-omega.vercel.app/song/?query=Arijit%20Singh').then(r => r.json()),
        fetch('https://jio-savan-api-omega.vercel.app/song/?query=Pritam').then(r => r.json()),
        fetch('https://jio-savan-api-omega.vercel.app/song/?query=Latest%20Hindi%20Songs').then(r => r.json()),
        fetch('https://jio-savan-api-omega.vercel.app/song/?query=Latest%20Punjabi%20Songs').then(r => r.json())
      ]);

      const tSongs1 = Array.isArray(tRes1) ? tRes1 : [];
      const tSongs2 = Array.isArray(tRes2) ? tRes2 : [];
      const nrSongs1 = Array.isArray(nrRes1) ? nrRes1 : [];
      const nrSongs2 = Array.isArray(nrRes2) ? nrRes2 : [];

      const combinedTSongs = [...tSongs1, ...tSongs2];
      const combinedNrSongs = [...nrSongs1, ...nrSongs2];

      trendingSongs = combinedTSongs.map(mapJioSaavnSong);
      newReleases = combinedNrSongs.map(mapJioSaavnSong);

      combinedTSongs.forEach((item: any) => {
        if (item.primary_artists && item.primary_artists_id) {
          const names = item.primary_artists.split(',');
          const ids = item.primary_artists_id.split(',');
          const primaryName = names[0].trim();
          const primaryId = ids[0].trim();
          if (primaryId && !artists.some(a => a.id === primaryId)) {
            artists.push({
              id: primaryId,
              name: primaryName,
              thumbnailUrl: item.image || undefined,
            });
          }
        }
        if (item.album && item.albumid) {
          if (!albums.some(a => a.id === item.albumid)) {
            albums.push({
              id: item.albumid,
              title: item.album,
              artistName: item.primary_artists || 'Unknown Artist',
              thumbnailUrl: item.image || undefined,
            });
          }
        }
      });

      if (trendingSongs.length > 0 && newReleases.length > 0) {
        cachedTrending = { songs: trendingSongs, artists, albums };
        cachedNewReleases = { songs: newReleases };
        lastFetchTime = now;
      }
    }

    const getRecentlyPlayed = async (): Promise<Song[]> => {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
          .from('recently_played')
          .select(`
            song_id,
            played_at
          `)
          .order('played_at', { ascending: false })
          .limit(30);

        if (error || !data || data.length === 0) return [];

        // Remove duplicate song_ids while keeping the first (latest) occurrence
        const uniqueSongIds: string[] = [];
        const seen = new Set<string>();
        for (const item of data) {
          if (item.song_id && !seen.has(item.song_id)) {
            seen.add(item.song_id);
            uniqueSongIds.push(item.song_id);
          }
        }

        // Take only the top 6 unique song ids
        const finalSongIds = uniqueSongIds.slice(0, 6);

        const { data: songsCache } = await supabase
          .from('songs')
          .select('*')
          .in('id', finalSongIds);

        if (!songsCache) return [];

        const orderedSongs: Song[] = [];
        finalSongIds.forEach(id => {
          const found = songsCache.find(s => s.id === id);
          if (found) {
            orderedSongs.push({
              id: found.id,
              title: found.title,
              artist: found.artist,
              artistId: found.artist_id || undefined,
              album: found.album || undefined,
              albumId: found.album_id || undefined,
              duration: found.duration,
              thumbnailUrl: found.thumbnail_url || undefined,
            });
          }
        });

        return orderedSongs;
      } catch (err) {
        console.error('[RecentlyPlayed] Fetch failed:', err);
        return [];
      }
    };

    const recentlyPlayedPromise = getRecentlyPlayed();

    const [recommendations, recentlyPlayed] = await Promise.all([
      recommendationsPromise,
      recentlyPlayedPromise,
    ]);

    return NextResponse.json({
      recommendations,
      trendingSongs: trendingSongs.slice(0, 6),
      newReleases: newReleases.slice(0, 6),
      recentlyPlayed,
      artists: artists.slice(0, 6),
      albums: albums.slice(0, 6),
    });
  } catch (error: any) {
    console.error('[Home API Route] Failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch home data' }, { status: 500 });
  }
}
