import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export default proxy;

export const config = {
  matcher: [
    '/library/:path*',
    '/playlists/:path*',
    '/liked/:path*',
    '/admin/:path*',
  ],
};
