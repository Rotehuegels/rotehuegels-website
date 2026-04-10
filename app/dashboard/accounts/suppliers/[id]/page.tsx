import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, Hash, MapPin, BadgeCheck, BadgeX, Calendar, Mail, Phone, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: supplier, error } = await supabaseAdmin
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !supplier) notFound();

  // Fetch purchase orders linked to this supplier
  const { data: purchaseOrders } = await supabaseAdmin
    .from('purchase_orders')
    .select('id, po_no, po_date, total_amount, status')
    .eq('supplier_id', id)
    .order('po_date', { ascending: false });

  const poList = purchaseOrders ?? [];

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

  const isActive = supplier.gst_status === 'Active';

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <Link href="/dashboard/accounts/suppliers"
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Suppliers
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">{supplier.legal_name}</h1>
            {supplier.trade_name && supplier.trade_name !== supplier.legal_name && (
              <p className="text-sm text-zinc-400 mt-0.5">{supplier.trade_name}</p>
            )}
          </div>
          {supplier.gst_status && (
            <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border shrink-0 ${
              isActive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {isActive ? <BadgeCheck className="h-3.5 w-3.5" /> : <BadgeX className="h-3.5 w-3.5" />}
              {supplier.gst_status}
            </span>
          )}
        </div>
      </div>

      {/* GSTIN & Tax Details */}
      <div className={`${glass} p-6`}>
        <h2 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
          <Hash className="h-4 w-4 text-amber-400" /> Tax & Registration
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {supplier.gstin && (
            <div>
              <p className="text-xs text-zinc-500">GSTIN</p>
              <p className="text-sm font-mono text-amber-400 font-semibold mt-0.5">{supplier.gstin}</p>
            </div>
          )}
          {supplier.pan && (
            <div>
              <p className="text-xs text-zinc-500">PAN</p>
              <p className="text-sm font-mono text-zinc-200 mt-0.5">{supplier.pan}</p>
            </div>
          )}
          {supplier.entity_type && (
            <div>
              <p className="text-xs text-zinc-500">Entity Type</p>
              <p className="text-sm text-zinc-200 mt-0.5">{supplier.entity_type}</p>
            </div>
          )}
          {supplier.reg_date && (
            <div>
              <p className="text-xs text-zinc-500">GST Registration Date</p>
              <p className="text-sm text-zinc-200 mt-0.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                {fmtDate(supplier.reg_date)}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-zinc-500">GST Status</p>
            <p className={`text-sm font-medium mt-0.5 ${isActive ? 'text-emerald-400' : 'text-red-400'}`}>
              {supplier.gst_status ?? 'Not Registered'}
            </p>
          </div>
        </div>
      </div>

      {/* Address & Contact */}
      <div className={`${glass} p-6`}>
        <h2 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-amber-400" /> Address & Contact
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {supplier.address && (
            <div className="sm:col-span-2">
              <p className="text-xs text-zinc-500">Address</p>
              <p className="text-sm text-zinc-300 mt-0.5 flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-zinc-500 shrink-0 mt-0.5" />
                {supplier.address}
              </p>
            </div>
          )}
          {supplier.state && (
            <div>
              <p className="text-xs text-zinc-500">State</p>
              <p className="text-sm text-zinc-200 mt-0.5">{supplier.state}</p>
            </div>
          )}
          {supplier.pincode && (
            <div>
              <p className="text-xs text-zinc-500">Pincode</p>
              <p className="text-sm font-mono text-zinc-200 mt-0.5">{supplier.pincode}</p>
            </div>
          )}
          {supplier.email && (
            <div>
              <p className="text-xs text-zinc-500">Email</p>
              <p className="text-sm text-zinc-200 mt-0.5 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-zinc-500" />
                {supplier.email}
              </p>
            </div>
          )}
          {supplier.phone && (
            <div>
              <p className="text-xs text-zinc-500">Phone</p>
              <p className="text-sm text-zinc-200 mt-0.5 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-zinc-500" />
                {supplier.phone}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Purchase Orders */}
      <div className={glass}>
        <div className="px-6 py-4 border-b border-zinc-800/60 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-400" /> Purchase Orders
          </h2>
          <span className="text-xs text-zinc-600">{poList.length} total</span>
        </div>
        {!poList.length ? (
          <p className="p-6 text-sm text-zinc-600">No purchase orders with this supplier.</p>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {poList.map(po => (
              <Link key={po.id} href={`/dashboard/accounts/purchase-orders/${po.id}`}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-zinc-800/30 transition-colors">
                <div>
                  <span className="font-mono text-xs text-amber-400 font-semibold">{po.po_no}</span>
                  <span className="text-xs text-zinc-500 ml-3">{fmtDate(po.po_date)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-zinc-300">{fmt(po.total_amount)}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${
                    po.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    po.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {po.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      {supplier.notes && (
        <div className={`${glass} p-6`}>
          <p className="text-xs text-zinc-500 mb-2">Notes</p>
          <p className="text-sm text-zinc-400 leading-relaxed">{supplier.notes}</p>
        </div>
      )}

      {/* Meta */}
      <div className="flex items-center gap-4 text-[10px] text-zinc-600">
        {supplier.created_at && <span>Created {fmtDate(supplier.created_at)}</span>}
        {supplier.updated_at && <span>· Updated {fmtDate(supplier.updated_at)}</span>}
      </div>
    </div>
  );
}
