import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import StatementPrintButton from './StatementPrintButton';

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
  bank:  'State Bank of India, Padianallur Branch',
  acc:   '44512115640',
  ifsc:  'SBIN0014160',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default async function CustomerStatementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: customer, error: custErr } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (custErr || !customer) notFound();

  // Fetch active orders with their payments
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('id, order_no, order_type, description, order_date, invoice_date, total_value_incl_gst, status, order_category')
    .eq('customer_id', id)
    .neq('status', 'cancelled')
    .neq('order_category', 'reimbursement')
    .order('invoice_date', { ascending: true, nullsFirst: false });

  const orderIds = (orders ?? []).map(o => o.id);

  // Fetch all payments for these orders in one query
  const { data: allPayments } = await supabaseAdmin
    .from('order_payments')
    .select('order_id, amount_received')
    .in('order_id', orderIds.length ? orderIds : ['00000000-0000-0000-0000-000000000000']);

  // Calculate received + pending per order
  const paymentMap: Record<string, number> = {};
  for (const p of allPayments ?? []) {
    paymentMap[p.order_id] = (paymentMap[p.order_id] ?? 0) + (p.amount_received ?? 0);
  }

  const rows = (orders ?? []).map(o => ({
    ...o,
    received: paymentMap[o.id] ?? 0,
    pending:  (o.total_value_incl_gst ?? 0) - (paymentMap[o.id] ?? 0),
  })).filter(o => o.order_category !== 'complimentary' || o.total_value_incl_gst > 0);

  const totalValue    = rows.reduce((s, o) => s + o.total_value_incl_gst, 0);
  const totalReceived = rows.reduce((s, o) => s + o.received, 0);
  const totalPending  = rows.reduce((s, o) => s + o.pending, 0);

  const billing = customer.billing_address as Record<string, string> | null;
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const cell: React.CSSProperties = { border: '1px solid #ddd', padding: '6px 8px', fontSize: '10px' };
  const th: React.CSSProperties   = { ...cell, background: '#f5f5f5', fontWeight: 700, textAlign: 'center' as const };

  return (
    <div className="p-6 max-w-5xl space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/dashboard/accounts/customers/${id}`}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-3 transition-colors">
            <ArrowLeft className="h-3 w-3" /> {customer.name}
          </Link>
          <h1 className="text-base font-bold text-white">Statement of Account</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Pending bills as of {today}</p>
        </div>
        <StatementPrintButton />
      </div>

      {/* Letterhead document */}
      <div className="rounded-2xl border border-zinc-700 bg-zinc-100 p-2 shadow-xl">
        <div id="rh-statement-doc" className="bg-white text-zinc-900 rounded-xl"
          style={{ padding: '12mm 16mm', fontFamily: 'Arial, sans-serif', fontSize: '11px' }}>

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
                  <div>✉ {CO.email} | 📞 {CO.phone}</div>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <div style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', color: '#b45309', letterSpacing: '1px' }}>
                STATEMENT OF ACCOUNT
              </div>
              <div style={{ marginTop: '6px', fontSize: '10px', lineHeight: 1.8 }}>
                <div><strong>Date:</strong> {today}</div>
                <div><strong>GSTIN:</strong> {CO.gstin}</div>
                <div><strong>PAN:</strong> {CO.pan}</div>
              </div>
            </div>
          </div>

          {/* Customer details */}
          <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px 12px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', marginBottom: '4px', color: '#666' }}>To</div>
              <div style={{ fontWeight: 700, fontSize: '12px' }}>{customer.name}</div>
              {customer.gstin && <div style={{ fontSize: '9.5px', marginTop: '2px' }}>GSTIN: {customer.gstin}</div>}
              {billing && (
                <div style={{ fontSize: '9.5px', marginTop: '4px', lineHeight: 1.6, color: '#444' }}>
                  {billing.line1}{billing.line2 ? `, ${billing.line2}` : ''}<br />
                  {billing.city}, {billing.state}{billing.pincode ? ` – ${billing.pincode}` : ''}
                </div>
              )}
              {customer.email && <div style={{ fontSize: '9px', marginTop: '2px' }}>✉ {customer.email}</div>}
            </div>
            <div style={{ textAlign: 'right' as const, fontSize: '10px', lineHeight: 1.8 }}>
              <div style={{ fontSize: '9px', color: '#888', marginBottom: '4px' }}>Outstanding Summary</div>
              <div><strong>Total Billed:</strong> <span style={{ fontFamily: 'monospace' }}>{fmt(totalValue)}</span></div>
              <div><strong>Total Received:</strong> <span style={{ fontFamily: 'monospace', color: '#16a34a' }}>{fmt(totalReceived)}</span></div>
              <div style={{ fontSize: '12px', fontWeight: 900, color: '#c00', marginTop: '4px', borderTop: '1px solid #ddd', paddingTop: '4px' }}>
                Total Pending: {fmt(totalPending)}
              </div>
            </div>
          </div>

          {/* Orders table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px' }}>
            <thead>
              <tr>
                <th style={{ ...th, width: '10%', textAlign: 'left' as const }}>Order No</th>
                <th style={{ ...th, width: '35%', textAlign: 'left' as const }}>Description</th>
                <th style={{ ...th, width: '10%' }}>Invoice Date</th>
                <th style={{ ...th, width: '15%' }}>Order Value</th>
                <th style={{ ...th, width: '15%' }}>Received</th>
                <th style={{ ...th, width: '15%', color: '#c00' }}>Pending</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o, i) => (
                <tr key={o.id} style={{ background: i % 2 === 1 ? '#fafafa' : 'white' }}>
                  <td style={{ ...cell, fontFamily: 'monospace', fontWeight: 700 }}>{o.order_no}</td>
                  <td style={cell}>
                    <div style={{ fontWeight: 600 }}>{o.description}</div>
                    <div style={{ fontSize: '9px', color: '#888', marginTop: '2px', textTransform: 'capitalize' }}>{o.order_type}</div>
                  </td>
                  <td style={{ ...cell, textAlign: 'center' as const }}>{fmtDate(o.invoice_date ?? o.order_date)}</td>
                  <td style={{ ...cell, textAlign: 'right' as const, fontFamily: 'monospace' }}>
                    {o.total_value_incl_gst > 0 ? fmt(o.total_value_incl_gst) : 'Complimentary'}
                  </td>
                  <td style={{ ...cell, textAlign: 'right' as const, fontFamily: 'monospace', color: '#16a34a' }}>
                    {fmt(o.received)}
                  </td>
                  <td style={{ ...cell, textAlign: 'right' as const, fontFamily: 'monospace', fontWeight: 700, color: o.pending > 0 ? '#c00' : '#16a34a' }}>
                    {fmt(o.pending)}
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr style={{ background: '#f0f0f0' }}>
                <td colSpan={3} style={{ ...cell, textAlign: 'right' as const, fontWeight: 900 }}>TOTAL</td>
                <td style={{ ...cell, textAlign: 'right' as const, fontFamily: 'monospace', fontWeight: 900 }}>{fmt(totalValue)}</td>
                <td style={{ ...cell, textAlign: 'right' as const, fontFamily: 'monospace', fontWeight: 900, color: '#16a34a' }}>{fmt(totalReceived)}</td>
                <td style={{ ...cell, textAlign: 'right' as const, fontFamily: 'monospace', fontWeight: 900, color: '#c00', fontSize: '12px' }}>{fmt(totalPending)}</td>
              </tr>
            </tbody>
          </table>

          {/* Payment request */}
          <div style={{ border: '1px solid #f0c000', background: '#fffbeb', borderRadius: '4px', padding: '8px 12px', marginBottom: '14px', fontSize: '10px' }}>
            <strong>Kindly arrange payment of the outstanding amount at the earliest.</strong>
            <span style={{ color: '#666' }}> Please use the bank details below and mention the Order No. in your payment reference.</span>
          </div>

          {/* Bank details */}
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '8px 12px', marginBottom: '14px', fontSize: '10px', lineHeight: 1.8 }}>
            <div style={{ fontWeight: 700, marginBottom: '4px' }}>Bank Details for Payment</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
              <div><strong>Bank:</strong> {CO.bank}</div>
              <div><strong>Account No:</strong> {CO.acc}</div>
              <div><strong>IFSC:</strong> {CO.ifsc}</div>
              <div><strong>UPI:</strong> rotehuegels@sbi</div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid #ddd', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#888' }}>
            <div>
              <div>This is a computer-generated statement of account.</div>
              <div>For discrepancies, please contact us at {CO.email}</div>
              <div>Subject to Chennai jurisdiction.</div>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <div>For Rotehuegel Research Business Consultancy Pvt Ltd</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/api/private/signature" alt="Signature" style={{ height: '44px', width: 'auto', marginTop: '4px', marginLeft: 'auto' }} />
              <div style={{ fontWeight: 700, color: '#333', marginTop: '2px' }}>Authorised Signatory</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
