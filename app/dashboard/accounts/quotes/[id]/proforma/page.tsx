import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { redirect, notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

const CO = {
  name:  'Rotehuegel Research Business Consultancy Private Limited',
  addr1: 'No. 1/584, 7th Street, Jothi Nagar, Padianallur,',
  addr2: 'Near Gangaiamman Kovil, Redhills, Chennai – 600052, Tamil Nadu, India',
  gstin: '33AAPCR0554G1ZE',
  pan:   'AAPCR0554G',
  cin:   'U70200TN2025PTC184573',
  email: 'sales@rotehuegels.com',
  phone: '+91-90044 91275',
  web:   'www.rotehuegels.com',
  bank:  'State Bank of India, Padianallur Branch',
  acc:   '44512115640',
  ifsc:  'SBIN0014160',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

function amountInWords(amount: number): string {
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const twoD = (n: number) => n < 20 ? ones[n] : tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '');
  const threeD = (n: number) => n < 100 ? twoD(n) : ones[Math.floor(n/100)]+' Hundred'+(n%100 ? ' '+twoD(n%100) : '');
  const r = Math.floor(amount);
  const p = Math.round((amount - r) * 100);
  const parts: string[] = [];
  let rem = r;
  if (rem >= 10000000) { parts.push(twoD(Math.floor(rem/10000000))+' Crore'); rem %= 10000000; }
  if (rem >= 100000)   { parts.push(twoD(Math.floor(rem/100000))  +' Lakh');  rem %= 100000;   }
  if (rem >= 1000)     { parts.push(twoD(Math.floor(rem/1000))    +' Thousand'); rem %= 1000;   }
  if (rem > 0)         { parts.push(threeD(rem)); }
  const words = r === 0 ? 'Zero' : parts.join(' ');
  return `Rupees ${words}${p > 0 ? ` and ${twoD(p)} Paise` : ''} Only`;
}

export default async function ProformaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // quote id
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Load proforma invoice linked to this quote
  const { data: pi, error } = await supabaseAdmin
    .from('proforma_invoices')
    .select('*, customers(*)')
    .eq('quote_id', id)
    .single();

  if (error || !pi) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customer = pi.customers as any;
  const billing  = customer?.billing_address as Record<string, string> | null;
  const items    = (pi.items ?? []) as Array<{
    sku_id: string; name: string; item_type: string;
    hsn_code?: string; sac_code?: string; unit: string;
    quantity: number; unit_price: number; discount_pct: number;
    taxable_amount: number; gst_rate: number; cgst_rate: number;
    sgst_rate: number; igst_rate: number; gst_amount: number; total: number;
  }>;
  const isIntra = customer?.state_code === '33' || customer?.state?.toLowerCase().includes('tamil');

  const cell: React.CSSProperties = { border: '1px solid #ddd', padding: '6px 8px', fontSize: '10px' };
  const th: React.CSSProperties   = { ...cell, background: '#f5f5f5', fontWeight: 700, textAlign: 'center' as const };

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden !important; }
          #rh-pi, #rh-pi * { visibility: visible !important; }
          #rh-pi { position: fixed !important; inset: 0 !important; z-index: 99999 !important; background: white !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">Proforma Invoice</span>
          <span className="font-mono text-sm text-amber-400 font-bold">{pi.pi_no}</span>
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
            pi.status === 'paid' ? 'bg-green-500/10 text-green-400' :
            pi.status === 'sent' ? 'bg-blue-500/10 text-blue-400' :
            'bg-zinc-800 text-zinc-400'
          }`}>{pi.status}</span>
        </div>
        <button onClick={() => window.print()}
          className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 transition-colors">
          Print / Save PDF
        </button>
      </div>

      <div className="bg-zinc-950 min-h-screen py-10 print:py-0 print:bg-white flex justify-center">
        <div id="rh-pi" className="bg-white text-zinc-900"
          style={{ width: '210mm', minHeight: '297mm', padding: '12mm 16mm', fontFamily: 'Arial, sans-serif', fontSize: '11px' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2.5px solid #111', paddingBottom: '10px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/Logo2_black.png" alt="Rotehügels" style={{ height: '52px', width: 'auto', objectFit: 'contain', marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.2 }}>Rotehuegel Research Business</div>
                <div style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.2 }}>Consultancy Private Limited</div>
                <div style={{ marginTop: '5px', fontSize: '9px', color: '#666', lineHeight: 1.6 }}>
                  <div>{CO.addr1}</div><div>{CO.addr2}</div>
                  <div style={{ marginTop: '2px' }}>✉ {CO.email} | 📞 {CO.phone} | 🌐 {CO.web}</div>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <div style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', color: '#c45', letterSpacing: '1px' }}>
                PROFORMA INVOICE
              </div>
              <div style={{ marginTop: '8px', fontSize: '9.5px', color: '#555', fontStyle: 'italic' }}>
                This is not a tax invoice
              </div>
              <div style={{ marginTop: '6px', fontSize: '10px', lineHeight: 1.7 }}>
                <div><strong>PI No:</strong> {pi.pi_no}</div>
                <div><strong>Date:</strong> {fmtDate(pi.pi_date)}</div>
              </div>
            </div>
          </div>

          {/* Company strip */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', fontSize: '9.5px' }}>
            <div style={{ background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: '4px', padding: '5px 10px', lineHeight: 1.7 }}>
              <div><strong>GSTIN:</strong> {CO.gstin}</div>
              <div><strong>PAN:</strong> {CO.pan}</div>
              <div><strong>CIN:</strong> {CO.cin}</div>
            </div>
          </div>

          {/* Bill To */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px 10px' }}>
              <div style={{ fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', marginBottom: '5px', color: '#666' }}>Bill To</div>
              <div style={{ fontWeight: 700, fontSize: '11px' }}>{customer?.name}</div>
              {customer?.gstin && <div style={{ fontSize: '9.5px', marginTop: '2px' }}>GSTIN: {customer.gstin}</div>}
              {customer?.pan && <div style={{ fontSize: '9.5px' }}>PAN: {customer.pan}</div>}
              {billing && (
                <div style={{ fontSize: '9.5px', marginTop: '4px', lineHeight: 1.6, color: '#444' }}>
                  {billing.line1}{billing.line2 ? `, ${billing.line2}` : ''}<br/>
                  {billing.city}, {billing.state}{billing.pincode ? ` – ${billing.pincode}` : ''}
                </div>
              )}
              {customer?.phone && <div style={{ fontSize: '9px', marginTop: '3px' }}>📞 {customer.phone}</div>}
              {customer?.email && <div style={{ fontSize: '9px' }}>✉ {customer.email}</div>}
            </div>
            <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px 10px' }}>
              <div style={{ fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', marginBottom: '5px', color: '#666' }}>PI Details</div>
              <div style={{ fontSize: '10px', lineHeight: 1.8 }}>
                <div><strong>PI No:</strong> {pi.pi_no}</div>
                <div><strong>Date:</strong> {fmtDate(pi.pi_date)}</div>
                <div><strong>Place of Supply:</strong> {isIntra ? 'Tamil Nadu (33)' : (customer?.state ?? '—')}</div>
                <div><strong>GST Type:</strong> {isIntra ? 'CGST + SGST' : 'IGST'}</div>
              </div>
            </div>
          </div>

          {/* Items */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
            <thead>
              <tr>
                <th style={{ ...th, width: '4%' }}>#</th>
                <th style={{ ...th, width: '30%', textAlign: 'left' as const }}>Description</th>
                <th style={{ ...th, width: '8%' }}>HSN/SAC</th>
                <th style={{ ...th, width: '6%' }}>Qty</th>
                <th style={{ ...th, width: '6%' }}>Unit</th>
                <th style={{ ...th, width: '10%' }}>Rate (₹)</th>
                <th style={{ ...th, width: '10%' }}>Taxable (₹)</th>
                {isIntra ? (
                  <>
                    <th style={{ ...th, width: '8%' }}>CGST</th>
                    <th style={{ ...th, width: '8%' }}>SGST</th>
                  </>
                ) : (
                  <th style={{ ...th, width: '10%' }}>IGST</th>
                )}
                <th style={{ ...th, width: '10%' }}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const halfGst = parseFloat((item.gst_amount / 2).toFixed(2));
                return (
                  <tr key={i}>
                    <td style={{ ...cell, textAlign: 'center' as const }}>{i + 1}</td>
                    <td style={cell}>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      {item.sku_id && <div style={{ fontSize: '9px', color: '#888' }}>{item.sku_id}</div>}
                    </td>
                    <td style={{ ...cell, textAlign: 'center' as const, fontFamily: 'monospace' }}>
                      {item.hsn_code || item.sac_code || '—'}
                    </td>
                    <td style={{ ...cell, textAlign: 'right' as const }}>{item.quantity}</td>
                    <td style={{ ...cell, textAlign: 'center' as const }}>{item.unit}</td>
                    <td style={{ ...cell, textAlign: 'right' as const }}>{fmt(item.unit_price)}</td>
                    <td style={{ ...cell, textAlign: 'right' as const }}>{fmt(item.taxable_amount)}</td>
                    {isIntra ? (
                      <>
                        <td style={{ ...cell, textAlign: 'right' as const }}>{fmt(halfGst)}<br/><span style={{ fontSize: '8px', color: '#888' }}>{item.gst_rate/2}%</span></td>
                        <td style={{ ...cell, textAlign: 'right' as const }}>{fmt(halfGst)}<br/><span style={{ fontSize: '8px', color: '#888' }}>{item.gst_rate/2}%</span></td>
                      </>
                    ) : (
                      <td style={{ ...cell, textAlign: 'right' as const }}>{fmt(item.gst_amount)}<br/><span style={{ fontSize: '8px', color: '#888' }}>{item.gst_rate}%</span></td>
                    )}
                    <td style={{ ...cell, textAlign: 'right' as const, fontWeight: 700 }}>{fmt(item.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
            <table style={{ borderCollapse: 'collapse', minWidth: '240px' }}>
              <tbody>
                <tr>
                  <td style={{ ...cell, textAlign: 'right' as const, color: '#666' }}>Taxable Value</td>
                  <td style={{ ...cell, textAlign: 'right' as const, fontFamily: 'monospace' }}>{fmt(pi.taxable_value)}</td>
                </tr>
                {isIntra ? (
                  <>
                    <tr><td style={{ ...cell, textAlign: 'right' as const, color: '#666' }}>CGST</td>
                        <td style={{ ...cell, textAlign: 'right' as const, fontFamily: 'monospace' }}>{fmt(pi.cgst_amount)}</td></tr>
                    <tr><td style={{ ...cell, textAlign: 'right' as const, color: '#666' }}>SGST</td>
                        <td style={{ ...cell, textAlign: 'right' as const, fontFamily: 'monospace' }}>{fmt(pi.sgst_amount)}</td></tr>
                  </>
                ) : (
                  <tr><td style={{ ...cell, textAlign: 'right' as const, color: '#666' }}>IGST</td>
                      <td style={{ ...cell, textAlign: 'right' as const, fontFamily: 'monospace' }}>{fmt(pi.igst_amount)}</td></tr>
                )}
                <tr style={{ background: '#f0f0f0' }}>
                  <td style={{ ...cell, textAlign: 'right' as const, fontWeight: 900, fontSize: '12px' }}>TOTAL AMOUNT DUE</td>
                  <td style={{ ...cell, textAlign: 'right' as const, fontWeight: 900, fontSize: '12px', fontFamily: 'monospace' }}>{fmt(pi.total_amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Amount in words */}
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '6px 10px', marginBottom: '14px', fontSize: '10px' }}>
            <strong>Amount in Words:</strong> {amountInWords(pi.total_amount)}
          </div>

          {/* Bank details */}
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '8px 10px', marginBottom: '14px', fontSize: '10px', lineHeight: 1.7 }}>
            <div style={{ fontWeight: 700, marginBottom: '4px' }}>Bank Details for Payment</div>
            <div><strong>Bank:</strong> {CO.bank}</div>
            <div><strong>Account No:</strong> {CO.acc}</div>
            <div><strong>IFSC:</strong> {CO.ifsc}</div>
            <div style={{ marginTop: '4px', fontSize: '9px', color: '#888' }}>
              UPI: rotehuegels@sbi | Please mention PI No. {pi.pi_no} in payment reference.
            </div>
          </div>

          {pi.notes && (
            <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '8px 10px', marginBottom: '14px', fontSize: '10px' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>Notes</div>
              <div>{pi.notes}</div>
            </div>
          )}

          {/* Footer */}
          <div style={{ borderTop: '1px solid #ddd', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#888' }}>
            <div>
              <div>This is a Proforma Invoice and not a Tax Invoice under GST.</div>
              <div>Tax Invoice will be issued upon delivery/completion of service.</div>
              <div>Subject to Chennai jurisdiction.</div>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <div style={{ marginBottom: '30px' }}>For Rotehuegel Research Business Consultancy Pvt Ltd</div>
              <div style={{ fontWeight: 700, color: '#333' }}>Authorised Signatory</div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
