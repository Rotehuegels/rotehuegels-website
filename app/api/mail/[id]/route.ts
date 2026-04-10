import { NextRequest, NextResponse } from 'next/server';
import { getTokens, graphFetch } from '@/lib/microsoft';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const tokens = await getTokens();
  if (!tokens) return NextResponse.json({ error: 'Not connected' }, { status: 401 });

  const { id } = await params;
  const select = 'id,subject,from,toRecipients,ccRecipients,receivedDateTime,isRead,hasAttachments,body,importance,flag';

  try {
    const { data, tokens: t1, refreshed: r1 } = await graphFetch(
      `me/messages/${id}?$select=${select}`,
      tokens,
    );

    // Mark as read (fire-and-forget)
    const latest = r1 ? t1 : tokens;
    const { tokens: t2, refreshed: r2 } = await graphFetch(
      `me/messages/${id}`,
      latest,
      { method: 'PATCH', json: { isRead: true } },
    );

    const res = NextResponse.json(data);
    if (r1 || r2) setTokenCookie(res, t2);
    return res;
  } catch (e) {
    console.error('Mail detail error:', e);
    return NextResponse.json({ error: 'Failed to fetch email' }, { status: 500 });
  }
}
