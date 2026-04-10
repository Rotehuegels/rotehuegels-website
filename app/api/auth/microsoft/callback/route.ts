import { NextRequest, NextResponse } from 'next/server';
import { TOKEN_URL, getRedirectUri, SCOPES, saveTokens } from '@/lib/microsoft';
import { supabaseServer } from '@/lib/supabaseServer';
import type { MsTokens } from '@/lib/microsoft';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return errorPage(`Microsoft returned an error: ${error}`);
  }

  if (!code) {
    return errorPage('No authorization code received from Microsoft.');
  }

  // Validate CSRF state
  const savedState = req.cookies.get('ms_oauth_state')?.value;
  if (!savedState || savedState !== state) {
    return errorPage('Security validation failed (state mismatch). Please try again.');
  }

  // Get current logged-in user
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return errorPage('You must be logged into the dashboard first. Please log in and try again.');
  }

  // Exchange code for tokens
  const body = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
    grant_type: 'authorization_code',
    code,
    redirect_uri: getRedirectUri(),
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
    return errorPage('Failed to exchange authorization code. Please try again.');
  }

  const data = await tokenRes.json();

  const tokens: MsTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in as number) * 1000,
  };

  // Save tokens to Supabase (not cookies)
  await saveTokens(user.id, tokens);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Microsoft 365 Connected</title>
  <style>
    body { background: #0a0a0a; color: #fff; font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { text-align: center; padding: 40px; max-width: 420px; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 20px; margin-bottom: 8px; color: #34d399; }
    .sub { color: #888; font-size: 14px; margin-bottom: 24px; line-height: 1.6; }
    a.btn { color: #fff; background: #2563eb; text-decoration: none; font-weight: 600; padding: 14px 32px; border-radius: 10px; display: inline-block; font-size: 15px; transition: background 0.2s; }
    a.btn:hover { background: #1d4ed8; }
    .close { color: #555; font-size: 12px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✅</div>
    <h1>Microsoft 365 Connected!</h1>
    <p class="sub">Your email account has been linked successfully. Click below to open your inbox.</p>
    <a class="btn" href="/dashboard/mail">Open Mail Inbox</a>
    <p class="close">You can also close this tab and refresh the Mail page in your dashboard.</p>
  </div>
</body>
</html>`;

  const res = new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
  res.headers.append('Set-Cookie', 'ms_oauth_state=; Path=/; HttpOnly; Max-Age=0');
  return res;
}

function errorPage(message: string) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Connection Failed</title>
  <style>
    body { background: #0a0a0a; color: #fff; font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { text-align: center; padding: 40px; max-width: 420px; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 20px; margin-bottom: 8px; color: #f87171; }
    .sub { color: #888; font-size: 14px; margin-bottom: 24px; line-height: 1.6; }
    a.btn { color: #fff; background: #2563eb; text-decoration: none; font-weight: 600; padding: 14px 32px; border-radius: 10px; display: inline-block; font-size: 15px; }
    a.btn:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">❌</div>
    <h1>Connection Failed</h1>
    <p class="sub">${message}</p>
    <a class="btn" href="/api/auth/microsoft/login">Try Again</a>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
