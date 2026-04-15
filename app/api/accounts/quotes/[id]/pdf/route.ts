import { NextResponse } from 'next/server';
import { hrLine } from '@/lib/pdfConfig';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCompanyCO } from '@/lib/company';
import fs from 'fs';
import path from 'path';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = 'force-dynamic';

const fmtN = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

function getLogoDataUrl(): string | null {
  try { return `data:image/png;base64,${fs.readFileSync(path.join(process.cwd(), 'public', 'assets', 'Logo2_black.png')).toString('base64')}`; } catch { return null; }
}
function getSigDataUrl(): string | null {
  try { return `data:image/jpeg;base64,${fs.readFileSync(path.join(process.cwd(), 'private', 'signature.jpg')).toString('base64')}`; } catch { return null; }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(_req.url);
  const download = url.searchParams.get('download') === '1';

  try {
    const CO = await getCompanyCO();
    const logoUrl = getLogoDataUrl();
    const sigUrl = getSigDataUrl();

    const { data: quote, error } = await supabaseAdmin.from('quotes').select('*, customers(*)').eq('id', id).single();
    if (error || !quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });

    const customer = quote.customers as any;
    const billing = customer?.billing_address as Record<string, string> | null;
    const items = (quote.items ?? []) as any[];
    const isIntra = customer?.state_code === '33' || customer?.state?.toLowerCase().includes('tamil');
    const halfRate = (items[0]?.gst_rate ?? 18) / 2;

    const BG = '#f3f4f6';
    const content: any[] = [];

    // Header
    content.push({
      columns: [
        { width: '*', stack: [
          ...(logoUrl ? [{ image: logoUrl, width: 110, margin: [0, 0, 0, 4] }] : []),
          { text: CO.name, fontSize: 11, bold: true },
          { text: `${CO.addr1} ${CO.addr2}`, fontSize: 7, color: '#666', margin: [0, 2, 0, 0] },
          { text: `${CO.email}  |  ${CO.phone}  |  ${CO.web}`, fontSize: 7, color: '#888', margin: [0, 2, 0, 0] },
        ]},
        { width: 'auto', alignment: 'right', stack: [
          { text: 'QUOTATION', fontSize: 18, bold: true, color: '#b45309' },
          { text: 'Not a tax invoice', fontSize: 8, italics: true, color: '#888', margin: [0, 2, 0, 4] },
          { text: `Quote No: ${quote.quote_no}`, fontSize: 8 },
          { text: `Date: ${fmtDate(quote.quote_date)}`, fontSize: 8 },
          ...(quote.valid_until ? [{ text: `Valid Until: ${fmtDate(quote.valid_until)}`, fontSize: 8 }] : []),
        ]},
      ],
    });
    content.push({ ...hrLine(2, '#111'), margin: [0, 4, 0, 6] });

    // GSTIN strip
    content.push({
      text: `GSTIN: ${CO.gstin}  |  PAN: ${CO.pan}  |  CIN: ${CO.cin}`,
      fontSize: 7.5, color: '#555', fillColor: BG,
      margin: [0, 0, 0, 8],
    });

    // Quoted To + Quote Details
    content.push({
      columns: [
        { width: '*', stack: [
          { text: 'QUOTED TO', fontSize: 7, bold: true, color: '#888', margin: [0, 0, 0, 3] },
          { text: customer?.name ?? '', fontSize: 11, bold: true },
          ...(customer?.gstin ? [{ text: `GSTIN: ${customer.gstin}`, fontSize: 8, margin: [0, 2, 0, 0] }] : []),
          ...(customer?.pan ? [{ text: `PAN: ${customer.pan}`, fontSize: 8 }] : []),
          ...(billing ? [{ text: `${billing.line1 ?? ''}${billing.line2 ? ', ' + billing.line2 : ''}, ${billing.city ?? ''}, ${billing.state ?? ''}${billing.pincode ? ' - ' + billing.pincode : ''}`, fontSize: 8, color: '#555', margin: [0, 3, 0, 0] }] : []),
          ...(customer?.phone ? [{ text: `Phone: ${customer.phone}`, fontSize: 7.5, color: '#555', margin: [0, 2, 0, 0] }] : []),
          ...(customer?.email ? [{ text: `Email: ${customer.email}`, fontSize: 7.5, color: '#555' }] : []),
        ]},
        { width: 180, stack: [
          { text: 'QUOTE DETAILS', fontSize: 7, bold: true, color: '#888', margin: [0, 0, 0, 3] },
          { text: `Quote No: ${quote.quote_no}`, fontSize: 8 },
          { text: `Date: ${fmtDate(quote.quote_date)}`, fontSize: 8 },
          ...(quote.valid_until ? [{ text: `Valid Until: ${fmtDate(quote.valid_until)}`, fontSize: 8 }] : []),
          { text: `Place of Supply: ${isIntra ? 'Tamil Nadu (33)' : (customer?.state ?? '-')}`, fontSize: 8 },
          { text: `GST Type: ${isIntra ? 'CGST + SGST' : 'IGST'}`, fontSize: 8 },
        ]},
      ],
      margin: [0, 0, 0, 10],
    });

    // Items table
    const headerRow: any[] = [
      { text: '#', bold: true, fillColor: BG, alignment: 'center' },
      { text: 'Description', bold: true, fillColor: BG },
      { text: 'HSN/SAC', bold: true, fillColor: BG, alignment: 'center' },
      { text: 'Qty', bold: true, fillColor: BG, alignment: 'right' },
      { text: 'Unit', bold: true, fillColor: BG, alignment: 'center' },
      { text: 'Rate', bold: true, fillColor: BG, alignment: 'right' },
      { text: 'Disc%', bold: true, fillColor: BG, alignment: 'center' },
      { text: 'Taxable', bold: true, fillColor: BG, alignment: 'right' },
    ];
    if (isIntra) {
      headerRow.push({ text: `CGST ${halfRate}%`, bold: true, fillColor: BG, alignment: 'right' });
      headerRow.push({ text: `SGST ${halfRate}%`, bold: true, fillColor: BG, alignment: 'right' });
    } else {
      headerRow.push({ text: `IGST`, bold: true, fillColor: BG, alignment: 'right' });
    }
    headerRow.push({ text: 'Total', bold: true, fillColor: BG, alignment: 'right' });

    const dataRows = items.map((item: any, i: number) => {
      const halfGst = parseFloat((item.gst_amount / 2).toFixed(2));
      const row: any[] = [
        { text: String(i + 1), alignment: 'center' },
        { text: item.name, bold: true },
        { text: item.hsn_code || item.sac_code || '-', alignment: 'center', fontSize: 7.5 },
        { text: String(item.quantity), alignment: 'right' },
        { text: item.unit, alignment: 'center' },
        { text: fmtN(item.unit_price), alignment: 'right' },
        { text: item.discount_pct > 0 ? `${item.discount_pct}%` : '-', alignment: 'center' },
        { text: fmtN(item.taxable_amount), alignment: 'right' },
      ];
      if (isIntra) {
        row.push({ text: fmtN(halfGst), alignment: 'right' });
        row.push({ text: fmtN(halfGst), alignment: 'right' });
      } else {
        row.push({ text: fmtN(item.gst_amount), alignment: 'right' });
      }
      row.push({ text: fmtN(item.total), alignment: 'right', bold: true });
      return row;
    });

    const widths: any[] = [18, '*', 40, 28, 28, 55, 30, 55];
    if (isIntra) { widths.push(45, 45); } else { widths.push(50); }
    widths.push(60);

    content.push({
      table: { headerRows: 1, widths, body: [headerRow, ...dataRows], dontBreakRows: true },
      layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#ddd', vLineColor: () => '#ddd', paddingLeft: () => 4, paddingRight: () => 4, paddingTop: () => 3, paddingBottom: () => 3 },
      margin: [0, 0, 0, 8],
    });

    // Totals (right-aligned)
    const totalsBody: any[][] = [
      [{ text: 'Subtotal', alignment: 'right', color: '#666' }, { text: fmtN(quote.subtotal), alignment: 'right' }],
    ];
    if (Number(quote.discount_amount) > 0) {
      totalsBody.push([{ text: 'Discount', alignment: 'right', color: '#c00' }, { text: `- ${fmtN(quote.discount_amount)}`, alignment: 'right', color: '#c00' }]);
    }
    totalsBody.push([{ text: 'Taxable Value', alignment: 'right' }, { text: fmtN(quote.taxable_value), alignment: 'right' }]);
    if (isIntra) {
      totalsBody.push([{ text: 'CGST', alignment: 'right', color: '#666' }, { text: fmtN(quote.cgst_amount), alignment: 'right' }]);
      totalsBody.push([{ text: 'SGST', alignment: 'right', color: '#666' }, { text: fmtN(quote.sgst_amount), alignment: 'right' }]);
    } else {
      totalsBody.push([{ text: 'IGST', alignment: 'right', color: '#666' }, { text: fmtN(quote.igst_amount), alignment: 'right' }]);
    }
    totalsBody.push([
      { text: 'GRAND TOTAL', alignment: 'right', bold: true, fontSize: 10, fillColor: BG },
      { text: fmtN(quote.total_amount), alignment: 'right', bold: true, fontSize: 10, fillColor: BG },
    ]);

    content.push({
      columns: [{ width: '*', text: '' }, {
        width: 'auto',
        table: { widths: [120, 90], body: totalsBody },
        layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#ddd', vLineColor: () => '#ddd', paddingLeft: () => 6, paddingRight: () => 6, paddingTop: () => 3, paddingBottom: () => 3 },
      }],
      margin: [0, 0, 0, 10],
    });

    // Notes & Terms
    if (quote.notes || quote.terms) {
      const cols: any[] = [];
      if (quote.notes) cols.push({ width: '*', stack: [{ text: 'NOTES', fontSize: 7, bold: true, color: '#888', margin: [0, 0, 0, 2] }, { text: quote.notes, fontSize: 8, color: '#444', lineHeight: 1.5 }] });
      if (quote.terms) cols.push({ width: '*', stack: [{ text: 'TERMS & CONDITIONS', fontSize: 7, bold: true, color: '#888', margin: [0, 0, 0, 2] }, { text: quote.terms, fontSize: 8, color: '#444', lineHeight: 1.5 }] });
      content.push({ columns: cols, columnGap: 12, margin: [0, 0, 0, 10] });
    }

    // Footer / Signature
    content.push({
      columns: [
        { width: '*', stack: [
          { text: 'This is a quotation and not a tax invoice.', fontSize: 7.5, color: '#888' },
          { text: 'Prices subject to change after validity date.', fontSize: 7.5, color: '#888' },
          { text: 'Subject to Chennai jurisdiction.', fontSize: 7.5, color: '#888' },
        ]},
        { width: 180, alignment: 'right', stack: [
          { text: `For ${CO.name}`, fontSize: 8, bold: true, color: '#444', alignment: 'right' },
          ...(sigUrl ? [{ image: sigUrl, width: 60, alignment: 'right' as const, margin: [0, 4, 0, 2] as any }] : [{ text: '', margin: [0, 20, 0, 0] }]),
          { canvas: [{ type: 'line', x1: 60, y1: 0, x2: 180, y2: 0, lineWidth: 0.5, lineColor: '#bbb' }] },
          { text: 'Authorised Signatory', fontSize: 7.5, bold: true, alignment: 'right' },
        ]},
      ],
    });

    // Generate PDF using smart auto-scaling system
    const { generateSmartPdf } = await import('@/lib/pdfConfig');
    const pdfBuffer = await generateSmartPdf(content, (pg: number, total: number) => ({
      columns: [
        { text: quote.quote_no, fontSize: 7, color: '#aaa', margin: [36, 0, 0, 0] },
        { text: `${CO.web}  |  ${CO.email}`, fontSize: 7, color: '#aaa', alignment: 'center' },
        { text: `Page ${pg} of ${total}`, fontSize: 7, color: '#aaa', alignment: 'right', margin: [0, 0, 36, 0] },
      ],
    }));

    const headers: Record<string, string> = { 'Content-Type': 'application/pdf', 'Cache-Control': 'public, max-age=60' };
    if (download) headers['Content-Disposition'] = `attachment; filename="Quote-${quote.quote_no}.pdf"`;
    else headers['Content-Disposition'] = 'inline';

    return new Response(pdfBuffer, { status: 200, headers });
  } catch (err: unknown) {
    console.error('[GET /api/accounts/quotes/pdf]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'PDF generation failed' }, { status: 500 });
  }
}
