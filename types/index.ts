export interface Song {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  album?: string;
  albumId?: string;
  duration: number;
  thumbnailUrl?: string;
  viewCount?: number;
  publishDate?: string;
  provider?: string;
  streamUrl?: string; 
}

export interface Artist {
  id: string;
  name: string;
  thumbnailUrl?: string;
  description?: string;
}

export interface Album {
  id: string;
  title: string;
  artistId?: string;
  artistName?: string;
  thumbnailUrl?: string;
  releaseYear?: string;
}

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlaylistItem {
  id: string;
  playlist_id: string;
  song_id: string;
  position: number;
  created_at: string;
  song?: Song;
}
