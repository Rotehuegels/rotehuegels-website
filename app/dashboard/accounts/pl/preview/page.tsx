import { supabaseAdmin } from '@/lib/supabaseAdmin';
import PDFViewer from '@/components/PDFViewer';
import { getLogoBase64 } from '@/lib/serverAssets';

export const dynamic = 'force-dynamic';

const CO = {
  name:  'Rotehuegel Research Business Consultancy Private Limited',
  addr1: 'No. 1/584, 7th Street, Jothi Nagar, Padianallur,',
  addr2: 'Near Gangaiamman Kovil, Redhills, Chennai – 600052, Tamil Nadu, India',
  gstin: '33AAPCR0554G1ZE',
  pan:   'AAPCR0554G',
  cin:   'U70200TN2025PTC184573',
  tan:   'CHER28694B',
  email: 'sales@rotehuegels.com',
  phone: '+91-90044 91275',
  web:   'www.rotehuegels.com',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

function parseFY(fy: string) {
  const [startYear] = fy.split('-').map(Number);
  const endYear = startYear + 1;
  return {
    from:    `${startYear}-04-01`,
    to:      `${endYear}-03-31`,
    label:   `FY ${startYear}–${endYear}`,
    full:    `1 April ${startYear} to 31 March ${endYear}`,
    fyLabel: `${startYear}-${String(endYear).slice(2)}`,
  };
}

// ── Shared styles ──────────────────────────────────────────────
const doc: React.CSSProperties = {
  width: '210mm',
  minHeight: '297mm',
  padding: '12mm 16mm',
  fontFamily: 'Arial, sans-serif',
  fontSize: '11px',
  background: 'white',
  color: '#111',
  boxSizing: 'border-box',
};

const AMBER = '#b45309';
const DARK  = '#111111';
const MUTED = '#555555';
const LINE  = '#cccccc';
const LIGHT_BG = '#f8f7f4';

function Letterhead({ logoSrc, fy }: { logoSrc: string; fy: ReturnType<typeof parseFY> }) {
  return (
    <div style={{ borderBottom: `2.5px solid ${DARK}`, paddingBottom: '10px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      {/* Left: logo + company */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="Rotehügels" style={{ height: '52px', width: 'auto', objectFit: 'contain', marginTop: '2px' }} />
        <div>
          <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.2 }}>Rotehuegel Research Business</div>
          <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.2 }}>Consultancy Private Limited</div>
          <div style={{ marginTop: '5px', fontSize: '9px', color: MUTED, lineHeight: 1.65 }}>
            <div>{CO.addr1}</div>
            <div>{CO.addr2}</div>
            <div>✉ {CO.email} &nbsp;|&nbsp; ☎ {CO.phone} &nbsp;|&nbsp; 🌐 {CO.web}</div>
          </div>
        </div>
      </div>
      {/* Right: document title + IDs */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', color: AMBER, letterSpacing: '1px' }}>Profit &amp; Loss</div>
        <div style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', color: AMBER, letterSpacing: '1px' }}>Statement</div>
        <div style={{ marginTop: '6px', fontSize: '9.5px', lineHeight: 1.7, color: '#333' }}>
          <div><strong>Period:</strong> {fy.full}</div>
          <div><strong>GSTIN:</strong> {CO.gstin}</div>
          <div><strong>PAN:</strong> {CO.pan}</div>
          <div><strong>CIN:</strong> {CO.cin}</div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ letter, title }: { letter: string; title: string }) {
  return (
    <div style={{ marginTop: '14px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ fontSize: '9px', fontWeight: 900, color: AMBER, letterSpacing: '2px', textTransform: 'uppercase' }}>
        {letter} —
      </span>
      <span style={{ fontSize: '9px', fontWeight: 700, color: AMBER, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
        {title}
      </span>
    </div>
  );
}

function Row({ label, value, indent = false, bold = false, sub = false, positive, noColor = false }: {
  label: string; value: number; indent?: boolean; bold?: boolean; sub?: boolean; positive?: boolean; noColor?: boolean;
}) {
  const isNeg = value < 0;
  let color = DARK;
  if (!noColor) {
    if (positive !== undefined) {
      color = positive ? '#166534' : '#991b1b';
    } else if (isNeg) {
      color = '#991b1b';
    }
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '3.5px 0',
      paddingLeft: indent ? '16px' : '0',
      borderBottom: `1px solid ${bold ? '#aaa' : 'transparent'}`,
    }}>
      <span style={{ fontSize: bold ? '10.5px' : '10px', fontWeight: bold ? 700 : 400, color: sub ? '#777' : DARK }}>
        {label}
      </span>
      <span style={{ fontSize: bold ? '10.5px' : '10px', fontWeight: bold ? 700 : 400, fontVariantNumeric: 'tabular-nums', color }}>
        {isNeg ? `(${fmt(Math.abs(value))})` : fmt(value)}
      </span>
    </div>
  );
}

function HRule({ thick = false }: { thick?: boolean }) {
  return <div style={{ borderTop: `${thick ? 1.5 : 0.5}px solid ${LINE}`, margin: '2px 0' }} />;
}

function SubtotalRow({ label, value, positive }: { label: string; value: number; positive?: boolean }) {
  const color = positive !== undefined ? (positive ? '#166534' : '#991b1b') : DARK;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: `2px solid ${DARK}`, borderBottom: `0.5px solid ${LINE}`, marginTop: '1px' }}>
      <span style={{ fontSize: '10.5px', fontWeight: 800 }}>{label}</span>
      <span style={{ fontSize: '10.5px', fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{value < 0 ? `(${fmt(Math.abs(value))})` : fmt(value)}</span>
    </div>
  );
}

export default async function PLPreviewPage({ searchParams }: { searchParams: Promise<{ fy?: string }> }) {
  const { fy: fyParam } = await searchParams;
  const fyStr = fyParam ?? '2025-26';
  const fy = parseFY(fyStr);

  const [startYear] = fyStr.split('-').map(Number);
  const prevFYFrom  = `${startYear - 1}-04-01`;
  const prevFYTo    = `${startYear}-03-31`;
  const prevFYLabel = `FY ${startYear - 1}–${startYear}`;

  const logoSrc = getLogoBase64();
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  // Mirror the exact same data-fetching logic as the main P&L page.
  const [ordersRes, expensesRes] = await Promise.all([
    supabaseAdmin
      .from('orders')
      .select('id, order_type, base_value, total_value_incl_gst, cgst_amount, sgst_amount, igst_amount, status, order_category')
      .gte('order_date', fy.from)
      .lte('order_date', fy.to)
      .neq('status', 'cancelled')
      .neq('status', 'draft')
      .neq('order_category', 'reimbursement')
      .neq('order_category', 'complimentary'),
    supabaseAdmin
      .from('expenses')
      .select('expense_type, amount, gst_input_credit')
      .gte('expense_date', fy.from)
      .lte('expense_date', fy.to),
  ]);

  const orders   = ordersRes.data   ?? [];
  const expenses = expensesRes.data ?? [];

  const orderIds = orders.map(o => o.id);

  const paymentsRes = orderIds.length > 0
    ? await supabaseAdmin
        .from('order_payments')
        .select('amount_received, tds_deducted, net_received')
        .in('order_id', orderIds)
    : { data: [] };

  const payments = paymentsRes.data ?? [];

  const goodsOrders   = orders.filter(o => o.order_type === 'goods');
  const serviceOrders = orders.filter(o => o.order_type === 'service');

  const goodsBase   = goodsOrders.reduce((s, o)   => s + (o.base_value ?? 0), 0);
  const serviceBase = serviceOrders.reduce((s, o) => s + (o.base_value ?? 0), 0);
  const totalBase   = goodsBase + serviceBase;

  const outputCGST  = orders.reduce((s, o) => s + (o.cgst_amount ?? 0), 0);
  const outputSGST  = orders.reduce((s, o) => s + (o.sgst_amount ?? 0), 0);
  const outputIGST  = orders.reduce((s, o) => s + (o.igst_amount ?? 0), 0);
  const totalGST    = outputCGST + outputSGST + outputIGST;
  // Use stored total_value_incl_gst to avoid rounding drift from GST reverse-calculation.
  const totalInvoiced = orders.reduce((s, o) => s + (o.total_value_incl_gst ?? 0), 0);

  const grossReceived = payments.reduce((s, p) => s + (p.amount_received ?? 0), 0);
  const tdsDeducted   = payments.reduce((s, p) => s + (p.tds_deducted   ?? 0), 0);
  const netReceived   = payments.reduce((s, p) => s + (p.net_received   ?? 0), 0);

  const sumExp = (type: string) =>
    expenses.filter(e => e.expense_type === type).reduce((s, e) => s + (e.amount ?? 0), 0);

  const salaries   = sumExp('salary');
  const purchases  = sumExp('purchase');
  const tdsPaid    = sumExp('tds_paid');
  const advanceTax = sumExp('advance_tax');
  const gstPaid    = sumExp('gst_paid');
  const otherExp   = sumExp('other');

  const inputCredit     = expenses.reduce((s, e) => s + (e.gst_input_credit ?? 0), 0);
  const netGSTLiability = totalGST - inputCredit - gstPaid;

  const grossProfit     = totalBase - purchases;
  const totalOpExp      = salaries + otherExp;
  const operatingProfit = grossProfit - totalOpExp;
  const totalTax        = advanceTax + gstPaid;
  const netProfit          = operatingProfit - advanceTax;
  // TDS deducted by clients is legally settled — treat as received (recoverable via 26AS/ITR).
  const effectiveReceived  = grossReceived + tdsDeducted;
  const pendingRec         = totalInvoiced - effectiveReceived;

  // ── Brought-Forward Receivables from previous FY (same logic as main page) ──
  const prevOrdersRes2 = await supabaseAdmin
    .from('orders')
    .select('id, total_value_incl_gst')
    .gte('order_date', prevFYFrom)
    .lte('order_date', prevFYTo)
    .neq('status', 'cancelled')
    .neq('status', 'draft')
    .neq('order_category', 'reimbursement')
    .neq('order_category', 'complimentary');

  const prevOrders2   = prevOrdersRes2.data ?? [];
  const prevOrderIds2 = prevOrders2.map(o => o.id);
  const prevInvoiced2 = prevOrders2.reduce((s, o) => s + (o.total_value_incl_gst ?? 0), 0);

  const [prevPayByYearEnd2, prevPayInCurrFY2] = prevOrderIds2.length > 0
    ? await Promise.all([
        supabaseAdmin.from('order_payments').select('amount_received, tds_deducted')
          .in('order_id', prevOrderIds2).lte('payment_date', prevFYTo),
        supabaseAdmin.from('order_payments').select('amount_received, tds_deducted')
          .in('order_id', prevOrderIds2).gte('payment_date', fy.from).lte('payment_date', fy.to),
      ])
    : [{ data: [] }, { data: [] }];

  const prevEffective2     = (prevPayByYearEnd2.data ?? []).reduce((s, p) => s + (p.amount_received ?? 0) + (p.tds_deducted ?? 0), 0);
  const bfOpening2         = prevInvoiced2 - prevEffective2;
  const bfCollected2       = (prevPayInCurrFY2.data ?? []).reduce((s, p) => s + (p.amount_received ?? 0) + (p.tds_deducted ?? 0), 0);
  const bfClosing2         = bfOpening2 - bfCollected2;

  return (
    <PDFViewer
      pages={['pl-page-1', 'pl-page-2']}
      filename={`PL-Statement-FY${fy.fyLabel}.pdf`}
      toolbar={
        <div className="flex items-center gap-3">
          <a
            href={`/dashboard/accounts/pl?fy=${fyStr}`}
            className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            ← Back to P&amp;L
          </a>
          <span className="text-zinc-700">|</span>
          <span className="text-xs text-zinc-500">P&amp;L Statement</span>
          <span className="text-sm text-amber-400 font-bold">{fy.label}</span>
        </div>
      }
    >
      <div>

        {/* ══════════════════════════════ PAGE 1 — Main P&L ══════════════════════════════ */}
        <div id="pl-page-1" style={doc}>

          <Letterhead logoSrc={logoSrc} fy={fy} />

          {/* Basis note */}
          <div style={{ background: LIGHT_BG, border: `0.5px solid ${LINE}`, borderRadius: '3px', padding: '5px 10px', marginBottom: '10px', fontSize: '9px', color: MUTED }}>
            Prepared on <strong>accrual basis</strong> — revenue recognised on order date within {fy.full}.
            All amounts in <strong>Indian Rupees (INR)</strong> excluding GST unless stated otherwise.
          </div>

          {/* ── A: INCOME ── */}
          <SectionTitle letter="A" title="Income (Revenue)" />
          <Row label="Sales of Goods" value={goodsBase} indent />
          <Row label="Sales of Services" value={serviceBase} indent />
          <HRule />
          <SubtotalRow label="Total Revenue (excl. GST)" value={totalBase} positive={totalBase >= 0} />

          {/* ── B: DIRECT COSTS ── */}
          <SectionTitle letter="B" title="Direct Costs" />
          <Row label="Purchases / Raw Materials" value={purchases} indent />
          <HRule />
          <SubtotalRow label="Gross Profit  (A − B)" value={grossProfit} positive={grossProfit >= 0} />

          {/* ── C: OPERATING EXPENSES ── */}
          <SectionTitle letter="C" title="Operating Expenses" />
          <Row label="Salaries & Wages" value={salaries} indent />
          <Row label="Other Expenses" value={otherExp} indent />
          <HRule />
          <Row label="Total Operating Expenses" value={totalOpExp} bold />
          <div style={{ height: '6px' }} />
          <SubtotalRow label="Operating Profit  (Gross Profit − C)" value={operatingProfit} positive={operatingProfit >= 0} />

          {/* ── D: TAX & STATUTORY ── */}
          <SectionTitle letter="D" title="Tax & Statutory Payments" />
          <Row label="Advance Tax Paid" value={advanceTax} indent />
          <Row label="GST Paid to Government (net of ITC)" value={gstPaid} indent />
          <HRule />
          <Row label="Total Tax Payments" value={totalTax} bold />
          <div style={{ height: '6px' }} />

          {/* Net Profit — highlighted box */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: netProfit >= 0 ? '#f0fdf4' : '#fff1f2',
            border: `1.5px solid ${netProfit >= 0 ? '#16a34a' : '#dc2626'}`,
            borderRadius: '4px', padding: '8px 12px', marginTop: '8px',
          }}>
            <span style={{ fontSize: '12px', fontWeight: 800 }}>Net Profit / (Loss) after Tax</span>
            <span style={{ fontSize: '14px', fontWeight: 900, color: netProfit >= 0 ? '#166534' : '#991b1b', fontVariantNumeric: 'tabular-nums' }}>
              {netProfit < 0 ? `(${fmt(Math.abs(netProfit))})` : fmt(netProfit)}
            </span>
          </div>

          {/* Summary KPI bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '18px' }}>
            {[
              { label: 'Total Revenue', value: totalBase, color: AMBER },
              { label: 'Gross Profit', value: grossProfit, color: grossProfit >= 0 ? '#166534' : '#991b1b' },
              { label: 'Operating Profit', value: operatingProfit, color: operatingProfit >= 0 ? '#166534' : '#991b1b' },
              { label: 'Net Profit', value: netProfit, color: netProfit >= 0 ? '#166534' : '#991b1b' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ border: `1px solid ${LINE}`, borderRadius: '4px', padding: '7px 10px', background: LIGHT_BG }}>
                <div style={{ fontSize: '8px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                <div style={{ fontSize: '11px', fontWeight: 800, color, marginTop: '3px', fontVariantNumeric: 'tabular-nums' }}>
                  {value < 0 ? `(${fmt(Math.abs(value))})` : fmt(value)}
                </div>
              </div>
            ))}
          </div>

          {/* Page footer */}
          <PageFooter today={today} page={1} total={2} />
        </div>

        {/* ══════════════════════════════ PAGE 2 — Supplementary Schedules ══════════════════════════════ */}
        <div id="pl-page-2" style={doc}>

          <Letterhead logoSrc={logoSrc} fy={fy} />

          <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '14px', color: DARK, borderBottom: `1px solid ${LINE}`, paddingBottom: '6px' }}>
            Supplementary Schedules
          </div>

          {/* Two-column: GST + TDS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>

            {/* GST Summary */}
            <div style={{ border: `1px solid ${LINE}`, borderRadius: '4px', padding: '10px 12px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: AMBER, marginBottom: '8px' }}>GST Summary</div>
              <Row label="Output GST (Liability)" value={totalGST} bold noColor />
              <Row label="— CGST" value={outputCGST} indent sub />
              <Row label="— SGST" value={outputSGST} indent sub />
              {outputIGST > 0 && <Row label="— IGST" value={outputIGST} indent sub />}
              <HRule />
              <Row label="Input Tax Credit (ITC)" value={inputCredit} indent />
              <Row label="GST Paid to Government" value={gstPaid} indent />
              <HRule thick />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: `2px solid ${DARK}`, marginTop: '2px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800 }}>Net GST Position</span>
                <span style={{ fontSize: '10px', fontWeight: 800, color: netGSTLiability <= 0 ? '#166534' : '#991b1b', fontVariantNumeric: 'tabular-nums' }}>
                  {netGSTLiability < 0 ? `(${fmt(Math.abs(netGSTLiability))})` : fmt(netGSTLiability)}
                </span>
              </div>
              <div style={{ fontSize: '8.5px', marginTop: '4px', color: netGSTLiability > 0 ? '#b45309' : '#166534' }}>
                {netGSTLiability > 0 ? '⚠ GST payable to government' : '✓ GST liability cleared'}
              </div>
            </div>

            {/* TDS Summary */}
            <div style={{ border: `1px solid ${LINE}`, borderRadius: '4px', padding: '10px 12px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: AMBER, marginBottom: '8px' }}>TDS Summary</div>
              <Row label="TDS Deducted by Clients" value={tdsDeducted} bold noColor />
              <div style={{ fontSize: '8.5px', color: MUTED, paddingLeft: '14px', paddingBottom: '4px' }}>Recoverable via Form 26AS / AIS</div>
              <HRule />
              <Row label="TDS Paid to Government" value={tdsPaid} bold noColor />
              <HRule thick />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: `2px solid ${DARK}`, marginTop: '2px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800 }}>Net TDS Refundable</span>
                <span style={{ fontSize: '10px', fontWeight: 800, color: (tdsDeducted - tdsPaid) >= 0 ? '#166534' : '#991b1b', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(tdsDeducted - tdsPaid)}
                </span>
              </div>
              {(tdsDeducted - tdsPaid) > 0 && (
                <div style={{ fontSize: '8.5px', marginTop: '4px', color: '#166534' }}>✓ Refundable / adjustable in ITR</div>
              )}
            </div>
          </div>

          {/* Receivables Position */}
          <div style={{ border: `1px solid ${LINE}`, borderRadius: '4px', padding: '10px 12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: AMBER, marginBottom: '4px' }}>Receivables Position</div>
            <div style={{ fontSize: '8.5px', color: MUTED, marginBottom: '8px' }}>All payments for {fy.label} orders — date recorded does not matter. TDS deducted by clients treated as settled (recoverable via 26AS / ITR).</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <Row label="Total Invoiced (incl. GST)" value={totalInvoiced} bold noColor />
                <Row label="Cash Received from Clients" value={grossReceived} indent />
                <Row label="TDS Deducted by Clients" value={tdsDeducted} indent />
                <Row label="Effective Amount Settled" value={effectiveReceived} indent />
                <Row label="Net to Bank" value={netReceived} indent sub />
                <HRule thick />
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: `2px solid ${DARK}`, marginTop: '2px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800 }}>Outstanding Receivables</span>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: pendingRec > 0 ? '#991b1b' : '#166534', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(pendingRec)}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {pendingRec > 0 ? (
                  <div style={{ border: `1px solid #fca5a5`, borderRadius: '6px', background: '#fff1f2', padding: '12px 16px', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '8.5px', color: MUTED }}>Outstanding collection</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#991b1b', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>{fmt(pendingRec)}</div>
                    <div style={{ fontSize: '8px', color: MUTED, marginTop: '4px' }}>Invoiced but not yet received or TDS-settled</div>
                  </div>
                ) : (
                  <div style={{ border: `1px solid #86efac`, borderRadius: '6px', background: '#f0fdf4', padding: '12px 16px', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#166534' }}>✓ All invoices collected</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Brought-Forward Receivables — only if prev FY had outstanding amounts */}
          {bfOpening2 > 0 && (
            <div style={{ border: `1px solid ${LINE}`, borderRadius: '4px', padding: '10px 12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: AMBER, marginBottom: '4px' }}>
                Brought Forward Receivables ({prevFYLabel})
              </div>
              <div style={{ fontSize: '8.5px', color: MUTED, marginBottom: '8px' }}>
                Invoices raised in {prevFYLabel} outstanding at 31 March {startYear}.
                Not counted as {fy.label} revenue — prior-year collections only.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <Row label={`Opening B/F (31 Mar ${startYear})`} value={bfOpening2} bold noColor />
                  <Row label={`Collected in ${fy.label}`} value={bfCollected2} indent />
                  <HRule thick />
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: `2px solid ${DARK}`, marginTop: '2px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800 }}>Closing B/F (still outstanding)</span>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: bfClosing2 > 0 ? '#991b1b' : '#166534', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(bfClosing2)}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {bfClosing2 > 0 ? (
                    <div style={{ border: `1px solid #fca5a5`, borderRadius: '6px', background: '#fff1f2', padding: '10px 14px', textAlign: 'center' as const }}>
                      <div style={{ fontSize: '8.5px', color: MUTED }}>Still outstanding from {prevFYLabel}</div>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: '#991b1b', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>{fmt(bfClosing2)}</div>
                    </div>
                  ) : (
                    <div style={{ border: `1px solid #86efac`, borderRadius: '6px', background: '#f0fdf4', padding: '10px 14px', textAlign: 'center' as const }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#166534' }}>✓ All B/F amounts collected</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Declaration / Disclaimer */}
          <div style={{ border: `0.5px solid ${LINE}`, borderRadius: '3px', padding: '8px 12px', background: LIGHT_BG, fontSize: '8.5px', color: MUTED }}>
            <strong style={{ color: DARK }}>Declaration:</strong> This Profit &amp; Loss Statement has been prepared internally based on data recorded in the company's management system for the period {fy.full}.
            It is prepared on an accrual basis for management reporting purposes and has not been audited.
            This document does not constitute a statutory financial statement under the Companies Act, 2013 or the Income Tax Act, 1961.
          </div>

          {/* Signature block */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <div style={{ textAlign: 'center' as const, width: '180px' }}>
              <div style={{ borderTop: `1px solid ${DARK}`, paddingTop: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700 }}>Authorised Signatory</div>
                <div style={{ fontSize: '9px', color: MUTED, marginTop: '2px' }}>Rotehuegel Research Business</div>
                <div style={{ fontSize: '9px', color: MUTED }}>Consultancy Private Limited</div>
              </div>
            </div>
          </div>

          <PageFooter today={today} page={2} total={2} />
        </div>

      </div>
    </PDFViewer>
  );
}

function PageFooter({ today, page, total }: { today: string; page: number; total: number }) {
  return (
    <div style={{ borderTop: `0.5px solid ${LINE}`, marginTop: '20px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', color: '#999' }}>
      <span>Generated on {today} &nbsp;|&nbsp; {CO.name} &nbsp;|&nbsp; CIN: {CO.cin}</span>
      <span>Page {page} of {total}</span>
    </div>
  );
}
