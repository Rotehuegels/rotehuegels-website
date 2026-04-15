import { NextResponse } from 'next/server';
import { getSOPById, type SOP } from '@/lib/sops';
import { getCompanyCO } from '@/lib/company';
import { getLogoDataUrl, generateSmartPdf } from '@/lib/pdfConfig';
import { COLORS, FONT, TABLE_LAYOUT, buildHeader, sectionLabel } from '@/lib/pdfTemplate';

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = 'force-dynamic';

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

function buildDocDefinition(sop: SOP, CO: Awaited<ReturnType<typeof getCompanyCO>>, logoUrl: string | null) {
  const kpiSectionNum = sop.kpis && sop.kpis.length > 0 ? 5 : null;
  const relatedSectionNum = kpiSectionNum ? 6 : 5;

  const content: any[] = [];

  // ── Header — shared template ───────────────────────────────────────────
  content.push(buildHeader({
    logoUrl,
    companyName: CO.name,
    address: `${CO.addr1} ${CO.addr2}`,
    contactLine: `${CO.email}  |  ${CO.phone}  |  ${CO.web}`,
    gstin: CO.gstin,
    pan: CO.pan,
    cin: CO.cin,
    tan: CO.tan,
    documentTitle: 'STANDARD OPERATING PROCEDURE',
  }));

  // ── Title Block ─────────────────────────────────────────────────────────
  const titleRows: any[][] = [
    [{ text: 'Title', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.table }, { text: sop.title, bold: true, fontSize: FONT.heading }],
    [{ text: 'Doc No.', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.table }, { text: sop.id, fontSize: FONT.table }],
    [{ text: 'Version', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.table }, { text: `${sop.version}  |  Revision: R0`, fontSize: FONT.table }],
    [{ text: 'Department', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.table }, { text: sop.department, fontSize: FONT.table }],
    [{ text: 'Category', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.table }, { text: sop.category, fontSize: FONT.table }],
    [{ text: 'Effective Date', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.table }, { text: fmtDate(sop.effectiveDate), fontSize: FONT.table }],
    [{ text: 'Review Date', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.table }, { text: fmtDate(sop.reviewDate), fontSize: FONT.table }],
    [{ text: 'Approved By', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.table }, { text: sop.approvedBy, fontSize: FONT.table }],
  ];
  content.push({
    table: { headerRows: 0, widths: [90, '*'], body: titleRows },
    layout: TABLE_LAYOUT,
    margin: [0, 0, 0, 6],
  });

  function sectionHeader(num: number, title: string): any {
    return {
      text: `${num}. ${title.toUpperCase()}`,
      fontSize: FONT.heading,
      bold: true,
      color: COLORS.black,
      characterSpacing: 0.3,
      margin: [0, 6, 0, 3],
    };
  }

  // ── 1. Purpose ──────────────────────────────────────────────────────────
  content.push(sectionHeader(1, 'Purpose'));
  content.push({ text: sop.purpose, fontSize: FONT.body, color: COLORS.darkGray, margin: [0, 0, 0, 2] });

  // ── 2. Scope ────────────────────────────────────────────────────────────
  content.push(sectionHeader(2, 'Scope'));
  content.push({ text: sop.scope, fontSize: FONT.body, color: COLORS.darkGray, margin: [0, 0, 0, 2] });

  // ── 3. Responsibilities ─────────────────────────────────────────────────
  content.push(sectionHeader(3, 'Responsibilities'));
  const respRows: any[][] = sop.responsibilities.map(r => {
    const [role, ...descParts] = r.split(':');
    const desc = descParts.join(':').trim();
    return [
      { text: role.trim(), bold: true, fillColor: COLORS.headerBg, fontSize: FONT.table },
      { text: desc || role, color: COLORS.darkGray, fontSize: FONT.table },
    ];
  });
  content.push({
    table: { headerRows: 0, widths: [130, '*'], body: respRows },
    layout: TABLE_LAYOUT,
    margin: [0, 0, 0, 2],
  });

  // ── 4. Procedure ────────────────────────────────────────────────────────
  content.push(sectionHeader(4, 'Procedure'));
  const procHeader: any[] = [
    { text: 'Step', bold: true, fillColor: COLORS.headerBg, color: COLORS.headerText, alignment: 'center', fontSize: FONT.tableHeader },
    { text: 'Action', bold: true, fillColor: COLORS.headerBg, color: COLORS.headerText, fontSize: FONT.tableHeader },
    { text: 'Detail', bold: true, fillColor: COLORS.headerBg, color: COLORS.headerText, fontSize: FONT.tableHeader },
    { text: 'System Ref', bold: true, fillColor: COLORS.headerBg, color: COLORS.headerText, fontSize: FONT.tableHeader },
  ];
  const procRows: any[][] = sop.procedure.map(step => [
    { text: String(step.step), alignment: 'center', bold: true, color: COLORS.darkGray, fontSize: FONT.table },
    { text: step.action, bold: true, color: COLORS.black, fontSize: FONT.table },
    { text: step.detail, color: COLORS.darkGray, fontSize: FONT.table },
    { text: step.system ?? '\u2014', color: COLORS.medGray, fontSize: FONT.small },
  ]);
  content.push({
    table: {
      headerRows: 1,
      widths: [28, 90, '*', 80],
      body: [procHeader, ...procRows],
      dontBreakRows: true,
    },
    layout: TABLE_LAYOUT,
    margin: [0, 0, 0, 2],
  });

  // ── 5. KPIs ─────────────────────────────────────────────────────────────
  if (sop.kpis && sop.kpis.length > 0) {
    content.push(sectionHeader(5, 'Key Performance Indicators'));
    const kpiHeader: any[] = [
      { text: '#', bold: true, fillColor: COLORS.headerBg, alignment: 'center', fontSize: FONT.tableHeader },
      { text: 'KPI', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.tableHeader },
    ];
    const kpiRows: any[][] = sop.kpis.map((kpi, i) => [
      { text: String(i + 1), alignment: 'center', color: COLORS.medGray, fontSize: FONT.table },
      { text: kpi, color: COLORS.darkGray, fontSize: FONT.table },
    ]);
    content.push({
      table: { headerRows: 1, widths: [28, '*'], body: [kpiHeader, ...kpiRows] },
      layout: TABLE_LAYOUT,
      margin: [0, 0, 0, 2],
    });
  }

  // ── Related Documents ───────────────────────────────────────────────────
  content.push(sectionHeader(relatedSectionNum, 'Related Documents'));
  const relHeader: any[] = [
    { text: '#', bold: true, fillColor: COLORS.headerBg, alignment: 'center', fontSize: FONT.tableHeader },
    { text: 'Document', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.tableHeader },
  ];
  const relRows: any[][] = sop.relatedDocs.map((doc, i) => [
    { text: String(i + 1), alignment: 'center', color: COLORS.medGray, fontSize: FONT.table },
    { text: doc, color: COLORS.darkGray, fontSize: FONT.table },
  ]);
  content.push({
    table: { headerRows: 1, widths: [28, '*'], body: [relHeader, ...relRows] },
    layout: TABLE_LAYOUT,
    margin: [0, 0, 0, 0],
  });

  // Footer
  const footer = (currentPage: number, pageCount: number) => ({
    columns: [
      { text: `${sop.id}  |  Version ${sop.version}  |  R0  |  APPROVED`, fontSize: 5.5, color: COLORS.lightGray, margin: [32, 0, 0, 0] },
      { text: 'CONTROLLED COPY', fontSize: 5.5, bold: true, color: COLORS.positive, alignment: 'center' },
      { text: `Roteh\u00fcgels IMS  |  Page ${currentPage} of ${pageCount}`, fontSize: 5.5, color: COLORS.lightGray, alignment: 'right', margin: [0, 0, 32, 0] },
    ],
  });

  return { content, footer };
}

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
    const docDefinition = buildDocDefinition(sop, CO, logoUrl);

    const pdfBuffer = await generateSmartPdf(docDefinition.content, docDefinition.footer);

    const url = new URL(_req.url);
    const download = url.searchParams.get('download') === '1';

    const headers: Record<string, string> = {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'public, max-age=300',
    };

    if (download) {
      headers['Content-Disposition'] = `attachment; filename="${sop.id}-${sop.title.replace(/\s+/g, '-')}.pdf"`;
    } else {
      headers['Content-Disposition'] = 'inline';
    }

    return new Response(pdfBuffer, { status: 200, headers });
  } catch (err: unknown) {
    console.error('[GET /api/ims/sops/pdf]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'PDF generation failed' },
      { status: 500 },
    );
  }
}
