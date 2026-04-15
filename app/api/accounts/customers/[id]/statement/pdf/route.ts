import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCompanyCO } from '@/lib/company';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = 'force-dynamic';

const fmtN = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

function loadFont(name: string): Buffer {
  try { return fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'Roboto', name)); }
  catch { return fs.readFileSync(path.join(process.cwd(), 'node_modules', 'pdfmake', 'fonts', 'Roboto', name)); }
}
function getLogoDataUrl(): string | null {
  try { return `data:image/png;base64,${fs.readFileSync(path.join(process.cwd(), 'public', 'assets', 'Logo2_black.png')).toString('base64')}`; } catch { return null; }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(_req.url);
  const selectedFY = url.searchParams.get('fy') ?? 'all';
  const download = url.searchParams.get('download') === '1';

  try {
    const CO = await getCompanyCO();
    const logoUrl = getLogoDataUrl();
    const upiQr = await QRCode.toDataURL(`upi://pay?pa=${CO.upi}&pn=${encodeURIComponent(CO.name)}&cu=INR`, { width: 80, margin: 1, color: { dark: '#111', light: '#fff' } });

    const { data: customer, error: custErr } = await supabaseAdmin.from('customers').select('*').eq('id', id).single();
    if (custErr || !customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    const { data: orders } = await supabaseAdmin.from('orders').select('*').eq('customer_id', id).neq('status', 'cancelled').neq('order_category', 'reimbursement').order('invoice_date', { ascending: true, nullsFirst: false });
    const orderIds = (orders ?? []).map(o => o.id);

    const [{ data: allPayments }] = await Promise.all([
      supabaseAdmin.from('order_payments').select('order_id, amount_received, tds_deducted').in('order_id', orderIds.length ? orderIds : ['00000000-0000-0000-0000-000000000000']),
    ]);

    const paymentMap: Record<string, number> = {};
    const tdsMap: Record<string, number> = {};
    for (const p of allPayments ?? []) {
      paymentMap[p.order_id] = (paymentMap[p.order_id] ?? 0) + (p.amount_received ?? 0);
      tdsMap[p.order_id] = (tdsMap[p.order_id] ?? 0) + (p.tds_deducted ?? 0);
    }

    // Build SOA rows
    type Row = { order_no: string; desc: string; inv_date: string | null; order_date: string; base: number; gst: number; total: number; received: number; tds: number; pending: number };
    const rows: Row[] = (orders ?? []).filter(o => (o.total_value_incl_gst ?? 0) > 0).map(o => {
      const received = paymentMap[o.id] ?? 0;
      const tds = tdsMap[o.id] ?? 0;
      const gst = (o.cgst_amount ?? 0) + (o.sgst_amount ?? 0) + (o.igst_amount ?? 0);
      return {
        order_no: o.order_no, desc: o.description ?? '', inv_date: o.invoice_date, order_date: o.order_date,
        base: o.base_value ?? 0, gst, total: o.total_value_incl_gst ?? 0, received, tds, pending: (o.total_value_incl_gst ?? 0) - received,
      };
    });

    // FY filter
    const filtered = selectedFY === 'all' ? rows : rows.filter(r => {
      const d = new Date(r.inv_date ?? r.order_date);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const fy = m >= 4 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`;
      return fy === selectedFY;
    });

    const totalInvoiced = filtered.reduce((s, r) => s + r.total, 0);
    const totalReceived = filtered.reduce((s, r) => s + r.received, 0);
    const totalTds = filtered.reduce((s, r) => s + r.tds, 0);
    const totalPending = filtered.reduce((s, r) => s + r.pending, 0);

    const billing = customer.billing_address as Record<string, string> | null;
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const AMBER = '#b45309';
    const BG = '#f3f4f6';
    const content: any[] = [];

    // Header
    content.push({
      columns: [
        { width: '*', stack: [
          ...(logoUrl ? [{ image: logoUrl, width: 100, margin: [0, 0, 0, 3] }] : []),
          { text: CO.name, fontSize: 9, bold: true },
          { text: `${CO.addr1} ${CO.addr2}`, fontSize: 7, color: '#666', margin: [0, 2, 0, 0] },
          { text: `GSTIN: ${CO.gstin}  |  PAN: ${CO.pan}`, fontSize: 7, color: '#666', margin: [0, 1, 0, 0] },
        ]},
        { width: 'auto', alignment: 'right', stack: [
          { text: 'STATEMENT OF ACCOUNT', fontSize: 12, bold: true, color: AMBER },
          { text: `As on ${today}`, fontSize: 8, color: '#555', margin: [0, 2, 0, 0] },
          { text: selectedFY === 'all' ? 'All Periods' : `FY ${selectedFY}`, fontSize: 8, color: '#555' },
        ]},
      ],
    });
    content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 523, y2: 0, lineWidth: 2, lineColor: '#111' }], margin: [0, 4, 0, 6] });

    // Customer details
    content.push({
      columns: [
        { width: '*', stack: [
          { text: 'CUSTOMER', fontSize: 7, bold: true, color: '#888', margin: [0, 0, 0, 3] },
          { text: customer.name, fontSize: 11, bold: true },
          ...(customer.gstin ? [{ text: `GSTIN: ${customer.gstin}`, fontSize: 8, margin: [0, 2, 0, 0] }] : []),
          ...(billing ? [{ text: `${billing.line1 ?? ''}${billing.line2 ? ', ' + billing.line2 : ''}, ${billing.city ?? ''}, ${billing.state ?? ''}`, fontSize: 8, color: '#555', margin: [0, 2, 0, 0] }] : []),
        ]},
        { width: 180, table: { widths: ['*', 80], body: [
          [{ text: 'Total Invoiced', fontSize: 8, color: '#666' }, { text: fmtN(totalInvoiced), fontSize: 8, alignment: 'right', bold: true }],
          [{ text: 'Received', fontSize: 8, color: '#666' }, { text: fmtN(totalReceived), fontSize: 8, alignment: 'right', color: '#16a34a' }],
          [{ text: 'TDS Deducted', fontSize: 8, color: '#666' }, { text: fmtN(totalTds), fontSize: 8, alignment: 'right', color: '#16a34a' }],
          [{ text: 'Outstanding', fontSize: 9, bold: true }, { text: fmtN(totalPending), fontSize: 9, alignment: 'right', bold: true, color: totalPending > 0 ? '#dc2626' : '#16a34a' }],
        ]}, layout: 'noBorders' },
      ],
      margin: [0, 0, 0, 10],
    });

    // Transaction table
    const headerRow = [
      { text: '#', bold: true, fillColor: '#1a1a1a', color: 'white', alignment: 'center' },
      { text: 'Invoice', bold: true, fillColor: '#1a1a1a', color: 'white' },
      { text: 'Date', bold: true, fillColor: '#1a1a1a', color: 'white' },
      { text: 'Description', bold: true, fillColor: '#1a1a1a', color: 'white' },
      { text: 'Invoiced', bold: true, fillColor: '#1a1a1a', color: 'white', alignment: 'right' },
      { text: 'Received', bold: true, fillColor: '#1a1a1a', color: 'white', alignment: 'right' },
      { text: 'Outstanding', bold: true, fillColor: '#1a1a1a', color: 'white', alignment: 'right' },
    ];

    let runningBalance = 0;
    const dataRows = filtered.map((r, i) => {
      runningBalance += r.pending;
      return [
        { text: String(i + 1), alignment: 'center' },
        { text: r.order_no, fontSize: 7.5, bold: true },
        { text: fmtDate(r.inv_date ?? r.order_date), fontSize: 7.5 },
        { text: r.desc, fontSize: 7.5, color: '#555' },
        { text: fmtN(r.total), alignment: 'right', fontSize: 7.5 },
        { text: r.received > 0 ? fmtN(r.received) : '-', alignment: 'right', fontSize: 7.5, color: '#16a34a' },
        { text: fmtN(r.pending), alignment: 'right', fontSize: 7.5, bold: true, color: r.pending > 0 ? '#dc2626' : '#16a34a' },
      ];
    });

    // Total row
    const totalDataRow = [
      { text: '', colSpan: 3 }, {}, {},
      { text: 'TOTAL', alignment: 'right', bold: true, fillColor: BG },
      { text: fmtN(totalInvoiced), alignment: 'right', bold: true, fillColor: BG },
      { text: fmtN(totalReceived), alignment: 'right', bold: true, color: '#16a34a', fillColor: BG },
      { text: fmtN(totalPending), alignment: 'right', bold: true, color: totalPending > 0 ? '#dc2626' : '#16a34a', fillColor: BG, fontSize: 10 },
    ];

    content.push({
      table: { headerRows: 1, widths: [18, 50, 55, '*', 65, 65, 65], body: [headerRow, ...dataRows, totalDataRow], dontBreakRows: true },
      layout: { hLineWidth: (i: number) => i <= 1 ? 1.5 : 0.5, vLineWidth: () => 0.5, hLineColor: (i: number) => i <= 1 ? '#555' : '#ddd', vLineColor: () => '#ddd', paddingLeft: () => 4, paddingRight: () => 4, paddingTop: () => 3, paddingBottom: () => 3 },
      margin: [0, 0, 0, 8],
    });

    // Bank details + UPI QR
    content.push({
      columns: [
        { width: '*', stack: [
          { text: 'BANK DETAILS FOR PAYMENT', fontSize: 7, bold: true, color: '#888', margin: [0, 0, 0, 3] },
          { table: { body: [
            [{ text: 'Name', fontSize: 7.5, color: '#888' }, { text: CO.name, fontSize: 7.5 }],
            [{ text: 'A/c No.', fontSize: 7.5, color: '#888' }, { text: CO.acc, fontSize: 7.5, bold: true }],
            [{ text: 'IFSC', fontSize: 7.5, color: '#888' }, { text: CO.ifsc, fontSize: 7.5 }],
            [{ text: 'Bank', fontSize: 7.5, color: '#888' }, { text: CO.bank, fontSize: 7.5 }],
            [{ text: 'UPI', fontSize: 7.5, color: '#888' }, { text: CO.upi, fontSize: 7.5 }],
          ]}, layout: 'noBorders' },
        ]},
        { width: 90, alignment: 'center', stack: [
          { image: upiQr, fit: [70, 70] },
          { text: 'Scan to Pay (UPI)', fontSize: 6.5, color: '#888', alignment: 'center', margin: [0, 2, 0, 0] },
        ]},
      ],
      margin: [0, 0, 0, 6],
    });

    // Footer
    content.push({ text: `This is a computer-generated statement.  |  ${CO.web}  |  ${CO.email}  |  ${CO.phone}`, fontSize: 7, color: '#aaa', alignment: 'center', margin: [0, 4, 0, 0] });

    // Generate PDF
    const pdfmake = require('pdfmake');
    for (const f of ['Roboto-Regular.ttf', 'Roboto-Medium.ttf', 'Roboto-Italic.ttf', 'Roboto-MediumItalic.ttf']) pdfmake.virtualfs.writeFileSync(f, loadFont(f));
    pdfmake.fonts = { Roboto: { normal: 'Roboto-Regular.ttf', bold: 'Roboto-Medium.ttf', italics: 'Roboto-Italic.ttf', bolditalics: 'Roboto-MediumItalic.ttf' } };

    const pdfBuffer: Buffer = await pdfmake.createPdf({
      pageSize: 'A4', pageMargins: [32, 22, 32, 40],
      defaultStyle: { fontSize: 8, lineHeight: 1.2 },
      content,
      footer: (pg: number, total: number) => ({ columns: [
        { text: `Statement for ${customer.name}`, fontSize: 7, color: '#aaa', margin: [36, 0, 0, 0] },
        { text: today, fontSize: 7, color: '#aaa', alignment: 'center' },
        { text: `Page ${pg} of ${total}`, fontSize: 7, color: '#aaa', alignment: 'right', margin: [0, 0, 36, 0] },
      ]}),
    }).getBuffer();

    const headers: Record<string, string> = { 'Content-Type': 'application/pdf', 'Cache-Control': 'public, max-age=60' };
    if (download) headers['Content-Disposition'] = `attachment; filename="Statement-${customer.customer_id ?? customer.name}.pdf"`;
    else headers['Content-Disposition'] = 'inline';
    return new Response(pdfBuffer, { status: 200, headers });
  } catch (err: unknown) {
    console.error('[GET /api/accounts/customers/statement/pdf]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'PDF generation failed' }, { status: 500 });
  }
}
