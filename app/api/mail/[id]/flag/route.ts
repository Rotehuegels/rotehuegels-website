import { NextRequest, NextResponse } from 'next/server';
import { getTokens, graphFetch } from '@/lib/microsoft';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const tokens = await getTokens();
  if (!tokens) return NextResponse.json({ error: 'Not connected' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const patch: Record<string, unknown> = {};
  if (typeof body.isRead === 'boolean') patch.isRead = body.isRead;
  if (typeof body.isFlagged === 'boolean') {
    patch.flag = { flagStatus: body.isFlagged ? 'flagged' : 'notFlagged' };
  }

  try {
    const { data, tokens: updated, refreshed } = await graphFetch(
      `me/messages/${id}`,
      tokens,
      { method: 'PATCH', json: patch },
    );
    const res = NextResponse.json(data);
    return res;
  } catch (e) {
    console.error('Flag error:', e);
    return NextResponse.json({ error: 'Failed to update email' }, { status: 500 });
  }
}
