import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * GET /api/auth/signout
 *
 * Plain HTTP route for logout. The browser does a full page navigation here,
 * so there is no React/RSC in-flight request that could race with cookie
 * clearing. The server clears the session and issues a 302 to /login — all
 * in one HTTP response before the browser renders anything.
 *
 * Optional query param: ?reason=timeout  → /login?reason=timeout
 */
export async function GET(request: NextRequest) {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();

  const reason   = request.nextUrl.searchParams.get('reason');
  const loginUrl = new URL('/login', request.url);
  if (reason) loginUrl.searchParams.set('reason', reason);

  return NextResponse.redirect(loginUrl);
}
