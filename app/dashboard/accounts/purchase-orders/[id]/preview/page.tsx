import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import POPreviewActions from './POPreviewActions';

export const dynamic = 'force-dynamic';

const CO = {
  name:  'Rotehuegel Research Business Consultancy Private Limited',
  addr1: 'No. 1/584, 7th Street, Jothi Nagar, Padianallur,',
  addr2: 'Near Gangaiamman Kovil, Redhills, Chennai – 600052, Tamil Nadu, India',
  gstin: '33AAPCR0554G1ZE',
  pan:   'AAPCR0554G',
  cin:   'U70200TN2025PTC184573',
  email: 'procurements@rotehuegels.com',
  phone: '+91-90044 91275',
  web:   'www.rotehuegels.com',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

function numToWords(n: number): string {
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
             'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen',
             'Seventeen','Eighteen','Nineteen'];
  const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const inr = Math.round(n);
  if (inr === 0) return 'Zero';
  function words(num: number): string {
    if (num === 0) return '';
    if (num < 20) return a[num] + ' ';
    if (num < 100) return b[Math.floor(num/10)] + (num%10 ? ' ' + a[num%10] : '') + ' ';
    if (num < 1000) return a[Math.floor(num/100)] + ' Hundred ' + words(num%100);
    if (num < 100000) return words(Math.floor(num/1000)) + 'Thousand ' + words(num%1000);
    if (num < 10000000) return words(Math.floor(num/100000)) + 'Lakh ' + words(num%100000);
    return words(Math.floor(num/10000000)) + 'Crore ' + words(num%10000000);
  }
  return words(inr).trim() + ' Only';
}

export default async function POPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [poRes, itemsRes, pmtsRes] = await Promise.all([
    supabaseAdmin
      .from('purchase_orders')
      .select('*, suppliers(*)')
      .eq('id', id)
      .single(),
    supabaseAdmin
      .from('po_items')
      .select('*')
      .eq('po_id', id)
      .order('sl_no'),
    supabaseAdmin
      .from('po_payments')
      .select('amount')
      .eq('po_id', id),
  ]);

  if (poRes.error || !poRes.data) notFound();

  const po        = poRes.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supplier  = po.suppliers as any;
  const items     = itemsRes.data ?? [];
  const totalPaid = (pmtsRes.data ?? []).reduce((s, p) => s + p.amount, 0);
  const balance   = po.total_amount - totalPaid;
  const isIGST    = po.igst_amount > 0;
  const shipTo    = po.ship_to as Record<string, string> | null;

  const cell: React.CSSProperties = { border: '1px solid #ddd', padding: '5px 7px', fontSize: '9.5px' };
  const th: React.CSSProperties   = { ...cell, background: '#f5f5f5', fontWeight: 700, textAlign: 'center' as const };

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }

          /* Nuclear: hide every direct body child except <main> */
          body > *:not(main) { display: none !important; }

          /* Strip all dashboard wrapper backgrounds / padding */
          html, body, main,
          main > *, main > * > *, main > * > * > *, main > * > * > * > * {
            background: transparent !important;
            background-color: transparent !important;
            min-height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Hide sidebar, MobileNav, toolbar */
          aside, .md\:hidden, .po-no-print { display: none !important; }

          /* A4 wrapper */
          .po-print-wrapper { display: flex !important; justify-content: center !important; background: white !important; }

          /* A4 page */
          #rh-po { display: block !important; position: static !important; width: 210mm !important; min-height: 0 !important; background: white !important; }
        }
      `}</style>

      <POPreviewActions poId={id} poNo={po.po_no} />

      <div className="po-print-wrapper bg-zinc-950 min-h-screen py-10 flex justify-center">
        <div id="rh-po" className="bg-white text-zinc-900"
          style={{ width: '210mm', minHeight: '297mm', padding: '10mm 14mm', fontFamily: 'Arial, sans-serif', fontSize: '10px', display: 'flex', flexDirection: 'column' }}>

          {/* ── Header ───────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2.5px solid #111', paddingBottom: '8px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/Logo2_black.png" alt="Rotehügels" style={{ height: '46px', width: 'auto', objectFit: 'contain', marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.2 }}>
                  Rotehuegel Research Business
                </div>
                <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.2 }}>
                  Consultancy Private Limited
                </div>
                <div style={{ marginTop: '4px', fontSize: '8.5px', color: '#666', lineHeight: 1.5 }}>
                  <div>{CO.addr1}</div>
                  <div>{CO.addr2}</div>
                  <div>✉ {CO.email} | 📞 {CO.phone} | 🌐 {CO.web}</div>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <div style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', color: '#111', letterSpacing: '1px' }}>
                PURCHASE ORDER
              </div>
              <div style={{ marginTop: '6px', fontSize: '9.5px', lineHeight: 1.7 }}>
                <div><strong>PO No:</strong> {po.po_no}</div>
                <div><strong>Date:</strong> {fmtDate(po.po_date)}</div>
                {po.expected_delivery && <div><strong>Delivery By:</strong> {fmtDate(po.expected_delivery)}</div>}
                {po.supplier_ref && <div><strong>Supplier Ref:</strong> {po.supplier_ref}</div>}
              </div>
            </div>
          </div>

          {/* ── GSTIN strip ──────────────────────────────────── */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', fontSize: '9px' }}>
            <div style={{ background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: '3px', padding: '4px 8px', lineHeight: 1.6 }}>
              <strong>GSTIN:</strong> {CO.gstin} &nbsp;|&nbsp; <strong>PAN:</strong> {CO.pan} &nbsp;|&nbsp; <strong>CIN:</strong> {CO.cin}
            </div>
          </div>

          {/* ── Vendor + Deliver To ──────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div style={{ border: '1px solid #ddd', borderRadius: '3px', padding: '7px 9px' }}>
              <div style={{ fontWeight: 700, fontSize: '8px', textTransform: 'uppercase', marginBottom: '4px', color: '#666' }}>
                Vendor (Bill From)
              </div>
              <div style={{ fontWeight: 700, fontSize: '10px' }}>{supplier?.legal_name}</div>
              {supplier?.gstin && (
                <div style={{ fontSize: '9px', marginTop: '2px' }}><strong>GSTIN:</strong> {supplier.gstin}</div>
              )}
              {supplier?.address && (
                <div style={{ fontSize: '9px', marginTop: '3px', lineHeight: 1.5, color: '#444' }}>
                  {supplier.address}{supplier.state ? `, ${supplier.state}` : ''}{supplier.pincode ? ` – ${supplier.pincode}` : ''}
                </div>
              )}
              {supplier?.email && <div style={{ fontSize: '8.5px', marginTop: '2px' }}>✉ {supplier.email}</div>}
              {supplier?.phone && <div style={{ fontSize: '8.5px' }}>📞 {supplier.phone}</div>}
            </div>

            <div style={{ border: '1px solid #ddd', borderRadius: '3px', padding: '7px 9px' }}>
              <div style={{ fontWeight: 700, fontSize: '8px', textTransform: 'uppercase', marginBottom: '4px', color: '#666' }}>
                Deliver To (Bill To)
              </div>
              <div style={{ fontWeight: 700, fontSize: '10px' }}>{CO.name}</div>
              <div style={{ fontSize: '9px', marginTop: '2px' }}><strong>GSTIN:</strong> {CO.gstin}</div>
              {shipTo ? (
                <div style={{ fontSize: '9px', marginTop: '3px', lineHeight: 1.5, color: '#444' }}>
                  {shipTo.line1}{shipTo.line2 ? `, ${shipTo.line2}` : ''}<br />
                  {shipTo.city}, {shipTo.state}{shipTo.pincode ? ` – ${shipTo.pincode}` : ''}
                </div>
              ) : (
                <div style={{ fontSize: '9px', marginTop: '3px', lineHeight: 1.5, color: '#444' }}>
                  {CO.addr1}<br />{CO.addr2}
                </div>
              )}
              <div style={{ fontSize: '9px', marginTop: '4px', lineHeight: 1.6 }}>
                <strong>Place of Supply:</strong> Tamil Nadu (33) &nbsp;|&nbsp;
                <strong>GST:</strong> {isIGST ? 'IGST (Inter-state)' : 'CGST+SGST (Intra-state)'}
              </div>
            </div>
          </div>

          {/* ── Items table ──────────────────────────────────── */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
            <thead>
              <tr>
                <th style={{ ...th, width: '4%' }}>#</th>
                <th style={{ ...th, width: '35%', textAlign: 'left' as const }}>Description</th>
                <th style={{ ...th, width: '7%' }}>HSN</th>
                <th style={{ ...th, width: '6%' }}>Qty</th>
                <th style={{ ...th, width: '5%' }}>Unit</th>
                <th style={{ ...th, width: '11%' }}>Rate (₹)</th>
                <th style={{ ...th, width: '11%' }}>Taxable (₹)</th>
                <th style={{ ...th, width: '8%' }}>{isIGST ? 'IGST' : 'GST'}</th>
                <th style={{ ...th, width: '13%' }}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id ?? i}>
                  <td style={{ ...cell, textAlign: 'center' as const }}>{item.sl_no}</td>
                  <td style={cell}>
                    <div style={{ fontWeight: 600 }}>{item.description}</div>
                  </td>
                  <td style={{ ...cell, textAlign: 'center' as const, fontFamily: 'monospace' }}>{item.hsn_code || '—'}</td>
                  <td style={{ ...cell, textAlign: 'right' as const }}>{item.quantity}</td>
                  <td style={{ ...cell, textAlign: 'center' as const }}>{item.unit}</td>
                  <td style={{ ...cell, textAlign: 'right' as const }}>{fmt(item.unit_price)}</td>
                  <td style={{ ...cell, textAlign: 'right' as const }}>{fmt(item.taxable_amount)}</td>
                  <td style={{ ...cell, textAlign: 'right' as const }}>
                    {fmt(item.gst_amount)}
                    <div style={{ fontSize: '7.5px', color: '#999' }}>
                      {isIGST ? `${item.igst_rate}%` : `${item.cgst_rate}%+${item.sgst_rate}%`}
                    </div>
                  </td>
                  <td style={{ ...cell, textAlign: 'right' as const, fontWeight: 700 }}>{fmt(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── Totals ───────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
            <table style={{ borderCollapse: 'collapse', minWidth: '230px' }}>
              <tbody>
                <tr>
                  <td style={{ ...cell, textAlign: 'right' as const, color: '#666' }}>Net Assessable Value</td>
                  <td style={{ ...cell, textAlign: 'right' as const, fontFamily: 'monospace' }}>{fmt(po.taxable_value)}</td>
                </tr>
                {isIGST ? (
                  <tr>
                    <td style={{ ...cell, textAlign: 'right' as const, color: '#666' }}>IGST @ 18%</td>
                    <td style={{ ...cell, textAlign: 'right' as const, fontFamily: 'monospace' }}>{fmt(po.igst_amount)}</td>
                  </tr>
                ) : (
                  <>
                    <tr>
                      <td style={{ ...cell, textAlign: 'right' as const, color: '#666' }}>CGST</td>
                      <td style={{ ...cell, textAlign: 'right' as const, fontFamily: 'monospace' }}>{fmt(po.cgst_amount)}</td>
                    </tr>
                    <tr>
                      <td style={{ ...cell, textAlign: 'right' as const, color: '#666' }}>SGST</td>
                      <td style={{ ...cell, textAlign: 'right' as const, fontFamily: 'monospace' }}>{fmt(po.sgst_amount)}</td>
                    </tr>
                  </>
                )}
                <tr style={{ background: '#f0f0f0' }}>
                  <td style={{ ...cell, textAlign: 'right' as const, fontWeight: 900, fontSize: '11px' }}>GRAND TOTAL</td>
                  <td style={{ ...cell, textAlign: 'right' as const, fontWeight: 900, fontSize: '11px', fontFamily: 'monospace' }}>{fmt(po.total_amount)}</td>
                </tr>
                {totalPaid > 0 && (
                  <>
                    <tr>
                      <td style={{ ...cell, textAlign: 'right' as const, color: '#059669' }}>Less: Advance Paid</td>
                      <td style={{ ...cell, textAlign: 'right' as const, fontFamily: 'monospace', color: '#059669' }}>− {fmt(totalPaid)}</td>
                    </tr>
                    <tr style={{ background: balance > 0 ? '#fff5f5' : '#f0fdf4' }}>
                      <td style={{ ...cell, textAlign: 'right' as const, fontWeight: 900, fontSize: '11px' }}>BALANCE PAYABLE</td>
                      <td style={{ ...cell, textAlign: 'right' as const, fontWeight: 900, fontSize: '11px', fontFamily: 'monospace', color: balance > 0 ? '#dc2626' : '#059669' }}>
                        {fmt(balance)}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Amount in words ──────────────────────────────── */}
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '3px', padding: '5px 8px', marginBottom: '10px', fontSize: '9px' }}>
            <strong>Grand Total (in words): </strong>{numToWords(po.total_amount)} (INR)
            {totalPaid > 0 && (
              <span> &nbsp;|&nbsp; <strong>Balance Payable: </strong>{numToWords(balance)} (INR)</span>
            )}
          </div>

          {/* ── Terms (brief) ────────────────────────────────── */}
          {po.terms && (
            <div style={{ border: '1px solid #e0e0e0', borderRadius: '3px', padding: '5px 8px', marginBottom: '10px', fontSize: '9px' }}>
              <strong>Terms: </strong>{po.terms}
            </div>
          )}

          {/* ── Footer / Signature ───────────────────────────── */}
          <div style={{ borderTop: '1px solid #ddd', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '8.5px', color: '#888', marginTop: 'auto' }}>
            <div>
              <div>This is a Purchase Order issued by Rotehuegel Research Business Consultancy Pvt Ltd.</div>
              <div>Subject to Chennai jurisdiction. GSTIN: {CO.gstin}</div>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <div style={{ marginBottom: '4px', color: '#666' }}>For Rotehuegel Research Business Consultancy Pvt Ltd</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/api/private/signature" alt="Signature" style={{ height: '44px', width: 'auto', marginLeft: 'auto' }} />
              <div style={{ fontWeight: 700, color: '#333', marginTop: '2px' }}>Authorised Signatory</div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
