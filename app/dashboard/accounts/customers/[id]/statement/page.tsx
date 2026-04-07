import React from 'react';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import StatementPrintButton from './StatementPrintButton';
import StatementFYSelector from './StatementFYSelector';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

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
  bank:  'State Bank of India, Padianallur Branch',
  acc:   '44512115640',
  ifsc:  'SBIN0014160',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function getFY(dateStr: string) {
  const d = new Date(dateStr); const y = d.getFullYear(); const m = d.getMonth() + 1;
  return m >= 4 ? `${String(y).slice(2)}-${String(y+1).slice(2)}` : `${String(y-1).slice(2)}-${String(y).slice(2)}`;
}

function amountInWords(amount: number): string {
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tensArr = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const twoD = (n: number) => n < 20 ? ones[n] : tensArr[Math.floor(n/10)]+(n%10?' '+ones[n%10]:'');
  const threeD = (n: number) => n < 100 ? twoD(n) : ones[Math.floor(n/100)]+' Hundred'+(n%100?' '+twoD(n%100):'');
  const r = Math.floor(amount); const p = Math.round((amount - r)*100);
  const parts: string[] = []; let rem = r;
  if (rem>=10000000){parts.push(twoD(Math.floor(rem/10000000))+' Crore');rem%=10000000;}
  if (rem>=100000){parts.push(twoD(Math.floor(rem/100000))+' Lakh');rem%=100000;}
  if (rem>=1000){parts.push(twoD(Math.floor(rem/1000))+' Thousand');rem%=1000;}
  if (rem>0){parts.push(threeD(rem));}
  return `Rupees ${r===0?'Zero':parts.join(' ')}${p>0?` and ${twoD(p)} Paise`:''} Only`;
}

export default async function CustomerStatementPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fy?: string }>;
}) {
  const { id } = await params;
  const { fy: fyParam } = await searchParams;
  const selectedFY = fyParam ?? 'all';
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: customer, error: custErr } = await supabaseAdmin
    .from('customers').select('*').eq('id', id).single();
  if (custErr || !customer) notFound();

  // Load assets server-side as base64
  const sigPath = path.join(process.cwd(), 'private', 'signature.jpg');
  const sigBase64 = fs.existsSync(sigPath)
    ? `data:image/jpeg;base64,${fs.readFileSync(sigPath).toString('base64')}` : null;

  const upiQr = await QRCode.toDataURL(
    `upi://pay?pa=rotehuegels@sbi&pn=Rotehuegel+Research+Business+Consultancy+Pvt+Ltd&cu=INR`,
    { width: 80, margin: 1, color: { dark: '#111111', light: '#ffffff' } }
  );

  // Fetch orders with payment stages
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('customer_id', id)
    .neq('status', 'cancelled')
    .neq('order_category', 'reimbursement')
    .order('invoice_date', { ascending: true, nullsFirst: false });

  const orderIds = (orders ?? []).map(o => o.id);

  const [{ data: allPayments }, { data: allStages }, { data: quotes }] = await Promise.all([
    // Include stage_id and tds_deducted so we can map payments to individual stages
    supabaseAdmin.from('order_payments').select('order_id, stage_id, amount_received, tds_deducted')
      .in('order_id', orderIds.length ? orderIds : ['00000000-0000-0000-0000-000000000000']),
    supabaseAdmin.from('order_payment_stages').select('*')
      .in('order_id', orderIds.length ? orderIds : ['00000000-0000-0000-0000-000000000000'])
      .order('stage_number'),
    supabaseAdmin.from('quotes').select('*, customers(*)')
      .eq('customer_id', id)
      .not('status', 'in', '("rejected","expired","converted")')
      .order('quote_date', { ascending: true }),
  ]);

  // Build payment maps — both by order and by stage
  const orderPaymentMap: Record<string, number> = {};
  const orderTdsMap:     Record<string, number> = {};
  const stagePaymentMap: Record<string, number> = {};
  const stageTdsMap:     Record<string, number> = {};
  for (const p of allPayments ?? []) {
    orderPaymentMap[p.order_id] = (orderPaymentMap[p.order_id] ?? 0) + (p.amount_received ?? 0);
    orderTdsMap[p.order_id]     = (orderTdsMap[p.order_id]     ?? 0) + (p.tds_deducted   ?? 0);
    if (p.stage_id) {
      stagePaymentMap[p.stage_id] = (stagePaymentMap[p.stage_id] ?? 0) + (p.amount_received ?? 0);
      stageTdsMap[p.stage_id]     = (stageTdsMap[p.stage_id]     ?? 0) + (p.tds_deducted   ?? 0);
    }
  }
  const stagesMap: Record<string, typeof allStages> = {};
  for (const s of allStages ?? []) {
    if (!stagesMap[s.order_id]) stagesMap[s.order_id] = [];
    stagesMap[s.order_id]!.push(s);
  }

  // Build SOA rows — orders with stages on different invoice dates expand into separate rows
  type SoaRow = {
    id: string; order_no: string; description: string; order_type: string;
    invoice_date: string | null; order_date: string;
    baseValue: number; gstAmount: number; tdsAmount: number;
    total_value_incl_gst: number; received: number; pending: number;
    stageLabel?: string;
    // Optional order-level fields used in invoice rendering (present via spread for order rows)
    igst_amount?: number; cgst_amount?: number; sgst_amount?: number; gst_rate?: number;
    hsn_sac_code?: string; client_name?: string; client_address?: string;
    client_gstin?: string; place_of_supply?: string; stages?: unknown[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };

  const soaRows: SoaRow[] = [];
  for (const o of orders ?? []) {
    const stages = stagesMap[o.id] ?? [];
    const stagesWithDate = stages.filter((s: { invoice_date?: string | null }) => s.invoice_date);

    // Group stages by their invoice_date
    const dateGroups: Record<string, typeof stages> = {};
    for (const s of stagesWithDate) {
      const key = (s as { invoice_date: string }).invoice_date;
      if (!dateGroups[key]) dateGroups[key] = [];
      dateGroups[key].push(s);
    }
    const groupKeys = Object.keys(dateGroups);

    if (groupKeys.length > 1) {
      // Multiple invoice dates — one SOA row per date group
      for (const dateKey of groupKeys.sort()) {
        const group = dateGroups[dateKey];
        const groupBase     = group.reduce((sum: number, s: { amount_due?: number }) => sum + (s.amount_due ?? 0), 0);
        const groupGst      = group.reduce((sum: number, s: { gst_on_stage?: number }) => sum + (s.gst_on_stage ?? 0), 0);
        const groupTds      = group.reduce((sum: number, s: { id: string }) => sum + (stageTdsMap[s.id] ?? 0), 0);
        const groupValue    = groupBase + groupGst;
        const groupReceived = group.reduce((sum: number, s: { id: string }) => sum + (stagePaymentMap[s.id] ?? 0), 0);
        const nums = group.map((s: { stage_number: number }) => s.stage_number).sort((a: number, b: number) => a - b);
        const stageLabel = nums.length === 1 ? `Stage ${nums[0]}` : `Stages ${nums[0]}–${nums[nums.length - 1]}`;
        soaRows.push({
          ...o,
          id: `${o.id}_${dateKey}`,
          invoice_date: dateKey,
          baseValue: groupBase, gstAmount: groupGst, tdsAmount: groupTds,
          total_value_incl_gst: groupValue,
          received: groupReceived, pending: groupValue - groupReceived,
          stageLabel,
        });
      }
    } else {
      // Single invoice date or no stage dates — use order-level totals
      const received = orderPaymentMap[o.id] ?? 0;
      soaRows.push({
        ...o,
        baseValue:  o.base_value ?? 0,
        gstAmount:  (o.cgst_amount ?? 0) + (o.sgst_amount ?? 0) + (o.igst_amount ?? 0),
        tdsAmount:  orderTdsMap[o.id] ?? 0,
        received,
        pending: (o.total_value_incl_gst ?? 0) - received,
      });
    }
  }

  // Sort by invoice_date then order_no
  soaRows.sort((a, b) => {
    const da = a.invoice_date ?? a.order_date;
    const db = b.invoice_date ?? b.order_date;
    return da !== db ? da.localeCompare(db) : a.order_no.localeCompare(b.order_no);
  });

  // FY helper
  const rowFY = (row: SoaRow) => {
    const d = new Date(row.invoice_date ?? row.order_date);
    return (d.getMonth() + 1) >= 4
      ? `${d.getFullYear()}-${String(d.getFullYear()+1).slice(2)}`
      : `${d.getFullYear()-1}-${String(d.getFullYear()).slice(2)}`;
  };

  // Only show invoiceable rows (exclude zero-value complimentary), optionally filtered by FY
  const allInvoiceRows = soaRows.filter(o => (o.total_value_incl_gst ?? 0) > 0);
  const invoiceRows = selectedFY === 'all'
    ? allInvoiceRows
    : allInvoiceRows.filter(r => rowFY(r) === selectedFY);

  const totalValue    = invoiceRows.reduce((s, o) => s + o.total_value_incl_gst, 0);
  const totalReceived = invoiceRows.reduce((s, o) => s + o.received, 0);
  const totalPending  = invoiceRows.reduce((s, o) => s + o.pending, 0);
  type FyAgg = { baseValue: number; gstAmount: number; tdsAmount: number; total: number; received: number; pending: number };
  const fyAggs: Record<string, FyAgg> = {};
  for (const row of invoiceRows) {
    const fy = rowFY(row);
    if (!fyAggs[fy]) fyAggs[fy] = { baseValue:0, gstAmount:0, tdsAmount:0, total:0, received:0, pending:0 };
    fyAggs[fy].baseValue  += row.baseValue;
    fyAggs[fy].gstAmount  += row.gstAmount;
    fyAggs[fy].tdsAmount  += row.tdsAmount;
    fyAggs[fy].total      += row.total_value_incl_gst;
    fyAggs[fy].received   += row.received;
    fyAggs[fy].pending    += row.pending;
  }
  const fyKeys = Object.keys(fyAggs).sort();
  const grandBase = invoiceRows.reduce((s, r) => s + r.baseValue, 0);
  const grandGst  = invoiceRows.reduce((s, r) => s + r.gstAmount, 0);
  const grandTds  = invoiceRows.reduce((s, r) => s + r.tdsAmount, 0);

  const billing = customer.billing_address as Record<string, string> | null;
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const cell: React.CSSProperties = { border: '1px solid #ddd', padding: '6px 8px', fontSize: '10px' };
  const th: React.CSSProperties   = { ...cell, background: '#f5f5f5', fontWeight: 700, textAlign: 'center' as const };
  const docStyle: React.CSSProperties = { padding: '12mm 16mm', fontFamily: 'Arial, sans-serif', fontSize: '11px', background: 'white' };
  const pageBreak: React.CSSProperties = { pageBreakBefore: 'always', paddingTop: '12mm' };

  return (
    <div className="p-6 max-w-5xl space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Link href={`/dashboard/accounts/customers/${id}`}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-3 transition-colors">
            <ArrowLeft className="h-3 w-3" /> {customer.name}
          </Link>
          <h1 className="text-base font-bold text-white">Statement of Account</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {selectedFY === 'all' ? 'All years' : `FY ${selectedFY}`} · {today}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatementFYSelector customerId={id} current={selectedFY} />
          <StatementPrintButton customerId={id} />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-700 bg-zinc-100 p-2 shadow-xl">
        <div id="rh-statement-doc" className="bg-white text-zinc-900 rounded-xl">

          {/* ══════════════════════ PAGE 1 — SOA ══════════════════════ */}
          <div style={docStyle}>

            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', borderBottom:'2.5px solid #111', paddingBottom:'10px', marginBottom:'14px' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:'12px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/Logo2_black.png" alt="Rotehügels" style={{ height:'52px', width:'auto', objectFit:'contain', marginTop:'2px' }} />
                <div>
                  <div style={{ fontSize:'15px', fontWeight:900, textTransform:'uppercase', lineHeight:1.2 }}>Rotehuegel Research Business</div>
                  <div style={{ fontSize:'15px', fontWeight:900, textTransform:'uppercase', lineHeight:1.2 }}>Consultancy Private Limited</div>
                  <div style={{ marginTop:'5px', fontSize:'9px', color:'#666', lineHeight:1.6 }}>
                    <div>{CO.addr1}</div><div>{CO.addr2}</div>
                    <div>✉ {CO.email} | 📞 {CO.phone}</div>
                  </div>
                </div>
              </div>
              <div style={{ textAlign:'right' as const }}>
                <div style={{ fontSize:'20px', fontWeight:900, textTransform:'uppercase', color:'#b45309', letterSpacing:'1px' }}>STATEMENT OF ACCOUNT</div>
                <div style={{ marginTop:'6px', fontSize:'10px', lineHeight:1.8 }}>
                  <div><strong>Date:</strong> {today}</div>
                  <div><strong>GSTIN:</strong> {CO.gstin}</div>
                  <div><strong>PAN:</strong> {CO.pan}</div>
                </div>
              </div>
            </div>

            {/* Customer info */}
            <div style={{ border:'1px solid #ddd', borderRadius:'4px', padding:'8px 12px', marginBottom:'10px' }}>
              <div style={{ fontWeight:700, fontSize:'9px', textTransform:'uppercase', marginBottom:'4px', color:'#666' }}>To</div>
              <div style={{ fontWeight:700, fontSize:'12px' }}>{customer.name}</div>
              {customer.gstin && <div style={{ fontSize:'9.5px', marginTop:'2px' }}>GSTIN: {customer.gstin}</div>}
              {billing && (
                <div style={{ fontSize:'9.5px', marginTop:'4px', lineHeight:1.6, color:'#444' }}>
                  {billing.line1}{billing.line2?`, ${billing.line2}`:''}<br />{billing.city}, {billing.state}{billing.pincode?` – ${billing.pincode}`:''}
                </div>
              )}
              {customer.email && <div style={{ fontSize:'9px', marginTop:'2px' }}>✉ {customer.email}</div>}
            </div>

            {/* Financial summary table — per FY with subtotals */}
            <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:'14px', fontSize:'9px' }}>
              <thead>
                <tr style={{ background:'#1a1a1a', color:'white' }}>
                  <th style={{ padding:'5px 8px', textAlign:'left' as const, fontWeight:700 }}>Period</th>
                  <th style={{ padding:'5px 8px', textAlign:'right' as const, fontWeight:700 }}>Base Value</th>
                  <th style={{ padding:'5px 8px', textAlign:'right' as const, fontWeight:700 }}>GST</th>
                  <th style={{ padding:'5px 8px', textAlign:'right' as const, fontWeight:700 }}>Total Invoiced</th>
                  <th style={{ padding:'5px 8px', textAlign:'right' as const, fontWeight:700, color:'#86efac' }}>Received</th>
                  <th style={{ padding:'5px 8px', textAlign:'right' as const, fontWeight:700, color:'#fcd34d' }}>TDS Deducted</th>
                  <th style={{ padding:'5px 8px', textAlign:'right' as const, fontWeight:700, color:'#fca5a5' }}>Pending</th>
                </tr>
              </thead>
              <tbody>
                {fyKeys.map((fy, i) => {
                  const a = fyAggs[fy];
                  const fyStartYear = fy.split('-')[0];
                  const fyEndYear   = String(Number(fyStartYear) + 1);
                  const fyLabel = `FY ${fy}  (1 Apr ${fyStartYear} – 31 Mar ${fyEndYear})`;
                  const bg = i === 0 ? '#f5f0ff' : '#f0fdf4';
                  const labelColor = i === 0 ? '#6d28d9' : '#065f46';
                  return (
                    <tr key={fy} style={{ background: bg }}>
                      <td style={{ padding:'6px 8px', fontWeight:700, color: labelColor, borderBottom:'1px solid #e5e7eb' }}>{fyLabel}</td>
                      <td style={{ padding:'6px 8px', textAlign:'right' as const, fontFamily:'monospace', borderBottom:'1px solid #e5e7eb' }}>{fmt(a.baseValue)}</td>
                      <td style={{ padding:'6px 8px', textAlign:'right' as const, fontFamily:'monospace', borderBottom:'1px solid #e5e7eb' }}>{fmt(a.gstAmount)}</td>
                      <td style={{ padding:'6px 8px', textAlign:'right' as const, fontFamily:'monospace', fontWeight:700, borderBottom:'1px solid #e5e7eb' }}>{fmt(a.total)}</td>
                      <td style={{ padding:'6px 8px', textAlign:'right' as const, fontFamily:'monospace', color:'#16a34a', borderBottom:'1px solid #e5e7eb' }}>{fmt(a.received)}</td>
                      <td style={{ padding:'6px 8px', textAlign:'right' as const, fontFamily:'monospace', color:'#b45309', borderBottom:'1px solid #e5e7eb' }}>{a.tdsAmount > 0 ? fmt(a.tdsAmount) : '—'}</td>
                      <td style={{ padding:'6px 8px', textAlign:'right' as const, fontFamily:'monospace', fontWeight:700, color: a.pending > 0 ? '#dc2626' : '#16a34a', borderBottom:'1px solid #e5e7eb' }}>{fmt(a.pending)}</td>
                    </tr>
                  );
                })}
                {/* Grand total */}
                <tr style={{ background:'#111827', color:'white' }}>
                  <td style={{ padding:'7px 8px', fontWeight:900, fontSize:'10px' }}>Grand Total</td>
                  <td style={{ padding:'7px 8px', textAlign:'right' as const, fontFamily:'monospace', fontWeight:700 }}>{fmt(grandBase)}</td>
                  <td style={{ padding:'7px 8px', textAlign:'right' as const, fontFamily:'monospace', fontWeight:700 }}>{fmt(grandGst)}</td>
                  <td style={{ padding:'7px 8px', textAlign:'right' as const, fontFamily:'monospace', fontWeight:900, fontSize:'11px' }}>{fmt(totalValue)}</td>
                  <td style={{ padding:'7px 8px', textAlign:'right' as const, fontFamily:'monospace', fontWeight:700, color:'#86efac' }}>{fmt(totalReceived)}</td>
                  <td style={{ padding:'7px 8px', textAlign:'right' as const, fontFamily:'monospace', color:'#fcd34d' }}>{grandTds > 0 ? fmt(grandTds) : '—'}</td>
                  <td style={{ padding:'7px 8px', textAlign:'right' as const, fontFamily:'monospace', fontWeight:900, fontSize:'12px', color:'#fca5a5' }}>{fmt(totalPending)}</td>
                </tr>
              </tbody>
            </table>

            {/* SOA table */}
            <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:'14px' }}>
              <thead>
                <tr>
                  <th style={{ ...th, width:'10%', textAlign:'left' as const }}>Order No</th>
                  <th style={{ ...th, width:'35%', textAlign:'left' as const }}>Description</th>
                  <th style={{ ...th, width:'10%' }}>Invoice Date</th>
                  <th style={{ ...th, width:'15%' }}>Order Value</th>
                  <th style={{ ...th, width:'15%' }}>Received</th>
                  <th style={{ ...th, width:'15%', color:'#c00' }}>Pending</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Split rows into FY sections
                  const getFY = (row: SoaRow) => {
                    const d = new Date(row.invoice_date ?? row.order_date);
                    return (d.getMonth() + 1) >= 4
                      ? `${d.getFullYear()}-${String(d.getFullYear()+1).slice(2)}`
                      : `${d.getFullYear()-1}-${String(d.getFullYear()).slice(2)}`;
                  };
                  const fyGroups: Record<string, SoaRow[]> = {};
                  for (const row of invoiceRows) {
                    const fy = getFY(row);
                    if (!fyGroups[fy]) fyGroups[fy] = [];
                    fyGroups[fy].push(row);
                  }
                  const fyKeys = Object.keys(fyGroups).sort();

                  return fyKeys.map((fy, fyIdx) => {
                    const fyRows = fyGroups[fy];
                    const fyValue    = fyRows.reduce((s, r) => s + r.total_value_incl_gst, 0);
                    const fyReceived = fyRows.reduce((s, r) => s + r.received, 0);
                    const fyPending  = fyRows.reduce((s, r) => s + r.pending, 0);
                    const fyStartYear = fy.split('-')[0];
                    const fyLabel = fy === '2025-26' ? 'Up to 31 Mar 2026 — FY 2025-26' : `From 1 Apr ${fyStartYear} — FY ${fy}`;

                    return (
                      <React.Fragment key={fy}>
                        {/* FY section header */}
                        <tr>
                          <td colSpan={6} style={{ ...cell, background: fyIdx === 0 ? '#1a1a2e' : '#0f2027', color: fyIdx === 0 ? '#c084fc' : '#34d399', fontWeight:800, fontSize:'9px', textTransform:'uppercase' as const, letterSpacing:'0.8px', paddingTop:'8px', paddingBottom:'8px' }}>
                            {fyIdx === 0 ? '▸ ' : '▸ '}Payments — {fyLabel}
                          </td>
                        </tr>
                        {fyRows.map((o, i) => (
                          <tr key={o.id} style={{ background: i%2===1?'#fafafa':'white' }}>
                            <td style={{ ...cell, fontFamily:'monospace', fontWeight:700 }}>
                              {o.order_no}
                              {o.stageLabel && <div style={{ fontSize:'8px', color:'#92400e', fontWeight:400, fontFamily:'sans-serif' }}>{o.stageLabel}</div>}
                            </td>
                            <td style={cell}>
                              <div style={{ fontWeight:600 }}>{o.description}</div>
                              <div style={{ fontSize:'9px', color:'#888', marginTop:'2px', textTransform:'capitalize' }}>{o.order_type}</div>
                            </td>
                            <td style={{ ...cell, textAlign:'center' as const }}>{fmtDate(o.invoice_date ?? o.order_date)}</td>
                            <td style={{ ...cell, textAlign:'right' as const, fontFamily:'monospace' }}>{fmt(o.total_value_incl_gst)}</td>
                            <td style={{ ...cell, textAlign:'right' as const, fontFamily:'monospace', color:'#16a34a' }}>{fmt(o.received)}</td>
                            <td style={{ ...cell, textAlign:'right' as const, fontFamily:'monospace', fontWeight:700, color:o.pending>0?'#c00':'#16a34a' }}>{fmt(o.pending)}</td>
                          </tr>
                        ))}
                        {/* FY subtotal */}
                        <tr style={{ background: fyIdx === 0 ? '#f3e8ff' : '#d1fae5' }}>
                          <td colSpan={3} style={{ ...cell, textAlign:'right' as const, fontWeight:800, fontSize:'9px', color: fyIdx === 0 ? '#7c3aed' : '#065f46' }}>
                            FY {fy} Subtotal
                          </td>
                          <td style={{ ...cell, textAlign:'right' as const, fontFamily:'monospace', fontWeight:800 }}>{fmt(fyValue)}</td>
                          <td style={{ ...cell, textAlign:'right' as const, fontFamily:'monospace', fontWeight:800, color:'#16a34a' }}>{fmt(fyReceived)}</td>
                          <td style={{ ...cell, textAlign:'right' as const, fontFamily:'monospace', fontWeight:800, color: fyPending > 0 ? '#c00' : '#16a34a' }}>{fmt(fyPending)}</td>
                        </tr>
                      </React.Fragment>
                    );
                  });
                })()}
                {/* Grand total */}
                <tr style={{ background:'#1a1a1a' }}>
                  <td colSpan={3} style={{ ...cell, textAlign:'right' as const, fontWeight:900, color:'white', fontSize:'10px' }}>TOTAL INVOICED</td>
                  <td style={{ ...cell, textAlign:'right' as const, fontFamily:'monospace', fontWeight:900, color:'white' }}>{fmt(totalValue)}</td>
                  <td style={{ ...cell, textAlign:'right' as const, fontFamily:'monospace', fontWeight:900, color:'#86efac' }}>{fmt(totalReceived)}</td>
                  <td style={{ ...cell, textAlign:'right' as const, fontFamily:'monospace', fontWeight:900, color:'#fca5a5', fontSize:'12px' }}>{fmt(totalPending)}</td>
                </tr>

                {/* Quotes section */}
                {(quotes ?? []).length > 0 && (
                  <>
                    <tr>
                      <td colSpan={6} style={{ ...cell, background:'#fffbeb', fontWeight:700, fontSize:'9px', color:'#92400e', textTransform:'uppercase' as const, letterSpacing:'0.5px', paddingTop:'8px' }}>
                        Pending Quotations (Not Yet Invoiced)
                      </td>
                    </tr>
                    {(quotes ?? []).map((q) => (
                      <tr key={q.id} style={{ background:'#fffdf0' }}>
                        <td style={{ ...cell, fontFamily:'monospace', fontWeight:700, color:'#92400e' }}>{q.quote_no}</td>
                        <td style={cell}>
                          <div style={{ fontWeight:600 }}>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {((q.items as any[]) ?? []).map((it: { name: string }) => it.name).join(', ')}
                          </div>
                          <div style={{ fontSize:'9px', color:'#888', marginTop:'2px' }}>Quotation · Valid until {fmtDate(q.valid_until)}</div>
                        </td>
                        <td style={{ ...cell, textAlign:'center' as const }}>{fmtDate(q.quote_date)}</td>
                        <td style={{ ...cell, textAlign:'right' as const, fontFamily:'monospace', color:'#92400e' }}>{fmt(q.total_amount)}</td>
                        <td style={{ ...cell, textAlign:'center' as const, fontSize:'9px', color:'#aaa' }}>—</td>
                        <td style={{ ...cell, textAlign:'center' as const, fontSize:'9px', color:'#92400e', fontWeight:700 }}>QUOTED</td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>

            {/* Payment request */}
            <div style={{ border:'1px solid #f0c000', background:'#fffbeb', borderRadius:'4px', padding:'8px 12px', marginBottom:'14px', fontSize:'10px' }}>
              <strong>Kindly arrange payment of the outstanding amount at the earliest.</strong>
              <span style={{ color:'#666' }}> Please use the bank details below and mention the Order No. in your payment reference.</span>
            </div>

            {/* Bank details + QR */}
            <div style={{ border:'1px solid #e0e0e0', borderRadius:'4px', padding:'8px 12px', marginBottom:'14px', fontSize:'10px' }}>
              <div style={{ fontWeight:700, marginBottom:'6px' }}>Bank Details for Payment</div>
              <div style={{ display:'flex', gap:'16px', alignItems:'flex-start' }}>
                <div style={{ lineHeight:1.8, flex:1 }}>
                  <div><strong>Bank:</strong> {CO.bank}</div>
                  <div><strong>Account No:</strong> <span style={{ fontFamily:'monospace' }}>{CO.acc}</span></div>
                  <div><strong>IFSC:</strong> <span style={{ fontFamily:'monospace' }}>{CO.ifsc}</span></div>
                  <div><strong>UPI:</strong> <span style={{ fontFamily:'monospace' }}>rotehuegels@sbi</span></div>
                </div>
                <div style={{ textAlign:'center' as const, flexShrink:0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={upiQr} alt="UPI QR" style={{ width:'80px', height:'80px', display:'block' }} />
                  <div style={{ fontSize:'8px', color:'#888', marginTop:'2px' }}>Scan to Pay (UPI)</div>
                </div>
              </div>
            </div>

            {/* SOA footer */}
            <div style={{ borderTop:'1px solid #ddd', paddingTop:'10px', display:'flex', justifyContent:'space-between', fontSize:'9px', color:'#888' }}>
              <div>
                <div>This is a computer-generated statement of account.</div>
                <div>For discrepancies, contact {CO.email}</div>
                <div>Subject to Chennai jurisdiction. | Detailed invoices follow on next pages.</div>
              </div>
              <div style={{ textAlign:'right' as const }}>
                <div>For Rotehuegel Research Business Consultancy Pvt Ltd</div>
                {sigBase64 && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sigBase64} alt="" style={{ height:'44px', width:'auto', marginTop:'4px', marginLeft:'auto', display:'block', mixBlendMode:'multiply' }} />
                )}
                <div style={{ fontWeight:700, color:'#333', marginTop:'2px' }}>Authorised Signatory</div>
              </div>
            </div>
          </div>

          {/* ══════════════════════ PAGES 2+ — INVOICES ══════════════════════ */}
          {invoiceRows.map(o => {
            const fy = getFY(o.invoice_date ?? o.order_date);
            const invoiceNo = `RH/${fy}/${o.order_no}`;
            const invoiceDate = fmtDate(o.invoice_date ?? o.order_date);
            // Intra-state if no IGST. Defaults to true (intra) when fields are absent (stage-group rows, always TN supplier).
            const isIntra = (o.igst_amount ?? 0) === 0;
            const gstRate = Number(o.gst_rate ?? 18);
            const halfRate = gstRate / 2;
            const sacHsn = o.hsn_sac_code ?? (o.order_type === 'service' ? '9983' : '—');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const items: Array<{ description: string; qty?: string; hsn: string; base: number; cgst: number; sgst: number; igst: number; total: number }> = Array.isArray((o as any).items) ? (o as any).items : [];
            const stages = (o.stages ?? []) as Array<{ id: string; stage_name: string; amount_due: number; gst_on_stage: number; tds_amount?: number }>;
            const descColspan = items.length > 0 ? 4 : 3;

            const invCell: React.CSSProperties = { border: '1px solid #ddd', padding: '7px 6px', fontSize: '9.5px' };
            const invTh: React.CSSProperties = { border: '1px solid #555', padding: '5px 6px', fontSize: '9.5px', background: '#1a1a1a', color: 'white' };

            return (
              <div key={o.id} style={{ ...docStyle, ...pageBreak }}>

                {/* Invoice header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', borderBottom:'2.5px solid #111', paddingBottom:'10px', marginBottom:'12px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:'12px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/assets/Logo2_black.png" alt="Rotehügels" style={{ height:'52px', width:'auto', objectFit:'contain', marginTop:'2px' }} />
                    <div>
                      <div style={{ fontSize:'15px', fontWeight:900, textTransform:'uppercase', lineHeight:1.2 }}>Rotehuegel Research Business</div>
                      <div style={{ fontSize:'15px', fontWeight:900, textTransform:'uppercase', lineHeight:1.2 }}>Consultancy Private Limited</div>
                      <div style={{ marginTop:'5px', fontSize:'9px', color:'#666', lineHeight:1.6 }}>
                        <div>{CO.addr1}</div><div>{CO.addr2}</div>
                        <div>✉ {CO.email} | 📞 {CO.phone} | 🌐 {CO.web}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' as const, flexShrink:0, marginLeft:'12px' }}>
                    <div style={{ display:'inline-block', border:'2px solid #111', padding:'4px 10px', marginBottom:'6px' }}>
                      <span style={{ fontSize:'13px', fontWeight:900, letterSpacing:'1px' }}>TAX INVOICE</span>
                    </div>
                    <div style={{ fontSize:'9px', color:'#555', lineHeight:1.8 }}>
                      <div><strong>GSTIN:</strong> {CO.gstin}</div>
                      <div><strong>PAN:</strong> {CO.pan}</div>
                      <div><strong>CIN:</strong> {CO.cin}</div>
                      <div><strong>TAN:</strong> {CO.tan}</div>
                    </div>
                  </div>
                </div>

                {/* Bill To + Invoice details */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' }}>
                  <div style={{ border:'1px solid #ddd', borderRadius:'4px', padding:'8px 10px' }}>
                    <div style={{ fontSize:'8px', fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'5px' }}>Bill To</div>
                    <div style={{ fontSize:'12px', fontWeight:800, color:'#111', marginBottom:'2px' }}>{o.client_name}</div>
                    {o.client_address && <div style={{ fontSize:'8.5px', color:'#555', lineHeight:1.5, marginBottom:'3px' }}>{o.client_address}</div>}
                    {o.client_gstin && <div style={{ fontSize:'9px', color:'#555', fontFamily:'monospace' }}>GSTIN: {o.client_gstin}</div>}
                  </div>
                  <div style={{ border:'1px solid #ddd', borderRadius:'4px', padding:'8px 10px' }}>
                    <table style={{ width:'100%', fontSize:'9px', borderCollapse:'collapse' }}>
                      <tbody>
                        {[
                          ['Invoice No.', <span key="inv" style={{ fontFamily:'monospace', fontWeight:800 }}>{invoiceNo}</span>],
                          ['Invoice Date', invoiceDate],
                          ['Order Ref.', o.order_no],
                          ['Place of Supply', o.place_of_supply ?? 'Tamil Nadu (33)'],
                          ['Supply Type', isIntra ? 'Intra-State' : 'Inter-State'],
                        ].map(([label, value]) => (
                          <tr key={String(label)}>
                            <td style={{ color:'#888', paddingRight:'8px', paddingBottom:'3px', whiteSpace:'nowrap' as const, fontWeight:600 }}>{label}</td>
                            <td style={{ color:'#111', paddingBottom:'3px' }}>{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Items table */}
                <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:'12px', fontSize:'9.5px' }}>
                  <thead>
                    <tr>
                      <th style={{ ...invTh, textAlign:'left' as const, width:'20px' }}>#</th>
                      <th style={{ ...invTh, textAlign:'left' as const }}>Description</th>
                      {items.length > 0 && <th style={{ ...invTh, textAlign:'center' as const, width:'45px' }}>Qty</th>}
                      <th style={{ ...invTh, textAlign:'center' as const, width:'55px' }}>SAC/HSN</th>
                      <th style={{ ...invTh, textAlign:'right' as const, width:'90px' }}>Taxable (₹)</th>
                      {isIntra ? (
                        <>
                          <th style={{ ...invTh, textAlign:'right' as const, width:'75px' }}>CGST {halfRate}%</th>
                          <th style={{ ...invTh, textAlign:'right' as const, width:'75px' }}>SGST {halfRate}%</th>
                        </>
                      ) : (
                        <th style={{ ...invTh, textAlign:'right' as const, width:'90px' }}>IGST {gstRate}%</th>
                      )}
                      <th style={{ ...invTh, textAlign:'right' as const, width:'90px' }}>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length > 0 ? items.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ ...invCell, verticalAlign:'top' as const }}>{idx+1}</td>
                        <td style={{ ...invCell, verticalAlign:'top' as const }}><div style={{ fontWeight:700 }}>{item.description}</div></td>
                        <td style={{ ...invCell, textAlign:'center' as const, verticalAlign:'top' as const }}>{item.qty ?? '—'}</td>
                        <td style={{ ...invCell, textAlign:'center' as const, fontFamily:'monospace', fontWeight:700 }}>{item.hsn}</td>
                        <td style={{ ...invCell, textAlign:'right' as const }}>{fmt(item.base)}</td>
                        {isIntra ? (
                          <>
                            <td style={{ ...invCell, textAlign:'right' as const }}>{fmt(item.cgst)}</td>
                            <td style={{ ...invCell, textAlign:'right' as const }}>{fmt(item.sgst)}</td>
                          </>
                        ) : (
                          <td style={{ ...invCell, textAlign:'right' as const }}>{fmt(item.igst)}</td>
                        )}
                        <td style={{ ...invCell, textAlign:'right' as const, fontWeight:700 }}>{fmt(item.total)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td style={{ ...invCell, verticalAlign:'top' as const }}>1</td>
                        <td style={{ ...invCell, verticalAlign:'top' as const }}>
                          <div style={{ fontWeight:700, marginBottom:'3px' }}>{o.description}</div>
                          {stages.length > 1 && stages.map((s) => (
                            <div key={s.id} style={{ fontSize:'8.5px', color:'#666', marginTop:'2px' }}>
                              • {s.stage_name}: {fmt(s.amount_due)} + GST {fmt(s.gst_on_stage ?? 0)}
                            </div>
                          ))}
                        </td>
                        <td style={{ ...invCell, textAlign:'center' as const, fontFamily:'monospace', fontWeight:700 }}>{sacHsn}</td>
                        <td style={{ ...invCell, textAlign:'right' as const }}>{fmt(o.base_value ?? 0)}</td>
                        {isIntra ? (
                          <>
                            <td style={{ ...invCell, textAlign:'right' as const }}>{fmt(o.cgst_amount ?? 0)}</td>
                            <td style={{ ...invCell, textAlign:'right' as const }}>{fmt(o.sgst_amount ?? 0)}</td>
                          </>
                        ) : (
                          <td style={{ ...invCell, textAlign:'right' as const }}>{fmt(o.igst_amount ?? 0)}</td>
                        )}
                        <td style={{ ...invCell, textAlign:'right' as const, fontWeight:700 }}>{fmt(o.total_value_incl_gst)}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={{ background:'#f5f5f5' }}>
                      <td colSpan={descColspan} style={{ ...invCell, textAlign:'right' as const, fontWeight:700 }}>Total</td>
                      <td style={{ ...invCell, textAlign:'right' as const, fontWeight:700 }}>{fmt(o.base_value ?? 0)}</td>
                      {isIntra ? (
                        <>
                          <td style={{ ...invCell, textAlign:'right' as const, fontWeight:700 }}>{fmt(o.cgst_amount ?? 0)}</td>
                          <td style={{ ...invCell, textAlign:'right' as const, fontWeight:700 }}>{fmt(o.sgst_amount ?? 0)}</td>
                        </>
                      ) : (
                        <td style={{ ...invCell, textAlign:'right' as const, fontWeight:700 }}>{fmt(o.igst_amount ?? 0)}</td>
                      )}
                      <td style={{ ...invCell, textAlign:'right' as const, fontWeight:900, fontSize:'11px' }}>{fmt(o.total_value_incl_gst)}</td>
                    </tr>
                  </tfoot>
                </table>

                {/* Amount in words */}
                <div style={{ border:'1px solid #ddd', borderRadius:'4px', padding:'8px 10px', marginBottom:'12px' }}>
                  <div style={{ fontSize:'8px', fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'3px' }}>Amount in Words</div>
                  <div style={{ fontSize:'11px', fontWeight:800, color:'#111' }}>{amountInWords(o.total_value_incl_gst)}</div>
                </div>

                {/* Bank + Signature */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' }}>
                  <div style={{ border:'1px solid #ddd', borderRadius:'4px', padding:'8px 10px' }}>
                    <div style={{ fontSize:'8px', fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'6px' }}>Bank Details</div>
                    <div style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                      <table style={{ fontSize:'9px', borderCollapse:'collapse', flex:1 }}>
                        <tbody>
                          {[['A/c No.', CO.acc],['IFSC', CO.ifsc],['Bank', CO.bank],['UPI', 'rotehuegels@sbi']].map(([l,v]) => (
                            <tr key={l}><td style={{ color:'#888', paddingRight:'8px', paddingBottom:'3px', whiteSpace:'nowrap' as const, fontWeight:600 }}>{l}</td><td style={{ paddingBottom:'3px', fontFamily: l==='A/c No.'||l==='IFSC'||l==='UPI'?'monospace':'inherit' }}>{v}</td></tr>
                          ))}
                        </tbody>
                      </table>
                      <div style={{ textAlign:'center' as const, flexShrink:0 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={upiQr} alt="UPI QR" style={{ width:'72px', height:'72px', display:'block' }} />
                        <div style={{ fontSize:'7px', color:'#888', marginTop:'2px' }}>Scan to Pay</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ border:'1px solid #ddd', borderRadius:'4px', padding:'8px 10px', display:'flex', flexDirection:'column' as const, justifyContent:'space-between' }}>
                    <div style={{ fontSize:'8.5px', color:'#666', lineHeight:1.5 }}>
                      We declare that this invoice shows the actual price of goods/services described and all particulars are true and correct.
                    </div>
                    <div style={{ textAlign:'right' as const, marginTop:'8px' }}>
                      <div style={{ fontSize:'9px', fontWeight:700, color:'#444', textTransform:'uppercase' as const }}>
                        For Rotehuegel Research Business<br />Consultancy Private Limited
                      </div>
                      {sigBase64 && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={sigBase64} alt="" style={{ height:'48px', width:'auto', marginLeft:'auto', display:'block', marginTop:'6px', mixBlendMode:'multiply' }} />
                      )}
                      <div style={{ borderBottom:'1px solid #bbb', marginBottom:'3px' }}></div>
                      <div style={{ fontSize:'9px', fontWeight:700, color:'#111' }}>Sivakumar Shanmugam</div>
                      <div style={{ fontSize:'8px', color:'#555' }}>CEO, Rotehügels | Authorised Signatory</div>
                    </div>
                  </div>
                </div>

                {/* Invoice footer */}
                <div style={{ borderTop:'1px solid #e0e0e0', paddingTop:'6px', textAlign:'center' as const, fontSize:'8px', color:'#aaa', lineHeight:1.6 }}>
                  Computer-generated invoice. | {CO.web} | {CO.email} | {CO.phone}
                </div>
              </div>
            );
          })}

          {/* ══════════════════════ QUOTE PAGES ══════════════════════ */}
          {(quotes ?? []).map(q => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const customer = q.customers as any;
            const billing  = customer?.billing_address as Record<string, string> | null;
            const items = (q.items ?? []) as Array<{
              sku_id: string; name: string; unit: string;
              hsn_code?: string; sac_code?: string;
              quantity: number; unit_price: number; discount_pct: number;
              taxable_amount: number; gst_rate: number; gst_amount: number;
              cgst_rate: number; sgst_rate: number; igst_rate: number; total: number;
            }>;
            const isIntra = customer?.state_code === '33' || customer?.state?.toLowerCase().includes('tamil');
            const qCell: React.CSSProperties = { border:'1px solid #ddd', padding:'6px 8px', fontSize:'10px' };
            const qTh: React.CSSProperties = { ...qCell, background:'#f5f5f5', fontWeight:700, textAlign:'center' as const };

            return (
              <div key={q.id} style={{ ...docStyle, ...pageBreak }}>

                {/* Quote header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', borderBottom:'2.5px solid #111', paddingBottom:'10px', marginBottom:'14px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:'12px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/assets/Logo2_black.png" alt="Rotehügels" style={{ height:'52px', width:'auto', objectFit:'contain', marginTop:'2px' }} />
                    <div>
                      <div style={{ fontSize:'15px', fontWeight:900, textTransform:'uppercase', lineHeight:1.2 }}>Rotehuegel Research Business</div>
                      <div style={{ fontSize:'15px', fontWeight:900, textTransform:'uppercase', lineHeight:1.2 }}>Consultancy Private Limited</div>
                      <div style={{ marginTop:'5px', fontSize:'9px', color:'#666', lineHeight:1.6 }}>
                        <div>{CO.addr1}</div><div>{CO.addr2}</div>
                        <div>✉ {CO.email} | 📞 {CO.phone} | 🌐 {CO.web}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' as const }}>
                    <div style={{ fontSize:'22px', fontWeight:900, textTransform:'uppercase', color:'#b45309', letterSpacing:'1px' }}>QUOTATION</div>
                    <div style={{ fontSize:'9.5px', color:'#555', fontStyle:'italic', marginTop:'2px' }}>Not a tax invoice</div>
                    <div style={{ marginTop:'6px', fontSize:'10px', lineHeight:1.8 }}>
                      <div><strong>Quote No:</strong> {q.quote_no}</div>
                      <div><strong>Date:</strong> {fmtDate(q.quote_date)}</div>
                      {q.valid_until && <div><strong>Valid Until:</strong> {fmtDate(q.valid_until)}</div>}
                    </div>
                  </div>
                </div>

                {/* Company strip */}
                <div style={{ display:'flex', gap:'8px', marginBottom:'14px', fontSize:'9.5px' }}>
                  <div style={{ background:'#f5f5f5', border:'1px solid #e0e0e0', borderRadius:'4px', padding:'5px 10px', lineHeight:1.7 }}>
                    <div><strong>GSTIN:</strong> {CO.gstin}</div>
                    <div><strong>PAN:</strong> {CO.pan}</div>
                    <div><strong>CIN:</strong> {CO.cin}</div>
                  </div>
                </div>

                {/* Quoted To / Quote Details */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'14px' }}>
                  <div style={{ border:'1px solid #ddd', borderRadius:'4px', padding:'8px 10px' }}>
                    <div style={{ fontWeight:700, fontSize:'9px', textTransform:'uppercase', marginBottom:'5px', color:'#666' }}>Quoted To</div>
                    <div style={{ fontWeight:700, fontSize:'11px' }}>{customer?.name}</div>
                    {customer?.gstin && <div style={{ fontSize:'9.5px', marginTop:'2px' }}>GSTIN: {customer.gstin}</div>}
                    {billing && (
                      <div style={{ fontSize:'9.5px', marginTop:'4px', lineHeight:1.6, color:'#444' }}>
                        {billing.line1}{billing.line2?`, ${billing.line2}`:''}<br />{billing.city}, {billing.state}{billing.pincode?` – ${billing.pincode}`:''}
                      </div>
                    )}
                    {customer?.email && <div style={{ fontSize:'9px', marginTop:'3px' }}>✉ {customer.email}</div>}
                  </div>
                  <div style={{ border:'1px solid #ddd', borderRadius:'4px', padding:'8px 10px' }}>
                    <div style={{ fontWeight:700, fontSize:'9px', textTransform:'uppercase', marginBottom:'5px', color:'#666' }}>Quote Details</div>
                    <div style={{ fontSize:'10px', lineHeight:1.8 }}>
                      <div><strong>Quote No:</strong> {q.quote_no}</div>
                      <div><strong>Date:</strong> {fmtDate(q.quote_date)}</div>
                      {q.valid_until && <div><strong>Valid Until:</strong> {fmtDate(q.valid_until)}</div>}
                      <div><strong>Place of Supply:</strong> {isIntra ? 'Tamil Nadu (33)' : (customer?.state ?? '—')}</div>
                      <div><strong>GST Type:</strong> {isIntra ? 'CGST + SGST' : 'IGST'}</div>
                    </div>
                  </div>
                </div>

                {/* Items table */}
                <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:'12px' }}>
                  <thead>
                    <tr>
                      <th style={{ ...qTh, width:'4%' }}>#</th>
                      <th style={{ ...qTh, width:'30%', textAlign:'left' as const }}>Description</th>
                      <th style={{ ...qTh, width:'8%' }}>HSN/SAC</th>
                      <th style={{ ...qTh, width:'6%' }}>Qty</th>
                      <th style={{ ...qTh, width:'6%' }}>Unit</th>
                      <th style={{ ...qTh, width:'10%' }}>Rate (₹)</th>
                      <th style={{ ...qTh, width:'6%' }}>Disc%</th>
                      <th style={{ ...qTh, width:'10%' }}>Taxable (₹)</th>
                      {isIntra ? (
                        <>
                          <th style={{ ...qTh, width:'8%' }}>CGST</th>
                          <th style={{ ...qTh, width:'8%' }}>SGST</th>
                        </>
                      ) : (
                        <th style={{ ...qTh, width:'10%' }}>IGST</th>
                      )}
                      <th style={{ ...qTh, width:'10%' }}>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => {
                      const halfGst = parseFloat((item.gst_amount / 2).toFixed(2));
                      return (
                        <tr key={i} style={{ background: i%2===1?'#fafafa':'white' }}>
                          <td style={{ ...qCell, textAlign:'center' as const }}>{i+1}</td>
                          <td style={qCell}>
                            <div style={{ fontWeight:600 }}>{item.name}</div>
                            {item.sku_id && <div style={{ fontSize:'9px', color:'#888' }}>{item.sku_id}</div>}
                          </td>
                          <td style={{ ...qCell, textAlign:'center' as const, fontFamily:'monospace' }}>{item.hsn_code || item.sac_code || '—'}</td>
                          <td style={{ ...qCell, textAlign:'right' as const }}>{item.quantity}</td>
                          <td style={{ ...qCell, textAlign:'center' as const }}>{item.unit}</td>
                          <td style={{ ...qCell, textAlign:'right' as const }}>{fmt(item.unit_price)}</td>
                          <td style={{ ...qCell, textAlign:'center' as const }}>{item.discount_pct > 0 ? `${item.discount_pct}%` : '—'}</td>
                          <td style={{ ...qCell, textAlign:'right' as const }}>{fmt(item.taxable_amount)}</td>
                          {isIntra ? (
                            <>
                              <td style={{ ...qCell, textAlign:'right' as const }}>{fmt(halfGst)}<br /><span style={{ fontSize:'8px', color:'#888' }}>{item.gst_rate/2}%</span></td>
                              <td style={{ ...qCell, textAlign:'right' as const }}>{fmt(halfGst)}<br /><span style={{ fontSize:'8px', color:'#888' }}>{item.gst_rate/2}%</span></td>
                            </>
                          ) : (
                            <td style={{ ...qCell, textAlign:'right' as const }}>{fmt(item.gst_amount)}<br /><span style={{ fontSize:'8px', color:'#888' }}>{item.gst_rate}%</span></td>
                          )}
                          <td style={{ ...qCell, textAlign:'right' as const, fontWeight:700 }}>{fmt(item.total)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Totals */}
                <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'14px' }}>
                  <table style={{ borderCollapse:'collapse', minWidth:'240px' }}>
                    <tbody>
                      <tr><td style={{ ...qCell, textAlign:'right' as const, color:'#666' }}>Taxable Value</td><td style={{ ...qCell, textAlign:'right' as const, fontFamily:'monospace' }}>{fmt(q.taxable_value)}</td></tr>
                      {isIntra ? (
                        <>
                          <tr><td style={{ ...qCell, textAlign:'right' as const, color:'#666' }}>CGST</td><td style={{ ...qCell, textAlign:'right' as const, fontFamily:'monospace' }}>{fmt(q.cgst_amount)}</td></tr>
                          <tr><td style={{ ...qCell, textAlign:'right' as const, color:'#666' }}>SGST</td><td style={{ ...qCell, textAlign:'right' as const, fontFamily:'monospace' }}>{fmt(q.sgst_amount)}</td></tr>
                        </>
                      ) : (
                        <tr><td style={{ ...qCell, textAlign:'right' as const, color:'#666' }}>IGST</td><td style={{ ...qCell, textAlign:'right' as const, fontFamily:'monospace' }}>{fmt(q.igst_amount)}</td></tr>
                      )}
                      <tr style={{ background:'#f0f0f0' }}>
                        <td style={{ ...qCell, textAlign:'right' as const, fontWeight:900, fontSize:'12px' }}>GRAND TOTAL</td>
                        <td style={{ ...qCell, textAlign:'right' as const, fontWeight:900, fontSize:'12px', fontFamily:'monospace' }}>{fmt(q.total_amount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Notes & Terms */}
                {(q.notes || q.terms) && (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'14px' }}>
                    {q.notes && (
                      <div style={{ border:'1px solid #e0e0e0', borderRadius:'4px', padding:'8px 10px' }}>
                        <div style={{ fontWeight:700, fontSize:'9px', textTransform:'uppercase', marginBottom:'4px', color:'#666' }}>Notes</div>
                        <div style={{ fontSize:'10px', lineHeight:1.6 }}>{q.notes}</div>
                      </div>
                    )}
                    {q.terms && (
                      <div style={{ border:'1px solid #e0e0e0', borderRadius:'4px', padding:'8px 10px' }}>
                        <div style={{ fontWeight:700, fontSize:'9px', textTransform:'uppercase', marginBottom:'4px', color:'#666' }}>Terms &amp; Conditions</div>
                        <div style={{ fontSize:'10px', lineHeight:1.6 }}>{q.terms}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Quote footer */}
                <div style={{ borderTop:'1px solid #ddd', paddingTop:'10px', display:'flex', justifyContent:'space-between', fontSize:'9px', color:'#888' }}>
                  <div>
                    <div>This is a quotation and not a tax invoice.</div>
                    <div>Prices are subject to change without notice after validity date.</div>
                    <div>Subject to Chennai jurisdiction.</div>
                  </div>
                  <div style={{ textAlign:'right' as const }}>
                    <div>For Rotehuegel Research Business Consultancy Pvt Ltd</div>
                    {sigBase64 && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sigBase64} alt="" style={{ height:'44px', width:'auto', marginTop:'4px', marginLeft:'auto', display:'block', mixBlendMode:'multiply' }} />
                    )}
                    <div style={{ fontWeight:700, color:'#333', marginTop:'2px' }}>Authorised Signatory</div>
                  </div>
                </div>

              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}
