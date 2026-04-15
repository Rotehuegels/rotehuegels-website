import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCompanyCO } from '@/lib/company';
import { hrLine } from '@/lib/pdfConfig';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = 'force-dynamic';

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtN = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

function getFY(dateStr: string) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return m >= 4 ? `${String(y).slice(2)}-${String(y + 1).slice(2)}` : `${String(y - 1).slice(2)}-${String(y).slice(2)}`;
}

function amountInWords(amount: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const twoD = (n: number) => n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  const threeD = (n: number) => n < 100 ? twoD(n) : ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + twoD(n % 100) : '');
  const r = Math.floor(amount);
  const p = Math.round((amount - r) * 100);
  const parts: string[] = [];
  let rem = r;
  if (rem >= 10000000) { parts.push(twoD(Math.floor(rem / 10000000)) + ' Crore'); rem %= 10000000; }
  if (rem >= 100000) { parts.push(twoD(Math.floor(rem / 100000)) + ' Lakh'); rem %= 100000; }
  if (rem >= 1000) { parts.push(twoD(Math.floor(rem / 1000)) + ' Thousand'); rem %= 1000; }
  if (rem > 0) { parts.push(threeD(rem)); }
  const words = r === 0 ? 'Zero' : parts.join(' ');
  const paiseStr = p > 0 ? ` and ${twoD(p)} Paise` : '';
  return `Rupees ${words}${paiseStr} Only`;
}

function loadFont(name: string): Buffer {
  try { return fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'Roboto', name)); }
  catch { return fs.readFileSync(path.join(process.cwd(), 'node_modules', 'pdfmake', 'fonts', 'Roboto', name)); }
}

function getLogoDataUrl(): string | null {
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), 'public', 'assets', 'Logo2_black.png'));
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch { return null; }
}

function getSignatureDataUrl(): string | null {
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), 'private', 'signature.jpg'));
    return `data:image/jpeg;base64,${buf.toString('base64')}`;
  } catch { return null; }
}

// ── Build PDF ────────────────────────────────────────────────────────────────
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(_req.url);
  const uptoStage = url.searchParams.get('upto') ? parseInt(url.searchParams.get('upto')!) : null;
  const onlyStage = url.searchParams.get('stage') ? parseInt(url.searchParams.get('stage')!) : null;
  const download = url.searchParams.get('download') === '1';

  try {
    const CO = await getCompanyCO();
    const logoUrl = getLogoDataUrl();
    const sigUrl = getSignatureDataUrl();

    const [orderRes, stagesRes, paymentsRes] = await Promise.all([
      supabaseAdmin.from('orders').select('*').eq('id', id).single(),
      supabaseAdmin.from('order_payment_stages').select('*').eq('order_id', id).order('stage_number'),
      supabaseAdmin.from('order_payments').select('*').eq('order_id', id).order('payment_date'),
    ]);

    if (orderRes.error || !orderRes.data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderRes.data;
    const stages = stagesRes.data ?? [];
    const payments = paymentsRes.data ?? [];
    const adjustments = ((order as any).adjustments ?? []) as Array<{ description: string; amount: number }>;
    const totalPaid = payments.reduce((s: number, p: any) => s + (p.amount_received ?? 0), 0);
    const totalAdj = adjustments.reduce((s, a) => s + (a.amount ?? 0), 0);

    // Items
    const rawItems = (order as any).items as Array<Record<string, any>> | null;
    const isIntra = (order.igst_amount ?? 0) === 0 && (order.cgst_amount ?? 0) > 0;
    const gstRate = Number(order.gst_rate ?? 18);
    const halfRate = gstRate / 2;

    const items = Array.isArray(rawItems)
      ? rawItems.map(r => {
          const taxable = r.taxable_amount ?? r.base ?? 0;
          const gstAmt = r.gst_amount ?? 0;
          const halfGst = parseFloat((gstAmt / 2).toFixed(2));
          return {
            desc: r.name ?? r.description ?? '', qty: r.quantity != null ? `${r.quantity} ${r.unit ?? ''}`.trim() : '',
            hsn: r.hsn_code || r.sac_code || '', rate: r.rate, discount: r.discount,
            base: taxable, cgst: isIntra ? halfGst : 0, sgst: isIntra ? halfGst : 0,
            igst: isIntra ? 0 : gstAmt, total: r.total ?? (taxable + gstAmt),
          };
        })
      : [];

    // Stage filtering
    const isFiltered = uptoStage !== null || onlyStage !== null;
    const filteredStages = isFiltered
      ? stages.filter(s => uptoStage !== null ? s.stage_number <= uptoStage : s.stage_number === onlyStage)
      : stages;

    let base = order.base_value ?? 0, cgst = order.cgst_amount ?? 0, sgst = order.sgst_amount ?? 0, igst = order.igst_amount ?? 0, total = order.total_value_incl_gst;
    let tds = order.tds_applicable ? base * (order.tds_rate / 100) : 0;

    if (isFiltered && filteredStages.length > 0) {
      base = filteredStages.reduce((s, st) => s + (st.amount_due ?? 0), 0);
      const gstTotal = filteredStages.reduce((s, st) => s + (st.gst_on_stage ?? 0), 0);
      if (isIntra) { cgst = gstTotal / 2; sgst = gstTotal / 2; igst = 0; }
      else { cgst = 0; sgst = 0; igst = gstTotal; }
      total = base + gstTotal;
      tds = order.tds_applicable ? filteredStages.reduce((s, st) => s + (st.tds_amount ?? 0), 0) : 0;
    }

    const rawDate = (isFiltered ? (filteredStages[filteredStages.length - 1] as any)?.invoice_date : null) ?? order.invoice_date ?? null;
    const fy = getFY(rawDate ?? order.order_date);
    const invoiceNo = `RH/${fy}/${order.order_no}`;
    const invoiceDate = rawDate ? fmtDate(rawDate) : fmtDate(new Date().toISOString());
    const sacHsn = order.hsn_sac_code ?? (order.order_type === 'service' ? '9983' : '-');
    const placeOfSupply = order.place_of_supply ?? 'Tamil Nadu (33)';

    const balanceDue = Math.max(0, total - totalPaid - totalAdj);
    const upiAmountParam = balanceDue > 0 && balanceDue <= 100000 ? `&am=${balanceDue.toFixed(2)}` : '';
    const upiString = `upi://pay?pa=${CO.upi}&pn=${encodeURIComponent(CO.name)}${upiAmountParam}&cu=INR&tn=${encodeURIComponent('Invoice ' + invoiceNo)}`;
    const upiQr = await QRCode.toDataURL(upiString, { width: 90, margin: 1, color: { dark: '#111111', light: '#ffffff' } });

    // ── Build pdfmake doc ───────────────────────────────────────────────
    const content: any[] = [];
    const BG = '#f3f4f6';

    // Header
    content.push({
      columns: [
        {
          width: '*',
          stack: [
            ...(logoUrl ? [{ image: logoUrl, width: 110, margin: [0, 0, 0, 4] }] : []),
            { text: CO.name, fontSize: 11, bold: true, color: '#111' },
            { text: `${CO.addr1} ${CO.addr2}`, fontSize: 7, color: '#666', margin: [0, 2, 0, 0] },
            { text: `${CO.email}  |  ${CO.phone}  |  ${CO.web}`, fontSize: 7, color: '#888', margin: [0, 2, 0, 0] },
          ],
        },
        {
          width: 'auto', alignment: 'right',
          stack: [
            { table: { body: [[{ text: 'TAX INVOICE', fontSize: 10, bold: true, alignment: 'center' }]] },
              layout: { hLineWidth: () => 1.5, vLineWidth: () => 1.5, hLineColor: () => '#111', vLineColor: () => '#111', paddingLeft: () => 8, paddingRight: () => 8, paddingTop: () => 3, paddingBottom: () => 3 },
              margin: [0, 0, 0, 4] },
            { text: `GSTIN: ${CO.gstin}`, fontSize: 7, color: '#555', alignment: 'right' },
            { text: `PAN: ${CO.pan}`, fontSize: 7, color: '#555', alignment: 'right' },
            { text: `CIN: ${CO.cin}`, fontSize: 7, color: '#555', alignment: 'right' },
            { text: `TAN: ${CO.tan}`, fontSize: 7, color: '#555', alignment: 'right' },
          ],
        },
      ],
    });
    content.push({ ...hrLine(2, '#111'), margin: [0, 4, 0, 6] });

    // Bill To + Invoice Details — full-width two-column table
    const invDetailRows: [string, string][] = [
      ['Invoice No.', invoiceNo],
      ['Invoice Date', invoiceDate],
      ['Order Date', fmtDate(order.order_date)],
      ...(order.delivery_date ? [['Delivery Date', fmtDate(order.delivery_date)] as [string, string]] : []),
      ['Order Ref.', order.order_no],
      ['Place of Supply', placeOfSupply],
      ['Supply Type', isIntra ? 'Intra-State' : 'Inter-State'],
    ];

    content.push({
      table: {
        widths: ['*', '*'],
        body: [[
          {
            stack: [
              { text: 'BILL TO / SHIP TO', fontSize: 6.5, bold: true, color: '#888', margin: [0, 0, 0, 3] },
              { text: order.client_name, fontSize: 10, bold: true, color: '#111' },
              ...(order.client_contact ? [{ text: order.client_contact, fontSize: 7, color: '#555' }] : []),
              ...(order.client_address ? [{ text: order.client_address, fontSize: 7, color: '#555', margin: [0, 1, 0, 0] }] : []),
              ...(order.client_gstin ? [{ text: `GSTIN: ${order.client_gstin}`, fontSize: 7, color: '#555', margin: [0, 2, 0, 0] }] : []),
              ...(order.client_pan ? [{ text: `PAN: ${order.client_pan}`, fontSize: 7, color: '#555' }] : []),
            ],
          },
          {
            table: {
              widths: [70, '*'],
              body: invDetailRows.map(([l, v]) => [
                { text: l, fontSize: 7, color: '#888', bold: true, border: [false, false, false, false] },
                { text: v, fontSize: 7, color: '#111', bold: l === 'Invoice No.', border: [false, false, false, false] },
              ]),
            },
            layout: { paddingLeft: () => 2, paddingRight: () => 2, paddingTop: () => 1, paddingBottom: () => 1, hLineWidth: () => 0, vLineWidth: () => 0 },
          },
        ]],
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 8],
    });

    // Items table
    const hasRate = items.some(i => i.rate != null);
    const headerRow: any[] = [
      { text: '#', bold: true, fillColor: '#1a1a1a', color: 'white', alignment: 'center' },
      { text: 'Description', bold: true, fillColor: '#1a1a1a', color: 'white' },
    ];
    if (items.length > 0) headerRow.push({ text: 'Qty', bold: true, fillColor: '#1a1a1a', color: 'white', alignment: 'center' });
    headerRow.push({ text: 'HSN/SAC', bold: true, fillColor: '#1a1a1a', color: 'white', alignment: 'center' });
    if (hasRate) {
      headerRow.push({ text: 'Rate', bold: true, fillColor: '#1a1a1a', color: 'white', alignment: 'right' });
      headerRow.push({ text: 'Disc.', bold: true, fillColor: '#1a1a1a', color: 'white', alignment: 'center' });
    }
    headerRow.push({ text: 'Taxable', bold: true, fillColor: '#1a1a1a', color: 'white', alignment: 'right' });
    if (isIntra) {
      headerRow.push({ text: `CGST ${halfRate}%`, bold: true, fillColor: '#1a1a1a', color: 'white', alignment: 'right' });
      headerRow.push({ text: `SGST ${halfRate}%`, bold: true, fillColor: '#1a1a1a', color: 'white', alignment: 'right' });
    } else {
      headerRow.push({ text: `IGST ${gstRate}%`, bold: true, fillColor: '#1a1a1a', color: 'white', alignment: 'right' });
    }
    headerRow.push({ text: 'Total', bold: true, fillColor: '#1a1a1a', color: 'white', alignment: 'right' });

    const dataRows: any[][] = items.length > 0
      ? items.map((item, idx) => {
          const row: any[] = [
            { text: String(idx + 1), alignment: 'center' },
            { text: item.desc, bold: true },
            { text: item.qty || '-', alignment: 'center' },
            { text: item.hsn, alignment: 'center', fontSize: 7.5 },
          ];
          if (hasRate) {
            row.push({ text: item.rate != null ? fmtN(item.rate) : '-', alignment: 'right' });
            row.push({ text: item.discount ?? '-', alignment: 'center' });
          }
          row.push({ text: fmtN(item.base), alignment: 'right' });
          if (isIntra) {
            row.push({ text: fmtN(item.cgst), alignment: 'right' });
            row.push({ text: fmtN(item.sgst), alignment: 'right' });
          } else {
            row.push({ text: fmtN(item.igst), alignment: 'right' });
          }
          row.push({ text: fmtN(item.total), alignment: 'right', bold: true });
          return row;
        })
      : [(() => {
          const row: any[] = [
            { text: '1', alignment: 'center' },
            { text: order.description, bold: true },
            { text: sacHsn, alignment: 'center', fontSize: 7.5 },
          ];
          row.push({ text: fmtN(base), alignment: 'right' });
          if (isIntra) {
            row.push({ text: fmtN(cgst), alignment: 'right' });
            row.push({ text: fmtN(sgst), alignment: 'right' });
          } else {
            row.push({ text: fmtN(igst), alignment: 'right' });
          }
          row.push({ text: fmtN(total), alignment: 'right', bold: true });
          return row;
        })()];

    // Total row
    const totalRow: any[] = [];
    const colsBefore = (items.length > 0 ? 4 : 3) + (hasRate ? 2 : 0);
    totalRow.push({ text: 'TOTAL', colSpan: colsBefore, alignment: 'right', bold: true, fillColor: BG });
    for (let i = 1; i < colsBefore; i++) totalRow.push({});
    totalRow.push({ text: fmtN(base), alignment: 'right', bold: true, fillColor: BG });
    if (isIntra) {
      totalRow.push({ text: fmtN(cgst), alignment: 'right', bold: true, fillColor: BG });
      totalRow.push({ text: fmtN(sgst), alignment: 'right', bold: true, fillColor: BG });
    } else {
      totalRow.push({ text: fmtN(igst), alignment: 'right', bold: true, fillColor: BG });
    }
    totalRow.push({ text: fmtN(total), alignment: 'right', bold: true, fillColor: BG, fontSize: 10 });

    // Column widths
    const widths: any[] = [18, '*'];
    if (items.length > 0) widths.push(35);
    widths.push(45);
    if (hasRate) { widths.push(55); widths.push(30); }
    widths.push(65);
    if (isIntra) { widths.push(55); widths.push(55); } else { widths.push(60); }
    widths.push(65);

    content.push({
      table: { headerRows: 1, widths, body: [headerRow, ...dataRows, totalRow], dontBreakRows: true },
      layout: {
        hLineWidth: () => 0.5, vLineWidth: () => 0.5,
        hLineColor: (i: number) => i <= 1 ? '#555' : '#ddd',
        vLineColor: () => '#ddd',
        paddingLeft: () => 4, paddingRight: () => 4, paddingTop: () => 3, paddingBottom: () => 3,
      },
      margin: [0, 0, 0, 6],
    });

    // Amount in words — no border, just text
    content.push({
      stack: [
        { text: 'AMOUNT IN WORDS', fontSize: 6.5, bold: true, color: '#888' },
        { text: amountInWords(total), fontSize: 9, bold: true, color: '#111', margin: [0, 2, 0, 0] },
        ...(order.tds_applicable ? [{ text: `* Subject to TDS @ ${order.tds_rate}%. Net receivable: ${fmtN(total - tds)}`, fontSize: 7, color: '#777', margin: [0, 2, 0, 0] }] : []),
      ],
      margin: [0, 4, 0, 6],
    });

    // Payment summary (if any) — no borders, clean rows
    if (totalPaid > 0 || totalAdj > 0) {
      const netDue = total - totalPaid - totalAdj;
      const pmtRows: any[][] = [
        [{ text: 'Invoice Total', bold: true, fontSize: 7.5 }, { text: fmtN(total), alignment: 'right', bold: true, fontSize: 7.5 }],
      ];
      for (const p of payments) {
        pmtRows.push([
          { text: `Less: Payment (${fmtDate(p.payment_date)})${p.payment_mode ? ' - ' + p.payment_mode : ''}`, color: '#555', fontSize: 7 },
          { text: `-${fmtN(p.amount_received)}`, alignment: 'right', color: '#16a34a', fontSize: 7 },
        ]);
      }
      for (const a of adjustments) {
        pmtRows.push([
          { text: `Less: ${a.description}`, color: '#555', fontSize: 7 },
          { text: `-${fmtN(a.amount)}`, alignment: 'right', color: '#16a34a', fontSize: 7 },
        ]);
      }
      pmtRows.push([
        { text: 'Balance Due', bold: true, fontSize: 9 },
        { text: fmtN(netDue), alignment: 'right', bold: true, fontSize: 9, color: netDue > 0 ? '#dc2626' : '#16a34a' },
      ]);
      content.push({
        table: { widths: ['*', 100], body: pmtRows },
        layout: 'noBorders',
        margin: [0, 0, 0, 6],
      });
    }

    // Bank details + Declaration/Signature — 3-column: bank | QR | declaration+sig
    content.push({
      table: {
        widths: ['*', 55, '*'],
        body: [[
          // Bank details
          {
            stack: [
              { text: 'BANK DETAILS', fontSize: 6.5, bold: true, color: '#b45309', margin: [0, 0, 0, 3] },
              { text: `Name: ${CO.name}`, fontSize: 6.5, color: '#555' },
              { text: `A/c No: ${CO.acc}`, fontSize: 6.5, bold: true },
              { text: `IFSC: ${CO.ifsc}`, fontSize: 6.5, color: '#555' },
              { text: `Bank: ${CO.bank}`, fontSize: 6.5, color: '#555' },
              { text: `UPI: ${CO.upi}`, fontSize: 6.5, color: '#555' },
            ],
          },
          // QR code (compact)
          { image: upiQr, fit: [50, 50], alignment: 'center', margin: [0, 10, 0, 0] },
          // Declaration + Signature
          {
            stack: [
              { text: 'DECLARATION', fontSize: 6.5, bold: true, color: '#b45309', margin: [0, 0, 0, 2] },
              { text: 'We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct.', fontSize: 6, color: '#666', lineHeight: 1.3 },
              { text: '', margin: [0, 4, 0, 0] },
              { text: `For ${CO.name}`, fontSize: 6.5, bold: true, color: '#444', alignment: 'right' },
              ...(sigUrl ? [{ image: sigUrl, width: 50, alignment: 'right' as const, margin: [0, 3, 0, 1] as any }] : [{ text: '', margin: [0, 12, 0, 0] }]),
              { text: 'Sivakumar Shanmugam', fontSize: 6.5, bold: true, alignment: 'right' },
              { text: 'CEO, Roteh\u00fcgels | Authorised Signatory', fontSize: 6, color: '#888', alignment: 'right' },
            ],
          },
        ]],
      },
      layout: 'noBorders',
    });

    // Generate PDF using smart auto-scaling system
    const { generateSmartPdf } = await import('@/lib/pdfConfig');
    const invoiceFooter = (currentPage: number, pageCount: number) => ({
      columns: [
        { text: invoiceNo, fontSize: 6, color: '#aaa', margin: [32, 0, 0, 0] },
        { text: `Computer-generated invoice  |  ${CO.web}  |  ${CO.phone}`, fontSize: 6, color: '#aaa', alignment: 'center' },
        { text: `Page ${currentPage} of ${pageCount}`, fontSize: 6, color: '#aaa', alignment: 'right', margin: [0, 0, 32, 0] },
      ],
    });
    const pdfBuffer = await generateSmartPdf(content, invoiceFooter);

    const headers: Record<string, string> = {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'public, max-age=60',
    };
    if (download) {
      headers['Content-Disposition'] = `attachment; filename="Invoice-${invoiceNo.replace(/\//g, '-')}.pdf"`;
    } else {
      headers['Content-Disposition'] = 'inline';
    }

    return new Response(pdfBuffer, { status: 200, headers });
  } catch (err: unknown) {
    console.error('[GET /api/accounts/orders/invoice/pdf]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'PDF generation failed' }, { status: 500 });
  }
}
