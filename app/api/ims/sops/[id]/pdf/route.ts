import { NextResponse } from 'next/server';
import { getSOPById } from '@/lib/sops';
import { getCompanyCO } from '@/lib/company';
import { getLogoDataUrl, generateSmartPdf } from '@/lib/pdfConfig';
import { COLORS, buildHeader } from '@/lib/pdfTemplate';
import { buildSopBody } from '@/lib/sopContent';

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sop = getSOPById(id);
  if (!sop) {
    return NextResponse.json({ error: 'SOP not found' }, { status: 404 });
  }

  try {
    const CO = await getCompanyCO();
    const logoUrl = getLogoDataUrl();

    const content: any[] = [
      buildHeader({
        logoUrl,
        companyName: CO.name,
        address: `${CO.addr1} ${CO.addr2}`,
        contactLine: `${CO.email}  |  ${CO.phone}  |  ${CO.web}`,
        gstin: CO.gstin,
        pan: CO.pan,
        cin: CO.cin,
        tan: CO.tan,
        documentTitle: 'STANDARD OPERATING PROCEDURE',
      }),
      // Standalone PDF: body sits directly under the page header, no page break.
      ...buildSopBody(sop, { pageBreak: false }),
    ];

    const footer = (currentPage: number, pageCount: number) => ({
      columns: [
        { text: `${sop.id}  |  Version ${sop.version}  |  R0  |  APPROVED`, fontSize: 5.5, color: COLORS.lightGray, margin: [32, 0, 0, 0] },
        { text: 'CONTROLLED COPY', fontSize: 5.5, bold: true, color: COLORS.positive, alignment: 'center' },
        { text: `Rotehügels IMS  |  Page ${currentPage} of ${pageCount}`, fontSize: 5.5, color: COLORS.lightGray, alignment: 'right', margin: [0, 0, 32, 0] },
      ],
    });

    const pdfBuffer = await generateSmartPdf(content, footer);

    const url = new URL(_req.url);
    const download = url.searchParams.get('download') === '1';

    const headers: Record<string, string> = {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'public, max-age=300',
    };
    headers['Content-Disposition'] = download
      ? `attachment; filename="${sop.id}-${sop.title.replace(/\s+/g, '-')}.pdf"`
      : 'inline';

    return new Response(pdfBuffer as unknown as BodyInit, { status: 200, headers });
  } catch (err: unknown) {
    console.error('[GET /api/ims/sops/pdf]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'PDF generation failed' },
      { status: 500 },
    );
  }
}
