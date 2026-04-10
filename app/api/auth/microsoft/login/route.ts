import { NextResponse } from 'next/server';
import { AUTH_URL, getRedirectUri, SCOPES } from '@/lib/microsoft';
import crypto from 'crypto';

export async function GET() {
  const state = crypto.randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    response_mode: 'query',
    scope: SCOPES,
    state,
  });

  const url = `${AUTH_URL}?${params}`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Sign in with Microsoft 365</title>
  <style>
    body { background: #0a0a0a; color: #fff; font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { text-align: center; padding: 40px; max-width: 400px; }
    .logo { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 18px; margin-bottom: 8px; }
    .sub { color: #888; font-size: 13px; margin-bottom: 24px; }
    a.btn { color: #fff; background: #2563eb; text-decoration: none; font-weight: 600; padding: 14px 32px; border-radius: 10px; display: inline-block; font-size: 15px; transition: background 0.2s; }
    a.btn:hover { background: #1d4ed8; }
    .note { color: #555; font-size: 11px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🔐</div>
    <h1>Sign in with Microsoft 365</h1>
    <p class="sub">Click the button below to authenticate with your Microsoft account.</p>
    <a class="btn" href="${url}">Sign in with Microsoft</a>
    <p class="note">You will be redirected to login.microsoftonline.com</p>
  </div>
</body>
</html>`;

  const res = new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });

  res.headers.append(
    'Set-Cookie',
    `ms_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
  );

  return res;
}
