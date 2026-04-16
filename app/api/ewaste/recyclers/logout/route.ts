import { NextResponse } from 'next/server';

export async function GET() {
  const res = NextResponse.redirect(new URL('/recycler', process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rotehuegels.com'));
  res.cookies.set('recycler_session', '', { path: '/', maxAge: 0 });
  return res;
}
