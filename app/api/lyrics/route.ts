import { NextRequest, NextResponse } from "next/server";

type LyricsResponse = {
  synced: string | null;
  plain: string | null;
  instrumental: boolean;
};

const cache = new Map<
  string,
  {
    data: LyricsResponse;
    expires: number;
  }
>();

const CACHE_TTL = 1000 * 60 * 60 * 12;

function getCache(key: string) {
  const item = cache.get(key);

  if (!item) return null;

  if (Date.now() > item.expires) {
    cache.delete(key);
    return null;
  }

  return item.data;
}

function setCache(key: string, data: LyricsResponse) {
  cache.set(key, {
    data,
    expires: Date.now() + CACHE_TTL,
  });
}

function cleanTitle(title: string, fuzzy = false) {
  let cleaned = title
    .replace(/\(From\s+"[^"]*"\)/gi, "")
    .replace(/\[From\s+"[^"]*"\]/gi, "")
    .replace(/\(Official[^)]*\)/gi, "")
    .replace(/\(Audio[^)]*\)/gi, "")
    .replace(/\(Video[^)]*\)/gi, "")
    .replace(/\(Lyrics[^)]*\)/gi, "")
    .replace(/\(Full Video[^)]*\)/gi, "")
    .replace(/\[Official[^\]]*\]/gi, "")
    .replace(/\[Audio[^\]]*\]/gi, "")
    .replace(/\[Video[^\]]*\]/gi, "")
    .replace(/\[Lyrics[^\]]*\]/gi, "")
    .replace(/\s*\|\s*.*$/g, "")
    .replace(/\s+-\s+.*$/g, "")
    .replace(/#[^\s]+/g, "")
    .replace(/feat\..*/gi, "")
    .replace(/ft\..*/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (fuzzy) {
    cleaned = cleaned
      .replace(/\(.*\)/g, "")
      .replace(/\[.*\]/g, "")
      .replace(/OST/gi, "")
      .replace(/Remix/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  return cleaned;
}

function cleanArtistName(artist: string) {
  const normalized = artist.trim();
  if (!normalized) return "";
  if (normalized.toLowerCase() === "unknown artist") return "";
  return normalized.split(",")[0].trim();
}

async function fetchWithTimeout(url: string, timeout = 10000) {
  return fetch(url, {
    signal: AbortSignal.timeout(timeout),
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    cache: "force-cache",
  });
}

async function getLyricsFromLRCLIB(title: string, artist: string, duration?: number): Promise<LyricsResponse | null> {
  try {
    let url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}`;
    if (artist) url += `&artist_name=${encodeURIComponent(artist)}`;
    if (duration) url += `&duration=${Math.round(duration)}`;

    try {
      const res = await fetchWithTimeout(url, 5000);
      if (res.ok) {
        const data = await res.json();
        return { synced: data.syncedLyrics || null, plain: data.plainLyrics || null, instrumental: !!data.instrumental };
      }
    } catch {}

    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${title} ${artist}`.trim())}`;
    const sRes = await fetchWithTimeout(searchUrl, 7000);
    if (sRes.ok) {
      const results = await sRes.json();
      if (Array.isArray(results) && results.length > 0) {
        const match = results[0];
        return { synced: match.syncedLyrics || null, plain: match.plainLyrics || null, instrumental: !!match.instrumental };
      }
    }
  } catch (e) {
    console.warn("[Lyrics] LRCLIB failed:", title);
  }
  return null;
}

async function getLyricsFromKugou(title: string, artist: string): Promise<LyricsResponse | null> {
  try {
    const searchUrl = `http://mobilecdn.kugou.com/api/v3/search/song?keyword=${encodeURIComponent(`${title} ${artist}`)}&format=json`;
    const res = await fetchWithTimeout(searchUrl, 5000);
    if (res.ok) {
      const data = await res.json();
      const song = data.data?.info?.[0];
      if (song && song.hash) {
        const detailUrl = `http://krcs.kugou.com/search?ver=1&man=yes&client=pc&keyword=&duration=&hash=${song.hash}`;
        const dRes = await fetchWithTimeout(detailUrl, 5000);
        if (dRes.ok) {
          const dData = await dRes.json();
          if (dData.candidates?.[0]?.accesskey) {
            const lrcUrl = `http://lyrics.kugou.com/download?ver=1&client=pc&id=${dData.candidates[0].id}&accesskey=${dData.candidates[0].accesskey}&fmt=lrc`;
            const lRes = await fetchWithTimeout(lrcUrl, 5000);
            if (lRes.ok) {
              const lData = await lRes.json();
              if (lData.content) {
                const decoded = Buffer.from(lData.content, 'base64').toString('utf-8');
                return { synced: decoded, plain: null, instrumental: false };
              }
            }
          }
        }
      }
    }
  } catch {}
  return null;
}

async function getLyricsFromOVH(title: string, artist: string): Promise<LyricsResponse | null> {
  try {
    if (!artist) return null;
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    const res = await fetchWithTimeout(url, 5000);
    if (res.ok) {
      const data = await res.json();
      if (data.lyrics) return { synced: null, plain: data.lyrics, instrumental: false };
    }
  } catch {}
  return null;
}

async function getLyricsFromGecimi(title: string, artist: string): Promise<LyricsResponse | null> {
  try {
    const url = `https://gecimi.com/api/lyric/${encodeURIComponent(title)}/${encodeURIComponent(artist)}`;
    const res = await fetchWithTimeout(url, 4000);
    if (res.ok) {
      const data = await res.json();
      if (data.result && data.result.length > 0 && data.result[0].lrc) {
        const lrcRes = await fetch(data.result[0].lrc);
        if (lrcRes.ok) return { synced: await lrcRes.text(), plain: null, instrumental: false };
      }
    }
  } catch {}
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "";
  const artist = searchParams.get("artist") || "";
  const durationStr = searchParams.get("duration");
  const duration = durationStr ? Number(durationStr) : undefined;
  const songId = searchParams.get("id") || "";

  if (!title && !songId) return NextResponse.json({ error: "Missing title or id" }, { status: 400 });

  const cleanSong = cleanTitle(title);
  const fuzzySong = cleanTitle(title, true);
  const cleanArtist = cleanArtistName(artist);
  
  const cacheKey = songId ? `lyrics:${songId}` : `lyrics:${cleanSong}:${cleanArtist || "_"}:${duration || "_"}`;
  const cached = getCache(cacheKey);
  if (cached) return NextResponse.json(cached);

  // 1. Try JioSaavn API using Song ID first (Very fast & reliable for JioSaavn tracks)
  if (songId) {
    try {
      const response = await fetch(`https://jio-savan-api-omega.vercel.app/lyrics/?query=${encodeURIComponent(songId)}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.status && data.lyrics) {
          const text = data.lyrics.replace(/<br\s*\/?>/gi, '\n');
          const result = { synced: null, plain: text, instrumental: false };
          setCache(cacheKey, result);
          return NextResponse.json(result);
        }
      }
    } catch (e) {
      console.warn("[Lyrics] JioSaavn API failed for ID:", songId, e);
    }
  }

  // 2. Try LRCLIB Exact with cleaned title
  if (cleanSong) {
    const firstTry = await getLyricsFromLRCLIB(cleanSong, cleanArtist, duration);
    if (firstTry && (firstTry.synced || firstTry.plain)) {
      setCache(cacheKey, firstTry);
      return NextResponse.json(firstTry);
    }

    // 3. Try LRCLIB with fuzzy title
    const secondTry = await getLyricsFromLRCLIB(fuzzySong, cleanArtist, duration);
    if (secondTry && (secondTry.synced || secondTry.plain)) {
      setCache(cacheKey, secondTry);
      return NextResponse.json(secondTry);
    }

    // 4. Race all remaining providers
    const results = await Promise.allSettled([
      getLyricsFromKugou(cleanSong, cleanArtist),
      getLyricsFromOVH(cleanSong, cleanArtist),
      getLyricsFromGecimi(cleanSong, cleanArtist),
    ]);

    for (const res of results) {
      if (res.status === 'fulfilled' && res.value && (res.value.synced || res.value.plain)) {
        setCache(cacheKey, res.value);
        return NextResponse.json(res.value);
      }
    }
  }

  const empty = { synced: null, plain: null, instrumental: false };
  setCache(cacheKey, empty);
  return NextResponse.json({ ...empty, message: "Lyrics not found" });
}
