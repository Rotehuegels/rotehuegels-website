import { NextResponse } from 'next/server';
import { AUTH_URL, REDIRECT_URI, SCOPES } from '@/lib/microsoft';
import crypto from 'crypto';

export async function GET() {
  const state = crypto.randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    response_mode: 'query',
    scope: SCOPES,
    state,
  });

  const url = `${AUTH_URL}?${params}`;

  const res = NextResponse.redirect(url);
  // Store state in a short-lived cookie for CSRF validation
  res.headers.append(
    'Set-Cookie',
    `ms_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
  );
  return res;
}
