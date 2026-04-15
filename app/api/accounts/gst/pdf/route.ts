import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCompanyCO } from '@/lib/company';
import fs from 'fs';
import path from 'path';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = 'force-dynamic';

const fmtN = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

function loadFont(name: string): Buffer {
  try { return fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'Roboto', name)); }
  catch { return fs.readFileSync(path.join(process.cwd(), 'node_modules', 'pdfmake', 'fonts', 'Roboto', name)); }
}
function getLogoDataUrl(): string | null {
  try { return `data:image/png;base64,${fs.readFileSync(path.join(process.cwd(), 'public', 'assets', 'Logo2_black.png')).toString('base64')}`; } catch { return null; }
}

function parseFY(fy: string) {
  const [startYear] = fy.split('-').map(Number);
  const endYear = startYear + 1;
  return { from: `${startYear}-04-01`, to: `${endYear}-03-31`, full: `1 April ${startYear} to 31 March ${endYear}`, label: `FY ${startYear}-${endYear}`, startYear, endYear };
}

function fyMonths(startYear: number, endYear: number) {
  const months: { year: number; month: number }[] = [];
  for (let m = 4; m <= 12; m++) months.push({ year: startYear, month: m });
  for (let m = 1; m <= 3; m++) months.push({ year: endYear, month: m });
  return months;
}

export async function GET(_req: Request) {
  const url = new URL(_req.url);
  const fy = url.searchParams.get('fy') ?? '2025-26';
  const download = url.searchParams.get('download') === '1';

  try {
    const CO = await getCompanyCO();
    const logoUrl = getLogoDataUrl();
    const { from, to, full, label, startYear, endYear } = parseFY(fy);

    const [ordersRes, expensesRes] = await Promise.all([
      supabaseAdmin.from('orders').select('order_date, cgst_amount, sgst_amount, igst_amount, status').gte('order_date', from).lte('order_date', to).neq('status', 'cancelled'),
      supabaseAdmin.from('expenses').select('expense_date, gst_input_credit').gte('expense_date', from).lte('expense_date', to),
    ]);

    const orders = ordersRes.data ?? [];
    const expenses = expensesRes.data ?? [];

    const outputByMonth: Record<string, { cgst: number; sgst: number; igst: number }> = {};
    const itcByMonth: Record<string, number> = {};
    for (const o of orders) { const k = o.order_date.slice(0, 7); if (!outputByMonth[k]) outputByMonth[k] = { cgst: 0, sgst: 0, igst: 0 }; outputByMonth[k].cgst += o.cgst_amount ?? 0; outputByMonth[k].sgst += o.sgst_amount ?? 0; outputByMonth[k].igst += o.igst_amount ?? 0; }
    for (const e of expenses) { const k = e.expense_date.slice(0, 7); itcByMonth[k] = (itcByMonth[k] ?? 0) + (e.gst_input_credit ?? 0); }

    const totalCGST = orders.reduce((s, o) => s + (o.cgst_amount ?? 0), 0);
    const totalSGST = orders.reduce((s, o) => s + (o.sgst_amount ?? 0), 0);
    const totalIGST = orders.reduce((s, o) => s + (o.igst_amount ?? 0), 0);
    const totalOutput = totalCGST + totalSGST + totalIGST;
    const totalITC = expenses.reduce((s, e) => s + (e.gst_input_credit ?? 0), 0);
    const netPayable = totalOutput - totalITC;
    const months = fyMonths(startYear, endYear);
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
          { text: `CIN: ${CO.cin}  |  GSTIN: ${CO.gstin}  |  PAN: ${CO.pan}`, fontSize: 7, color: '#666', margin: [0, 2, 0, 0] },
        ]},
        { width: 'auto', alignment: 'right', stack: [
          { text: 'GST SUMMARY REPORT', fontSize: 12, bold: true, color: AMBER },
          { text: label, fontSize: 9, color: '#555', margin: [0, 2, 0, 0] },
        ]},
      ],
    });
    content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 523, y2: 0, lineWidth: 2, lineColor: '#111' }], margin: [0, 4, 0, 4] });
    content.push({ text: `For the period ${full}  |  GSTIN: ${CO.gstin}  |  All amounts in INR`, fontSize: 7.5, color: '#666', margin: [0, 0, 0, 8] });

    // Summary boxes (as table)
    content.push({
      table: {
        widths: ['*', '*', '*'],
        body: [[
          { stack: [
            { text: 'OUTPUT GST (LIABILITY)', fontSize: 7, bold: true, color: '#666' },
            { text: 'Collected from customers', fontSize: 7, color: '#888', margin: [0, 1, 0, 3] },
            { text: fmtN(totalOutput), fontSize: 14, bold: true, color: AMBER },
            { text: `CGST: ${fmtN(totalCGST)}  |  SGST: ${fmtN(totalSGST)}${totalIGST > 0 ? '  |  IGST: ' + fmtN(totalIGST) : ''}`, fontSize: 7, color: '#666', margin: [0, 3, 0, 0] },
          ]},
          { stack: [
            { text: 'INPUT TAX CREDIT (ITC)', fontSize: 7, bold: true, color: '#666' },
            { text: 'GST paid on purchases', fontSize: 7, color: '#888', margin: [0, 1, 0, 3] },
            { text: fmtN(totalITC), fontSize: 14, bold: true, color: '#16a34a' },
            { text: 'Offset against output liability', fontSize: 7, color: '#666', margin: [0, 3, 0, 0] },
          ]},
          { stack: [
            { text: 'NET GST PAYABLE', fontSize: 7, bold: true, color: '#666' },
            { text: 'Output GST - ITC', fontSize: 7, color: '#888', margin: [0, 1, 0, 3] },
            { text: fmtN(Math.abs(netPayable)), fontSize: 14, bold: true, color: netPayable > 0 ? '#dc2626' : '#16a34a' },
            { text: netPayable > 0 ? 'Payable to government' : 'ITC surplus / carry forward', fontSize: 7, color: netPayable > 0 ? AMBER : '#16a34a', margin: [0, 3, 0, 0] },
          ]},
        ]],
      },
      layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#ddd', vLineColor: () => '#ddd', paddingLeft: () => 10, paddingRight: () => 10, paddingTop: () => 8, paddingBottom: () => 8 },
      margin: [0, 0, 0, 10],
    });

    // Monthly breakdown table
    content.push({ text: 'Monthly Breakdown', fontSize: 10, bold: true, color: AMBER, margin: [0, 0, 0, 2], decoration: 'underline', decorationColor: '#fde68a' });
    content.push({ text: 'Output GST by order date  |  ITC by expense date', fontSize: 7, color: '#888', margin: [0, 0, 0, 4] });

    const monthHeader = [
      { text: 'Month', bold: true, fillColor: '#1a1a1a', color: 'white' },
      { text: 'CGST', bold: true, fillColor: '#1a1a1a', color: 'white', alignment: 'right' },
      { text: 'SGST', bold: true, fillColor: '#1a1a1a', color: 'white', alignment: 'right' },
      { text: 'IGST', bold: true, fillColor: '#1a1a1a', color: 'white', alignment: 'right' },
      { text: 'Total Output', bold: true, fillColor: '#1a1a1a', color: 'white', alignment: 'right' },
      { text: 'ITC', bold: true, fillColor: '#1a1a1a', color: 'white', alignment: 'right' },
      { text: 'Net Payable', bold: true, fillColor: '#1a1a1a', color: 'white', alignment: 'right' },
    ];

    const monthRows = months.map(({ year, month }) => {
      const key = `${year}-${String(month).padStart(2, '0')}`;
      const out = outputByMonth[key] ?? { cgst: 0, sgst: 0, igst: 0 };
      const itc = itcByMonth[key] ?? 0;
      const totalOut = out.cgst + out.sgst + out.igst;
      const net = totalOut - itc;
      const hasActivity = totalOut > 0 || itc > 0;
      const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

      return [
        { text: monthLabel, bold: hasActivity },
        { text: out.cgst > 0 ? fmtN(out.cgst) : '-', alignment: 'right', color: hasActivity ? '#374151' : '#aaa' },
        { text: out.sgst > 0 ? fmtN(out.sgst) : '-', alignment: 'right', color: hasActivity ? '#374151' : '#aaa' },
        { text: out.igst > 0 ? fmtN(out.igst) : '-', alignment: 'right', color: hasActivity ? '#374151' : '#aaa' },
        { text: totalOut > 0 ? fmtN(totalOut) : '-', alignment: 'right', bold: true, color: hasActivity ? AMBER : '#aaa' },
        { text: itc > 0 ? fmtN(itc) : '-', alignment: 'right', color: hasActivity ? '#16a34a' : '#aaa' },
        { text: !hasActivity ? '-' : net > 0 ? fmtN(net) : net < 0 ? `(${fmtN(Math.abs(net))})` : '0', alignment: 'right', bold: true, color: !hasActivity ? '#aaa' : net > 0 ? '#dc2626' : net < 0 ? '#16a34a' : '#666' },
      ];
    });

    // Totals row
    const totalRow = [
      { text: 'TOTAL', bold: true, fillColor: BG },
      { text: fmtN(totalCGST), alignment: 'right', bold: true, fillColor: BG },
      { text: fmtN(totalSGST), alignment: 'right', bold: true, fillColor: BG },
      { text: totalIGST > 0 ? fmtN(totalIGST) : '-', alignment: 'right', bold: true, fillColor: BG },
      { text: fmtN(totalOutput), alignment: 'right', bold: true, color: AMBER, fillColor: BG },
      { text: fmtN(totalITC), alignment: 'right', bold: true, color: '#16a34a', fillColor: BG },
      { text: netPayable > 0 ? fmtN(netPayable) : `(${fmtN(Math.abs(netPayable))})`, alignment: 'right', bold: true, color: netPayable > 0 ? '#dc2626' : '#16a34a', fillColor: BG },
    ];

    content.push({
      table: { headerRows: 1, widths: [55, '*', '*', '*', '*', '*', '*'], body: [monthHeader, ...monthRows, totalRow] },
      layout: { hLineWidth: (i: number, _n: any, node: any) => i === 0 || i === 1 || i === node.table.body.length ? 1.5 : 0.5, vLineWidth: () => 0.5, hLineColor: (i: number) => i <= 1 ? '#555' : '#ddd', vLineColor: () => '#ddd', paddingLeft: () => 6, paddingRight: () => 6, paddingTop: () => 4, paddingBottom: () => 4 },
      margin: [0, 0, 0, 8],
    });

    // Footer
    content.push({ text: `Generated on ${today}  |  ${CO.name}  |  Internal management report. Not audited.`, fontSize: 7, color: '#aaa', alignment: 'center', margin: [0, 6, 0, 0] });

    // Generate PDF
    const pdfmake = require('pdfmake');
    for (const f of ['Roboto-Regular.ttf', 'Roboto-Medium.ttf', 'Roboto-Italic.ttf', 'Roboto-MediumItalic.ttf']) pdfmake.virtualfs.writeFileSync(f, loadFont(f));
    pdfmake.fonts = { Roboto: { normal: 'Roboto-Regular.ttf', bold: 'Roboto-Medium.ttf', italics: 'Roboto-Italic.ttf', bolditalics: 'Roboto-MediumItalic.ttf' } };

    const pdfBuffer: Buffer = await pdfmake.createPdf({
      pageSize: 'A4', pageMargins: [36, 25, 36, 35],
      defaultStyle: { fontSize: 8.5, lineHeight: 1.25 },
      content,
      footer: (pg: number, total: number) => ({ columns: [
        { text: `GSTIN: ${CO.gstin}`, fontSize: 7, color: '#aaa', margin: [36, 0, 0, 0] },
        { text: label, fontSize: 7, color: '#aaa', alignment: 'center' },
        { text: `Page ${pg} of ${total}`, fontSize: 7, color: '#aaa', alignment: 'right', margin: [0, 0, 36, 0] },
      ]}),
    }).getBuffer();

    const headers: Record<string, string> = { 'Content-Type': 'application/pdf', 'Cache-Control': 'public, max-age=60' };
    if (download) headers['Content-Disposition'] = `attachment; filename="GST-Report-${fy}.pdf"`;
    else headers['Content-Disposition'] = 'inline';
    return new Response(pdfBuffer, { status: 200, headers });
  } catch (err: unknown) {
    console.error('[GET /api/accounts/gst/pdf]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'PDF generation failed' }, { status: 500 });
  }
}
