import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import PDFViewer from '@/components/PDFViewer';
import { getLogoBase64, getSignatureBase64 } from '@/lib/serverAssets';
import QRCode from 'qrcode';

// ── Company constants ───────────────────────────────────────────────────────
const CO = {
  name: 'Rotehuegel Research Business Consultancy Private Limited',
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

// ── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

function getFY(dateStr: string) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return m >= 4
    ? `${String(y).slice(2)}-${String(y + 1).slice(2)}`
    : `${String(y - 1).slice(2)}-${String(y).slice(2)}`;
}

function amountInWords(amount: number): string {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
    'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tensArr = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const twoD = (n: number) =>
    n < 20 ? ones[n] : tensArr[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');

  const threeD = (n: number) =>
    n < 100 ? twoD(n) : ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + twoD(n % 100) : '');

  const r = Math.floor(amount);
  const p = Math.round((amount - r) * 100);
  const parts: string[] = [];
  let rem = r;

  if (rem >= 10000000) { parts.push(twoD(Math.floor(rem / 10000000)) + ' Crore');   rem %= 10000000; }
  if (rem >= 100000)   { parts.push(twoD(Math.floor(rem / 100000))   + ' Lakh');    rem %= 100000;   }
  if (rem >= 1000)     { parts.push(twoD(Math.floor(rem / 1000))     + ' Thousand'); rem %= 1000;    }
  if (rem > 0)         { parts.push(threeD(rem)); }

  const words     = r === 0 ? 'Zero' : parts.join(' ');
  const paiseStr  = p > 0 ? ` and ${twoD(p)} Paise` : '';
  return `Rupees ${words}${paiseStr} Only`;
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function InvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ upto?: string; stage?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const logoSrc   = getLogoBase64();
  const sigBase64 = getSignatureBase64();

  const [orderRes, stagesRes] = await Promise.all([
    supabaseAdmin.from('orders').select('*').eq('id', id).single(),
    supabaseAdmin.from('order_payment_stages').select('*').eq('order_id', id).order('stage_number'),
  ]);

  if (orderRes.error || !orderRes.data) notFound();

  const order  = orderRes.data;
  const stages = stagesRes.data ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawItems = (order as any).items;
  const items: Array<{
    description: string; qty?: string; hsn: string;
    base: number; cgst: number; sgst: number; igst: number; total: number;
  }> = Array.isArray(rawItems) ? rawItems : [];

  // ── Stage filtering ────────────────────────────────────────────────────────
  const uptoStage = sp.upto ? parseInt(sp.upto) : null;
  const onlyStage = sp.stage ? parseInt(sp.stage) : null;
  const isFiltered = uptoStage !== null || onlyStage !== null;

  const filteredStages = isFiltered
    ? stages.filter(s => {
        if (uptoStage !== null) return s.stage_number <= uptoStage;
        if (onlyStage !== null) return s.stage_number === onlyStage;
        return true;
      })
    : stages;

  // Stage label for toolbar / invoice reference
  const stageLabel = uptoStage
    ? `Stages 1–${uptoStage}`
    : onlyStage
    ? `Stage ${onlyStage}`
    : null;

  // ── Effective financials (recalculate when stage-filtered) ────────────────
  const isIntra = (order.igst_amount ?? 0) === 0 && (order.cgst_amount ?? 0) > 0;

  let effectiveBase  = order.base_value ?? 0;
  let effectiveCgst  = order.cgst_amount ?? 0;
  let effectiveSgst  = order.sgst_amount ?? 0;
  let effectiveIgst  = order.igst_amount ?? 0;
  let effectiveTotal = order.total_value_incl_gst;
  let effectiveTds   = order.tds_applicable
    ? (order.base_value ?? 0) * (order.tds_rate / 100)
    : 0;

  if (isFiltered && filteredStages.length > 0) {
    effectiveBase = filteredStages.reduce((sum, s) => sum + (s.amount_due ?? 0), 0);
    const gstTotal = filteredStages.reduce((sum, s) => sum + (s.gst_on_stage ?? 0), 0);
    if (isIntra) {
      effectiveCgst = gstTotal / 2;
      effectiveSgst = gstTotal / 2;
      effectiveIgst = 0;
    } else {
      effectiveCgst = 0;
      effectiveSgst = 0;
      effectiveIgst = gstTotal;
    }
    effectiveTotal = effectiveBase + gstTotal;
    effectiveTds   = order.tds_applicable
      ? filteredStages.reduce((sum, s) => sum + (s.tds_amount ?? 0), 0)
      : 0;
  }

  const tdsNet = order.tds_applicable ? effectiveTotal - effectiveTds : null;

  // ── Invoice date — stage invoice_date > order.invoice_date > today ─────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stageDate = isFiltered
    ? (filteredStages[filteredStages.length - 1] as any)?.invoice_date ?? null
    : null;
  const rawDate    = stageDate ?? order.invoice_date ?? null;
  const fy         = getFY(rawDate ?? order.order_date);
  const invoiceNo  = `RH/${fy}/${order.order_no}`;
  const invoiceDate = rawDate
    ? fmtDate(rawDate)
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const gstRate  = Number(order.gst_rate ?? 18);
  const halfRate = gstRate / 2;
  const sacHsn   = order.hsn_sac_code ?? (order.order_type === 'service' ? '9983' : '—');
  const placeOfSupply = order.place_of_supply ?? 'Tamil Nadu (33)';

  // colspan for footer row: # + Description + (Qty if multi-item) + HSN
  const descColspan = items.length > 0 ? 4 : 3;

  // Balance due — scoped to filtered stages
  const filteredPaid = filteredStages
    .filter(s => s.status === 'paid')
    .reduce((sum, s) => sum + (s.amount_due ?? 0) + (s.gst_on_stage ?? 0), 0);
  const balanceDue = Math.max(0, effectiveTotal - filteredPaid);

  // UPI limit is ₹1 lakh/txn — omit amount if balance exceeds limit
  const upiAmountParam = balanceDue > 0 && balanceDue <= 100000
    ? `&am=${balanceDue.toFixed(2)}`
    : '';
  const upiString = `upi://pay?pa=rotehuegels@sbi&pn=Rotehuegel Research Business Consultancy Pvt Ltd${upiAmountParam}&cu=INR&tn=${encodeURIComponent('Invoice ' + invoiceNo)}`;
  const upiQr = await QRCode.toDataURL(upiString, { width: 90, margin: 1, color: { dark: '#111111', light: '#ffffff' } });

  return (
    <PDFViewer
      contentId="rh-invoice"
      filename={`${invoiceNo.replace(/\//g, '-')}${stageLabel ? `-${stageLabel.replace(/\s/g, '')}` : ''}.pdf`}
      toolbar={
        <div className="flex items-center gap-3">
          <a href={`/dashboard/accounts/orders/${id}`}
            className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            ← Back to Order
          </a>
          <span className="text-zinc-700">|</span>
          <span className="text-xs text-zinc-500">Invoice</span>
          <span className="font-mono text-sm text-amber-400 font-bold">{invoiceNo}</span>
          {stageLabel && (
            <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">{stageLabel}</span>
          )}
        </div>
      }
    >
      <div>
        <div
          id="rh-invoice"
          className="bg-white text-zinc-900"
          style={{ width: '210mm', minHeight: '297mm', padding: '12mm 16mm', fontFamily: 'Arial, sans-serif', fontSize: '11px' }}
        >

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2.5px solid #111', paddingBottom: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoSrc} alt="Rotehügels" style={{ height: '52px', width: 'auto', objectFit: 'contain', marginTop: '2px', flexShrink: 0 }} />
              <div>
              <div style={{ fontSize: '15px', fontWeight: 900, lineHeight: 1.2, color: '#111', textTransform: 'uppercase' }}>
                Rotehuegel Research Business
              </div>
              <div style={{ fontSize: '15px', fontWeight: 900, lineHeight: 1.2, color: '#111', textTransform: 'uppercase' }}>
                Consultancy Private Limited
              </div>
              <div style={{ marginTop: '5px', fontSize: '9px', color: '#666', lineHeight: 1.6 }}>
                <div>{CO.addr1}</div>
                <div>{CO.addr2}</div>
                <div style={{ marginTop: '3px' }}>
                  ✉ {CO.email} &nbsp;|&nbsp; 📞 {CO.phone} &nbsp;|&nbsp; 🌐 {CO.web}
                </div>
              </div>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
              <div style={{ display: 'inline-block', border: '2px solid #111', padding: '4px 10px', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '1px' }}>TAX INVOICE</span>
              </div>
              <div style={{ fontSize: '9px', color: '#555', lineHeight: 1.8 }}>
                <div><strong>GSTIN:</strong> {CO.gstin}</div>
                <div><strong>PAN:</strong>&nbsp; {CO.pan}</div>
                <div><strong>CIN:</strong>&nbsp; {CO.cin}</div>
                <div><strong>TAN:</strong>&nbsp; {CO.tan}</div>
              </div>
            </div>
          </div>

          {/* ── Invoice meta ────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>

            {/* Bill To */}
            <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px 10px' }}>
              <div style={{ fontSize: '8px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '5px' }}>
                Bill To / Ship To
              </div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#111', marginBottom: '2px' }}>
                {order.client_name}
              </div>
              {order.client_contact && (
                <div style={{ fontSize: '8.5px', color: '#555', marginBottom: '2px' }}>{order.client_contact}</div>
              )}
              {order.client_address && (
                <div style={{ fontSize: '8.5px', color: '#555', lineHeight: 1.5, marginBottom: '3px' }}>{order.client_address}</div>
              )}
              {order.client_gstin && (
                <div style={{ fontSize: '9px', color: '#555', fontFamily: 'monospace' }}>GSTIN: {order.client_gstin}</div>
              )}
              {order.client_pan && (
                <div style={{ fontSize: '9px', color: '#555', fontFamily: 'monospace' }}>PAN: {order.client_pan}</div>
              )}
              {!order.client_gstin && !order.client_pan && (
                <div style={{ fontSize: '9px', color: '#aaa', fontStyle: 'italic' }}>GSTIN / PAN not provided</div>
              )}
            </div>

            {/* Invoice details */}
            <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px 10px' }}>
              <table style={{ width: '100%', fontSize: '9px', borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    ['Invoice No.',   <span style={{ fontFamily: 'monospace', fontWeight: 800 }} key="inv">{invoiceNo}</span>],
                    ['Invoice Date',  invoiceDate],
                    ['Order Date',    fmtDate(order.order_date)],
                    ...(order.delivery_date ? [['Delivery Date', fmtDate(order.delivery_date)]] : []),
                    ['Order Ref.',    order.order_no],
                    ...(stageLabel ? [['Stage',  stageLabel]] : []),
                    ['Place of Supply', placeOfSupply],
                    ['Supply Type',   isIntra ? 'Intra-State' : 'Inter-State'],
                  ].map(([label, value]) => (
                    <tr key={String(label)}>
                      <td style={{ color: '#888', paddingRight: '8px', paddingBottom: '3px', whiteSpace: 'nowrap', fontWeight: 600 }}>{label}</td>
                      <td style={{ color: '#111', paddingBottom: '3px' }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Items table ──────────────────────────────────────────────── */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '9.5px' }}>
            <thead>
              <tr style={{ background: '#1a1a1a', color: 'white' }}>
                <th style={{ border: '1px solid #555', padding: '5px 6px', textAlign: 'left', width: '20px' }}>#</th>
                <th style={{ border: '1px solid #555', padding: '5px 6px', textAlign: 'left' }}>Description of Goods / Services</th>
                {items.length > 0 && (
                  <th style={{ border: '1px solid #555', padding: '5px 6px', textAlign: 'center', width: '45px' }}>Qty</th>
                )}
                <th style={{ border: '1px solid #555', padding: '5px 6px', textAlign: 'center', width: '50px' }}>SAC / HSN</th>
                <th style={{ border: '1px solid #555', padding: '5px 6px', textAlign: 'right', width: '90px' }}>Taxable Value</th>
                {isIntra ? (
                  <>
                    <th style={{ border: '1px solid #555', padding: '5px 6px', textAlign: 'right', width: '80px' }}>CGST {halfRate}%</th>
                    <th style={{ border: '1px solid #555', padding: '5px 6px', textAlign: 'right', width: '80px' }}>SGST {halfRate}%</th>
                  </>
                ) : (
                  <th style={{ border: '1px solid #555', padding: '5px 6px', textAlign: 'right', width: '90px' }}>IGST {gstRate}%</th>
                )}
                <th style={{ border: '1px solid #555', padding: '5px 6px', textAlign: 'right', width: '90px' }}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? items.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ border: '1px solid #ddd', padding: '7px 6px', verticalAlign: 'top' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #ddd', padding: '7px 6px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 700, color: '#111', whiteSpace: 'pre-line', lineHeight: 1.5 }}>{item.description}</div>
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '7px 6px', textAlign: 'center', verticalAlign: 'top' }}>{item.qty ?? '—'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '7px 6px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, verticalAlign: 'top' }}>{item.hsn}</td>
                  <td style={{ border: '1px solid #ddd', padding: '7px 6px', textAlign: 'right' }}>{fmt(item.base)}</td>
                  {isIntra ? (
                    <>
                      <td style={{ border: '1px solid #ddd', padding: '7px 6px', textAlign: 'right' }}>{fmt(item.cgst)}</td>
                      <td style={{ border: '1px solid #ddd', padding: '7px 6px', textAlign: 'right' }}>{fmt(item.sgst)}</td>
                    </>
                  ) : (
                    <td style={{ border: '1px solid #ddd', padding: '7px 6px', textAlign: 'right' }}>{fmt(item.igst)}</td>
                  )}
                  <td style={{ border: '1px solid #ddd', padding: '7px 6px', textAlign: 'right', fontWeight: 700 }}>{fmt(item.total)}</td>
                </tr>
              )) : (
                <tr>
                  <td style={{ border: '1px solid #ddd', padding: '7px 6px', verticalAlign: 'top' }}>1</td>
                  <td style={{ border: '1px solid #ddd', padding: '7px 6px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 700, color: '#111', marginBottom: '3px', whiteSpace: 'pre-line' }}>{order.description}</div>
                    {filteredStages.length > 1 && (
                      <div style={{ marginTop: '4px', paddingLeft: '8px' }}>
                        {filteredStages.map(s => (
                          <div key={s.id} style={{ fontSize: '8.5px', color: '#666', marginBottom: '2px' }}>
                            • {s.stage_name}: {fmt(s.amount_due)} base + {fmt(s.gst_on_stage ?? 0)} GST
                            {s.tds_amount ? ` – TDS ${fmt(s.tds_amount)}` : ''}
                          </div>
                        ))}
                      </div>
                    )}
                    {filteredStages.length === 1 && (
                      <div style={{ marginTop: '4px', fontSize: '8.5px', color: '#555' }}>
                        {filteredStages[0].stage_name}
                        {filteredStages[0].tds_amount ? ` (TDS @ ${filteredStages[0].tds_rate}% = ${fmt(filteredStages[0].tds_amount)})` : ''}
                      </div>
                    )}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '7px 6px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700 }}>{sacHsn}</td>
                  <td style={{ border: '1px solid #ddd', padding: '7px 6px', textAlign: 'right' }}>{fmt(effectiveBase)}</td>
                  {isIntra ? (
                    <>
                      <td style={{ border: '1px solid #ddd', padding: '7px 6px', textAlign: 'right' }}>{fmt(effectiveCgst)}</td>
                      <td style={{ border: '1px solid #ddd', padding: '7px 6px', textAlign: 'right' }}>{fmt(effectiveSgst)}</td>
                    </>
                  ) : (
                    <td style={{ border: '1px solid #ddd', padding: '7px 6px', textAlign: 'right' }}>{fmt(effectiveIgst)}</td>
                  )}
                  <td style={{ border: '1px solid #ddd', padding: '7px 6px', textAlign: 'right', fontWeight: 700 }}>{fmt(effectiveTotal)}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f5f5f5' }}>
                <td colSpan={descColspan} style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right', fontWeight: 700 }}>Total</td>
                <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right', fontWeight: 700 }}>{fmt(effectiveBase)}</td>
                {isIntra ? (
                  <>
                    <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right', fontWeight: 700 }}>{fmt(effectiveCgst)}</td>
                    <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right', fontWeight: 700 }}>{fmt(effectiveSgst)}</td>
                  </>
                ) : (
                  <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right', fontWeight: 700 }}>{fmt(effectiveIgst)}</td>
                )}
                <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right', fontWeight: 900, fontSize: '11px' }}>{fmt(effectiveTotal)}</td>
              </tr>
            </tfoot>
          </table>

          {/* ── Amount in words + TDS ────────────────────────────────────── */}
          <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px 10px', marginBottom: '12px' }}>
            <div style={{ fontSize: '8px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '3px' }}>
              Amount in Words
            </div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#111' }}>
              {amountInWords(effectiveTotal)}
            </div>
            {order.tds_applicable && tdsNet !== null && (
              <div style={{ marginTop: '5px', fontSize: '8.5px', color: '#777', borderTop: '1px dashed #ddd', paddingTop: '4px' }}>
                * Subject to TDS deduction @ {order.tds_rate}% under applicable Income Tax provisions.
                &nbsp; Net receivable after TDS: <strong>{fmt(tdsNet)}</strong>
              </div>
            )}
          </div>

          {/* ── Advance adjustment note (inter-state partial orders) ─────── */}
          {order.advance_note && (
            <div style={{ border: '1px dashed #ccc', borderRadius: '4px', padding: '7px 10px', marginBottom: '12px', fontSize: '8.5px', color: '#555', lineHeight: 1.6 }}>
              <strong style={{ color: '#333' }}>Advance Reference: </strong>{order.advance_note}
            </div>
          )}

          {/* ── Bank details + Declaration + Signature ───────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>

            {/* Bank */}
            <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px 10px' }}>
              <div style={{ fontSize: '8px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                Bank Details
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <table style={{ fontSize: '9px', borderCollapse: 'collapse', flex: 1 }}>
                  <tbody>
                    {[
                      ['Name',    CO.name],
                      ['A/c No.', CO.acc],
                      ['IFSC',    CO.ifsc],
                      ['Bank',    CO.bank],
                      ['UPI',     'rotehuegels@sbi'],
                    ].map(([l, v]) => (
                      <tr key={l}>
                        <td style={{ color: '#888', paddingRight: '8px', paddingBottom: '3px', whiteSpace: 'nowrap', fontWeight: 600 }}>{l}</td>
                        <td style={{ color: '#111', paddingBottom: '3px', fontFamily: l === 'A/c No.' || l === 'IFSC' || l === 'UPI' ? 'monospace' : 'inherit', fontWeight: l === 'A/c No.' ? 700 : 400 }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={upiQr} alt="UPI QR" style={{ width: '72px', height: '72px', display: 'block' }} />
                  <div style={{ fontSize: '7px', color: '#888', marginTop: '2px' }}>Scan to Pay (UPI)</div>
                </div>
              </div>
            </div>

            {/* Declaration + Signature */}
            <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '8px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
                  Declaration
                </div>
                <div style={{ fontSize: '8.5px', color: '#666', lineHeight: 1.5 }}>
                  We declare that this invoice shows the actual price of the goods / services described
                  and that all particulars are true and correct to the best of our knowledge.
                </div>
              </div>
              <div style={{ textAlign: 'right', marginTop: '10px' }}>
                <div style={{ fontSize: '9px', fontWeight: 700, color: '#444', lineHeight: 1.5, textTransform: 'uppercase' }}>
                  For Rotehuegel Research Business<br />Consultancy Private Limited
                </div>
                {true && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sigBase64} alt="" style={{ display: 'block', height: '52px', width: 'auto', objectFit: 'contain', marginLeft: 'auto', marginTop: '8px', mixBlendMode: 'multiply' }} />
                )}
                <div style={{ borderBottom: '1px solid #bbb', marginBottom: '4px' }}></div>
                <div style={{ fontSize: '9px', fontWeight: 700, color: '#111' }}>Sivakumar Shanmugam</div>
                <div style={{ fontSize: '8.5px', color: '#555' }}>CEO, Rotehügels</div>
                <div style={{ fontSize: '8px', color: '#999', marginTop: '1px' }}>Authorised Signatory</div>
              </div>
            </div>
          </div>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <div style={{ fontSize: '7.5px', color: '#999', marginBottom: '6px', lineHeight: 1.5 }}>
            * UPI payments are subject to per-transaction limits (typically ₹1 lakh). For amounts exceeding the limit, you may split into multiple UPI transfers or use NEFT / RTGS for the full amount in a single transfer.
          </div>

          <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '6px', textAlign: 'center', fontSize: '8px', color: '#aaa', lineHeight: 1.6 }}>
            <div>This is a computer-generated invoice. | {CO.web} | {CO.email} | {CO.phone}</div>
          </div>

        </div>
      </div>
    </PDFViewer>
  );
}
