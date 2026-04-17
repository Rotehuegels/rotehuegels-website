export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { getLogoDataUrl, fmtINR, generateSmartPdf } from '@/lib/pdfConfig';
import { COLORS, FONT, buildHeader, buildFooter, TABLE_LAYOUT, sectionLabel } from '@/lib/pdfTemplate';
import { getCompanyCO } from '@/lib/company';

/* eslint-disable @typescript-eslint/no-explicit-any */

function parseFY(fy: string) {
  const [startYear] = fy.split('-').map(Number);
  const endYear = startYear + 1;
  return { from: `${startYear}-04-01`, to: `${endYear}-03-31`, label: `FY ${startYear}-${String(endYear).slice(2)}`, endDate: `${endYear}-03-31` };
}

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

const num = (v: string | null | undefined, def = 0) => { const n = Number(v); return Number.isFinite(n) ? n : def; };

export async function GET(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const fy = url.searchParams.get('fy') ?? '2025-26';
  const { from, to, label, endDate } = parseFY(fy);

  // User-supplied figures (parameters — will be persisted separately)
  const shareCapital    = num(url.searchParams.get('share_capital'),    100000);  // default ₹1L paid-up
  const bankBalance     = num(url.searchParams.get('bank_balance'),     0);
  const cashBalance     = num(url.searchParams.get('cash_balance'),     0);
  const otherReceivables = num(url.searchParams.get('other_receivables'), 0);
  const download = url.searchParams.get('download') === '1';

  // ── Gather DB data ────────────────────────────────────────────────
  const [ordersRes, paymentsRes, expensesRes, poRes, poPmtRes, stockRes, assetsRes] = await Promise.all([
    supabaseAdmin
      .from('orders')
      .select('id, order_type, base_value, total_value_incl_gst, cgst_amount, sgst_amount, igst_amount, status, order_category')
      .gte('order_date', from).lte('order_date', to)
      .neq('status', 'cancelled')
      .neq('order_category', 'reimbursement')
      .neq('order_category', 'complimentary'),
    supabaseAdmin
      .from('order_payments')
      .select('amount_received, tds_deducted, order_id')
      .gte('payment_date', from).lte('payment_date', to),
    supabaseAdmin
      .from('expenses')
      .select('expense_type, amount, gst_input_credit, expense_date')
      .gte('expense_date', from).lte('expense_date', to),
    supabaseAdmin
      .from('purchase_orders')
      .select('id, po_no, total_amount, status, po_date')
      .gte('po_date', from).lte('po_date', to)
      .neq('status', 'cancelled'),
    supabaseAdmin.from('po_payments').select('po_id, amount'),
    supabaseAdmin.from('stock_items').select('quantity, unit_cost'),
    supabaseAdmin.from('fixed_assets').select('current_book_value, purchase_value, accumulated_depreciation').neq('status', 'disposed'),
  ]);

  const orders     = ordersRes.data   ?? [];
  const payments   = paymentsRes.data ?? [];
  const expenses   = expensesRes.data ?? [];
  const pos        = poRes.data       ?? [];
  const poPmts     = poPmtRes.data    ?? [];
  const stock      = stockRes.data    ?? [];
  const assets     = assetsRes.data   ?? [];

  // ── Compute — P&L → Profit for the year ──────────────────────────
  const totalBase    = orders.reduce((s, o: any) => s + (o.base_value ?? 0), 0);
  const outputGST    = orders.reduce((s, o: any) => s + (o.cgst_amount ?? 0) + (o.sgst_amount ?? 0) + (o.igst_amount ?? 0), 0);
  const totalInvoiced = totalBase + outputGST;
  const sum = (type: string) => expenses.filter((e: any) => e.expense_type === type).reduce((s, e: any) => s + (e.amount ?? 0), 0);
  const salaries    = sum('salary');
  const purchases   = sum('purchase');
  const gstPaid     = sum('gst_paid');
  const otherExp    = sum('other');
  const operatingExp = salaries + purchases + otherExp;
  const profitBeforeTax = totalBase - operatingExp;

  // ── Assets ────────────────────────────────────────────────────────

  // Fixed assets net block
  const grossFixedAssets = assets.reduce((s, a: any) => s + (a.purchase_value ?? 0), 0);
  const accDep           = assets.reduce((s, a: any) => s + (a.accumulated_depreciation ?? 0), 0);
  const netFixedAssets   = grossFixedAssets - accDep;

  // Sundry Debtors (AR) — Invoice value minus receipts (accrual)
  const grossReceipts = payments.reduce((s, p: any) => s + (p.amount_received ?? 0), 0);
  const tdsWithheld   = payments.reduce((s, p: any) => s + (p.tds_deducted   ?? 0), 0);
  const sundryDebtors = Math.max(0, totalInvoiced - grossReceipts);

  // Inventory
  const inventoryValue = stock.reduce((s, s2: any) => s + ((s2.quantity ?? 0) * (s2.unit_cost ?? 0)), 0);

  // GST Input Credit (balance — net accumulated)
  const inputCredit = expenses.reduce((s, e: any) => s + (e.gst_input_credit ?? 0), 0);
  const gstOutputLiability = Math.max(0, outputGST - inputCredit - gstPaid);
  const gstInputAvailable  = Math.max(0, inputCredit + gstPaid - outputGST);

  // TDS receivable
  const tdsReceivable = tdsWithheld;

  // Total Current Assets
  const totalCA = bankBalance + cashBalance + sundryDebtors + inventoryValue + gstInputAvailable + tdsReceivable + otherReceivables;

  // ── Liabilities ───────────────────────────────────────────────────

  // Sundry Creditors (AP) — POs value minus paid
  const poPaidByPo = new Map<string, number>();
  for (const p of poPmts as any[]) poPaidByPo.set(p.po_id, (poPaidByPo.get(p.po_id) ?? 0) + (p.amount ?? 0));
  const sundryCreditors = pos.reduce((s, p: any) => {
    const paid = poPaidByPo.get(p.id) ?? 0;
    return s + Math.max(0, (p.total_amount ?? 0) - paid);
  }, 0);

  // Advances from customers — if receipts > invoiced (rare, but happens with advance payments)
  const advanceFromCustomers = Math.max(0, grossReceipts - totalInvoiced);

  const totalCL = sundryCreditors + gstOutputLiability + advanceFromCustomers;

  // Reserves = Profit for the year (no prior years)
  const reserves = profitBeforeTax;

  const totalEquity = shareCapital + reserves;
  const totalAssets = netFixedAssets + totalCA;
  const totalLiabEquity = totalEquity + totalCL;

  // Balancing figure (if data incomplete)
  const diff = totalAssets - totalLiabEquity;

  // ── Render PDF ────────────────────────────────────────────────────
  const CO = await getCompanyCO();
  const logoUrl = getLogoDataUrl();

  const content: any[] = [];
  content.push(buildHeader({
    logoUrl,
    companyName: CO.name,
    address: `${CO.addr1} ${CO.addr2}`,
    contactLine: `${CO.email}  |  ${CO.phone}  |  ${CO.web}`,
    gstin: CO.gstin, pan: CO.pan, cin: CO.cin, tan: CO.tan,
    documentTitle: 'PROVISIONAL BALANCE SHEET',
  }));

  // FY + date
  content.push({
    columns: [
      { width: '*', text: '' },
      {
        width: 'auto', alignment: 'right',
        stack: [
          { text: `As at 31 March ${endDate.slice(0, 4)}`, fontSize: FONT.heading, bold: true },
          { text: label, fontSize: FONT.body, color: COLORS.gray },
          { text: '(Unaudited — Provisional, subject to statutory audit)', fontSize: FONT.small, italics: true, color: '#b45309' },
        ],
      },
    ],
    margin: [0, 0, 0, 10],
  });

  // Helper to render a section
  const row = (label: string, amount: number, opts: { bold?: boolean; indent?: number; colour?: string } = {}) => ([
    { text: label, fontSize: FONT.body, bold: opts.bold, margin: [opts.indent ?? 0, 0, 0, 0], color: opts.colour },
    { text: fmtINR(amount), fontSize: FONT.body, bold: opts.bold, alignment: 'right', color: opts.colour },
  ]);

  const divider = () => [{ text: '', colSpan: 2, margin: [0, 0, 0, 2], border: [false, false, false, true] as [boolean, boolean, boolean, boolean] }, {}];

  content.push(sectionLabel('I.  EQUITY & LIABILITIES'));
  content.push({
    table: {
      widths: ['*', 130],
      body: [
        [{ text: 'Particulars', fontSize: FONT.tableHeader, bold: true, fillColor: COLORS.headerBg }, { text: 'Amount (₹)', fontSize: FONT.tableHeader, bold: true, alignment: 'right', fillColor: COLORS.headerBg }],

        row('1. Shareholders\' Funds', 0, { bold: true }),
        row('   Share Capital (Paid-up)', shareCapital, { indent: 8 }),
        row('   Reserves and Surplus (Profit for the year)', reserves, { indent: 8, colour: reserves >= 0 ? COLORS.bodyText : COLORS.negative }),
        row('   Total Shareholders\' Funds', totalEquity, { bold: true, indent: 4 }),

        [{ text: '', colSpan: 2, margin: [0, 3, 0, 3] }, {}],

        row('2. Current Liabilities', 0, { bold: true }),
        row('   Sundry Creditors (Trade Payables)', sundryCreditors, { indent: 8 }),
        row('   GST Output Liability (Net)', gstOutputLiability, { indent: 8 }),
        row('   Advance from Customers', advanceFromCustomers, { indent: 8 }),
        row('   Total Current Liabilities', totalCL, { bold: true, indent: 4 }),

        [{ text: '', colSpan: 2, margin: [0, 3, 0, 3] }, {}],

        [{ text: 'TOTAL EQUITY & LIABILITIES', fontSize: FONT.heading, bold: true, fillColor: '#f3f4f6' }, { text: fmtINR(totalLiabEquity), fontSize: FONT.heading, bold: true, alignment: 'right', fillColor: '#f3f4f6' }],
      ],
    },
    layout: TABLE_LAYOUT,
    margin: [0, 0, 0, 12],
  });

  content.push(sectionLabel('II.  ASSETS'));
  content.push({
    table: {
      widths: ['*', 130],
      body: [
        [{ text: 'Particulars', fontSize: FONT.tableHeader, bold: true, fillColor: COLORS.headerBg }, { text: 'Amount (₹)', fontSize: FONT.tableHeader, bold: true, alignment: 'right', fillColor: COLORS.headerBg }],

        row('1. Non-Current Assets', 0, { bold: true }),
        row('   Fixed Assets (Net Block)', netFixedAssets, { indent: 8 }),
        row('   Gross Block', grossFixedAssets, { indent: 16, colour: COLORS.gray }),
        row('   Less: Accumulated Depreciation', -accDep, { indent: 16, colour: COLORS.gray }),

        [{ text: '', colSpan: 2, margin: [0, 3, 0, 3] }, {}],

        row('2. Current Assets', 0, { bold: true }),
        row('   Cash & Bank Balance — Bank', bankBalance, { indent: 8 }),
        row('   Cash & Bank Balance — Cash in Hand', cashBalance, { indent: 8 }),
        row('   Sundry Debtors (Trade Receivables)', sundryDebtors, { indent: 8 }),
        row('   Inventory (Stock in Hand)', inventoryValue, { indent: 8 }),
        row('   GST Input Credit Receivable', gstInputAvailable, { indent: 8 }),
        row('   TDS Receivable', tdsReceivable, { indent: 8 }),
        ...(otherReceivables > 0 ? [row('   Other Receivables / Advances', otherReceivables, { indent: 8 })] : []),
        row('   Total Current Assets', totalCA, { bold: true, indent: 4 }),

        [{ text: '', colSpan: 2, margin: [0, 3, 0, 3] }, {}],

        [{ text: 'TOTAL ASSETS', fontSize: FONT.heading, bold: true, fillColor: '#f3f4f6' }, { text: fmtINR(totalAssets), fontSize: FONT.heading, bold: true, alignment: 'right', fillColor: '#f3f4f6' }],
      ],
    },
    layout: TABLE_LAYOUT,
    margin: [0, 0, 0, 10],
  });

  // Balance check
  content.push({
    columns: [
      { width: '*', text: '' },
      {
        width: 'auto',
        stack: [
          { text: `Difference (Assets − E&L): ${fmtINR(diff)}`, fontSize: FONT.small, color: Math.abs(diff) < 1 ? COLORS.positive : '#b45309', alignment: 'right' },
          ...(Math.abs(diff) >= 1 ? [{ text: 'Non-zero → indicates missing ledger data (likely opening balances / accruals). Update fields and regenerate.', fontSize: FONT.small, italics: true, color: '#b45309', alignment: 'right' }] : []),
        ],
      },
    ],
    margin: [0, 0, 0, 10],
  });

  // Notes + disclaimer
  content.push(sectionLabel('NOTES TO THE PROVISIONAL ACCOUNTS'));
  content.push({
    ul: [
      'This statement is compiled from the company\'s ERP records for the financial year noted and is provisional in nature. Statutory audit under the Companies Act 2013 is pending.',
      'All figures are presented on an accrual basis except where noted. Revenue is recognised on invoice date; expenses on accrual as per the ERP\'s expense register.',
      'Fixed Assets, Inventory, and GST balances are as per ERP sub-ledgers at the closing date. Opening balances, where relevant, are per management representation.',
      'Share Capital is per Memorandum of Association and Form SH-7 / PAS-3 filings with MCA.',
      'The difference figure above, if any, represents entries outside the ERP\'s current ledger scope (opening balances, directors\' loans, manual adjustments) and will be reconciled during statutory audit.',
      'This document is being furnished for purposes including, but not limited to, application under Section 80-IAC of the Income-tax Act, 1961. Final figures will be as per audited financial statements once audit is complete.',
    ],
    fontSize: FONT.small, color: COLORS.gray, lineHeight: 1.3, margin: [0, 2, 0, 10],
  });

  // Signatures
  content.push({
    columns: [
      { width: '*', stack: [
        { text: 'For and on behalf of the Board of Directors', fontSize: FONT.small, color: COLORS.gray },
        { text: CO.name, fontSize: FONT.body, bold: true, margin: [0, 3, 0, 20] },
        { text: '_______________________________', fontSize: FONT.small },
        { text: 'Director', fontSize: FONT.body },
        { text: 'DIN: _______________________', fontSize: FONT.small, color: COLORS.gray },
      ]},
      { width: '*', stack: [
        { text: 'Place: Chennai', fontSize: FONT.small, color: COLORS.gray },
        { text: `Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, fontSize: FONT.small, color: COLORS.gray, margin: [0, 3, 0, 20] },
        { text: '_______________________________', fontSize: FONT.small },
        { text: 'Director', fontSize: FONT.body },
        { text: 'DIN: _______________________', fontSize: FONT.small, color: COLORS.gray },
      ]},
    ],
    margin: [0, 10, 0, 0],
  });

  const pdf = await generateSmartPdf(
    content,
    buildFooter({
      leftText: `${CO.name}  ·  GSTIN ${CO.gstin}`,
      centerText: `PROVISIONAL — ${label}  ·  Unaudited`,
    }),
  );

  const safeName = `Provisional-Balance-Sheet-${label}.pdf`.replace(/\s+/g, '-');
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': download ? `attachment; filename="${safeName}"` : `inline; filename="${safeName}"`,
    },
  });
}
