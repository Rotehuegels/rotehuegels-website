import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Building2, Mail, Phone, MapPin, User, FileText, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: customer, error } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !customer) notFound();

  // Load quotes and orders for this customer
  const [{ data: quotes }, { data: orders }] = await Promise.all([
    supabaseAdmin
      .from('quotes')
      .select('id, quote_no, quote_date, total_amount, status')
      .eq('customer_id', id)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('orders')
      .select('id, order_no, order_type, order_date, total_value_incl_gst, status')
      .eq('customer_id', id)
      .neq('order_category', 'reimbursement')
      .neq('status', 'cancelled')
      .order('order_date', { ascending: false }),
  ]);

  const billing = customer.billing_address as Record<string, string> | null;
  const shipping = customer.shipping_address as Record<string, string> | null;

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

  const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-zinc-800 text-zinc-400', sent: 'bg-blue-500/10 text-blue-400',
    accepted: 'bg-green-500/10 text-green-400', rejected: 'bg-red-500/10 text-red-400',
    expired: 'bg-orange-500/10 text-orange-400', converted: 'bg-amber-500/10 text-amber-400',
  };

  return (
    <div className="p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/dashboard/accounts/customers" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-3 transition-colors">
            <ArrowLeft className="h-3 w-3" /> Customers
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-amber-400 font-bold">{customer.customer_id}</span>
            <h1 className="text-xl font-bold text-white">{customer.name}</h1>
          </div>
          {customer.state && (
            <p className="text-xs text-zinc-500 mt-1">
              {customer.state} · {customer.state_code === '33' ? 'Intra-state (CGST+SGST)' : 'Inter-state (IGST)'}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/accounts/quotes/new?customer=${id}`}
            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 transition-colors flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" /> New Quote
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Customer Info</h2>

          {customer.gstin && (
            <div>
              <p className="text-xs text-zinc-600">GSTIN</p>
              <p className="font-mono text-sm text-white">{customer.gstin}</p>
            </div>
          )}
          {customer.pan && (
            <div>
              <p className="text-xs text-zinc-600">PAN</p>
              <p className="font-mono text-sm text-white">{customer.pan}</p>
            </div>
          )}
          {customer.contact_person && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-zinc-600" />
              <span className="text-sm text-zinc-300">{customer.contact_person}</span>
            </div>
          )}
          {customer.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-zinc-600" />
              <a href={`mailto:${customer.email}`} className="text-sm text-amber-400 hover:underline">{customer.email}</a>
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-zinc-600" />
              <a href={`tel:${customer.phone}`} className="text-sm text-zinc-300">{customer.phone}</a>
            </div>
          )}
          {customer.notes && (
            <div className="border-t border-zinc-800 pt-3">
              <p className="text-xs text-zinc-600 mb-1">Notes</p>
              <p className="text-sm text-zinc-400">{customer.notes}</p>
            </div>
          )}
        </div>

        {/* Address card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Addresses</h2>

          {billing && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <MapPin className="h-3.5 w-3.5 text-zinc-600" />
                <p className="text-xs text-zinc-500 font-medium">Billing</p>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {billing.line1}{billing.line2 ? `, ${billing.line2}` : ''}<br />
                {billing.city}, {billing.state}{billing.pincode ? ` – ${billing.pincode}` : ''}
              </p>
            </div>
          )}

          {shipping && (
            <div className="border-t border-zinc-800 pt-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <MapPin className="h-3.5 w-3.5 text-zinc-600" />
                <p className="text-xs text-zinc-500 font-medium">Shipping</p>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {shipping.line1}{shipping.line2 ? `, ${shipping.line2}` : ''}<br />
                {shipping.city}, {shipping.state}{shipping.pincode ? ` – ${shipping.pincode}` : ''}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Orders */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
            Orders ({orders?.length ?? 0})
          </h2>
          <Link href="/dashboard/accounts/orders/new" className="text-xs text-amber-400 hover:underline">
            + New Order
          </Link>
        </div>
        {!orders?.length ? (
          <p className="text-sm text-zinc-600">No orders for this customer yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="pb-2 text-left text-xs text-zinc-500">Order No</th>
                <th className="pb-2 text-left text-xs text-zinc-500">Type</th>
                <th className="pb-2 text-left text-xs text-zinc-500">Date</th>
                <th className="pb-2 text-right text-xs text-zinc-500">Amount</th>
                <th className="pb-2 text-left text-xs text-zinc-500 pl-4">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-zinc-800/20">
                  <td className="py-2.5 font-mono text-xs text-amber-400">{o.order_no}</td>
                  <td className="py-2.5 text-xs text-zinc-500 capitalize">{o.order_type}</td>
                  <td className="py-2.5 text-xs text-zinc-400">
                    {new Date(o.order_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-2.5 text-right font-mono text-sm text-white">{fmt(o.total_value_incl_gst)}</td>
                  <td className="py-2.5 pl-4">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      o.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                      o.status === 'active'    ? 'bg-blue-500/10 text-blue-400' :
                      o.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>{o.status}</span>
                  </td>
                  <td className="py-2.5 text-right">
                    <Link href={`/dashboard/accounts/orders/${o.id}`} className="text-xs text-amber-400 hover:underline">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quotes */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
            Quotations ({quotes?.length ?? 0})
          </h2>
          <Link href="/dashboard/accounts/quotes/new" className="text-xs text-amber-400 hover:underline">
            + New Quote
          </Link>
        </div>
        {!quotes?.length ? (
          <p className="text-sm text-zinc-600">No quotes for this customer yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="pb-2 text-left text-xs text-zinc-500">Quote No</th>
                <th className="pb-2 text-left text-xs text-zinc-500">Date</th>
                <th className="pb-2 text-right text-xs text-zinc-500">Amount</th>
                <th className="pb-2 text-left text-xs text-zinc-500 pl-4">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {quotes.map(q => (
                <tr key={q.id} className="hover:bg-zinc-800/20">
                  <td className="py-2.5 font-mono text-xs text-amber-400">{q.quote_no}</td>
                  <td className="py-2.5 text-xs text-zinc-400">
                    {new Date(q.quote_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-2.5 text-right font-mono text-sm text-white">{fmt(q.total_amount)}</td>
                  <td className="py-2.5 pl-4">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[q.status] ?? ''}`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <Link href={`/dashboard/accounts/quotes/${q.id}`} className="text-xs text-amber-400 hover:underline">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
