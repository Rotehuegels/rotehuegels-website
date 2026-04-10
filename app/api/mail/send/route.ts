import { NextRequest, NextResponse } from 'next/server';
import { getTokens, graphFetch } from '@/lib/microsoft';

export async function POST(req: NextRequest) {
  const tokens = await getTokens();
  if (!tokens) return NextResponse.json({ error: 'Not connected' }, { status: 401 });

  const { to, cc, subject, body: htmlBody, replyToId } = await req.json();

  try {
    let result;

    if (replyToId) {
      // Reply to existing message
      result = await graphFetch(`me/messages/${replyToId}/reply`, tokens, {
        method: 'POST',
        json: {
          message: {
            toRecipients: to.split(',').map((e: string) => ({
              emailAddress: { address: e.trim() },
            })),
            ...(cc ? {
              ccRecipients: cc.split(',').map((e: string) => ({
                emailAddress: { address: e.trim() },
              })),
            } : {}),
            body: { contentType: 'HTML', content: htmlBody },
          },
          comment: '',
        },
      });
    } else {
      // New message
      result = await graphFetch('me/sendMail', tokens, {
        method: 'POST',
        json: {
          message: {
            subject,
            body: { contentType: 'HTML', content: htmlBody },
            toRecipients: to.split(',').map((e: string) => ({
              emailAddress: { address: e.trim() },
            })),
            ...(cc ? {
              ccRecipients: cc.split(',').map((e: string) => ({
                emailAddress: { address: e.trim() },
              })),
            } : {}),
          },
          saveToSentItems: true,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Send error:', e);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
