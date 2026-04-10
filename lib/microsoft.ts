import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

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

// ── Cookie helpers ───────────────────────────────────────────────────────────
const COOKIE = 'ms_tokens';

/** Read tokens from the cookie jar (server component / route handler). */
export async function getTokens(): Promise<MsTokens | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  try { return JSON.parse(raw) as MsTokens; }
  catch { return null; }
}

/** Read tokens from a NextRequest (API routes). */
export function getTokensFromReq(req: NextRequest): MsTokens | null {
  const raw = req.cookies.get(COOKIE)?.value;
  if (!raw) return null;
  try { return JSON.parse(raw) as MsTokens; }
  catch { return null; }
}

/** Build a Set-Cookie header value. */
export function tokenCookieValue(tokens: MsTokens): string {
  const json = JSON.stringify(tokens);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE}=${encodeURIComponent(json)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${secure}`;
}

/** Set the token cookie on a NextResponse. */
export function setTokenCookie(res: NextResponse, tokens: MsTokens) {
  res.headers.append('Set-Cookie', tokenCookieValue(tokens));
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
    init.headers = { ...headers, Authorization: `Bearer ${current.access_token}` };
    res = await fetch(url, init);
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Graph API ${res.status}: ${err}`);
  }

  // Some endpoints return 204 No Content
  const data = res.status === 204 ? null : await res.json();
  return { data, tokens: current, refreshed };
}
