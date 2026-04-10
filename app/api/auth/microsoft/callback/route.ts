import { NextRequest, NextResponse } from 'next/server';
import { TOKEN_URL, REDIRECT_URI, SCOPES, tokenCookieValue } from '@/lib/microsoft';
import type { MsTokens } from '@/lib/microsoft';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  if (error) {
    return NextResponse.redirect(`${siteUrl}/dashboard/mail?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/dashboard/mail?error=no_code`);
  }

  // Validate CSRF state
  const savedState = req.cookies.get('ms_oauth_state')?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${siteUrl}/dashboard/mail?error=state_mismatch`);
  }

  // Exchange code for tokens
  const body = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
  });

  const tokenRes = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error('Token exchange failed:', err);
    return NextResponse.redirect(`${siteUrl}/dashboard/mail?error=token_exchange`);
  }

  const data = await tokenRes.json();

  const tokens: MsTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in as number) * 1000,
  };

  const res = NextResponse.redirect(`${siteUrl}/dashboard/mail`);
  res.headers.append('Set-Cookie', tokenCookieValue(tokens));
  // Clear the state cookie
  res.headers.append('Set-Cookie', 'ms_oauth_state=; Path=/; HttpOnly; Max-Age=0');
  return res;
}
