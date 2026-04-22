import { NextResponse } from 'next/server';
import { generateRecyclerProfilePdfBuffer } from '@/lib/recyclerProfilePdf';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const url = new URL(req.url);
  const download = url.searchParams.get('download') === '1';

  try {
    const { buffer, filename } = await generateRecyclerProfilePdfBuffer(code);
    const headers: Record<string, string> = {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'private, max-age=60',
      'Content-Disposition': download ? `attachment; filename="${filename}"` : 'inline',
    };
    return new Response(buffer, { status: 200, headers });
  } catch (err: unknown) {
    console.error('[GET /api/ecosystem/[code]/pdf]', err);
    const msg = err instanceof Error ? err.message : 'PDF generation failed';
    const status = /not found/i.test(msg) ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
