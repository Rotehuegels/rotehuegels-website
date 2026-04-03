import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';

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
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default async function QuotePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: quote, error } = await supabaseAdmin
    .from('quotes')
    .select('*, customers(*)')
    .eq('id', id)
    .single();

  if (error || !quote) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customer = quote.customers as any;
  const billing = customer?.billing_address as Record<string, string> | null;
  const items = (quote.items ?? []) as Array<{
    sku_id: string; name: string; item_type: string;
    hsn_code?: string; sac_code?: string; unit: string;
    quantity: number; unit_price: number; discount_pct: number;
    taxable_amount: number; gst_rate: number; cgst_rate: number;
    sgst_rate: number; igst_rate: number; gst_amount: number; total: number;
  }>;
  const isIntra = customer?.state_code === '33' || customer?.state?.toLowerCase().includes('tamil');

  const cell: React.CSSProperties = {
    border: '1px solid #ddd', padding: '6px 8px', fontSize: '10px',
  };
  const th: React.CSSProperties = { ...cell, background: '#f5f5f5', fontWeight: 700, textAlign: 'center' as const };

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden !important; }
          #rh-quote, #rh-quote * { visibility: visible !important; }
          #rh-quote {
            position: fixed !important; inset: 0 !important;
            z-index: 99999 !important; background: white !important;
            overflow: visible !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">Quotation Preview</span>
          <span className="font-mono text-sm text-amber-400 font-bold">{quote.quote_no}</span>
        </div>
        <button onClick={() => window.print()}
          className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 transition-colors">
          Print / Save PDF
        </button>
      </div>

      <div className="bg-zinc-950 min-h-screen py-10 print:py-0 print:bg-white flex justify-center">
        <div id="rh-quote" className="bg-white text-zinc-900"
          style={{ width: '210mm', minHeight: '297mm', padding: '12mm 16mm', fontFamily: 'Arial, sans-serif', fontSize: '11px' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2.5px solid #111', paddingBottom: '10px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/Logo2_black.png" alt="Rotehügels" style={{ height: '52px', width: 'auto', objectFit: 'contain', marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.2 }}>
                  Rotehuegel Research Business
                </div>
                <div style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.2 }}>
                  Consultancy Private Limited
                </div>
                <div style={{ marginTop: '5px', fontSize: '9px', color: '#666', lineHeight: 1.6 }}>
                  <div>{CO.addr1}</div>
                  <div>{CO.addr2}</div>
                  <div style={{ marginTop: '2px' }}>✉ {CO.email} | 📞 {CO.phone} | 🌐 {CO.web}</div>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <div style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', color: '#111', letterSpacing: '1px' }}>
                QUOTATION
              </div>
              <div style={{ marginTop: '8px', fontSize: '10px', lineHeight: 1.7 }}>
                <div><strong>Quote No:</strong> {quote.quote_no}</div>
                <div><strong>Date:</strong> {fmtDate(quote.quote_date)}</div>
                {quote.valid_until && <div><strong>Valid Until:</strong> {fmtDate(quote.valid_until)}</div>}
              </div>
            </div>
          </div>

          {/* Company details strip */}
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
              <div style={{ fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', marginBottom: '5px', color: '#666' }}>
                Bill To
              </div>
              <div style={{ fontWeight: 700, fontSize: '11px' }}>{customer?.name}</div>
              {customer?.gstin && <div style={{ fontSize: '9.5px', marginTop: '2px' }}>GSTIN: {customer.gstin}</div>}
              {billing && (
                <div style={{ fontSize: '9.5px', marginTop: '4px', lineHeight: 1.6, color: '#444' }}>
                  {billing.line1}{billing.line2 ? `, ${billing.line2}` : ''}<br />
                  {billing.city}, {billing.state}{billing.pincode ? ` – ${billing.pincode}` : ''}
                </div>
              )}
              {customer?.phone && <div style={{ fontSize: '9px', marginTop: '3px' }}>📞 {customer.phone}</div>}
              {customer?.email && <div style={{ fontSize: '9px' }}>✉ {customer.email}</div>}
            </div>
            <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px 10px' }}>
              <div style={{ fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', marginBottom: '5px', color: '#666' }}>
                Quote Details
              </div>
              <div style={{ fontSize: '10px', lineHeight: 1.8 }}>
                <div><strong>Quote No:</strong> {quote.quote_no}</div>
                <div><strong>Date:</strong> {fmtDate(quote.quote_date)}</div>
                {quote.valid_until && <div><strong>Valid Until:</strong> {fmtDate(quote.valid_until)}</div>}
                <div><strong>Place of Supply:</strong> {isIntra ? 'Tamil Nadu (33)' : (customer?.state ?? '—')}</div>
                <div><strong>GST Type:</strong> {isIntra ? 'CGST + SGST' : 'IGST'}</div>
              </div>
            </div>
          </div>

          {/* Items table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
            <thead>
              <tr>
                <th style={{ ...th, width: '4%' }}>#</th>
                <th style={{ ...th, width: '30%', textAlign: 'left' as const }}>Description</th>
                <th style={{ ...th, width: '8%' }}>HSN/SAC</th>
                <th style={{ ...th, width: '6%' }}>Qty</th>
                <th style={{ ...th, width: '6%' }}>Unit</th>
                <th style={{ ...th, width: '10%' }}>Rate (₹)</th>
                <th style={{ ...th, width: '6%' }}>Disc%</th>
                <th style={{ ...th, width: '10%' }}>Taxable (₹)</th>
                <th style={{ ...th, width: '6%' }}>GST%</th>
                <th style={{ ...th, width: '14%' }}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
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
                  <td style={{ ...cell, textAlign: 'center' as const }}>
                    {item.discount_pct > 0 ? `${item.discount_pct}%` : '—'}
                  </td>
                  <td style={{ ...cell, textAlign: 'right' as const }}>{fmt(item.taxable_amount)}</td>
                  <td style={{ ...cell, textAlign: 'center' as const }}>{item.gst_rate}%</td>
                  <td style={{ ...cell, textAlign: 'right' as const, fontWeight: 700 }}>{fmt(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <table style={{ borderCollapse: 'collapse', minWidth: '220px' }}>
              <tbody>
                <tr>
                  <td style={{ ...cell, textAlign: 'right' as const, color: '#666' }}>Subtotal</td>
                  <td style={{ ...cell, textAlign: 'right' as const, fontFamily: 'monospace' }}>{fmt(quote.subtotal)}</td>
                </tr>
                {Number(quote.discount_amount) > 0 && (
                  <tr>
                    <td style={{ ...cell, textAlign: 'right' as const, color: '#e00' }}>Discount</td>
                    <td style={{ ...cell, textAlign: 'right' as const, fontFamily: 'monospace', color: '#e00' }}>− {fmt(quote.discount_amount)}</td>
                  </tr>
                )}
                <tr>
                  <td style={{ ...cell, textAlign: 'right' as const }}>Taxable Value</td>
                  <td style={{ ...cell, textAlign: 'right' as const, fontFamily: 'monospace' }}>{fmt(quote.taxable_value)}</td>
                </tr>
                {isIntra ? (
                  <>
                    <tr>
                      <td style={{ ...cell, textAlign: 'right' as const, color: '#666' }}>CGST</td>
                      <td style={{ ...cell, textAlign: 'right' as const, fontFamily: 'monospace' }}>{fmt(quote.cgst_amount)}</td>
                    </tr>
                    <tr>
                      <td style={{ ...cell, textAlign: 'right' as const, color: '#666' }}>SGST</td>
                      <td style={{ ...cell, textAlign: 'right' as const, fontFamily: 'monospace' }}>{fmt(quote.sgst_amount)}</td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td style={{ ...cell, textAlign: 'right' as const, color: '#666' }}>IGST</td>
                    <td style={{ ...cell, textAlign: 'right' as const, fontFamily: 'monospace' }}>{fmt(quote.igst_amount)}</td>
                  </tr>
                )}
                <tr style={{ background: '#f0f0f0' }}>
                  <td style={{ ...cell, textAlign: 'right' as const, fontWeight: 900, fontSize: '12px' }}>GRAND TOTAL</td>
                  <td style={{ ...cell, textAlign: 'right' as const, fontWeight: 900, fontSize: '12px', fontFamily: 'monospace' }}>{fmt(quote.total_amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes & Terms */}
          {(quote.notes || quote.terms) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              {quote.notes && (
                <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '8px 10px' }}>
                  <div style={{ fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', marginBottom: '4px', color: '#666' }}>Notes</div>
                  <div style={{ fontSize: '10px', lineHeight: 1.6 }}>{quote.notes}</div>
                </div>
              )}
              {quote.terms && (
                <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '8px 10px' }}>
                  <div style={{ fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', marginBottom: '4px', color: '#666' }}>Terms &amp; Conditions</div>
                  <div style={{ fontSize: '10px', lineHeight: 1.6 }}>{quote.terms}</div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={{ borderTop: '1px solid #ddd', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#888' }}>
            <div>
              <div>This is a quotation, not a tax invoice.</div>
              <div>Subject to Chennai jurisdiction.</div>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <div style={{ marginBottom: '24px' }}>For Rotehuegel Research Business Consultancy Pvt Ltd</div>
              <div style={{ fontWeight: 700, color: '#333' }}>Authorised Signatory</div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
