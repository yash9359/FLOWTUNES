-- supabase-schema.sql
-- Run this schema in your Supabase SQL editor

-- 1. Profiles (extending auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Allow public read access to profiles" on public.profiles
  for select using (true);

create policy "Allow users to update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- 2. Artists Cache
create table if not exists public.artists (
  id text primary key, -- YouTube Channel ID or Artist ID
  name text not null,
  thumbnail_url text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.artists enable row level security;
create policy "Allow public read access to artists" on public.artists for select using (true);
create policy "Allow anyone to insert/update artists (cache)" on public.artists for all using (true);

-- 3. Albums Cache
create table if not exists public.albums (
  id text primary key, -- YouTube Album ID
  title text not null,
  artist_id text references public.artists(id) on delete set null,
  artist_name text,
  thumbnail_url text,
  release_year text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.albums enable row level security;
create policy "Allow public read access to albums" on public.albums for select using (true);
create policy "Allow anyone to insert/update albums (cache)" on public.albums for all using (true);

-- 4. Songs Cache
create table if not exists public.songs (
  id text primary key, -- YouTube Video ID
  title text not null,
  artist text not null,
  artist_id text,
  album text,
  album_id text,
  duration integer not null, -- in seconds
  thumbnail_url text,
  view_count bigint,
  publish_date text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.songs enable row level security;
create policy "Allow public read access to songs" on public.songs for select using (true);
create policy "Allow anyone to insert/update songs (cache)" on public.songs for all using (true);

-- 5. Playlists
create table if not exists public.playlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  is_public boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.playlists enable row level security;

create policy "Allow public read of public playlists or creator access" on public.playlists
  for select using (is_public = true or auth.uid() = user_id);

create policy "Allow users to create playlists" on public.playlists
  for insert with check (auth.uid() = user_id);

create policy "Allow owner to update playlists" on public.playlists
  for update using (auth.uid() = user_id);

create policy "Allow owner to delete playlists" on public.playlists
  for delete using (auth.uid() = user_id);

-- 6. Playlist Songs (mapping table)
create table if not exists public.playlist_songs (
  id uuid default gen_random_uuid() primary key,
  playlist_id uuid references public.playlists(id) on delete cascade not null,
  song_id text not null, -- YouTube Video ID (metadata stored in songs cache)
  position integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (playlist_id, song_id)
);

alter table public.playlist_songs enable row level security;

create policy "Allow public read of playlist songs if playlist is public or user owns it" on public.playlist_songs
  for select using (
    exists (
      select 1 from public.playlists 
      where id = playlist_id 
      and (is_public = true or auth.uid() = user_id)
    )
  );

create policy "Allow playlist owner to insert songs" on public.playlist_songs
  for insert with check (
    exists (
      select 1 from public.playlists 
      where id = playlist_id 
      and auth.uid() = user_id
    )
  );

create policy "Allow playlist owner to update songs positions" on public.playlist_songs
  for update using (
    exists (
      select 1 from public.playlists 
      where id = playlist_id 
      and auth.uid() = user_id
    )
  );

create policy "Allow playlist owner to delete songs" on public.playlist_songs
  for delete using (
    exists (
      select 1 from public.playlists 
      where id = playlist_id 
      and auth.uid() = user_id
    )
  );

-- 7. Liked Songs
create table if not exists public.liked_songs (
  user_id uuid references public.profiles(id) on delete cascade not null,
  song_id text not null, -- YouTube Video ID
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, song_id)
);

alter table public.liked_songs enable row level security;

create policy "Allow users to view their own liked songs" on public.liked_songs
  for select using (auth.uid() = user_id);

create policy "Allow users to manage their own liked songs" on public.liked_songs
  for all using (auth.uid() = user_id);

-- 8. Recently Played
create table if not exists public.recently_played (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  song_id text not null, -- YouTube Video ID
  played_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.recently_played enable row level security;

create policy "Allow users to view their own history" on public.recently_played
  for select using (auth.uid() = user_id);

create policy "Allow users to log history" on public.recently_played
  for insert with check (auth.uid() = user_id);

-- 9. Search History
create table if not exists public.search_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  query text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.search_history enable row level security;

create policy "Allow users to manage their search history" on public.search_history
  for all using (auth.uid() = user_id);

-- 10. Recommendations
create table if not exists public.recommendations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  song_id text not null, -- YouTube Video ID
  score float default 1.0 not null,
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.recommendations enable row level security;

create policy "Allow users to view their own recommendations" on public.recommendations
  for select using (auth.uid() = user_id);

-- Profile Syncing trigger from auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
