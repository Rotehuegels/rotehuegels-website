// lib/apiAuth.ts
// Shared auth + rate limiting for admin API endpoints

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

/**
 * Verify the request is from an authenticated admin user.
 * Returns the user if valid, or a NextResponse error.
 */
export async function requireAdmin(req: Request) {
  // Rate limit: 60 requests per minute per IP
  const ip = getClientIp(req);
  const { allowed } = rateLimit(`admin:${ip}`, 60, 60 * 1000);
  if (!allowed) {
    return { error: NextResponse.json({ error: 'Rate limit exceeded. Try again shortly.' }, { status: 429 }) };
  }

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  return { user };
}
