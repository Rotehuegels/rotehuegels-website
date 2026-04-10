import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

// ── Config ───────────────────────────────────────────────────────────────────
const TENANT   = process.env.MICROSOFT_TENANT_ID!;
const CLIENT   = process.env.MICROSOFT_CLIENT_ID!;
const SECRET   = process.env.MICROSOFT_CLIENT_SECRET!;
export const AUTH_URL  = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/authorize`;
export const TOKEN_URL = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`;
export const GRAPH_BASE   = 'https://graph.microsoft.com/v1.0';

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || 'http://localhost:3000';
}

export function getRedirectUri() {
  return `${getSiteUrl()}/api/auth/microsoft/callback`;
}

export const SCOPES = [
  'openid', 'profile', 'email', 'offline_access',
  'Mail.Read', 'Mail.ReadWrite', 'Mail.Send', 'User.Read',
].join(' ');

// ── Types ────────────────────────────────────────────────────────────────────
export interface MsTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch ms
}

// ── Get current Supabase user ID ─────────────────────────────────────────────
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

// ── Token storage (Supabase) ─────────────────────────────────────────────────

/** Read tokens for the current logged-in user. */
export async function getTokens(): Promise<MsTokens | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data } = await supabaseAdmin
    .from('ms_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .single();

  if (!data) return null;
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Number(data.expires_at),
  };
}

/** Save tokens for a user. */
export async function saveTokens(userId: string, tokens: MsTokens): Promise<void> {
  const { error } = await supabaseAdmin
    .from('ms_tokens')
    .upsert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) console.error('Failed to save MS tokens:', error.message);
}

/** Update tokens after refresh. */
async function updateStoredTokens(tokens: MsTokens): Promise<void> {
  const userId = await getCurrentUserId();
  if (userId) await saveTokens(userId, tokens);
}

// ── Token refresh ────────────────────────────────────────────────────────────
export async function refreshAccessToken(refreshToken: string): Promise<MsTokens> {
  const body = new URLSearchParams({
    client_id: CLIENT,
    client_secret: SECRET,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    scope: SCOPES,
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${err}`);
  }

  const data = await res.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? refreshToken,
    expires_at: Date.now() + (data.expires_in as number) * 1000,
  };
}

// ── Graph fetch with auto-refresh ────────────────────────────────────────────
export async function graphFetch(
  path: string,
  tokens: MsTokens,
  options?: RequestInit & { json?: unknown },
): Promise<{ data: unknown; tokens: MsTokens; refreshed: boolean }> {
  let current = tokens;
  let refreshed = false;

  // Pre-emptively refresh if expiring within 5 min
  if (current.expires_at < Date.now() + 5 * 60 * 1000) {
    current = await refreshAccessToken(current.refresh_token);
    refreshed = true;
    await updateStoredTokens(current);
  }

  const url = `${GRAPH_BASE}/${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${current.access_token}`,
    'Content-Type': 'application/json',
  };

  const init: RequestInit = {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string> ?? {}) },
  };
  if (options?.json) {
    init.body = JSON.stringify(options.json);
  }

  let res = await fetch(url, init);

  // Retry on 401
  if (res.status === 401 && !refreshed) {
    current = await refreshAccessToken(current.refresh_token);
    refreshed = true;
    await updateStoredTokens(current);
    init.headers = { ...headers, Authorization: `Bearer ${current.access_token}` };
    res = await fetch(url, init);
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Graph API ${res.status}: ${err}`);
  }

  const data = res.status === 204 ? null : await res.json();
  return { data, tokens: current, refreshed };
}
