import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import InvoiceActions from './InvoiceActions';

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
export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [orderRes, stagesRes] = await Promise.all([
    supabaseAdmin.from('orders').select('*').eq('id', id).single(),
    supabaseAdmin.from('order_payment_stages').select('*').eq('order_id', id).order('stage_number'),
  ]);

  if (orderRes.error || !orderRes.data) notFound();

  const order  = orderRes.data;
  const stages = stagesRes.data ?? [];

  const fy          = getFY(order.order_date);
  const invoiceNo   = `RH/${fy}/${order.order_no}`;
  const invoiceDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const isIntra     = (order.igst_amount ?? 0) === 0 && (order.cgst_amount ?? 0) > 0;
  const gstRate     = Number(order.gst_rate ?? 18);
  const halfRate    = gstRate / 2;
  const sacHsn      = order.hsn_sac_code
    ?? (order.order_type === 'service' ? '9983' : '—');
  const tdsNet      = order.tds_applicable
    ? order.total_value_incl_gst - (order.base_value ?? 0) * (order.tds_rate / 100)
    : null;

  // colspan for footer row
  const descColspan = isIntra ? 3 : 3;

  return (
    <>
      {/* Print isolation CSS */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden !important; }
          #rh-invoice, #rh-invoice * { visibility: visible !important; }
          #rh-invoice {
            position: fixed !important;
            inset: 0 !important;
            z-index: 99999 !important;
            background: white !important;
            overflow: visible !important;
          }
        }
      `}</style>

      {/* Screen top bar */}
      <div className="print:hidden sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">Invoice</span>
          <span className="font-mono text-sm text-amber-400 font-bold">{invoiceNo}</span>
        </div>
        <InvoiceActions orderId={id} />
      </div>

      {/* Print-safe wrapper */}
      <div className="bg-zinc-950 min-h-screen py-10 print:py-0 print:bg-white flex justify-center">
        <div
          id="rh-invoice"
          className="bg-white text-zinc-900"
          style={{ width: '210mm', minHeight: '297mm', padding: '12mm 16mm', fontFamily: 'Arial, sans-serif', fontSize: '11px' }}
        >

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2.5px solid #111', paddingBottom: '10px', marginBottom: '12px' }}>
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
                Bill To
              </div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#111', marginBottom: '3px' }}>
                {order.client_name}
              </div>
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
                    ['Order Ref.',    order.order_no],
                    ['Place of Supply', 'Tamil Nadu (33)'],
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
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '7px 6px', verticalAlign: 'top' }}>1</td>
                <td style={{ border: '1px solid #ddd', padding: '7px 6px', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 700, color: '#111', marginBottom: '3px' }}>{order.description}</div>
                  {stages.length > 1 && (
                    <div style={{ marginTop: '4px', paddingLeft: '8px' }}>
                      {stages.map(s => (
                        <div key={s.id} style={{ fontSize: '8.5px', color: '#666', marginBottom: '2px' }}>
                          • {s.stage_name}: {fmt(s.amount_due)} base + {fmt(s.gst_on_stage ?? 0)} GST
                          {s.tds_amount ? ` – TDS ${fmt(s.tds_amount)}` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '7px 6px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700 }}>{sacHsn}</td>
                <td style={{ border: '1px solid #ddd', padding: '7px 6px', textAlign: 'right' }}>{fmt(order.base_value ?? 0)}</td>
                {isIntra ? (
                  <>
                    <td style={{ border: '1px solid #ddd', padding: '7px 6px', textAlign: 'right' }}>{fmt(order.cgst_amount ?? 0)}</td>
                    <td style={{ border: '1px solid #ddd', padding: '7px 6px', textAlign: 'right' }}>{fmt(order.sgst_amount ?? 0)}</td>
                  </>
                ) : (
                  <td style={{ border: '1px solid #ddd', padding: '7px 6px', textAlign: 'right' }}>{fmt(order.igst_amount ?? 0)}</td>
                )}
                <td style={{ border: '1px solid #ddd', padding: '7px 6px', textAlign: 'right', fontWeight: 700 }}>{fmt(order.total_value_incl_gst)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ background: '#f5f5f5' }}>
                <td colSpan={descColspan} style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right', fontWeight: 700 }}>Total</td>
                <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right', fontWeight: 700 }}>{fmt(order.base_value ?? 0)}</td>
                {isIntra ? (
                  <>
                    <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right', fontWeight: 700 }}>{fmt(order.cgst_amount ?? 0)}</td>
                    <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right', fontWeight: 700 }}>{fmt(order.sgst_amount ?? 0)}</td>
                  </>
                ) : (
                  <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right', fontWeight: 700 }}>{fmt(order.igst_amount ?? 0)}</td>
                )}
                <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right', fontWeight: 900, fontSize: '11px' }}>{fmt(order.total_value_incl_gst)}</td>
              </tr>
            </tfoot>
          </table>

          {/* ── Amount in words + TDS ────────────────────────────────────── */}
          <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px 10px', marginBottom: '12px' }}>
            <div style={{ fontSize: '8px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '3px' }}>
              Amount in Words
            </div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#111' }}>
              {amountInWords(order.total_value_incl_gst)}
            </div>
            {order.tds_applicable && tdsNet !== null && (
              <div style={{ marginTop: '5px', fontSize: '8.5px', color: '#777', borderTop: '1px dashed #ddd', paddingTop: '4px' }}>
                * Subject to TDS deduction @ {order.tds_rate}% under applicable Income Tax provisions.
                &nbsp; Net receivable after TDS: <strong>{fmt(tdsNet)}</strong>
              </div>
            )}
          </div>

          {/* ── Bank details + Declaration + Signature ───────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>

            {/* Bank */}
            <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px 10px' }}>
              <div style={{ fontSize: '8px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                Bank Details
              </div>
              <table style={{ fontSize: '9px', borderCollapse: 'collapse', width: '100%' }}>
                <tbody>
                  {[
                    ['Name',    CO.name],
                    ['A/c No.', CO.acc],
                    ['IFSC',    CO.ifsc],
                    ['Bank',    CO.bank],
                  ].map(([l, v]) => (
                    <tr key={l}>
                      <td style={{ color: '#888', paddingRight: '8px', paddingBottom: '3px', whiteSpace: 'nowrap', fontWeight: 600 }}>{l}</td>
                      <td style={{ color: '#111', paddingBottom: '3px', fontFamily: l === 'A/c No.' || l === 'IFSC' ? 'monospace' : 'inherit', fontWeight: l === 'A/c No.' ? 700 : 400 }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                <div style={{ borderBottom: '1px solid #bbb', marginTop: '28px', marginBottom: '4px' }}></div>
                <div style={{ fontSize: '8.5px', color: '#777' }}>Authorised Signatory</div>
              </div>
            </div>
          </div>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '6px', textAlign: 'center', fontSize: '8px', color: '#aaa', lineHeight: 1.6 }}>
            <div>This is a computer-generated invoice. | {CO.web} | {CO.email} | {CO.phone}</div>
          </div>

        </div>
      </div>
    </>
  );
}
