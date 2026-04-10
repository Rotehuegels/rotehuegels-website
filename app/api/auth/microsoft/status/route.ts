import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const msTokens = req.cookies.get('ms_tokens')?.value;
  const allCookieNames = Array.from(req.cookies.getAll()).map(c => c.name);

  return NextResponse.json({
    hasMsTokens: !!msTokens,
    tokenLength: msTokens?.length ?? 0,
    tokenPreview: msTokens ? msTokens.substring(0, 30) + '...' : null,
    allCookies: allCookieNames,
  });
}
