import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCompanyCO } from '@/lib/company';
import fs from 'fs';
import path from 'path';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = 'force-dynamic';

const fmtN = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

function loadFont(name: string): Buffer {
  try { return fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'Roboto', name)); }
  catch { return fs.readFileSync(path.join(process.cwd(), 'node_modules', 'pdfmake', 'fonts', 'Roboto', name)); }
}
function getLogoDataUrl(): string | null {
  try { return `data:image/png;base64,${fs.readFileSync(path.join(process.cwd(), 'public', 'assets', 'Logo2_black.png')).toString('base64')}`; } catch { return null; }
}
function getSigDataUrl(): string | null {
  try { return `data:image/jpeg;base64,${fs.readFileSync(path.join(process.cwd(), 'private', 'signature.jpg')).toString('base64')}`; } catch { return null; }
}

function amountInWords(amount: number): string {
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const twoD = (n: number) => n < 20 ? ones[n] : tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '');
  const threeD = (n: number) => n < 100 ? twoD(n) : ones[Math.floor(n/100)]+' Hundred'+(n%100 ? ' '+twoD(n%100) : '');
  const r = Math.floor(amount); const parts: string[] = []; let rem = r;
  if (rem >= 10000000) { parts.push(twoD(Math.floor(rem/10000000))+' Crore'); rem %= 10000000; }
  if (rem >= 100000) { parts.push(twoD(Math.floor(rem/100000))+' Lakh'); rem %= 100000; }
  if (rem >= 1000) { parts.push(twoD(Math.floor(rem/1000))+' Thousand'); rem %= 1000; }
  if (rem > 0) { parts.push(threeD(rem)); }
  return `Rupees ${r===0?'Zero':parts.join(' ')} Only`;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(_req.url);
  const download = url.searchParams.get('download') === '1';

  try {
    const CO = await getCompanyCO();
    const logoUrl = getLogoDataUrl();
    const sigUrl = getSigDataUrl();

    const { data: pi, error } = await supabaseAdmin.from('proforma_invoices').select('*, customers(*)').eq('quote_id', id).single();
    if (error || !pi) return NextResponse.json({ error: 'Proforma not found' }, { status: 404 });

    const customer = pi.customers as any;
    const billing = customer?.billing_address as Record<string, string> | null;
    const items = (pi.items ?? []) as any[];
    const isIntra = customer?.state_code === '33' || customer?.state?.toLowerCase().includes('tamil');

    const BG = '#f3f4f6';
    const content: any[] = [];

    // Header
    content.push({
      columns: [
        { width: '*', stack: [
          ...(logoUrl ? [{ image: logoUrl, width: 110, margin: [0, 0, 0, 4] }] : []),
          { text: CO.name, fontSize: 11, bold: true },
          { text: `${CO.addr1} ${CO.addr2}`, fontSize: 7, color: '#666', margin: [0, 2, 0, 0] },
          { text: `GSTIN: ${CO.gstin}  |  PAN: ${CO.pan}  |  CIN: ${CO.cin}`, fontSize: 7, color: '#666', margin: [0, 2, 0, 0] },
        ]},
        { width: 'auto', alignment: 'right', stack: [
          { text: 'PROFORMA INVOICE', fontSize: 14, bold: true, color: '#b45309' },
          { text: 'This is not a tax invoice', fontSize: 8, italics: true, color: '#888', margin: [0, 2, 0, 4] },
          { text: `PI No: ${pi.pi_no}`, fontSize: 8 },
          { text: `Date: ${fmtDate(pi.pi_date)}`, fontSize: 8 },
          ...(pi.valid_until ? [{ text: `Valid Until: ${fmtDate(pi.valid_until)}`, fontSize: 8 }] : []),
        ]},
      ],
    });
    content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 523, y2: 0, lineWidth: 2, lineColor: '#111' }], margin: [0, 4, 0, 8] });

    // Bill To + PI Details
    content.push({
      columns: [
        { width: '*', stack: [
          { text: 'BILL TO', fontSize: 7, bold: true, color: '#888', margin: [0, 0, 0, 3] },
          { text: customer?.name ?? '', fontSize: 11, bold: true },
          ...(customer?.gstin ? [{ text: `GSTIN: ${customer.gstin}`, fontSize: 8, margin: [0, 2, 0, 0] }] : []),
          ...(billing ? [{ text: `${billing.line1 ?? ''}${billing.line2 ? ', ' + billing.line2 : ''}, ${billing.city ?? ''}, ${billing.state ?? ''}`, fontSize: 8, color: '#555', margin: [0, 2, 0, 0] }] : []),
        ]},
        { width: 180, stack: [
          { text: 'PROFORMA DETAILS', fontSize: 7, bold: true, color: '#888', margin: [0, 0, 0, 3] },
          { text: `PI No: ${pi.pi_no}`, fontSize: 8 },
          { text: `Quote Ref: ${pi.quote_no ?? '-'}`, fontSize: 8 },
          { text: `Place of Supply: ${isIntra ? 'Tamil Nadu (33)' : (customer?.state ?? '-')}`, fontSize: 8 },
          { text: `GST Type: ${isIntra ? 'CGST + SGST' : 'IGST'}`, fontSize: 8 },
        ]},
      ],
      margin: [0, 0, 0, 10],
    });

    // Items table
    const halfRate = (items[0]?.gst_rate ?? 18) / 2;
    const headerRow: any[] = [
      { text: '#', bold: true, fillColor: BG, alignment: 'center' },
      { text: 'Description', bold: true, fillColor: BG },
      { text: 'HSN/SAC', bold: true, fillColor: BG, alignment: 'center' },
      { text: 'Qty', bold: true, fillColor: BG, alignment: 'right' },
      { text: 'Rate', bold: true, fillColor: BG, alignment: 'right' },
      { text: 'Taxable', bold: true, fillColor: BG, alignment: 'right' },
    ];
    if (isIntra) {
      headerRow.push({ text: `CGST ${halfRate}%`, bold: true, fillColor: BG, alignment: 'right' });
      headerRow.push({ text: `SGST ${halfRate}%`, bold: true, fillColor: BG, alignment: 'right' });
    } else {
      headerRow.push({ text: 'IGST', bold: true, fillColor: BG, alignment: 'right' });
    }
    headerRow.push({ text: 'Total', bold: true, fillColor: BG, alignment: 'right' });

    const dataRows = items.map((item: any, i: number) => {
      const halfGst = parseFloat((item.gst_amount / 2).toFixed(2));
      const row: any[] = [
        { text: String(i + 1), alignment: 'center' },
        { text: item.name, bold: true },
        { text: item.hsn_code || item.sac_code || '-', alignment: 'center', fontSize: 7.5 },
        { text: `${item.quantity} ${item.unit}`, alignment: 'right' },
        { text: fmtN(item.unit_price), alignment: 'right' },
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

    const widths: any[] = [18, '*', 40, 40, 55, 55];
    if (isIntra) { widths.push(45, 45); } else { widths.push(50); }
    widths.push(60);

    content.push({
      table: { headerRows: 1, widths, body: [headerRow, ...dataRows], dontBreakRows: true },
      layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#ddd', vLineColor: () => '#ddd', paddingLeft: () => 4, paddingRight: () => 4, paddingTop: () => 3, paddingBottom: () => 3 },
      margin: [0, 0, 0, 8],
    });

    // Totals
    const totalsBody: any[][] = [
      [{ text: 'Taxable Value', alignment: 'right' }, { text: fmtN(pi.taxable_value), alignment: 'right' }],
    ];
    if (isIntra) {
      totalsBody.push([{ text: 'CGST', alignment: 'right', color: '#666' }, { text: fmtN(pi.cgst_amount), alignment: 'right' }]);
      totalsBody.push([{ text: 'SGST', alignment: 'right', color: '#666' }, { text: fmtN(pi.sgst_amount), alignment: 'right' }]);
    } else {
      totalsBody.push([{ text: 'IGST', alignment: 'right', color: '#666' }, { text: fmtN(pi.igst_amount), alignment: 'right' }]);
    }
    totalsBody.push([
      { text: 'GRAND TOTAL', alignment: 'right', bold: true, fontSize: 10, fillColor: BG },
      { text: fmtN(pi.total_amount), alignment: 'right', bold: true, fontSize: 10, fillColor: BG },
    ]);

    content.push({
      columns: [{ width: '*', text: '' }, {
        width: 'auto',
        table: { widths: [120, 90], body: totalsBody },
        layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#ddd', vLineColor: () => '#ddd', paddingLeft: () => 6, paddingRight: () => 6, paddingTop: () => 3, paddingBottom: () => 3 },
      }],
      margin: [0, 0, 0, 6],
    });

    // Amount in words
    content.push({ text: `Amount in words: ${amountInWords(pi.total_amount)}`, fontSize: 8, bold: true, margin: [0, 0, 0, 8] });

    // Payment terms
    if (pi.payment_terms) {
      content.push({ text: `Payment Terms: ${pi.payment_terms}`, fontSize: 8, color: '#555', margin: [0, 0, 0, 6] });
    }

    // Bank details + Signature
    content.push({
      columns: [
        { width: '*', stack: [
          { text: 'BANK DETAILS', fontSize: 7, bold: true, color: '#888', margin: [0, 0, 0, 3] },
          { table: { body: [
            [{ text: 'Name', fontSize: 7.5, color: '#888' }, { text: CO.name, fontSize: 7.5 }],
            [{ text: 'A/c No.', fontSize: 7.5, color: '#888' }, { text: CO.acc, fontSize: 7.5, bold: true }],
            [{ text: 'IFSC', fontSize: 7.5, color: '#888' }, { text: CO.ifsc, fontSize: 7.5 }],
            [{ text: 'Bank', fontSize: 7.5, color: '#888' }, { text: CO.bank, fontSize: 7.5 }],
          ]}, layout: 'noBorders' },
        ]},
        { width: 180, alignment: 'right', stack: [
          { text: `For ${CO.name}`, fontSize: 8, bold: true, color: '#444', alignment: 'right' },
          ...(sigUrl ? [{ image: sigUrl, width: 55, alignment: 'right' as const, margin: [0, 4, 0, 2] as any }] : [{ text: '', margin: [0, 20, 0, 0] }]),
          { canvas: [{ type: 'line', x1: 60, y1: 0, x2: 180, y2: 0, lineWidth: 0.5, lineColor: '#bbb' }] },
          { text: 'Authorised Signatory', fontSize: 7.5, bold: true, alignment: 'right' },
        ]},
      ],
    });

    // Footer
    content.push({ text: 'This is a proforma invoice and not a tax invoice. Subject to Chennai jurisdiction.', fontSize: 7, color: '#aaa', alignment: 'center', margin: [0, 8, 0, 0] });

    // Generate PDF
    const pdfmake = require('pdfmake');
    for (const f of ['Roboto-Regular.ttf', 'Roboto-Medium.ttf', 'Roboto-Italic.ttf', 'Roboto-MediumItalic.ttf']) pdfmake.virtualfs.writeFileSync(f, loadFont(f));
    pdfmake.fonts = { Roboto: { normal: 'Roboto-Regular.ttf', bold: 'Roboto-Medium.ttf', italics: 'Roboto-Italic.ttf', bolditalics: 'Roboto-MediumItalic.ttf' } };

    const pdfBuffer: Buffer = await pdfmake.createPdf({
      pageSize: 'A4', pageMargins: [32, 22, 32, 40],
      defaultStyle: { fontSize: 8, lineHeight: 1.2 },
      content,
      footer: (pg: number, total: number) => ({ columns: [
        { text: pi.pi_no, fontSize: 7, color: '#aaa', margin: [36, 0, 0, 0] },
        { text: 'Proforma Invoice — Not a Tax Invoice', fontSize: 7, color: '#aaa', alignment: 'center' },
        { text: `Page ${pg} of ${total}`, fontSize: 7, color: '#aaa', alignment: 'right', margin: [0, 0, 36, 0] },
      ]}),
    }).getBuffer();

    const headers: Record<string, string> = { 'Content-Type': 'application/pdf', 'Cache-Control': 'public, max-age=60' };
    if (download) headers['Content-Disposition'] = `attachment; filename="Proforma-${pi.pi_no}.pdf"`;
    else headers['Content-Disposition'] = 'inline';
    return new Response(pdfBuffer, { status: 200, headers });
  } catch (err: unknown) {
    console.error('[GET /api/accounts/quotes/proforma/pdf]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'PDF generation failed' }, { status: 500 });
  }
}
