import { NextResponse } from 'next/server';
import { generateQuotePdfBuffer } from '@/lib/quotePdf';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(_req.url);
  const download = url.searchParams.get('download') === '1';

  try {
    const { buffer, filename } = await generateQuotePdfBuffer(id);
    const headers: Record<string, string> = {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'public, max-age=60',
      'Content-Disposition': download ? `attachment; filename="${filename}"` : 'inline',
    };
    return new Response(buffer, { status: 200, headers });
  } catch (err: unknown) {
    console.error('[GET /api/accounts/quotes/pdf]', err);
    const msg = err instanceof Error ? err.message : 'PDF generation failed';
    const status = /not found/i.test(msg) ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
