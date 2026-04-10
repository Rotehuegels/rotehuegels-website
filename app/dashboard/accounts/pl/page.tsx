import { supabaseAdmin } from '@/lib/supabaseAdmin';
import FYSelector from './FYSelector';
import { FileText } from 'lucide-react';

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

// ── P&L Row components ────────────────────────────────────────
function Row({ label, value, indent = false, bold = false, sub = false, positive }: {
  label: string; value: number; indent?: boolean; bold?: boolean; sub?: boolean; positive?: boolean;
}) {
  const isNeg = value < 0;
  const color = positive !== undefined
    ? (positive ? 'text-emerald-400' : 'text-rose-400')
    : (isNeg ? 'text-rose-400' : 'text-white');

  return (
    <div className={`flex items-center justify-between py-2 ${indent ? 'pl-6' : ''} ${sub ? 'text-zinc-400' : ''}`}>
      <span className={`text-sm ${bold ? 'font-semibold text-zinc-100' : sub ? 'text-zinc-400' : 'text-zinc-300'}`}>
        {label}
      </span>
      <span className={`text-sm font-mono tabular-nums ${bold ? 'font-bold' : ''} ${color}`}>
        {isNeg ? `(${fmt(Math.abs(value))})` : fmt(value)}
      </span>
    </div>
  );
}

function Divider({ thick = false }: { thick?: boolean }) {
  return <div className={`border-t ${thick ? 'border-zinc-500 my-1' : 'border-zinc-800 my-0.5'}`} />;
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-4 pb-1">
      <p className="text-xs font-bold uppercase tracking-widest text-amber-400">{children}</p>
    </div>
  );
}

export default async function PLPage({ searchParams }: { searchParams: Promise<{ fy?: string }> }) {
  const { fy: fyParam } = await searchParams;
  const fy = fyParam ?? '2025-26';
  const { from, to, label, full } = parseFY(fy);

  // Step 1 — orders in this FY
  const ordersRes = await supabaseAdmin
    .from('orders')
    .select('id, order_type, base_value, total_value_incl_gst, cgst_amount, sgst_amount, igst_amount, status')
    .gte('order_date', from)
    .lte('order_date', to)
    .neq('status', 'cancelled');

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

  const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

  return (
    <div className="p-8 space-y-6 print:p-0 print:space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-amber-400" />
            P&amp;L Statement
          </h1>
          <p className="mt-1 text-sm text-zinc-400">{full}</p>
        </div>
        <FYSelector current={fy} />
      </div>

      {/* Print header — only shows when printing */}
      <div className="hidden print:block mb-6">
        <p className="text-lg font-bold text-black">Rotehügels</p>
        <p className="text-base font-semibold text-black">Profit &amp; Loss Statement</p>
        <p className="text-sm text-gray-600">{full}</p>
        <p className="text-xs text-gray-400 mt-1">Generated {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Main P&L */}
      <div className={`${glass} p-6 print:border print:border-gray-300 print:rounded-none print:bg-white print:text-black`}>

        {/* INCOME */}
        <SectionHead>A — Income (Revenue)</SectionHead>
        <p className="text-[10px] text-zinc-600 mb-2">Accrual basis — orders raised in {label}</p>
        <Row label="Sales of Goods" value={goodsBase} indent />
        <Row label="Sales of Services" value={serviceBase} indent />
        <Divider />
        <Row label="Total Revenue (excl. GST)" value={totalBase} bold positive={totalBase >= 0} />

        {/* COST OF GOODS / DIRECT COSTS */}
        <SectionHead>B — Direct Costs</SectionHead>
        <Row label="Purchases / Raw Materials" value={purchases} indent />
        <Divider />
        <Row label="Gross Profit  (A − B)" value={grossProfit} bold positive={grossProfit >= 0} />

        {/* OPERATING EXPENSES */}
        <SectionHead>C — Operating Expenses</SectionHead>
        <Row label="Salaries & Wages" value={salaries} indent />
        <Row label="Other Expenses" value={otherExp} indent />
        <Divider />
        <Row label="Total Operating Expenses" value={salaries + otherExp} bold />

        <Divider thick />
        <Row label="Operating Profit  (Gross Profit − C)" value={operatingProfit} bold positive={operatingProfit >= 0} />

        {/* TAX & STATUTORY */}
        <SectionHead>D — Tax & Statutory Payments</SectionHead>
        <Row label="Advance Tax Paid" value={advanceTax} indent />
        <Row label="GST Paid to Govt (net of ITC)" value={gstPaid} indent />
        <Divider />
        <Row label="Total Tax Payments" value={advanceTax + gstPaid} bold />

        <Divider thick />
        <Row label="Net Profit / (Loss) after Tax" value={netProfit} bold positive={netProfit >= 0} />
      </div>

      {/* Two-col: GST + TDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 print:gap-4">

        {/* GST Summary */}
        <div className={`${glass} p-6 print:border print:border-gray-300 print:rounded-none print:bg-white`}>
          <SectionHead>GST Summary</SectionHead>
          <div className="mt-2 space-y-0.5">
            <Row label="Output GST (Liability)" value={totalGST} bold />
            <Row label="CGST" value={outputCGST} indent sub />
            <Row label="SGST" value={outputSGST} indent sub />
            {outputIGST > 0 && <Row label="IGST" value={outputIGST} indent sub />}
            <Divider />
            <Row label="Input Tax Credit (ITC)" value={inputCredit} indent />
            <Row label="GST Paid to Govt" value={gstPaid} indent />
            <Divider thick />
            <Row label="Net GST Position" value={netGSTLiability} bold positive={netGSTLiability <= 0} />
            {netGSTLiability > 0 && (
              <p className="text-xs text-amber-400 pt-1">⚠ GST payable to government</p>
            )}
            {netGSTLiability <= 0 && (
              <p className="text-xs text-emerald-400 pt-1">✓ GST liability cleared</p>
            )}
          </div>
        </div>

        {/* TDS Summary */}
        <div className={`${glass} p-6 print:border print:border-gray-300 print:rounded-none print:bg-white`}>
          <SectionHead>TDS Summary</SectionHead>
          <div className="mt-2 space-y-0.5">
            <Row label="TDS Deducted by Clients" value={tdsDeducted} bold />
            <p className="text-xs text-zinc-600 pl-1 pb-1">Recoverable via Form 26AS / AIS</p>
            <Divider />
            <Row label="TDS Paid to Govt" value={tdsPaid} bold />
            <Divider thick />
            <Row label="Net TDS Refundable" value={tdsDeducted - tdsPaid} bold positive={(tdsDeducted - tdsPaid) >= 0} />
            {(tdsDeducted - tdsPaid) > 0 && (
              <p className="text-xs text-emerald-400 pt-1">✓ Refundable / adjustable in ITR</p>
            )}
          </div>
        </div>
      </div>

      {/* Receivables Position */}
      <div className={`${glass} p-6 print:border print:border-gray-300 print:rounded-none print:bg-white`}>
        <SectionHead>Receivables Position</SectionHead>
        <p className="text-[10px] text-zinc-600 mb-2">
          All payments for {label} orders — date recorded does not matter.
          TDS deducted by clients is treated as settled (recoverable via 26AS / ITR).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12">
          <div>
            <Row label="Total Invoiced (incl. GST)" value={totalInvoiced} bold />
            <Row label="Cash Received from Clients" value={grossReceived} indent />
            <Row label="TDS Deducted by Clients" value={tdsDeducted} indent />
            <Row label="Effective Amount Settled" value={effectiveReceived} indent />
            <Row label="Net to Bank" value={netReceived} indent sub />
            <Divider thick />
            <Row label="Outstanding Receivables" value={pendingRec} bold positive={pendingRec === 0} />
          </div>
          <div className="mt-4 sm:mt-0">
            {pendingRec > 0 && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4">
                <p className="text-xs text-zinc-400 mb-1">Outstanding collection</p>
                <p className="text-2xl font-black text-rose-400">{fmt(pendingRec)}</p>
                <p className="text-xs text-zinc-600 mt-1">Invoiced but not yet received or TDS-settled</p>
              </div>
            )}
            {pendingRec === 0 && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                <p className="text-sm text-emerald-400 font-semibold">All invoices collected</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:gap-2">
        {[
          { label: 'Total Revenue', value: totalBase, color: 'text-amber-400' },
          { label: 'Gross Profit', value: grossProfit, color: grossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400' },
          { label: 'Net Profit', value: netProfit, color: netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400' },
          { label: 'Pending Receivables', value: pendingRec, color: pendingRec > 0 ? 'text-rose-400' : 'text-emerald-400' },
        ].map(({ label: l, value, color }) => (
          <div key={l} className={`${glass} p-4 print:border print:border-gray-200 print:rounded-none print:bg-white`}>
            <p className="text-xs text-zinc-500">{l}</p>
            <p className={`text-lg font-black mt-1 ${color}`}>{fmt(value)}</p>
          </div>
        ))}
      </div>

      {orders.length === 0 && expenses.length === 0 && (
        <div className={`${glass} p-12 text-center`}>
          <p className="text-zinc-500 text-sm">No transactions found for {label}.</p>
          <p className="text-zinc-600 text-xs mt-1">Orders and expenses are filtered by their date within the financial year.</p>
        </div>
      )}
    </div>
  );
}
