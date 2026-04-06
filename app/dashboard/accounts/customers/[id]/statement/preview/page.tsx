import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import PDFViewer from '@/components/PDFViewer';
import { getLogoBase64, getSignatureBase64 } from '@/lib/serverAssets';
import QRCode from 'qrcode';

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

export default async function StatementPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: customer, error: custErr } = await supabaseAdmin
    .from('customers').select('*').eq('id', id).single();
  if (custErr || !customer) notFound();

  const logoSrc = getLogoBase64();
  const sigSrc  = getSignatureBase64();

  const upiQr = await QRCode.toDataURL(
    `upi://pay?pa=rotehuegels@sbi&pn=Rotehuegel+Research+Business+Consultancy+Pvt+Ltd&cu=INR`,
    { width: 80, margin: 1, color: { dark: '#111111', light: '#ffffff' } }
  );

  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('customer_id', id)
    .neq('status', 'cancelled')
    .neq('order_category', 'reimbursement')
    .order('invoice_date', { ascending: true, nullsFirst: false });

  const orderIds = (orders ?? []).map(o => o.id);

  const [{ data: allPayments }, { data: allStages }, { data: quotes }] = await Promise.all([
    supabaseAdmin.from('order_payments').select('order_id, amount_received')
      .in('order_id', orderIds.length ? orderIds : ['00000000-0000-0000-0000-000000000000']),
    supabaseAdmin.from('order_payment_stages').select('*')
      .in('order_id', orderIds.length ? orderIds : ['00000000-0000-0000-0000-000000000000'])
      .order('stage_number'),
    supabaseAdmin.from('quotes').select('*, customers(*)')
      .eq('customer_id', id)
      .not('status', 'in', '("rejected","expired","converted")')
      .order('quote_date', { ascending: true }),
  ]);

  const paymentMap: Record<string, number> = {};
  for (const p of allPayments ?? []) {
    paymentMap[p.order_id] = (paymentMap[p.order_id] ?? 0) + (p.amount_received ?? 0);
  }
  const stagesMap: Record<string, typeof allStages> = {};
  for (const s of allStages ?? []) {
    if (!stagesMap[s.order_id]) stagesMap[s.order_id] = [];
    stagesMap[s.order_id]!.push(s);
  }

  const rows = (orders ?? []).map(o => ({
    ...o,
    received: paymentMap[o.id] ?? 0,
    pending:  (o.total_value_incl_gst ?? 0) - (paymentMap[o.id] ?? 0),
    stages:   stagesMap[o.id] ?? [],
  }));

  const invoiceRows = rows.filter(o => (o.total_value_incl_gst ?? 0) > 0);

  const totalValue    = invoiceRows.reduce((s, o) => s + o.total_value_incl_gst, 0);
  const totalReceived = invoiceRows.reduce((s, o) => s + o.received, 0);
  const totalPending  = invoiceRows.reduce((s, o) => s + o.pending, 0);

  const billing = customer.billing_address as Record<string, string> | null;
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const cell: React.CSSProperties = { border: '1px solid #ddd', padding: '6px 8px', fontSize: '10px' };
  const th: React.CSSProperties   = { ...cell, background: '#f5f5f5', fontWeight: 700, textAlign: 'center' as const };
  // Each section is captured individually — width must be set so html-to-image renders at A4 width
  const docStyle: React.CSSProperties = { width: '210mm', padding: '12mm 16mm', fontFamily: 'Arial, sans-serif', fontSize: '11px', background: 'white', color: '#111' };

  const pageIds = [
    'rh-stmt-p-soa',
    ...invoiceRows.map(o => `rh-stmt-p-inv-${o.id}`),
    ...(quotes ?? []).map(q => `rh-stmt-p-qt-${q.id}`),
  ];

  return (
    <PDFViewer
      pages={pageIds}
      filename={`SOA-${customer.name.replace(/\s+/g, '-')}.pdf`}
      toolbar={
        <div className="flex items-center gap-3">
          <a href={`/dashboard/accounts/customers/${id}/statement`}
            className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            ← Back to Statement
          </a>
          <span className="text-zinc-700">|</span>
          <span className="text-xs text-zinc-500">Statement of Account</span>
          <span className="text-sm text-amber-400 font-bold">{customer.name}</span>
        </div>
      }
    >
      <div>

          {/* ══════════════════════ PAGE 1 — SOA ══════════════════════ */}
          <div id="rh-stmt-p-soa" style={docStyle}>

            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', borderBottom:'2.5px solid #111', paddingBottom:'10px', marginBottom:'14px' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:'12px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoSrc} alt="Rotehügels" style={{ height:'52px', width:'auto', objectFit:'contain', marginTop:'2px' }} />
                <div>
                  <div style={{ fontSize:'11px', fontWeight:900, textTransform:'uppercase', lineHeight:1.2 }}>Rotehuegel Research Business</div>
                  <div style={{ fontSize:'11px', fontWeight:900, textTransform:'uppercase', lineHeight:1.2 }}>Consultancy Private Limited</div>
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

            {/* Customer + summary */}
            <div style={{ border:'1px solid #ddd', borderRadius:'4px', padding:'8px 12px', marginBottom:'14px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
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
              <div style={{ textAlign:'right' as const, fontSize:'10px', lineHeight:1.8 }}>
                <div style={{ fontSize:'9px', color:'#555', marginBottom:'4px' }}>Outstanding Summary</div>
                <div><strong>Total Billed:</strong> <span style={{ fontFamily:'monospace' }}>{fmt(totalValue)}</span></div>
                <div><strong>Total Received:</strong> <span style={{ fontFamily:'monospace', color:'#16a34a' }}>{fmt(totalReceived)}</span></div>
                <div style={{ fontSize:'12px', fontWeight:900, color:'#c00', marginTop:'4px', borderTop:'1px solid #ddd', paddingTop:'4px' }}>
                  Total Pending: {fmt(totalPending)}
                </div>
              </div>
            </div>

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
                {invoiceRows.map((o, i) => (
                  <tr key={o.id} style={{ background: i%2===1?'#fafafa':'white' }}>
                    <td style={{ ...cell, fontFamily:'monospace', fontWeight:700 }}>{o.order_no}</td>
                    <td style={cell}>
                      <div style={{ fontWeight:600 }}>{o.description}</div>
                      <div style={{ fontSize:'9px', color:'#555', marginTop:'2px', textTransform:'capitalize' }}>{o.order_type}</div>
                    </td>
                    <td style={{ ...cell, textAlign:'center' as const }}>{fmtDate(o.invoice_date ?? o.order_date)}</td>
                    <td style={{ ...cell, textAlign:'right' as const, fontFamily:'monospace' }}>{fmt(o.total_value_incl_gst)}</td>
                    <td style={{ ...cell, textAlign:'right' as const, fontFamily:'monospace', color:'#16a34a' }}>{fmt(o.received)}</td>
                    <td style={{ ...cell, textAlign:'right' as const, fontFamily:'monospace', fontWeight:700, color:o.pending>0?'#c00':'#16a34a' }}>{fmt(o.pending)}</td>
                  </tr>
                ))}
                <tr style={{ background:'#f0f0f0' }}>
                  <td colSpan={3} style={{ ...cell, textAlign:'right' as const, fontWeight:900 }}>INVOICED TOTAL</td>
                  <td style={{ ...cell, textAlign:'right' as const, fontFamily:'monospace', fontWeight:900 }}>{fmt(totalValue)}</td>
                  <td style={{ ...cell, textAlign:'right' as const, fontFamily:'monospace', fontWeight:900, color:'#16a34a' }}>{fmt(totalReceived)}</td>
                  <td style={{ ...cell, textAlign:'right' as const, fontFamily:'monospace', fontWeight:900, color:'#c00', fontSize:'12px' }}>{fmt(totalPending)}</td>
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
                          <div style={{ fontSize:'9px', color:'#555', marginTop:'2px' }}>Quotation · Valid until {fmtDate(q.valid_until)}</div>
                        </td>
                        <td style={{ ...cell, textAlign:'center' as const }}>{fmtDate(q.quote_date)}</td>
                        <td style={{ ...cell, textAlign:'right' as const, fontFamily:'monospace', color:'#92400e' }}>{fmt(q.total_amount)}</td>
                        <td style={{ ...cell, textAlign:'center' as const, fontSize:'9px', color:'#777' }}>—</td>
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
                  <div style={{ fontSize:'8px', color:'#555', marginTop:'2px' }}>Scan to Pay (UPI)</div>
                </div>
              </div>
            </div>

            {/* SOA footer */}
            <div style={{ borderTop:'1px solid #ddd', paddingTop:'10px', display:'flex', justifyContent:'space-between', fontSize:'9px', color:'#555' }}>
              <div>
                <div>This is a computer-generated statement of account.</div>
                <div>For discrepancies, contact {CO.email}</div>
                <div>Subject to Chennai jurisdiction. | Detailed invoices follow on next pages.</div>
              </div>
              <div style={{ textAlign:'right' as const }}>
                <div>For Rotehuegel Research Business Consultancy Pvt Ltd</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sigSrc} alt="" style={{ height:'44px', width:'auto', marginTop:'4px', marginLeft:'auto', display:'block', mixBlendMode:'multiply' }} />
                <div style={{ fontWeight:700, color:'#333', marginTop:'2px' }}>Authorised Signatory</div>
              </div>
            </div>
          </div>

          {/* ══════════════════════ PAGES 2+ — INVOICES ══════════════════════ */}
          {invoiceRows.map((o) => {
            const fy = getFY(o.invoice_date ?? o.order_date);
            const invoiceNo = `RH/${fy}/${o.order_no}`;
            const invoiceDate = fmtDate(o.invoice_date ?? o.order_date);
            const isIntra = (o.igst_amount ?? 0) === 0 && (o.cgst_amount ?? 0) > 0;
            const gstRate = Number(o.gst_rate ?? 18);
            const halfRate = gstRate / 2;
            const sacHsn = o.hsn_sac_code ?? (o.order_type === 'service' ? '9983' : '—');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const items: Array<{ description: string; qty?: string; hsn: string; base: number; cgst: number; sgst: number; igst: number; total: number }> = Array.isArray((o as any).items) ? (o as any).items : [];
            const stages = o.stages ?? [];
            const descColspan = items.length > 0 ? 4 : 3;

            const invCell: React.CSSProperties = { border: '1px solid #ddd', padding: '7px 6px', fontSize: '9.5px' };
            const invTh: React.CSSProperties = { border: '1px solid #555', padding: '5px 6px', fontSize: '9.5px', background: '#1a1a1a', color: 'white' };

            return (
              <div key={o.id} id={`rh-stmt-p-inv-${o.id}`} style={docStyle}>

                {/* Invoice header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', borderBottom:'2.5px solid #111', paddingBottom:'10px', marginBottom:'12px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:'12px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoSrc} alt="Rotehügels" style={{ height:'52px', width:'auto', objectFit:'contain', marginTop:'2px' }} />
                    <div>
                      <div style={{ fontSize:'11px', fontWeight:900, textTransform:'uppercase', lineHeight:1.2 }}>Rotehuegel Research Business</div>
                      <div style={{ fontSize:'11px', fontWeight:900, textTransform:'uppercase', lineHeight:1.2 }}>Consultancy Private Limited</div>
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
                    <div style={{ fontSize:'8px', fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'5px' }}>Bill To</div>
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
                            <td style={{ color:'#555', paddingRight:'8px', paddingBottom:'3px', whiteSpace:'nowrap' as const, fontWeight:600 }}>{label}</td>
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
                          {stages.length > 1 && stages.map((s: { id: string; stage_name: string; amount_due: number; gst_on_stage: number; tds_amount?: number }) => (
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
                  <div style={{ fontSize:'8px', fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'3px' }}>Amount in Words</div>
                  <div style={{ fontSize:'11px', fontWeight:800, color:'#111' }}>{amountInWords(o.total_value_incl_gst)}</div>
                </div>

                {/* Bank + Signature */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' }}>
                  <div style={{ border:'1px solid #ddd', borderRadius:'4px', padding:'8px 10px' }}>
                    <div style={{ fontSize:'8px', fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'6px' }}>Bank Details</div>
                    <div style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                      <table style={{ fontSize:'9px', borderCollapse:'collapse', flex:1 }}>
                        <tbody>
                          {[['A/c No.', CO.acc],['IFSC', CO.ifsc],['Bank', CO.bank],['UPI', 'rotehuegels@sbi']].map(([l,v]) => (
                            <tr key={l}><td style={{ color:'#555', paddingRight:'8px', paddingBottom:'3px', whiteSpace:'nowrap' as const, fontWeight:600 }}>{l}</td><td style={{ paddingBottom:'3px', fontFamily: l==='A/c No.'||l==='IFSC'||l==='UPI'?'monospace':'inherit' }}>{v}</td></tr>
                          ))}
                        </tbody>
                      </table>
                      <div style={{ textAlign:'center' as const, flexShrink:0 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={upiQr} alt="UPI QR" style={{ width:'72px', height:'72px', display:'block' }} />
                        <div style={{ fontSize:'7px', color:'#555', marginTop:'2px' }}>Scan to Pay</div>
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sigSrc} alt="" style={{ height:'48px', width:'auto', marginLeft:'auto', display:'block', marginTop:'6px', mixBlendMode:'multiply' }} />
                      <div style={{ borderBottom:'1px solid #bbb', marginBottom:'3px' }}></div>
                      <div style={{ fontSize:'9px', fontWeight:700, color:'#111' }}>Sivakumar Shanmugam</div>
                      <div style={{ fontSize:'8px', color:'#555' }}>CEO, Rotehügels | Authorised Signatory</div>
                    </div>
                  </div>
                </div>

                {/* Invoice footer */}
                <div style={{ borderTop:'1px solid #e0e0e0', paddingTop:'6px', textAlign:'center' as const, fontSize:'8px', color:'#777', lineHeight:1.6 }}>
                  Computer-generated invoice. | {CO.web} | {CO.email} | {CO.phone}
                </div>
              </div>
            );
          })}

          {/* ══════════════════════ QUOTE PAGES ══════════════════════ */}
          {(quotes ?? []).map(q => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const qCustomer = q.customers as any;
            const qBilling  = qCustomer?.billing_address as Record<string, string> | null;
            const items = (q.items ?? []) as Array<{
              sku_id: string; name: string; unit: string;
              hsn_code?: string; sac_code?: string;
              quantity: number; unit_price: number; discount_pct: number;
              taxable_amount: number; gst_rate: number; gst_amount: number;
              cgst_rate: number; sgst_rate: number; igst_rate: number; total: number;
            }>;
            const isIntra = qCustomer?.state_code === '33' || qCustomer?.state?.toLowerCase().includes('tamil');
            const qCell: React.CSSProperties = { border:'1px solid #ddd', padding:'6px 8px', fontSize:'10px' };
            const qTh: React.CSSProperties = { ...qCell, background:'#f5f5f5', fontWeight:700, textAlign:'center' as const };

            return (
              <div key={q.id} id={`rh-stmt-p-qt-${q.id}`} style={docStyle}>

                {/* Quote header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', borderBottom:'2.5px solid #111', paddingBottom:'10px', marginBottom:'14px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:'12px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoSrc} alt="Rotehügels" style={{ height:'52px', width:'auto', objectFit:'contain', marginTop:'2px' }} />
                    <div>
                      <div style={{ fontSize:'11px', fontWeight:900, textTransform:'uppercase', lineHeight:1.2 }}>Rotehuegel Research Business</div>
                      <div style={{ fontSize:'11px', fontWeight:900, textTransform:'uppercase', lineHeight:1.2 }}>Consultancy Private Limited</div>
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
                    <div style={{ fontWeight:700, fontSize:'11px' }}>{qCustomer?.name}</div>
                    {qCustomer?.gstin && <div style={{ fontSize:'9.5px', marginTop:'2px' }}>GSTIN: {qCustomer.gstin}</div>}
                    {qBilling && (
                      <div style={{ fontSize:'9.5px', marginTop:'4px', lineHeight:1.6, color:'#444' }}>
                        {qBilling.line1}{qBilling.line2?`, ${qBilling.line2}`:''}<br />{qBilling.city}, {qBilling.state}{qBilling.pincode?` – ${qBilling.pincode}`:''}
                      </div>
                    )}
                    {qCustomer?.email && <div style={{ fontSize:'9px', marginTop:'3px' }}>✉ {qCustomer.email}</div>}
                  </div>
                  <div style={{ border:'1px solid #ddd', borderRadius:'4px', padding:'8px 10px' }}>
                    <div style={{ fontWeight:700, fontSize:'9px', textTransform:'uppercase', marginBottom:'5px', color:'#666' }}>Quote Details</div>
                    <div style={{ fontSize:'10px', lineHeight:1.8 }}>
                      <div><strong>Quote No:</strong> {q.quote_no}</div>
                      <div><strong>Date:</strong> {fmtDate(q.quote_date)}</div>
                      {q.valid_until && <div><strong>Valid Until:</strong> {fmtDate(q.valid_until)}</div>}
                      <div><strong>Place of Supply:</strong> {isIntra ? 'Tamil Nadu (33)' : (qCustomer?.state ?? '—')}</div>
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
                            {item.sku_id && <div style={{ fontSize:'9px', color:'#555' }}>{item.sku_id}</div>}
                          </td>
                          <td style={{ ...qCell, textAlign:'center' as const, fontFamily:'monospace' }}>{item.hsn_code || item.sac_code || '—'}</td>
                          <td style={{ ...qCell, textAlign:'right' as const }}>{item.quantity}</td>
                          <td style={{ ...qCell, textAlign:'center' as const }}>{item.unit}</td>
                          <td style={{ ...qCell, textAlign:'right' as const }}>{fmt(item.unit_price)}</td>
                          <td style={{ ...qCell, textAlign:'center' as const }}>{item.discount_pct > 0 ? `${item.discount_pct}%` : '—'}</td>
                          <td style={{ ...qCell, textAlign:'right' as const }}>{fmt(item.taxable_amount)}</td>
                          {isIntra ? (
                            <>
                              <td style={{ ...qCell, textAlign:'right' as const }}>{fmt(halfGst)}<br /><span style={{ fontSize:'8px', color:'#555' }}>{item.gst_rate/2}%</span></td>
                              <td style={{ ...qCell, textAlign:'right' as const }}>{fmt(halfGst)}<br /><span style={{ fontSize:'8px', color:'#555' }}>{item.gst_rate/2}%</span></td>
                            </>
                          ) : (
                            <td style={{ ...qCell, textAlign:'right' as const }}>{fmt(item.gst_amount)}<br /><span style={{ fontSize:'8px', color:'#555' }}>{item.gst_rate}%</span></td>
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
                <div style={{ borderTop:'1px solid #ddd', paddingTop:'10px', display:'flex', justifyContent:'space-between', fontSize:'9px', color:'#555' }}>
                  <div>
                    <div>This is a quotation and not a tax invoice.</div>
                    <div>Prices are subject to change without notice after validity date.</div>
                    <div>Subject to Chennai jurisdiction.</div>
                  </div>
                  <div style={{ textAlign:'right' as const }}>
                    <div>For Rotehuegel Research Business Consultancy Pvt Ltd</div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sigSrc} alt="" style={{ height:'44px', width:'auto', marginTop:'4px', marginLeft:'auto', display:'block', mixBlendMode:'multiply' }} />
                    <div style={{ fontWeight:700, color:'#333', marginTop:'2px' }}>Authorised Signatory</div>
                  </div>
                </div>

              </div>
            );
          })}

      </div>
    </PDFViewer>
  );
}
