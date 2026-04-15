import { NextResponse } from 'next/server';
import { getSOPById, type SOP } from '@/lib/sops';
import { getCompanyCO } from '@/lib/company';
import fs from 'fs';
import path from 'path';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Content = any;
type TableCell = any;
type TDocumentDefinitions = any;

export const dynamic = 'force-dynamic';

function getLogoDataUrl(): string | null {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'assets', 'Logo2_black.png');
    const buf = fs.readFileSync(logoPath);
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const AMBER = '#b45309';
const GRAY = '#374151';
const LIGHT_GRAY = '#6b7280';
const BG_GRAY = '#f3f4f6';

function buildDocDefinition(sop: SOP, CO: Awaited<ReturnType<typeof getCompanyCO>>, logoUrl: string | null): TDocumentDefinitions {
  const kpiSectionNum = sop.kpis && sop.kpis.length > 0 ? 5 : null;
  const relatedSectionNum = kpiSectionNum ? 6 : 5;

  const content: Content[] = [];

  // ── Header ──────────────────────────────────────────────────────────────
  const headerColumns: Content = {
    columns: [
      {
        width: '*',
        stack: [
          ...(logoUrl ? [{ image: logoUrl, width: 100, margin: [0, 0, 0, 4] as [number, number, number, number] }] : []),
          { text: CO.name, fontSize: 11, bold: true, color: '#111' },
          { text: `${CO.addr1} ${CO.addr2}`, fontSize: 7, color: '#666', margin: [0, 2, 0, 0] as [number, number, number, number] },
        ],
      },
      {
        width: 'auto',
        alignment: 'right' as const,
        stack: [
          {
            table: {
              body: [[{ text: 'STANDARD OPERATING PROCEDURE', fontSize: 8, bold: true, color: AMBER, alignment: 'center' as const }]],
            },
            layout: {
              hLineWidth: () => 1.5,
              vLineWidth: () => 1.5,
              hLineColor: () => AMBER,
              vLineColor: () => AMBER,
              paddingLeft: () => 6,
              paddingRight: () => 6,
              paddingTop: () => 3,
              paddingBottom: () => 3,
            },
            margin: [0, 0, 0, 4] as [number, number, number, number],
          },
          { text: `Doc No: ${sop.id}`, fontSize: 7, color: '#555', alignment: 'right' as const },
          { text: `Version: ${sop.version}  |  Revision: R0`, fontSize: 7, color: '#555', alignment: 'right' as const },
        ],
      },
    ],
  };
  content.push(headerColumns);
  content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: '#111' }], margin: [0, 6, 0, 8] as [number, number, number, number] });

  // ── Title Block ─────────────────────────────────────────────────────────
  const titleRows: TableCell[][] = [
    [{ text: 'Title', bold: true, fillColor: BG_GRAY }, { text: sop.title, bold: true, fontSize: 11 }],
    [{ text: 'Department', bold: true, fillColor: BG_GRAY }, sop.department],
    [{ text: 'Category', bold: true, fillColor: BG_GRAY }, sop.category],
    [{ text: 'Effective Date', bold: true, fillColor: BG_GRAY }, fmtDate(sop.effectiveDate)],
    [{ text: 'Review Date', bold: true, fillColor: BG_GRAY }, fmtDate(sop.reviewDate)],
    [{ text: 'Approved By', bold: true, fillColor: BG_GRAY }, sop.approvedBy],
  ];
  content.push({
    table: { headerRows: 0, widths: [100, '*'], body: titleRows },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 10] as [number, number, number, number],
  });

  // ── Section helper ──────────────────────────────────────────────────────
  function sectionHeader(num: number, title: string): Content {
    return {
      text: `${num}. ${title}`,
      fontSize: 10,
      bold: true,
      color: AMBER,
      margin: [0, 8, 0, 4] as [number, number, number, number],
      decoration: 'underline' as const,
      decorationColor: '#fde68a',
    };
  }

  // ── 1. Purpose ──────────────────────────────────────────────────────────
  content.push(sectionHeader(1, 'Purpose'));
  content.push({ text: sop.purpose, color: GRAY, margin: [0, 0, 0, 2] as [number, number, number, number] });

  // ── 2. Scope ────────────────────────────────────────────────────────────
  content.push(sectionHeader(2, 'Scope'));
  content.push({ text: sop.scope, color: GRAY, margin: [0, 0, 0, 2] as [number, number, number, number] });

  // ── 3. Responsibilities ─────────────────────────────────────────────────
  content.push(sectionHeader(3, 'Responsibilities'));
  const respRows: TableCell[][] = sop.responsibilities.map(r => {
    const [role, ...descParts] = r.split(':');
    const desc = descParts.join(':').trim();
    return [
      { text: role.trim(), bold: true, fillColor: BG_GRAY },
      { text: desc || role, color: GRAY },
    ];
  });
  content.push({
    table: { headerRows: 0, widths: [130, '*'], body: respRows },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 2] as [number, number, number, number],
  });

  // ── 4. Procedure ────────────────────────────────────────────────────────
  content.push(sectionHeader(4, 'Procedure'));
  const procHeader: TableCell[] = [
    { text: 'Step', bold: true, fillColor: BG_GRAY, alignment: 'center' as const },
    { text: 'Action', bold: true, fillColor: BG_GRAY },
    { text: 'Detail', bold: true, fillColor: BG_GRAY },
    { text: 'System Ref', bold: true, fillColor: BG_GRAY },
  ];
  const procRows: TableCell[][] = sop.procedure.map(step => [
    { text: String(step.step), alignment: 'center' as const, bold: true, color: AMBER },
    { text: step.action, bold: true, color: '#111' },
    { text: step.detail, color: GRAY },
    { text: step.system ?? '\u2014', color: LIGHT_GRAY, fontSize: 7.5 },
  ]);
  content.push({
    table: {
      headerRows: 1,
      widths: [28, 90, '*', 80],
      body: [procHeader, ...procRows],
      dontBreakRows: true,
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#d1d5db',
      vLineColor: () => '#d1d5db',
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 3,
      paddingBottom: () => 3,
    },
    margin: [0, 0, 0, 2] as [number, number, number, number],
  });

  // ── 5. KPIs ─────────────────────────────────────────────────────────────
  if (sop.kpis && sop.kpis.length > 0) {
    content.push(sectionHeader(5, 'Key Performance Indicators'));
    const kpiHeader: TableCell[] = [
      { text: '#', bold: true, fillColor: BG_GRAY, alignment: 'center' as const },
      { text: 'KPI', bold: true, fillColor: BG_GRAY },
    ];
    const kpiRows: TableCell[][] = sop.kpis.map((kpi, i) => [
      { text: String(i + 1), alignment: 'center' as const, color: LIGHT_GRAY },
      { text: kpi, color: GRAY },
    ]);
    content.push({
      table: { headerRows: 1, widths: [28, '*'], body: [kpiHeader, ...kpiRows] },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 2] as [number, number, number, number],
    });
  }

  // ── Related Documents ───────────────────────────────────────────────────
  content.push(sectionHeader(relatedSectionNum, 'Related Documents'));
  const relHeader: TableCell[] = [
    { text: '#', bold: true, fillColor: BG_GRAY, alignment: 'center' as const },
    { text: 'Document', bold: true, fillColor: BG_GRAY },
  ];
  const relRows: TableCell[][] = sop.relatedDocs.map((doc, i) => [
    { text: String(i + 1), alignment: 'center' as const, color: LIGHT_GRAY },
    { text: doc, color: GRAY },
  ]);
  content.push({
    table: { headerRows: 1, widths: [28, '*'], body: [relHeader, ...relRows] },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 0] as [number, number, number, number],
  });

  return {
    pageSize: 'A4' as const,
    pageMargins: [40, 30, 40, 55] as [number, number, number, number],
    defaultStyle: { fontSize: 9, lineHeight: 1.3 },
    content,
    footer: (currentPage: number, pageCount: number) => ({
      stack: [
        {
          canvas: [{ type: 'line', x1: 40, y1: 0, x2: 555, y2: 0, lineWidth: 0.5, lineColor: '#d1d5db' }],
        },
        {
          columns: [
            {
              width: '*',
              text: `${sop.id}  |  Version ${sop.version}  |  R0  |  APPROVED`,
              fontSize: 7,
              color: LIGHT_GRAY,
              margin: [40, 4, 0, 0] as [number, number, number, number],
            },
            {
              width: 'auto',
              text: 'CONTROLLED COPY',
              fontSize: 7,
              bold: true,
              color: '#16a34a',
              alignment: 'center' as const,
              margin: [0, 4, 0, 0] as [number, number, number, number],
            },
            {
              width: '*',
              text: `Roteh\u00fcgels IMS  |  Page ${currentPage} of ${pageCount}`,
              fontSize: 7,
              color: LIGHT_GRAY,
              alignment: 'right' as const,
              margin: [0, 4, 40, 0] as [number, number, number, number],
            },
          ],
        },
      ],
    }),
  };
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

  const CO = await getCompanyCO();
  const logoUrl = getLogoDataUrl();
  const docDefinition = buildDocDefinition(sop, CO, logoUrl);

  // pdfmake v0.3.x server-side API
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfmake = require('pdfmake');
  pdfmake.fonts = {
    Roboto: {
      normal: path.join(process.cwd(), 'node_modules', 'pdfmake', 'fonts', 'Roboto', 'Roboto-Regular.ttf'),
      bold: path.join(process.cwd(), 'node_modules', 'pdfmake', 'fonts', 'Roboto', 'Roboto-Medium.ttf'),
      italics: path.join(process.cwd(), 'node_modules', 'pdfmake', 'fonts', 'Roboto', 'Roboto-Italic.ttf'),
      bolditalics: path.join(process.cwd(), 'node_modules', 'pdfmake', 'fonts', 'Roboto', 'Roboto-MediumItalic.ttf'),
    },
  };

  const pdfDoc = pdfmake.createPdf(docDefinition);
  const pdfBuffer: Buffer = await pdfDoc.getBuffer();

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
}
