import { NextResponse } from 'next/server';
import { generateInvoicePdfBuffer } from '@/lib/invoicePdf';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(_req.url);
  const uptoStage = url.searchParams.get('upto') ? parseInt(url.searchParams.get('upto')!) : undefined;
  const onlyStage = url.searchParams.get('stage') ? parseInt(url.searchParams.get('stage')!) : undefined;
  const download = url.searchParams.get('download') === '1';

  try {
    const { buffer, filename } = await generateInvoicePdfBuffer(id, {
      stage: onlyStage,
      upto: uptoStage,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'public, max-age=60',
    };
    if (download) {
      headers['Content-Disposition'] = `attachment; filename="${filename}"`;
    } else {
      headers['Content-Disposition'] = 'inline';
    }

    return new Response(buffer, { status: 200, headers });
  } catch (err: unknown) {
    console.error('[GET /api/accounts/orders/invoice/pdf]', err);
    const message = err instanceof Error ? err.message : 'PDF generation failed';
    const status = message.startsWith('Order not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
