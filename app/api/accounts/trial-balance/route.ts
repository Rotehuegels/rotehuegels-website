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
    const [ordersRes, expensesRes, paymentsRes] = await Promise.all([
      supabaseAdmin.from('orders').select('base_value, cgst_amount, sgst_amount, igst_amount, total_value_incl_gst, order_type')
        .gte('order_date', from).lte('order_date', to).neq('status', 'cancelled').neq('status', 'draft'),
      supabaseAdmin.from('expenses').select('expense_type, amount, gst_input_credit')
        .gte('expense_date', from).lte('expense_date', to),
      supabaseAdmin.from('order_payments').select('amount_received, tds_deducted')
        .gte('payment_date', from).lte('payment_date', to),
    ]);

    const orders = ordersRes.data ?? [];
    const expenses = expensesRes.data ?? [];
    const payments = paymentsRes.data ?? [];

    // Revenue accounts
    const goodsRevenue = orders.filter(o => o.order_type === 'goods').reduce((s, o) => s + (o.base_value ?? 0), 0);
    const serviceRevenue = orders.filter(o => o.order_type === 'service').reduce((s, o) => s + (o.base_value ?? 0), 0);
    const outputCGST = orders.reduce((s, o) => s + (o.cgst_amount ?? 0), 0);
    const outputSGST = orders.reduce((s, o) => s + (o.sgst_amount ?? 0), 0);
    const outputIGST = orders.reduce((s, o) => s + (o.igst_amount ?? 0), 0);

    // Expense accounts
    const sumExp = (t: string) => expenses.filter(e => e.expense_type === t).reduce((s, e) => s + (e.amount ?? 0), 0);
    const purchases = sumExp('purchase');
    const salaries = sumExp('salary');
    const otherExp = sumExp('other');
    const advanceTax = sumExp('advance_tax');
    const gstPaid = sumExp('gst_paid');
    const tdsPaid = sumExp('tds_paid');
    const inputCredit = expenses.reduce((s, e) => s + (e.gst_input_credit ?? 0), 0);

    // Receivables
    const totalInvoiced = orders.reduce((s, o) => s + (o.total_value_incl_gst ?? 0), 0);
    const cashReceived = payments.reduce((s, p) => s + (p.amount_received ?? 0), 0);
    const tdsDeducted = payments.reduce((s, p) => s + (p.tds_deducted ?? 0), 0);

    // Trial balance rows: [Account, Debit, Credit]
    type TBRow = { account: string; group: string; debit: number; credit: number };
    const rows: TBRow[] = [
      // Revenue (credits)
      { account: 'Sales of Goods', group: 'Revenue', debit: 0, credit: goodsRevenue },
      { account: 'Sales of Services', group: 'Revenue', debit: 0, credit: serviceRevenue },
      // GST Liability (credits)
      { account: 'Output CGST Payable', group: 'GST Liability', debit: 0, credit: outputCGST },
      { account: 'Output SGST Payable', group: 'GST Liability', debit: 0, credit: outputSGST },
      ...(outputIGST > 0 ? [{ account: 'Output IGST Payable', group: 'GST Liability', debit: 0, credit: outputIGST }] : []),
      // Expenses (debits)
      { account: 'Purchases / Raw Materials', group: 'Direct Costs', debit: purchases, credit: 0 },
      { account: 'Salaries & Wages', group: 'Operating Expenses', debit: salaries, credit: 0 },
      { account: 'Other Expenses', group: 'Operating Expenses', debit: otherExp, credit: 0 },
      // Tax (debits)
      { account: 'Advance Tax Paid', group: 'Tax Payments', debit: advanceTax, credit: 0 },
      { account: 'GST Paid to Govt', group: 'Tax Payments', debit: gstPaid, credit: 0 },
      { account: 'TDS Paid to Govt', group: 'Tax Payments', debit: tdsPaid, credit: 0 },
      // ITC (debit - asset)
      { account: 'Input Tax Credit (ITC)', group: 'Tax Assets', debit: inputCredit, credit: 0 },
      // Receivables
      { account: 'Accounts Receivable (Debtors)', group: 'Current Assets', debit: totalInvoiced, credit: 0 },
      { account: 'Cash / Bank Received', group: 'Current Assets', debit: 0, credit: cashReceived },
      { account: 'TDS Receivable (26AS)', group: 'Current Assets', debit: tdsDeducted, credit: 0 },
    ].filter(r => r.debit > 0 || r.credit > 0);

    const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

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
          { text: 'TRIAL BALANCE', fontSize: 14, bold: true, color: AMBER },
          { text: label, fontSize: 9, color: '#555', margin: [0, 2, 0, 0] },
        ]},
      ],
    });
    content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 523, y2: 0, lineWidth: 2, lineColor: '#111' }], margin: [0, 4, 0, 4] });
    content.push({ text: `For the period ${full}  |  All amounts in INR`, fontSize: 7.5, color: '#666', margin: [0, 0, 0, 8] });

    // Table
    const headerRow = [
      { text: 'Account', bold: true, fillColor: '#1a1a1a', color: 'white' },
      { text: 'Group', bold: true, fillColor: '#1a1a1a', color: 'white' },
      { text: 'Debit (Dr)', bold: true, fillColor: '#1a1a1a', color: 'white', alignment: 'right' },
      { text: 'Credit (Cr)', bold: true, fillColor: '#1a1a1a', color: 'white', alignment: 'right' },
    ];
    const dataRows = rows.map(r => [
      { text: r.account },
      { text: r.group, color: '#666', fontSize: 7.5 },
      { text: r.debit > 0 ? fmtN(r.debit) : '', alignment: 'right', color: '#111' },
      { text: r.credit > 0 ? fmtN(r.credit) : '', alignment: 'right', color: '#16a34a' },
    ]);
    const totalRow = [
      { text: 'TOTAL', bold: true, fillColor: BG, colSpan: 2 }, {},
      { text: fmtN(totalDebit), alignment: 'right', bold: true, fillColor: BG, fontSize: 10 },
      { text: fmtN(totalCredit), alignment: 'right', bold: true, fillColor: BG, fontSize: 10, color: '#16a34a' },
    ];
    const diffRow = [
      { text: 'Difference (Debit - Credit)', bold: true, colSpan: 2, color: '#666' }, {},
      { text: fmtN(Math.abs(totalDebit - totalCredit)), alignment: 'right', bold: true, colSpan: 2,
        color: Math.abs(totalDebit - totalCredit) < 1 ? '#16a34a' : '#dc2626' }, {},
    ];

    content.push({
      table: { headerRows: 1, widths: ['*', 100, 100, 100], body: [headerRow, ...dataRows, totalRow, diffRow] },
      layout: { hLineWidth: (i: number) => i <= 1 ? 1.5 : 0.5, vLineWidth: () => 0.5, hLineColor: (i: number) => i <= 1 ? '#555' : '#ddd', vLineColor: () => '#ddd', paddingLeft: () => 6, paddingRight: () => 6, paddingTop: () => 4, paddingBottom: () => 4 },
      margin: [0, 0, 0, 8],
    });

    // Balance check
    const balanced = Math.abs(totalDebit - totalCredit) < 1;
    content.push({
      text: balanced ? 'The trial balance is in agreement.' : `Note: Trial balance shows a difference of ${fmtN(Math.abs(totalDebit - totalCredit))}. This may be due to timing differences or incomplete entries.`,
      fontSize: 8, color: balanced ? '#16a34a' : '#dc2626', italics: true, margin: [0, 0, 0, 6],
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
        { text: `Trial Balance — ${label}`, fontSize: 7, color: '#aaa', alignment: 'center' },
        { text: `Page ${pg} of ${total}`, fontSize: 7, color: '#aaa', alignment: 'right', margin: [0, 0, 36, 0] },
      ]}),
    }).getBuffer();

    const headers: Record<string, string> = { 'Content-Type': 'application/pdf', 'Cache-Control': 'public, max-age=60' };
    if (download) headers['Content-Disposition'] = `attachment; filename="Trial-Balance-${fy}.pdf"`;
    else headers['Content-Disposition'] = 'inline';
    return new Response(pdfBuffer, { status: 200, headers });
  } catch (err: unknown) {
    console.error('[GET /api/accounts/trial-balance]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
