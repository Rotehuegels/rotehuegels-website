import { NextResponse } from 'next/server';
import { generatePurchaseOrderPdfBuffer } from '@/lib/purchaseOrderPdf';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(_req.url);
  const download = url.searchParams.get('download') === '1';

  try {
    const { buffer, filename } = await generatePurchaseOrderPdfBuffer(id);

    const headers: Record<string, string> = {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'public, max-age=60',
    };
    if (download) headers['Content-Disposition'] = `attachment; filename="${filename}"`;
    else headers['Content-Disposition'] = 'inline';

    return new Response(buffer, { status: 200, headers });
  } catch (err: unknown) {
    console.error('[GET /api/accounts/purchase-orders/pdf]', err);
    const message = err instanceof Error ? err.message : 'PDF generation failed';
    const status = message.startsWith('PO not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
