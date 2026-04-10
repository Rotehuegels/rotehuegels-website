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

  // Return an HTML page that redirects via JS + meta refresh + manual link
  // This bypasses Norton browser blocking server-side 307 redirects
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="1;url=${url}">
  <title>Connecting to Microsoft 365...</title>
  <style>
    body { background: #0a0a0a; color: #fff; font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { text-align: center; padding: 40px; }
    .spinner { width: 40px; height: 40px; border: 3px solid #333; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 20px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    a { color: #3b82f6; text-decoration: none; font-weight: 600; padding: 12px 24px; border: 1px solid #3b82f6; border-radius: 8px; display: inline-block; margin-top: 16px; }
    a:hover { background: #3b82f6; color: #fff; }
    .sub { color: #666; font-size: 13px; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <p>Redirecting to Microsoft 365...</p>
    <p class="sub">If you are not redirected automatically:</p>
    <a href="${url}">Click here to sign in with Microsoft</a>
  </div>
  <script>window.location.href = "${url}";</script>
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
