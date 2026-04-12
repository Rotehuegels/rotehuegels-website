import { supabaseAdmin } from '@/lib/supabaseAdmin';
import FYSelector from './FYSelector';
import { FileText } from 'lucide-react';
import ReportContainer from '@/components/ReportContainer';
import { getCompanyCO } from '@/lib/company';
import { getLogoBase64 } from '@/lib/serverAssets';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

function parseFY(fy: string) {
  const [startYear] = fy.split('-').map(Number);
  const endYear = startYear + 1;
  return {
    from:  `${startYear}-04-01`,
    to:    `${endYear}-03-31`,
    label: `FY ${startYear}–${endYear}`,
    full:  `1 April ${startYear} to 31 March ${endYear}`,
  };
}

// ── Document-style P&L Row components ────────────────────────────
function Row({ label, value, indent = false, bold = false, sub = false, positive, highlight = false }: {
  label: string; value: number; indent?: boolean; bold?: boolean; sub?: boolean; positive?: boolean; highlight?: boolean;
}) {
  const isNeg = value < 0;
  const valColor = positive !== undefined
    ? (positive ? 'text-green-700' : 'text-red-700')
    : (isNeg ? 'text-red-700' : 'text-gray-900');

  return (
    <div className={`flex items-center justify-between py-1.5 ${indent ? 'pl-8' : ''} ${highlight ? 'bg-gray-50 -mx-6 px-6' : ''}`}>
      <span className={`text-[13px] ${bold ? 'font-bold text-gray-900' : sub ? 'text-gray-400 text-[12px]' : 'text-gray-700'}`}>
        {label}
      </span>
      <span className={`text-[13px] font-mono tabular-nums ${bold ? 'font-bold' : ''} ${valColor}`}>
        {isNeg ? `(${fmt(Math.abs(value))})` : fmt(value)}
      </span>
    </div>
  );
}

function Divider({ thick = false }: { thick?: boolean }) {
  return <div className={`${thick ? 'border-t-2 border-gray-800 my-1' : 'border-t border-gray-200 my-0.5'}`} />;
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-5 pb-1">
      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-amber-700 border-b border-amber-200 pb-1">{children}</p>
    </div>
  );
}

function NetProfitBox({ label, value }: { label: string; value: number }) {
  const positive = value >= 0;
  return (
    <div className={`flex items-center justify-between py-2.5 px-4 -mx-6 mt-2 ${positive ? 'bg-green-50 border-y-2 border-green-600' : 'bg-red-50 border-y-2 border-red-600'}`}>
      <span className="text-[14px] font-black text-gray-900">{label}</span>
      <span className={`text-[16px] font-black font-mono tabular-nums ${positive ? 'text-green-700' : 'text-red-700'}`}>
        {value < 0 ? `(${fmt(Math.abs(value))})` : fmt(value)}
      </span>
    </div>
  );
}

export default async function PLPage({ searchParams }: { searchParams: Promise<{ fy?: string }> }) {
  const { fy: fyParam } = await searchParams;
  const fy = fyParam ?? '2025-26';
  const { from, to, label, full } = parseFY(fy);
  const CO = await getCompanyCO();
  const logoSrc = getLogoBase64();

  // Derive startYear for brought-forward calculation (prev FY = startYear-1 → startYear).
  const [startYear] = fy.split('-').map(Number);
  const prevFYFrom  = `${startYear - 1}-04-01`;
  const prevFYTo    = `${startYear}-03-31`;
  const prevFYLabel = `FY ${startYear - 1}–${startYear}`;

  // Step 1 — billable orders in this FY.
  // Mirror the same exclusions as the Orders list financial totals:
  //   cancelled      → void, never invoiced
  //   reimbursement  → pass-through expense recovery, not revenue
  //   complimentary  → no invoice value, not revenue
  const ordersRes = await supabaseAdmin
    .from('orders')
    .select('id, order_type, base_value, total_value_incl_gst, cgst_amount, sgst_amount, igst_amount, status, order_category')
    .gte('order_date', from)
    .lte('order_date', to)
    .neq('status', 'cancelled')
    .neq('status', 'draft')
    .neq('order_category', 'reimbursement')
    .neq('order_category', 'complimentary');

  const orders   = ordersRes.data ?? [];
  const orderIds = orders.map(o => o.id);

  // Step 2 — ALL payments for those orders, regardless of payment date.
  // This is correct: if every invoice for FY 25-26 was paid by 31 Mar,
  // pending receivables should be zero — even if some payments were
  // recorded a day later in the system.
  const [paymentsRes, expensesRes] = await Promise.all([
    orderIds.length > 0
      ? supabaseAdmin
          .from('order_payments')
          .select('amount_received, tds_deducted, net_received')
          .in('order_id', orderIds)
      : Promise.resolve({ data: [] }),
    supabaseAdmin
      .from('expenses')
      .select('expense_type, amount, gst_input_credit')
      .gte('expense_date', from)
      .lte('expense_date', to),
  ]);

  const payments = paymentsRes.data ?? [];
  const expenses = expensesRes.data ?? [];

  // ── Brought-Forward Receivables from previous FY ────────────────────────────
  // Fetch previous FY's billable orders (same exclusion rules).
  const prevOrdersRes = await supabaseAdmin
    .from('orders')
    .select('id, total_value_incl_gst')
    .gte('order_date', prevFYFrom)
    .lte('order_date', prevFYTo)
    .neq('status', 'cancelled')
    .neq('status', 'draft')
    .neq('order_category', 'reimbursement')
    .neq('order_category', 'complimentary');

  const prevOrders   = prevOrdersRes.data ?? [];
  const prevOrderIds = prevOrders.map(o => o.id);
  const prevInvoiced = prevOrders.reduce((s, o) => s + (o.total_value_incl_gst ?? 0), 0);

  // Payments for prev FY orders received ON OR BEFORE the prev FY year-end.
  // Opening B/F = prev invoiced − effective settled by year-end.
  const [prevPayByYearEndRes, prevPayInCurrFYRes] = prevOrderIds.length > 0
    ? await Promise.all([
        supabaseAdmin
          .from('order_payments')
          .select('amount_received, tds_deducted')
          .in('order_id', prevOrderIds)
          .lte('payment_date', prevFYTo),
        supabaseAdmin
          .from('order_payments')
          .select('amount_received, tds_deducted')
          .in('order_id', prevOrderIds)
          .gte('payment_date', from)
          .lte('payment_date', to),
      ])
    : [{ data: [] }, { data: [] }];

  const prevEffectiveByYearEnd = (prevPayByYearEndRes.data ?? []).reduce(
    (s, p) => s + (p.amount_received ?? 0) + (p.tds_deducted ?? 0), 0,
  );
  const bfOpening = prevInvoiced - prevEffectiveByYearEnd;  // what carried forward

  const bfCollectedInCurrFY = (prevPayInCurrFYRes.data ?? []).reduce(
    (s, p) => s + (p.amount_received ?? 0) + (p.tds_deducted ?? 0), 0,
  );
  const bfClosing = bfOpening - bfCollectedInCurrFY;        // still outstanding B/F

  const goodsOrders   = orders.filter(o => o.order_type === 'goods');
  const serviceOrders = orders.filter(o => o.order_type === 'service');

  const goodsBase    = goodsOrders.reduce((s, o)   => s + (o.base_value   ?? 0), 0);
  const serviceBase  = serviceOrders.reduce((s, o) => s + (o.base_value   ?? 0), 0);
  const totalBase    = goodsBase + serviceBase;

  const outputCGST   = orders.reduce((s, o) => s + (o.cgst_amount ?? 0), 0);
  const outputSGST   = orders.reduce((s, o) => s + (o.sgst_amount ?? 0), 0);
  const outputIGST   = orders.reduce((s, o) => s + (o.igst_amount ?? 0), 0);
  const totalGST     = outputCGST + outputSGST + outputIGST;

  // Use the stored total_value_incl_gst as the authoritative invoiced figure.
  // Recomputing base + cgst + sgst + igst introduces rounding drift because
  // the breakdown is reverse-calculated from the total using toFixed(2).
  const totalInvoiced = orders.reduce((s, o) => s + (o.total_value_incl_gst ?? 0), 0);

  const grossReceived = payments.reduce((s, p) => s + (p.amount_received ?? 0), 0);
  const tdsDeducted   = payments.reduce((s, p) => s + (p.tds_deducted   ?? 0), 0);
  const netReceived   = payments.reduce((s, p) => s + (p.net_received   ?? 0), 0);

  const sumExp = (type: string) =>
    expenses.filter(e => e.expense_type === type).reduce((s, e) => s + (e.amount ?? 0), 0);

  const salaries    = sumExp('salary');
  const purchases   = sumExp('purchase');
  const tdsPaid     = sumExp('tds_paid');
  const advanceTax  = sumExp('advance_tax');
  const gstPaid     = sumExp('gst_paid');
  const otherExp    = sumExp('other');

  const inputCredit     = expenses.reduce((s, e) => s + (e.gst_input_credit ?? 0), 0);
  const netGSTLiability = totalGST - inputCredit - gstPaid;

  const grossProfit     = totalBase - purchases;
  const operatingProfit = grossProfit - salaries - otherExp;
  const netProfit       = operatingProfit - advanceTax;
  // TDS deducted by clients is legally settled — recoverable via 26AS/ITR.
  // An invoice is fully received when: cash received + TDS deducted = total invoiced.
  const effectiveReceived = grossReceived + tdsDeducted;
  const pendingRec        = totalInvoiced - effectiveReceived;

  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="p-6 print:p-0">

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 no-print">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-amber-400" />
          <h1 className="text-lg font-bold text-white">P&amp;L Statement</h1>
        </div>
        <div className="flex items-center gap-2">
          <FYSelector current={fy} />
        </div>
      </div>

      {/* A4 Document */}
      <ReportContainer filename={`PL-Statement-${fy}`}>
      <div className="bg-white overflow-hidden">

        {/* Letterhead */}
        <div className="bg-white px-8 py-5 flex items-center justify-between border-b-2 border-gray-900">
          <div className="flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="Rotehügels" className="h-12 w-auto object-contain" />
            <div>
              <p className="text-[11px] font-bold text-gray-900 uppercase">{CO.name}</p>
              <p className="text-[9px] text-gray-500 mt-1">CIN: {CO.cin} &nbsp;|&nbsp; GSTIN: {CO.gstin} &nbsp;|&nbsp; PAN: {CO.pan}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-amber-700 uppercase tracking-widest">Profit &amp; Loss</p>
            <p className="text-sm font-black text-amber-700 uppercase tracking-widest">Statement</p>
            <p className="text-[11px] text-gray-500 mt-1 font-mono">{label}</p>
          </div>
        </div>

        {/* Period bar */}
        <div className="bg-gray-50 px-8 py-2 border-b border-gray-200 flex items-center justify-between">
          <p className="text-[11px] text-gray-600">
            For the period <strong>{full}</strong>
          </p>
          <p className="text-[10px] text-gray-400">
            Prepared on accrual basis · All amounts in INR
          </p>
        </div>

        {/* P&L Body */}
        <div className="px-8 py-4">

          {/* INCOME */}
          <SectionHead>A — Income (Revenue)</SectionHead>
          <Row label="Sales of Goods" value={goodsBase} indent />
          <Row label="Sales of Services" value={serviceBase} indent />
          <Divider />
          <Row label="Total Revenue (excl. GST)" value={totalBase} bold positive={totalBase >= 0} highlight />

          {/* DIRECT COSTS */}
          <SectionHead>B — Direct Costs</SectionHead>
          <Row label="Purchases / Raw Materials" value={purchases} indent />
          <Divider />
          <Row label="Gross Profit  (A − B)" value={grossProfit} bold positive={grossProfit >= 0} highlight />

          {/* OPERATING EXPENSES */}
          <SectionHead>C — Operating Expenses</SectionHead>
          <Row label="Salaries & Wages" value={salaries} indent />
          <Row label="Other Expenses" value={otherExp} indent />
          <Divider />
          <Row label="Total Operating Expenses" value={salaries + otherExp} bold />

          <Divider thick />
          <Row label="Operating Profit  (Gross Profit − C)" value={operatingProfit} bold positive={operatingProfit >= 0} highlight />

          {/* TAX */}
          <SectionHead>D — Tax &amp; Statutory Payments</SectionHead>
          <Row label="Advance Tax Paid" value={advanceTax} indent />
          <Row label="GST Paid to Govt (net of ITC)" value={gstPaid} indent />
          <Divider />
          <Row label="Total Tax Payments" value={advanceTax + gstPaid} bold />

          {/* NET PROFIT */}
          <NetProfitBox label="Net Profit / (Loss) after Tax" value={netProfit} />
        </div>

        {/* GST + TDS — two columns */}
        <div className="grid grid-cols-2 divide-x divide-gray-200 border-t border-gray-200">
          <div className="px-8 py-4">
            <SectionHead>GST Summary</SectionHead>
            <Row label="Output GST (Liability)" value={totalGST} bold />
            <Row label="CGST" value={outputCGST} indent sub />
            <Row label="SGST" value={outputSGST} indent sub />
            {outputIGST > 0 && <Row label="IGST" value={outputIGST} indent sub />}
            <Divider />
            <Row label="Input Tax Credit (ITC)" value={inputCredit} indent />
            <Row label="GST Paid to Govt" value={gstPaid} indent />
            <Divider thick />
            <Row label="Net GST Position" value={netGSTLiability} bold positive={netGSTLiability <= 0} />
            <p className={`text-[10px] mt-1 ${netGSTLiability > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {netGSTLiability > 0 ? '⚠ GST payable to government' : '✓ GST liability cleared'}
            </p>
          </div>
          <div className="px-8 py-4">
            <SectionHead>TDS Summary</SectionHead>
            <Row label="TDS Deducted by Clients" value={tdsDeducted} bold />
            <p className="text-[10px] text-gray-400 pl-1 pb-1">Recoverable via Form 26AS / AIS</p>
            <Divider />
            <Row label="TDS Paid to Govt" value={tdsPaid} bold />
            <Divider thick />
            <Row label="Net TDS Refundable" value={tdsDeducted - tdsPaid} bold positive={(tdsDeducted - tdsPaid) >= 0} />
            {(tdsDeducted - tdsPaid) > 0 && (
              <p className="text-[10px] text-green-600 mt-1">✓ Refundable / adjustable in ITR</p>
            )}
          </div>
        </div>

        {/* Receivables */}
        <div className="px-8 py-4 border-t border-gray-200">
          <SectionHead>Receivables Position</SectionHead>
          <p className="text-[10px] text-gray-400 mb-2">
            TDS deducted by clients treated as settled (recoverable via 26AS / ITR).
          </p>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <Row label="Total Invoiced (incl. GST)" value={totalInvoiced} bold />
              <Row label="Cash Received from Clients" value={grossReceived} indent />
              <Row label="TDS Deducted by Clients" value={tdsDeducted} indent />
              <Row label="Effective Amount Settled" value={effectiveReceived} indent />
              <Row label="Net to Bank" value={netReceived} indent sub />
              <Divider thick />
              <Row label="Outstanding Receivables" value={pendingRec} bold positive={pendingRec === 0} />
            </div>
            <div className="flex items-center justify-center">
              {pendingRec > 0 ? (
                <div className="text-center border border-red-200 rounded-lg bg-red-50 p-5">
                  <p className="text-[10px] text-gray-500">Outstanding</p>
                  <p className="text-2xl font-black text-red-700 mt-1">{fmt(pendingRec)}</p>
                </div>
              ) : (
                <div className="text-center border border-green-200 rounded-lg bg-green-50 p-5">
                  <p className="text-sm font-bold text-green-700">✓ All Collected</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Brought Forward */}
        {bfOpening > 0 && (
          <div className="px-8 py-4 border-t border-gray-200">
            <SectionHead>Brought Forward Receivables ({prevFYLabel})</SectionHead>
            <p className="text-[10px] text-gray-400 mb-2">
              Prior-year invoices outstanding at 31 March {startYear}. Not counted as {label} revenue.
            </p>
            <Row label={`Opening B/F (31 Mar ${startYear})`} value={bfOpening} bold />
            <Row label={`Collected in ${label}`} value={bfCollectedInCurrFY} indent />
            <Divider thick />
            <Row label="Closing B/F (still outstanding)" value={bfClosing} bold positive={bfClosing === 0} />
          </div>
        )}

        {/* KPI strip */}
        <div className="grid grid-cols-4 divide-x divide-gray-200 border-t border-gray-200">
          {[
            { l: 'Total Revenue', v: totalBase, c: 'text-amber-700' },
            { l: 'Gross Profit', v: grossProfit, c: grossProfit >= 0 ? 'text-green-700' : 'text-red-700' },
            { l: 'Net Profit', v: netProfit, c: netProfit >= 0 ? 'text-green-700' : 'text-red-700' },
            { l: 'Receivables', v: pendingRec, c: pendingRec > 0 ? 'text-red-700' : 'text-green-700' },
          ].map(({ l, v, c }) => (
            <div key={l} className="px-6 py-3 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">{l}</p>
              <p className={`text-sm font-black mt-0.5 ${c}`}>{fmt(v)}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-3 border-t border-gray-200 flex items-center justify-between text-[9px] text-gray-400">
          <span>Generated on {today} &nbsp;|&nbsp; {CO.name}</span>
          <span>This is an internal management report. Not audited.</span>
        </div>
      </div>
      </ReportContainer>

      {orders.length === 0 && expenses.length === 0 && (
        <div className="mx-auto max-w-[800px] mt-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-12 text-center">
          <p className="text-zinc-500 text-sm">No transactions found for {label}.</p>
        </div>
      )}
    </div>
  );
}
