import { NextRequest, NextResponse } from 'next/server';
import { getTokens, graphFetch } from '@/lib/microsoft';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const tokens = await getTokens();
  if (!tokens) return NextResponse.json({ error: 'Not connected' }, { status: 401 });

  const { id } = await params;
  const { destinationId } = await req.json();

  try {
    const { data, tokens: updated, refreshed } = await graphFetch(
      `me/messages/${id}/move`,
      tokens,
      { method: 'POST', json: { destinationId } },
    );
    const res = NextResponse.json(data);
    return res;
  } catch (e) {
    console.error('Move error:', e);
    return NextResponse.json({ error: 'Failed to move email' }, { status: 500 });
  }
}
