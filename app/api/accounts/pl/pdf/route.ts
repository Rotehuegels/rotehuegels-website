import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCompanyCO } from '@/lib/company';
import fs from 'fs';
import path from 'path';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = 'force-dynamic';

const fmtN = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

function getLogoDataUrl(): string | null {
  try { return `data:image/png;base64,${fs.readFileSync(path.join(process.cwd(), 'public', 'assets', 'Logo2_black.png')).toString('base64')}`; } catch { return null; }
}

function parseFY(fy: string) {
  const [startYear] = fy.split('-').map(Number);
  const endYear = startYear + 1;
  return { from: `${startYear}-04-01`, to: `${endYear}-03-31`, full: `1 April ${startYear} to 31 March ${endYear}`, label: `FY ${startYear}-${endYear}`, startYear };
}

export async function GET(_req: Request) {
  const url = new URL(_req.url);
  const fy = url.searchParams.get('fy') ?? '2025-26';
  const download = url.searchParams.get('download') === '1';

  try {
    const CO = await getCompanyCO();
    const logoUrl = getLogoDataUrl();
    const { from, to, full, label, startYear } = parseFY(fy);

    // Fetch data (same logic as the page)
    const ordersRes = await supabaseAdmin.from('orders').select('id, order_type, base_value, total_value_incl_gst, cgst_amount, sgst_amount, igst_amount, status, order_category')
      .gte('order_date', from).lte('order_date', to).neq('status', 'cancelled').neq('status', 'draft').neq('order_category', 'reimbursement').neq('order_category', 'complimentary');
    const orders = ordersRes.data ?? [];
    const orderIds = orders.map(o => o.id);

    const [paymentsRes, expensesRes] = await Promise.all([
      orderIds.length > 0 ? supabaseAdmin.from('order_payments').select('amount_received, tds_deducted, net_received').in('order_id', orderIds) : Promise.resolve({ data: [] }),
      supabaseAdmin.from('expenses').select('expense_type, amount, gst_input_credit').gte('expense_date', from).lte('expense_date', to),
    ]);
    const payments = paymentsRes.data ?? [];
    const expenses = expensesRes.data ?? [];

    // Brought forward
    const prevFYFrom = `${startYear - 1}-04-01`;
    const prevFYTo = `${startYear}-03-31`;
    const prevOrdersRes = await supabaseAdmin.from('orders').select('id, total_value_incl_gst').gte('order_date', prevFYFrom).lte('order_date', prevFYTo).neq('status', 'cancelled').neq('status', 'draft').neq('order_category', 'reimbursement').neq('order_category', 'complimentary');
    const prevOrders = prevOrdersRes.data ?? [];
    const prevOrderIds = prevOrders.map(o => o.id);
    const prevInvoiced = prevOrders.reduce((s, o) => s + (o.total_value_incl_gst ?? 0), 0);

    const [prevPayByYearEndRes, prevPayInCurrFYRes] = prevOrderIds.length > 0
      ? await Promise.all([
          supabaseAdmin.from('order_payments').select('amount_received, tds_deducted').in('order_id', prevOrderIds).lte('payment_date', prevFYTo),
          supabaseAdmin.from('order_payments').select('amount_received, tds_deducted').in('order_id', prevOrderIds).gte('payment_date', from).lte('payment_date', to),
        ])
      : [{ data: [] }, { data: [] }];

    const prevEffective = (prevPayByYearEndRes.data ?? []).reduce((s, p) => s + (p.amount_received ?? 0) + (p.tds_deducted ?? 0), 0);
    const bfOpening = prevInvoiced - prevEffective;
    const bfCollected = (prevPayInCurrFYRes.data ?? []).reduce((s, p) => s + (p.amount_received ?? 0) + (p.tds_deducted ?? 0), 0);
    const bfClosing = bfOpening - bfCollected;

    // Calculations
    const goodsBase = orders.filter(o => o.order_type === 'goods').reduce((s, o) => s + (o.base_value ?? 0), 0);
    const serviceBase = orders.filter(o => o.order_type === 'service').reduce((s, o) => s + (o.base_value ?? 0), 0);
    const totalBase = goodsBase + serviceBase;
    const outputCGST = orders.reduce((s, o) => s + (o.cgst_amount ?? 0), 0);
    const outputSGST = orders.reduce((s, o) => s + (o.sgst_amount ?? 0), 0);
    const outputIGST = orders.reduce((s, o) => s + (o.igst_amount ?? 0), 0);
    const totalGST = outputCGST + outputSGST + outputIGST;
    const totalInvoiced = orders.reduce((s, o) => s + (o.total_value_incl_gst ?? 0), 0);
    const grossReceived = payments.reduce((s, p) => s + (p.amount_received ?? 0), 0);
    const tdsDeducted = payments.reduce((s, p) => s + (p.tds_deducted ?? 0), 0);

    const sumExp = (type: string) => expenses.filter(e => e.expense_type === type).reduce((s, e) => s + (e.amount ?? 0), 0);
    const purchases = sumExp('purchase');
    const salaries = sumExp('salary');
    const otherExp = sumExp('other');
    const advanceTax = sumExp('advance_tax');
    const gstPaid = sumExp('gst_paid');
    const tdsPaid = sumExp('tds_paid');
    const inputCredit = expenses.reduce((s, e) => s + (e.gst_input_credit ?? 0), 0);

    const grossProfit = totalBase - purchases;
    const operatingProfit = grossProfit - salaries - otherExp;
    const netProfit = operatingProfit - advanceTax;
    const effectiveReceived = grossReceived + tdsDeducted;
    const pendingRec = totalInvoiced - effectiveReceived;
    const netGSTLiability = totalGST - inputCredit - gstPaid;

    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const AMBER = '#b45309';
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
          { text: 'PROFIT & LOSS', fontSize: 12, bold: true, color: AMBER },
          { text: 'STATEMENT', fontSize: 12, bold: true, color: AMBER },
          { text: label, fontSize: 9, color: '#555', margin: [0, 2, 0, 0] },
        ]},
      ],
    });
    content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 523, y2: 0, lineWidth: 2, lineColor: '#111' }], margin: [0, 4, 0, 4] });
    content.push({ text: `For the period ${full}  |  Prepared on accrual basis  |  All amounts in INR`, fontSize: 7.5, color: '#666', margin: [0, 0, 0, 6] });

    // Helper for P&L rows
    function plRow(label: string, value: number, opts: { bold?: boolean; indent?: boolean; highlight?: boolean; positive?: boolean } = {}): any {
      const color = opts.positive !== undefined ? (opts.positive ? '#16a34a' : '#dc2626') : (value < 0 ? '#dc2626' : '#374151');
      return {
        columns: [
          { text: label, width: '*', fontSize: 9, bold: opts.bold, margin: opts.indent ? [16, 0, 0, 0] : undefined, color: opts.bold ? '#111' : '#555' },
          { text: value < 0 ? `(${fmtN(Math.abs(value))})` : fmtN(value), width: 110, alignment: 'right', fontSize: 9, bold: opts.bold, color },
        ],
        margin: [0, 2, 0, 2] as any,
        ...(opts.highlight ? { fillColor: '#f9fafb' } : {}),
      };
    }
    function sectionHead(title: string): any {
      return { text: title, fontSize: 9, bold: true, color: AMBER, margin: [0, 8, 0, 3], decoration: 'underline', decorationColor: '#fde68a' };
    }
    function divider(thick = false): any {
      return { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 523, y2: 0, lineWidth: thick ? 1.5 : 0.5, lineColor: thick ? '#374151' : '#e5e7eb' }], margin: [0, 2, 0, 2] };
    }

    // A — Income
    content.push(sectionHead('A - Income (Revenue)'));
    content.push(plRow('Sales of Goods', goodsBase, { indent: true }));
    content.push(plRow('Sales of Services', serviceBase, { indent: true }));
    content.push(divider());
    content.push(plRow('Total Revenue (excl. GST)', totalBase, { bold: true, highlight: true, positive: totalBase >= 0 }));

    // B — Direct Costs
    content.push(sectionHead('B - Direct Costs'));
    content.push(plRow('Purchases / Raw Materials', purchases, { indent: true }));
    content.push(divider());
    content.push(plRow('Gross Profit (A - B)', grossProfit, { bold: true, highlight: true, positive: grossProfit >= 0 }));

    // C — Operating Expenses
    content.push(sectionHead('C - Operating Expenses'));
    content.push(plRow('Salaries & Wages', salaries, { indent: true }));
    content.push(plRow('Other Expenses', otherExp, { indent: true }));
    content.push(divider());
    content.push(plRow('Total Operating Expenses', salaries + otherExp, { bold: true }));
    content.push(divider(true));
    content.push(plRow('Operating Profit (Gross Profit - C)', operatingProfit, { bold: true, highlight: true, positive: operatingProfit >= 0 }));

    // D — Tax
    content.push(sectionHead('D - Tax & Statutory Payments'));
    content.push(plRow('Advance Tax Paid', advanceTax, { indent: true }));
    content.push(plRow('GST Paid to Govt (net of ITC)', gstPaid, { indent: true }));
    content.push(divider());
    content.push(plRow('Total Tax Payments', advanceTax + gstPaid, { bold: true }));

    // Net Profit box
    const npColor = netProfit >= 0 ? '#16a34a' : '#dc2626';
    const npBg = netProfit >= 0 ? '#f0fdf4' : '#fef2f2';
    content.push({
      table: { widths: ['*', 110], body: [[
        { text: 'Net Profit / (Loss) after Tax', bold: true, fontSize: 11, color: '#111' },
        { text: netProfit < 0 ? `(${fmtN(Math.abs(netProfit))})` : fmtN(netProfit), alignment: 'right', bold: true, fontSize: 12, color: npColor },
      ]]},
      layout: { hLineWidth: () => 2, vLineWidth: () => 0, hLineColor: () => npColor, paddingLeft: () => 8, paddingRight: () => 8, paddingTop: () => 6, paddingBottom: () => 6, fillColor: () => npBg },
      margin: [0, 6, 0, 8],
    });

    // GST + TDS Summary (side by side)
    content.push({
      columns: [
        { width: '*', stack: [
          sectionHead('GST Summary'),
          plRow('Output GST (Liability)', totalGST, { bold: true }),
          plRow('CGST', outputCGST, { indent: true }),
          plRow('SGST', outputSGST, { indent: true }),
          ...(outputIGST > 0 ? [plRow('IGST', outputIGST, { indent: true })] : []),
          divider(),
          plRow('Input Tax Credit (ITC)', inputCredit, { indent: true }),
          plRow('GST Paid to Govt', gstPaid, { indent: true }),
          divider(true),
          plRow('Net GST Position', netGSTLiability, { bold: true, positive: netGSTLiability <= 0 }),
        ]},
        { width: '*', stack: [
          sectionHead('TDS Summary'),
          plRow('TDS Deducted by Clients', tdsDeducted, { bold: true }),
          { text: 'Recoverable via Form 26AS / AIS', fontSize: 7, color: '#888', margin: [0, 0, 0, 4] },
          divider(),
          plRow('TDS Paid to Govt', tdsPaid, { bold: true }),
          divider(true),
          plRow('Net TDS Refundable', tdsDeducted - tdsPaid, { bold: true, positive: (tdsDeducted - tdsPaid) >= 0 }),
        ]},
      ],
      columnGap: 20,
    });

    // Receivables
    content.push(sectionHead('Receivables Position'));
    content.push(plRow('Total Invoiced (incl. GST)', totalInvoiced, { bold: true }));
    content.push(plRow('Cash Received from Clients', grossReceived, { indent: true }));
    content.push(plRow('TDS Deducted by Clients', tdsDeducted, { indent: true }));
    content.push(plRow('Effective Amount Settled', effectiveReceived, { indent: true }));
    content.push(divider(true));
    content.push(plRow('Outstanding Receivables', pendingRec, { bold: true, positive: pendingRec === 0 }));

    // Brought forward (if any)
    if (bfOpening > 0) {
      content.push(sectionHead(`Brought Forward Receivables (FY ${startYear - 1}-${startYear})`));
      content.push(plRow(`Opening B/F (31 Mar ${startYear})`, bfOpening, { bold: true }));
      content.push(plRow(`Collected in ${label}`, bfCollected, { indent: true }));
      content.push(divider(true));
      content.push(plRow('Closing B/F (still outstanding)', bfClosing, { bold: true, positive: bfClosing === 0 }));
    }

    // KPI strip
    content.push({
      table: { widths: ['*', '*', '*', '*'], body: [[
        { stack: [{ text: 'Total Revenue', fontSize: 7, color: '#888', alignment: 'center' }, { text: fmtN(totalBase), fontSize: 10, bold: true, color: AMBER, alignment: 'center' }] },
        { stack: [{ text: 'Gross Profit', fontSize: 7, color: '#888', alignment: 'center' }, { text: fmtN(grossProfit), fontSize: 10, bold: true, color: grossProfit >= 0 ? '#16a34a' : '#dc2626', alignment: 'center' }] },
        { stack: [{ text: 'Net Profit', fontSize: 7, color: '#888', alignment: 'center' }, { text: fmtN(netProfit), fontSize: 10, bold: true, color: netProfit >= 0 ? '#16a34a' : '#dc2626', alignment: 'center' }] },
        { stack: [{ text: 'Receivables', fontSize: 7, color: '#888', alignment: 'center' }, { text: fmtN(pendingRec), fontSize: 10, bold: true, color: pendingRec > 0 ? '#dc2626' : '#16a34a', alignment: 'center' }] },
      ]]},
      layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#ddd', vLineColor: () => '#ddd', paddingTop: () => 6, paddingBottom: () => 6 },
      margin: [0, 8, 0, 6],
    });

    // Footer

    // Generate PDF using smart auto-scaling system
    const { generateSmartPdf } = await import('@/lib/pdfConfig');
    const pdfBuffer = await generateSmartPdf(content, (pg: number, total: number) => ({ columns: [
      { text: `${CO.name}`, fontSize: 7, color: '#aaa', margin: [36, 0, 0, 0] },
      { text: label, fontSize: 7, color: '#aaa', alignment: 'center' },
      { text: `Page ${pg} of ${total}`, fontSize: 7, color: '#aaa', alignment: 'right', margin: [0, 0, 36, 0] },
    ]}));

    const headers: Record<string, string> = { 'Content-Type': 'application/pdf', 'Cache-Control': 'public, max-age=60' };
    if (download) headers['Content-Disposition'] = `attachment; filename="PL-Statement-${fy}.pdf"`;
    else headers['Content-Disposition'] = 'inline';
    return new Response(pdfBuffer, { status: 200, headers });
  } catch (err: unknown) {
    console.error('[GET /api/accounts/pl/pdf]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'PDF generation failed' }, { status: 500 });
  }
}
