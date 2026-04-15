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
  return { from: `${startYear}-04-01`, to: `${startYear + 1}-03-31`, label: `FY ${startYear}-${startYear + 1}`, full: `1 April ${startYear} to 31 March ${startYear + 1}` };
}

export async function GET(_req: Request) {
  const url = new URL(_req.url);
  const fy = url.searchParams.get('fy') ?? '2025-26';
  const download = url.searchParams.get('download') === '1';

  try {
    const CO = await getCompanyCO();
    const logoUrl = getLogoDataUrl();
    const { from, to, label, full } = parseFY(fy);
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    // Fetch data
    const [paymentsRes, expensesRes] = await Promise.all([
      supabaseAdmin.from('order_payments').select('amount_received, tds_deducted, payment_date, payment_mode')
        .gte('payment_date', from).lte('payment_date', to),
      supabaseAdmin.from('expenses').select('expense_type, amount, payment_mode, expense_date')
        .gte('expense_date', from).lte('expense_date', to),
    ]);

    const payments = paymentsRes.data ?? [];
    const expenses = expensesRes.data ?? [];

    // Cash inflows
    const cashFromCustomers = payments.reduce((s, p) => s + (p.amount_received ?? 0), 0);
    const tdsDeducted = payments.reduce((s, p) => s + (p.tds_deducted ?? 0), 0);

    // Cash outflows by category
    const sumExp = (t: string) => expenses.filter(e => e.expense_type === t).reduce((s, e) => s + (e.amount ?? 0), 0);
    const purchases = sumExp('purchase');
    const salaries = sumExp('salary');
    const otherExp = sumExp('other');
    const advanceTax = sumExp('advance_tax');
    const gstPaid = sumExp('gst_paid');
    const tdsPaid = sumExp('tds_paid');
    const totalOutflows = purchases + salaries + otherExp + advanceTax + gstPaid + tdsPaid;

    // Net cash flow
    const operatingInflow = cashFromCustomers;
    const operatingOutflow = purchases + salaries + otherExp;
    const netOperating = operatingInflow - operatingOutflow;
    const taxOutflow = advanceTax + gstPaid + tdsPaid;
    const netCashFlow = cashFromCustomers - totalOutflows;

    const AMBER = '#b45309';
    const BG = '#f3f4f6';
    const content: any[] = [];

    // Header
    content.push({
      columns: [
        { width: '*', stack: [
          ...(logoUrl ? [{ image: logoUrl, width: 100, margin: [0, 0, 0, 3] }] : []),
          { text: CO.name, fontSize: 9, bold: true },
          { text: `GSTIN: ${CO.gstin}  |  PAN: ${CO.pan}`, fontSize: 7, color: '#666', margin: [0, 2, 0, 0] },
        ]},
        { width: 'auto', alignment: 'right', stack: [
          { text: 'CASH FLOW', fontSize: 14, bold: true, color: AMBER },
          { text: 'STATEMENT', fontSize: 14, bold: true, color: AMBER },
          { text: label, fontSize: 9, color: '#555', margin: [0, 2, 0, 0] },
        ]},
      ],
    });
    content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 523, y2: 0, lineWidth: 2, lineColor: '#111' }], margin: [0, 4, 0, 4] });
    content.push({ text: `For the period ${full}  |  Direct method  |  All amounts in INR`, fontSize: 7.5, color: '#666', margin: [0, 0, 0, 10] });

    // Helper
    function cfRow(label: string, value: number, opts: { bold?: boolean; indent?: boolean; positive?: boolean; highlight?: boolean } = {}): any {
      const color = opts.positive !== undefined ? (opts.positive ? '#16a34a' : '#dc2626') : (value < 0 ? '#dc2626' : '#374151');
      return [
        { text: label, margin: opts.indent ? [16, 0, 0, 0] : undefined, bold: opts.bold, color: opts.bold ? '#111' : '#555', fillColor: opts.highlight ? BG : undefined },
        { text: value < 0 ? `(${fmtN(Math.abs(value))})` : fmtN(value), alignment: 'right', bold: opts.bold, color, fillColor: opts.highlight ? BG : undefined },
      ];
    }
    function sectionHead(title: string): any {
      return [{ text: title, bold: true, color: AMBER, fontSize: 10, colSpan: 2, decoration: 'underline', decorationColor: '#fde68a', margin: [0, 6, 0, 2] }, {}];
    }

    const tableBody: any[][] = [
      sectionHead('A. Cash Flow from Operating Activities'),
      [{ text: 'INFLOWS', bold: true, fontSize: 8, color: '#888', colSpan: 2, margin: [0, 4, 0, 0] }, {}],
      cfRow('Cash received from customers', cashFromCustomers, { indent: true }),
      cfRow('TDS deducted by customers (non-cash)', tdsDeducted, { indent: true }),
      [{ text: 'OUTFLOWS', bold: true, fontSize: 8, color: '#888', colSpan: 2, margin: [0, 4, 0, 0] }, {}],
      cfRow('Purchases / Raw Materials', -purchases, { indent: true }),
      cfRow('Salaries & Wages', -salaries, { indent: true }),
      cfRow('Other Operating Expenses', -otherExp, { indent: true }),
      cfRow('Net Cash from Operations', netOperating, { bold: true, highlight: true, positive: netOperating >= 0 }),

      sectionHead('B. Cash Flow from Tax & Statutory'),
      cfRow('Advance Tax Paid', -advanceTax, { indent: true }),
      cfRow('GST Paid to Government', -gstPaid, { indent: true }),
      cfRow('TDS Paid to Government', -tdsPaid, { indent: true }),
      cfRow('Total Tax Outflow', -taxOutflow, { bold: true, highlight: true }),

      sectionHead('C. Net Cash Flow'),
      cfRow('Total Cash Inflow', cashFromCustomers, { bold: true }),
      cfRow('Total Cash Outflow', -totalOutflows, { bold: true }),
    ];

    // Net cash flow box
    const netColor = netCashFlow >= 0 ? '#16a34a' : '#dc2626';
    const netBg = netCashFlow >= 0 ? '#f0fdf4' : '#fef2f2';

    content.push({
      table: { widths: ['*', 130], body: tableBody },
      layout: { hLineWidth: () => 0, vLineWidth: () => 0, paddingLeft: () => 6, paddingRight: () => 6, paddingTop: () => 3, paddingBottom: () => 3 },
      margin: [0, 0, 0, 6],
    });

    // Net cash flow highlight box
    content.push({
      table: { widths: ['*', 130], body: [[
        { text: 'Net Cash Flow for the Period', bold: true, fontSize: 11, color: '#111' },
        { text: netCashFlow < 0 ? `(${fmtN(Math.abs(netCashFlow))})` : fmtN(netCashFlow), alignment: 'right', bold: true, fontSize: 12, color: netColor },
      ]]},
      layout: { hLineWidth: () => 2, vLineWidth: () => 0, hLineColor: () => netColor, paddingLeft: () => 10, paddingRight: () => 10, paddingTop: () => 8, paddingBottom: () => 8, fillColor: () => netBg },
      margin: [0, 4, 0, 10],
    });

    content.push({ text: `Generated on ${today}  |  ${CO.name}  |  Internal management report. Not audited.`, fontSize: 7, color: '#aaa', alignment: 'center' });

    // Generate PDF
    const pdfmake = require('pdfmake');
    for (const f of ['Roboto-Regular.ttf', 'Roboto-Medium.ttf', 'Roboto-Italic.ttf', 'Roboto-MediumItalic.ttf']) pdfmake.virtualfs.writeFileSync(f, loadFont(f));
    pdfmake.fonts = { Roboto: { normal: 'Roboto-Regular.ttf', bold: 'Roboto-Medium.ttf', italics: 'Roboto-Italic.ttf', bolditalics: 'Roboto-MediumItalic.ttf' } };

    const pdfBuffer: Buffer = await pdfmake.createPdf({
      pageSize: 'A4', pageMargins: [32, 22, 32, 40],
      defaultStyle: { fontSize: 8, lineHeight: 1.2 },
      content,
      footer: (pg: number, total: number) => ({ columns: [
        { text: CO.name, fontSize: 7, color: '#aaa', margin: [36, 0, 0, 0] },
        { text: `Cash Flow Statement — ${label}`, fontSize: 7, color: '#aaa', alignment: 'center' },
        { text: `Page ${pg} of ${total}`, fontSize: 7, color: '#aaa', alignment: 'right', margin: [0, 0, 36, 0] },
      ]}),
    }).getBuffer();

    const headers: Record<string, string> = { 'Content-Type': 'application/pdf', 'Cache-Control': 'public, max-age=60' };
    if (download) headers['Content-Disposition'] = `attachment; filename="Cash-Flow-${fy}.pdf"`;
    else headers['Content-Disposition'] = 'inline';
    return new Response(pdfBuffer, { status: 200, headers });
  } catch (err: unknown) {
    console.error('[GET /api/accounts/cash-flow]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
