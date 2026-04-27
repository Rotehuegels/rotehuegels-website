// lib/apiAuthz.ts
// API-friendly permission guards. Unlike lib/authzGuard.ts (which redirects
// to /login or /d/forbidden — fine for pages, wrong for API routes), these
// return a NextResponse with a JSON error body so the calling fetch() gets
// a structured 401/403 response.

import 'server-only';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface ApiAuthCtx {
  userId: string;
  email: string | null;
  role: 'admin' | 'staff' | 'client';
  permissions: Set<string>;
}

async function loadCtx(): Promise<ApiAuthCtx | null> {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.is_active === false) return null;

  const role = (profile?.role ?? 'admin') as 'admin' | 'staff' | 'client';

  if (role === 'admin') {
    return { userId: user.id, email: user.email ?? null, role, permissions: new Set() };
  }

  const { data: perms } = await supabaseAdmin
    .from('user_permissions')
    .select('permission_key')
    .eq('user_id', user.id);

  return {
    userId: user.id,
    email: user.email ?? null,
    role,
    permissions: new Set((perms ?? []).map(p => p.permission_key as string)),
  };
}

/**
 * Check that the caller is authenticated AND holds the given permission.
 * Returns either a NextResponse (401/403 to return immediately) OR an
 * ApiAuthCtx with the user info when allowed. Admins always pass.
 *
 * Usage:
 *   const ctx = await requireApiPermission('procurement.create');
 *   if (ctx instanceof NextResponse) return ctx;
 *   // ...proceed; ctx.userId / ctx.email available
 */
export async function requireApiPermission(
  key: string,
): Promise<ApiAuthCtx | NextResponse> {
  const ctx = await loadCtx();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (ctx.role === 'client') {
    return NextResponse.json({ error: 'Client users cannot access internal APIs.' }, { status: 403 });
  }
  if (ctx.role === 'admin') return ctx;
  if (!ctx.permissions.has(key)) {
    return NextResponse.json({
      error: `Forbidden — missing permission "${key}".`,
      need: key,
    }, { status: 403 });
  }
  return ctx;
}

/** Like requireApiPermission but passes when the user holds ANY of the keys. */
export async function requireApiAnyPermission(
  keys: string[],
): Promise<ApiAuthCtx | NextResponse> {
  const ctx = await loadCtx();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (ctx.role === 'client') {
    return NextResponse.json({ error: 'Client users cannot access internal APIs.' }, { status: 403 });
  }
  if (ctx.role === 'admin') return ctx;
  if (!keys.some(k => ctx.permissions.has(k))) {
    return NextResponse.json({
      error: `Forbidden — need one of: ${keys.join(', ')}`,
      need: keys,
    }, { status: 403 });
  }
  return ctx;
}
