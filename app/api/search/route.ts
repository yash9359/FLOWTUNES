import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Song, Artist, Album } from '@/types';

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const suggestionsOnly = searchParams.get('suggestions') === 'true';

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameters' }, { status: 400 });
  }

  try {
    if (suggestionsOnly) {
      if (query.trim().length < 2) {
        return NextResponse.json({ suggestions: [] });
      }
      
      const response = await fetch(`https://jio-savan-api-omega.vercel.app/song/?query=${encodeURIComponent(query)}`);
      const items = await response.json();
      const songsList = Array.isArray(items) ? items : [];

      const suggestions = Array.from(new Set(songsList.map((item: any) => item.song))).slice(0, 10);
      return NextResponse.json({ suggestions });
    }

    const variations = [
      query,
      `${query} songs`,
      `${query} hits`,
      `${query} music`
    ];

    const responses = await Promise.all(
      variations.map(q => 
        fetch(`https://jio-savan-api-omega.vercel.app/song/?query=${encodeURIComponent(q)}`)
          .then(r => r.json())
          .catch(() => [])
      )
    );

    const seenIds = new Set<string>();
    const songsList: any[] = [];

    responses.forEach(items => {
      if (Array.isArray(items)) {
        items.forEach(item => {
          if (item && item.id && !seenIds.has(item.id)) {
            seenIds.add(item.id);
            songsList.push(item);
          }
        });
      }
    });

    const songs = songsList.map(mapJioSaavnSong);
    const artists: Artist[] = [];
    const albums: Album[] = [];

    songsList.forEach((item: any) => {
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

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Cache songs in database
    if (songs.length > 0) {
      const dbSongs = songs.map(song => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        artist_id: song.artistId || null,
        album: song.album || null,
        album_id: song.albumId || null,
        duration: song.duration,
        thumbnail_url: song.thumbnailUrl || null,
      }));

      await supabase.from('songs').upsert(dbSongs, { onConflict: 'id' });
    }

    // Log search history if user logged in
    if (user && query.trim()) {
      await supabase.from('search_history').insert({
        user_id: user.id,
        query: query.trim()
      });
    }

    return NextResponse.json({
      songs,
      artists,
      albums,
      provider: 'JioSaavn'
    });
  } catch (error: any) {
    console.error('[Search API Route] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
