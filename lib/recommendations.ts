import { createClient } from '@/lib/supabase/server';
import { Song } from '@/types';

const DEFAULT_RECOMMENDATIONS: Song[] = [
  {
    id: 'qcEf8GY8',
    title: 'Apna Bana Le',
    artist: 'Amitabh Bhattacharya, Sachin-Jigar, Arijit Singh',
    duration: 261,
    thumbnailUrl: 'https://c.saavncdn.com/675/Trending-Love-Songs-Hindi-2026-20260506185328-500x500.jpg',
  },
  {
    id: 'prJPLljw',
    title: 'Trending Nakhra',
    artist: 'Amrit Maan',
    duration: 234,
    thumbnailUrl: 'https://c.saavncdn.com/054/Trending-Nakhra-Punjabi-2018-20240625104521-500x500.jpg',
  },
];

export async function getRecommendationsForUser(): Promise<Song[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return DEFAULT_RECOMMENDATIONS;
    }

    const { data: liked } = await supabase
      .from('liked_songs')
      .select('song_id')
      .limit(3);

    const { data: recent } = await supabase
      .from('recently_played')
      .select('song_id')
      .order('played_at', { ascending: false })
      .limit(3);

    const songIds = new Set<string>();
    liked?.forEach(item => songIds.add(item.song_id));
    recent?.forEach(item => songIds.add(item.song_id));

    if (songIds.size === 0) {
      return DEFAULT_RECOMMENDATIONS;
    }

    const { data: cachedSongs } = await supabase
      .from('songs')
      .select('*')
      .in('id', Array.from(songIds));

    if (!cachedSongs || cachedSongs.length === 0) {
      return DEFAULT_RECOMMENDATIONS;
    }

    const randomSeedSong = cachedSongs[Math.floor(Math.random() * cachedSongs.length)];
    
    const res = await fetch(`https://jio-savan-api-omega.vercel.app/song/?query=${encodeURIComponent(randomSeedSong.artist + ' mix')}`);
    if (res.ok) {
      const data = await res.json();
      const songsList = Array.isArray(data) ? data : [];
      
      const recommendedSongs: Song[] = songsList.map((item: any) => ({
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

      if (recommendedSongs.length > 0) {
        return recommendedSongs.filter(s => s.id !== randomSeedSong.id).slice(0, 8);
      }
    }

    return DEFAULT_RECOMMENDATIONS;
  } catch (error) {
    console.error('[RecommendationEngine] Failed to generate recommendations:', error);
    return DEFAULT_RECOMMENDATIONS;
  }
}
