import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const streamCache = new Map<string, { url: string; mimeType?: string; expiresAt: number }>();
const STREAM_CACHE_TTL = 30 * 60 * 1000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('v');
  const directUrl = searchParams.get('url') || undefined;

  if (!videoId && !directUrl) {
    return new Response('Missing id parameter (v)', { status: 400 });
  }

  if (directUrl && !/^https?:\/\//i.test(directUrl)) {
    return new Response('Invalid stream URL', { status: 400 });
  }

  try {
    let url: string | undefined;
    let mimeType: string | undefined;

    const cacheKey = directUrl ? `url:${directUrl}` : `id:${videoId}`;
    const cached = streamCache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      url = cached.url;
      mimeType = cached.mimeType;
      console.log(`[Stream API] Serving cached URL for: ${directUrl || videoId}`);
    } else {
      console.log(`[Stream API] Cache miss for: ${directUrl || videoId}. Resolving new stream URL...`);
      if (directUrl) {
        url = directUrl;
      } else if (videoId) {
        const res = await fetch(`https://jio-savan-api-omega.vercel.app/song/get/?id=${videoId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.media_url) {
            url = data.media_url;
            mimeType = 'audio/mp4';
          }
        }
      }

      if (url) {
        streamCache.set(cacheKey, {
          url,
          mimeType,
          expiresAt: now + STREAM_CACHE_TTL,
        });
      }
    }

    if (!url) {
      return new Response('Stream URL could not be resolved', { status: 404 });
    }

    // Handle range request
    const rangeHeader = request.headers.get('Range');
    
    const response = await fetch(url, {
      headers: {
        Range: rangeHeader || 'bytes=0-',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const headers = new Headers();
    let cleanMime = mimeType || response.headers.get('Content-Type') || 'audio/mp4';
    if (cleanMime.includes(';')) {
      cleanMime = cleanMime.split(';')[0].trim();
    }
    
    headers.set('Content-Type', cleanMime);
    headers.set('Accept-Ranges', 'bytes');
    
    if (response.headers.has('Content-Range')) {
      headers.set('Content-Range', response.headers.get('Content-Range')!);
    }
    if (response.headers.has('Content-Length')) {
      headers.set('Content-Length', response.headers.get('Content-Length')!);
    }

    return new Response(response.body, {
      status: response.status,
      headers,
    });

  } catch (error: any) {
    console.error('[Stream API Route] Streaming failed:', error);
    return new Response(error.message || 'Streaming failed', { status: 500 });
  }
}
