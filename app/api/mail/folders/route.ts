import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromReq, graphFetch, setTokenCookie } from '@/lib/microsoft';

export async function GET(req: NextRequest) {
  const tokens = getTokensFromReq(req);
  if (!tokens) return NextResponse.json({ error: 'Not connected' }, { status: 401 });

  try {
    const { data, tokens: updated, refreshed } = await graphFetch(
      'me/mailFolders?$top=50',
      tokens,
    );
    const body = data as { value: unknown[] };
    const res = NextResponse.json({ folders: body.value });
    if (refreshed) setTokenCookie(res, updated);
    return res;
  } catch (e) {
    console.error('Folders error:', e);
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
  }
}
