import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromReq, graphFetch, setTokenCookie } from '@/lib/microsoft';

export async function GET(req: NextRequest) {
  const tokens = getTokensFromReq(req);
  if (!tokens) return NextResponse.json({ error: 'Not connected' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const folder = searchParams.get('folder') || 'inbox';
  const page   = parseInt(searchParams.get('page') || '0', 10);
  const search = searchParams.get('search') || '';
  const top    = 25;
  const skip   = page * top;

  const select = 'id,subject,from,toRecipients,receivedDateTime,isRead,hasAttachments,bodyPreview,importance';
  let path = `me/mailFolders/${folder}/messages?$top=${top}&$skip=${skip}&$orderby=receivedDateTime desc&$select=${select}&$count=true`;

  if (search) {
    path += `&$search="${encodeURIComponent(search)}"`;
  }

  try {
    const { data, tokens: updated, refreshed } = await graphFetch(path, tokens, {
      headers: { ConsistencyLevel: 'eventual' },
    });
    const body = data as { value: unknown[]; '@odata.count'?: number };
    const res = NextResponse.json({
      messages: body.value,
      totalCount: body['@odata.count'] ?? body.value.length,
    });
    if (refreshed) setTokenCookie(res, updated);
    return res;
  } catch (e) {
    console.error('Mail list error:', e);
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
  }
}
