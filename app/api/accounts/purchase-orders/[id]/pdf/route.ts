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

function numToWords(n: number): string {
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const inr = Math.round(n);
  if (inr === 0) return 'Zero';
  function words(num: number): string {
    if (num === 0) return '';
    if (num < 20) return a[num] + ' ';
    if (num < 100) return b[Math.floor(num / 10)] + (num % 10 ? ' ' + a[num % 10] : '') + ' ';
    if (num < 1000) return a[Math.floor(num / 100)] + ' Hundred ' + words(num % 100);
    if (num < 100000) return words(Math.floor(num / 1000)) + 'Thousand ' + words(num % 1000);
    if (num < 10000000) return words(Math.floor(num / 100000)) + 'Lakh ' + words(num % 100000);
    return words(Math.floor(num / 10000000)) + 'Crore ' + words(num % 10000000);
  }
  return 'Rupees ' + words(inr).trim() + ' Only';
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(_req.url);
  const download = url.searchParams.get('download') === '1';

  try {
    const CO = await getCompanyCO();
    const logoUrl = getLogoDataUrl();
    const sigUrl = getSigDataUrl();

    const [poRes, itemsRes, pmtsRes] = await Promise.all([
      supabaseAdmin.from('purchase_orders').select('*, suppliers(*)').eq('id', id).single(),
      supabaseAdmin.from('po_items').select('*').eq('po_id', id).order('sl_no'),
      supabaseAdmin.from('po_payments').select('amount').eq('po_id', id),
    ]);
    if (poRes.error || !poRes.data) return NextResponse.json({ error: 'PO not found' }, { status: 404 });

    const po = poRes.data;
    const supplier = po.suppliers as any;
    const items = itemsRes.data ?? [];
    const totalPaid = (pmtsRes.data ?? []).reduce((s: number, p: any) => s + p.amount, 0);
    const balance = po.total_amount - totalPaid;
    const isIGST = po.igst_amount > 0;
    const shipTo = po.ship_to as Record<string, string> | null;

    const BG = '#f3f4f6';
    const content: any[] = [];

    // Header
    content.push({
      columns: [
        { width: '*', stack: [
          ...(logoUrl ? [{ image: logoUrl, width: 110, margin: [0, 0, 0, 4] }] : []),
          { text: CO.name, fontSize: 10, bold: true },
          { text: `${CO.addr1} ${CO.addr2}`, fontSize: 7, color: '#666', margin: [0, 2, 0, 0] },
          { text: `${CO.procurementEmail}  |  ${CO.phone}  |  ${CO.web}`, fontSize: 7, color: '#888', margin: [0, 2, 0, 0] },
        ]},
        { width: 'auto', alignment: 'right', stack: [
          { text: 'PURCHASE ORDER', fontSize: 14, bold: true },
          ...((po as any).amendment_no > 0 ? [{ text: `AMENDMENT ${String((po as any).amendment_no).padStart(2, '0')}`, fontSize: 8, bold: true, color: '#92400e', margin: [0, 2, 0, 0] }] : []),
          { text: `PO No: ${po.po_no}`, fontSize: 8, margin: [0, 4, 0, 0] },
          { text: `Date: ${fmtDate(po.po_date)}`, fontSize: 8 },
          ...(po.expected_delivery ? [{ text: `Delivery By: ${fmtDate(po.expected_delivery)}`, fontSize: 8 }] : []),
          ...(po.supplier_ref ? [{ text: `Supplier Ref: ${po.supplier_ref}`, fontSize: 8 }] : []),
        ]},
      ],
    });
    content.push({ ...hrLine(2, '#111'), margin: [0, 4, 0, 6] });

    // GSTIN strip
    content.push({ text: `GSTIN: ${CO.gstin}  |  PAN: ${CO.pan}  |  CIN: ${CO.cin}`, fontSize: 7.5, color: '#555', margin: [0, 0, 0, 8] });

    // Vendor + Deliver To
    const deliverAddr = shipTo
      ? `${shipTo.line1 ?? ''}${shipTo.line2 ? ', ' + shipTo.line2 : ''}, ${shipTo.city ?? ''}, ${shipTo.state ?? ''}${shipTo.pincode ? ' - ' + shipTo.pincode : ''}`
      : `${CO.addr1} ${CO.addr2}`;

    content.push({
      table: {
        widths: ['*', '*'],
        body: [[
          {
            stack: [
              { text: 'VENDOR (BILL FROM)', fontSize: 6.5, bold: true, color: '#b45309', margin: [0, 0, 0, 3] },
              { text: supplier?.legal_name ?? '', fontSize: 10, bold: true },
              ...(supplier?.gstin ? [{ text: `GSTIN: ${supplier.gstin}`, fontSize: 7, margin: [0, 2, 0, 0] }] : []),
              ...(supplier?.address ? [{ text: `${supplier.address}${supplier.state ? ', ' + supplier.state : ''}${supplier.pincode ? ' - ' + supplier.pincode : ''}`, fontSize: 7, color: '#555', margin: [0, 2, 0, 0] }] : []),
              ...(supplier?.email ? [{ text: `Email: ${supplier.email}`, fontSize: 6.5, color: '#555', margin: [0, 2, 0, 0] }] : []),
              ...(supplier?.phone ? [{ text: `Phone: ${supplier.phone}`, fontSize: 6.5, color: '#555' }] : []),
            ],
          },
          {
            stack: [
              { text: 'DELIVER TO (BILL TO)', fontSize: 6.5, bold: true, color: '#b45309', margin: [0, 0, 0, 3] },
              { text: CO.name, fontSize: 10, bold: true },
              { text: `GSTIN: ${CO.gstin}`, fontSize: 7, margin: [0, 2, 0, 0] },
              { text: deliverAddr, fontSize: 7, color: '#555', margin: [0, 2, 0, 0] },
              { text: `Place of Supply: Tamil Nadu (33)  |  GST: ${isIGST ? 'IGST (Inter-state)' : 'CGST+SGST (Intra-state)'}`, fontSize: 6.5, color: '#555', margin: [0, 3, 0, 0] },
            ],
          },
        ]],
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 10],
    });

    // Items table
    const headerRow: any[] = [
      { text: '#', bold: true, fillColor: BG, alignment: 'center' },
      { text: 'Description', bold: true, fillColor: BG },
      { text: 'HSN', bold: true, fillColor: BG, alignment: 'center' },
      { text: 'Qty', bold: true, fillColor: BG, alignment: 'right' },
      { text: 'Unit', bold: true, fillColor: BG, alignment: 'center' },
      { text: 'Rate', bold: true, fillColor: BG, alignment: 'right' },
      { text: 'Taxable', bold: true, fillColor: BG, alignment: 'right' },
      { text: isIGST ? 'IGST' : 'GST', bold: true, fillColor: BG, alignment: 'right' },
      { text: 'Total', bold: true, fillColor: BG, alignment: 'right' },
    ];
    const dataRows = items.map((item: any, i: number) => [
      { text: String(item.sl_no ?? i + 1), alignment: 'center' },
      { text: item.description, bold: true },
      { text: item.hsn_code || '-', alignment: 'center', fontSize: 7.5 },
      { text: String(item.quantity), alignment: 'right' },
      { text: item.unit, alignment: 'center' },
      { text: fmtN(item.unit_price), alignment: 'right' },
      { text: fmtN(item.taxable_amount), alignment: 'right' },
      { text: `${fmtN(item.gst_amount)}\n${isIGST ? item.igst_rate + '%' : item.cgst_rate + '%+' + item.sgst_rate + '%'}`, alignment: 'right', fontSize: 7.5 },
      { text: fmtN(item.total), alignment: 'right', bold: true },
    ]);

    content.push({
      table: { headerRows: 1, widths: [18, '*', 35, 28, 28, 55, 55, 50, 60], body: [headerRow, ...dataRows], dontBreakRows: true },
      layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#ddd', vLineColor: () => '#ddd', paddingLeft: () => 4, paddingRight: () => 4, paddingTop: () => 3, paddingBottom: () => 3 },
      margin: [0, 0, 0, 8],
    });

    // Totals
    const totalsBody: any[][] = [
      [{ text: 'Net Assessable Value', alignment: 'right', color: '#666' }, { text: fmtN(po.taxable_value), alignment: 'right' }],
    ];
    if (isIGST) {
      totalsBody.push([{ text: 'IGST @ 18%', alignment: 'right', color: '#666' }, { text: fmtN(po.igst_amount), alignment: 'right' }]);
    } else {
      totalsBody.push([{ text: 'CGST', alignment: 'right', color: '#666' }, { text: fmtN(po.cgst_amount), alignment: 'right' }]);
      totalsBody.push([{ text: 'SGST', alignment: 'right', color: '#666' }, { text: fmtN(po.sgst_amount), alignment: 'right' }]);
    }
    totalsBody.push([
      { text: 'GRAND TOTAL', alignment: 'right', bold: true, fontSize: 10 },
      { text: fmtN(po.total_amount), alignment: 'right', bold: true, fontSize: 10 },
    ]);
    if (totalPaid > 0) {
      totalsBody.push([{ text: 'Less: Advance Paid', alignment: 'right', color: '#059669' }, { text: `- ${fmtN(totalPaid)}`, alignment: 'right', color: '#059669' }]);
      totalsBody.push([
        { text: 'BALANCE PAYABLE', alignment: 'right', bold: true, fontSize: 10 },
        { text: fmtN(balance), alignment: 'right', bold: true, fontSize: 10, color: balance > 0 ? '#dc2626' : '#059669' },
      ]);
    }

    content.push({
      columns: [{ width: '*', text: '' }, {
        width: 'auto',
        table: { widths: [130, 90], body: totalsBody },
        layout: 'noBorders',
      }],
      margin: [0, 0, 0, 6],
    });

    // Amount in words
    content.push({
      text: `Grand Total (in words): ${numToWords(po.total_amount)} (INR)${totalPaid > 0 ? '  |  Balance Payable: ' + numToWords(balance) + ' (INR)' : ''}`,
      fontSize: 8, margin: [0, 0, 0, 6],
    });

    // Terms
    if (po.terms) {
      content.push({ text: `Terms: ${po.terms}`, fontSize: 8, color: '#555', margin: [0, 0, 0, 6] });
    }

    // Amendment notes
    if ((po as any).amendment_no > 0 && (po as any).amendment_notes) {
      content.push({ text: `Amendment ${String((po as any).amendment_no).padStart(2, '0')}: ${(po as any).amendment_notes}`, fontSize: 8, color: '#92400e', margin: [0, 0, 0, 6] });
    }

    // Footer / Signature
    content.push({
      table: {
        widths: ['*', '*'],
        body: [[
          {
            stack: [
              { text: 'DISCLAIMER', fontSize: 6.5, bold: true, color: '#b45309', margin: [0, 0, 0, 3] },
              { text: `Purchase Order issued by ${CO.name}`, fontSize: 6.5, color: '#666' },
              { text: `Subject to Chennai jurisdiction. GSTIN: ${CO.gstin}`, fontSize: 6.5, color: '#666' },
            ],
          },
          {
            stack: [
              { text: `For ${CO.name}`, fontSize: 7, bold: true, color: '#444', alignment: 'right' },
              ...(sigUrl ? [{ image: sigUrl, width: 55, alignment: 'right' as const, margin: [0, 4, 0, 2] as any }] : [{ text: '', margin: [0, 16, 0, 0] }]),
              { canvas: [{ type: 'line', x1: 80, y1: 0, x2: 200, y2: 0, lineWidth: 0.5, lineColor: '#bbb' }] },
              { text: 'Authorised Signatory', fontSize: 6.5, bold: true, alignment: 'right' },
            ],
          },
        ]],
      },
      layout: 'noBorders',
    });

    // Generate PDF using smart auto-scaling system
    const { generateSmartPdf } = await import('@/lib/pdfConfig');
    const pdfBuffer = await generateSmartPdf(content, (pg: number, total: number) => ({
      columns: [
        { text: po.po_no, fontSize: 7, color: '#aaa', margin: [36, 0, 0, 0] },
        { text: `${CO.web}  |  ${CO.procurementEmail}`, fontSize: 7, color: '#aaa', alignment: 'center' },
        { text: `Page ${pg} of ${total}`, fontSize: 7, color: '#aaa', alignment: 'right', margin: [0, 0, 36, 0] },
      ],
    }));

    const headers: Record<string, string> = { 'Content-Type': 'application/pdf', 'Cache-Control': 'public, max-age=60' };
    if (download) headers['Content-Disposition'] = `attachment; filename="PO-${po.po_no}.pdf"`;
    else headers['Content-Disposition'] = 'inline';

    return new Response(pdfBuffer, { status: 200, headers });
  } catch (err: unknown) {
    console.error('[GET /api/accounts/purchase-orders/pdf]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'PDF generation failed' }, { status: 500 });
  }
}
