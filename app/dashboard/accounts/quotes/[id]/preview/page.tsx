import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import PDFViewer from '@/components/PDFViewer';
import { getLogoBase64, getSignatureBase64 } from '@/lib/serverAssets';

import { getCompanyCO } from '@/lib/company';

export const dynamic = 'force-dynamic';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default async function QuotePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const CO = await getCompanyCO();
  const logoSrc = getLogoBase64();
  const sigSrc  = getSignatureBase64();

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
    border: '1px solid #ddd', padding: '4px 5px', fontSize: '9px',
  };
  const th: React.CSSProperties = { ...cell, background: '#f5f5f5', fontWeight: 700, textAlign: 'center' as const };

  return (
    <PDFViewer
      contentId="rh-quote"
      filename={`${quote.quote_no}.pdf`}
      toolbar={
        <div className="flex items-center gap-3">
          <a href={`/d/quotes/${id}`}
            className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            ← Back to Quote
          </a>
          <span className="text-zinc-700">|</span>
          <span className="text-xs text-zinc-500">Quotation</span>
          <span className="font-mono text-sm text-amber-400 font-bold">{quote.quote_no}</span>
        </div>
      }
    >
      <div>
        <div id="rh-quote" className="bg-white text-zinc-900"
          style={{ width: '210mm', minHeight: '297mm', padding: '6mm 10mm', fontFamily: 'Arial, sans-serif', fontSize: '9.5px' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2.5px solid #111', paddingBottom: '6px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoSrc} alt="Rotehügels" style={{ height: '44px', width: 'auto', objectFit: 'contain', marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.2 }}>
                  Rotehuegel Research Business
                </div>
                <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.2 }}>
                  Consultancy Private Limited
                </div>
                <div style={{ marginTop: '3px', fontSize: '8.5px', color: '#666', lineHeight: 1.5 }}>
                  <div>{CO.addr1}</div>
                  <div>{CO.addr2}</div>
                  <div>✉ {CO.email} | 📞 {CO.phone} | 🌐 {CO.web}</div>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <div style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', color: '#111', letterSpacing: '1px' }}>
                QUOTATION
              </div>
              <div style={{ fontSize: '8.5px', color: '#888', marginBottom: '2px' }}>Not a tax invoice</div>
              <div style={{ marginTop: '4px', fontSize: '9px', lineHeight: 1.6 }}>
                <div><strong>Quote No:</strong> {quote.quote_no}</div>
                <div><strong>Date:</strong> {fmtDate(quote.quote_date)}</div>
                {quote.valid_until && <div><strong>Valid Until:</strong> {fmtDate(quote.valid_until)}</div>}
              </div>
            </div>
          </div>

          {/* Company details strip */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '9px' }}>
            <div style={{ background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: '4px', padding: '3px 8px', lineHeight: 1.6 }}>
              <strong>GSTIN:</strong> {CO.gstin} &nbsp;|&nbsp; <strong>PAN:</strong> {CO.pan} &nbsp;|&nbsp; <strong>CIN:</strong> {CO.cin}
            </div>
          </div>

          {/* Bill To */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '5px 8px' }}>
              <div style={{ fontWeight: 700, fontSize: '8px', textTransform: 'uppercase', marginBottom: '3px', color: '#666' }}>
                Quoted To
              </div>
              <div style={{ fontWeight: 700, fontSize: '10px' }}>{customer?.name}</div>
              {customer?.gstin && <div style={{ fontSize: '9px', marginTop: '1px' }}>GSTIN: {customer.gstin}</div>}
              {customer?.pan && <div style={{ fontSize: '9px' }}>PAN: {customer.pan}</div>}
              {billing && (
                <div style={{ fontSize: '9px', marginTop: '3px', lineHeight: 1.5, color: '#444' }}>
                  {billing.line1}{billing.line2 ? `, ${billing.line2}` : ''}<br />
                  {billing.city}, {billing.state}{billing.pincode ? ` – ${billing.pincode}` : ''}
                </div>
              )}
              {customer?.phone && <div style={{ fontSize: '8.5px', marginTop: '2px' }}>📞 {customer.phone}</div>}
              {customer?.email && <div style={{ fontSize: '8.5px' }}>✉ {customer.email}</div>}
            </div>
            <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '5px 8px' }}>
              <div style={{ fontWeight: 700, fontSize: '8px', textTransform: 'uppercase', marginBottom: '3px', color: '#666' }}>
                Quote Details
              </div>
              <div style={{ fontSize: '9px', lineHeight: 1.6 }}>
                <div><strong>Quote No:</strong> {quote.quote_no}</div>
                <div><strong>Date:</strong> {fmtDate(quote.quote_date)}</div>
                {quote.valid_until && <div><strong>Valid Until:</strong> {fmtDate(quote.valid_until)}</div>}
                <div><strong>Place of Supply:</strong> {isIntra ? 'Tamil Nadu (33)' : (customer?.state ?? '—')}</div>
                <div><strong>GST Type:</strong> {isIntra ? 'CGST + SGST' : 'IGST'}</div>
              </div>
            </div>
          </div>

          {/* Items table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
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
                  <td style={{ ...cell, textAlign: 'right' as const, fontWeight: 900, fontSize: '11px' }}>GRAND TOTAL</td>
                  <td style={{ ...cell, textAlign: 'right' as const, fontWeight: 900, fontSize: '11px', fontFamily: 'monospace' }}>{fmt(quote.total_amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes & Terms */}
          {(quote.notes || quote.terms) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              {quote.notes && (
                <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '5px 8px' }}>
                  <div style={{ fontWeight: 700, fontSize: '8px', textTransform: 'uppercase', marginBottom: '3px', color: '#666' }}>Notes</div>
                  <div style={{ fontSize: '8.5px', lineHeight: 1.5 }}>{quote.notes}</div>
                </div>
              )}
              {quote.terms && (
                <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '5px 8px' }}>
                  <div style={{ fontWeight: 700, fontSize: '8px', textTransform: 'uppercase', marginBottom: '3px', color: '#666' }}>Terms &amp; Conditions</div>
                  <div style={{ fontSize: '8.5px', lineHeight: 1.5 }}>{quote.terms}</div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={{ borderTop: '1px solid #ddd', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', color: '#888' }}>
            <div>
              <div>This is a quotation and not a tax invoice.</div>
              <div>Prices are subject to change without notice after validity date.</div>
              <div>Subject to Chennai jurisdiction.</div>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <div>For Rotehuegel Research Business Consultancy Pvt Ltd</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sigSrc} alt="Signature" style={{ height: '40px', width: 'auto', marginTop: '3px', marginLeft: 'auto' }} />
              <div style={{ fontWeight: 700, color: '#333', marginTop: '2px' }}>Authorised Signatory</div>
            </div>
          </div>

        </div>
      </div>
    </PDFViewer>
  );
}
