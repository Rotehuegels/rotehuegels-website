'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileCheck, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const input = 'w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600';
const label = 'text-xs text-zinc-500 mb-1 block';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

export default function NewEwayBillPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<AnyObj[]>([]);

  // Form state
  const [form, setForm] = useState({
    order_id: orderId ?? '',
    doc_type: 'INV',
    doc_no: '',
    doc_date: new Date().toISOString().split('T')[0],
    supply_type: 'outward',
    sub_supply_type: 'supply',
    transaction_type: 'regular',
    // From
    from_gstin: '',
    from_name: '',
    from_address: '',
    from_place: '',
    from_pincode: '',
    from_state_code: '33',
    // To
    to_gstin: '',
    to_name: '',
    to_address: '',
    to_place: '',
    to_pincode: '',
    to_state_code: '33',
    // Goods
    hsn_code: '',
    description: '',
    quantity: '',
    unit: 'NOS',
    taxable_value: '',
    cgst_amount: '',
    sgst_amount: '',
    igst_amount: '0',
    total_value: '',
    // Transport
    transport_mode: 'road',
    vehicle_no: '',
    vehicle_type: 'regular',
    transporter_name: '',
    transporter_id: '',
    trans_doc_no: '',
    trans_doc_date: '',
    distance_km: '',
    // E-way bill no (if already generated on portal)
    eway_bill_no: '',
    notes: '',
  });

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  // Load orders for dropdown
  useEffect(() => {
    fetch('/api/accounts/orders').then(r => r.json()).then(d => {
      setOrders((d.data ?? []).filter((o: AnyObj) => o.order_type === 'goods'));
    });
  }, []);

  // Pre-fill from selected order
  useEffect(() => {
    if (!form.order_id || orders.length === 0) return;
    const order = orders.find(o => o.id === form.order_id);
    if (!order) return;

    const fy = (() => {
      const d = new Date(order.invoice_date ?? order.order_date);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      return m >= 4 ? `${String(y).slice(2)}-${String(y + 1).slice(2)}` : `${String(y - 1).slice(2)}-${String(y).slice(2)}`;
    })();

    setForm(prev => ({
      ...prev,
      doc_no: `RH/${fy}/${order.order_no}`,
      doc_date: order.invoice_date ?? order.order_date ?? prev.doc_date,
      to_gstin: order.client_gstin ?? '',
      to_name: order.client_name ?? '',
      to_address: order.client_address ?? '',
      to_place: order.place_of_supply?.replace(/\s*\(\d+\)/, '') ?? '',
      to_state_code: order.client_gstin?.substring(0, 2) ?? '33',
      hsn_code: order.hsn_sac_code ?? '',
      description: order.description ?? '',
      taxable_value: String(order.base_value ?? ''),
      cgst_amount: String(order.cgst_amount ?? '0'),
      sgst_amount: String(order.sgst_amount ?? '0'),
      igst_amount: String(order.igst_amount ?? '0'),
      total_value: String(order.total_value_incl_gst ?? ''),
    }));
  }, [form.order_id, orders]);

  // Load company details for "From"
  useEffect(() => {
    fetch('/api/health').then(r => r.json()).catch(() => null);
    // Hardcode from company settings (loaded server-side in other pages)
    setForm(prev => ({
      ...prev,
      from_gstin: '33AAPCR0554G1ZE',
      from_name: 'Rotehuegel Research Business Consultancy Private Limited',
      from_address: 'No. 1/584, 7th Street, Jothi Nagar, Padianallur, Redhills',
      from_place: 'Chennai',
      from_pincode: '600052',
      from_state_code: '33',
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      ...form,
      order_id: form.order_id || null,
      quantity: form.quantity ? Number(form.quantity) : null,
      taxable_value: Number(form.taxable_value),
      cgst_amount: Number(form.cgst_amount || 0),
      sgst_amount: Number(form.sgst_amount || 0),
      igst_amount: Number(form.igst_amount || 0),
      total_value: Number(form.total_value),
      distance_km: form.distance_km ? Number(form.distance_km) : null,
      eway_bill_no: form.eway_bill_no || null,
      trans_doc_date: form.trans_doc_date || null,
    };

    try {
      const res = await fetch('/api/eway-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else router.push('/d/eway-bills');
    } catch {
      setError('Failed to create e-way bill');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <Link href="/d/eway-bills" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300">
        <ArrowLeft className="h-4 w-4" /> Back to E-Way Bills
      </Link>

      <div className="flex items-center gap-3">
        <FileCheck className="h-7 w-7 text-amber-400" />
        <h1 className="text-2xl font-bold text-white">New E-Way Bill</h1>
      </div>

      {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Link to order */}
        <div className={`${glass} p-6`}>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">Document Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={label}>Link to Order (auto-fills)</label>
              <select className={input} value={form.order_id} onChange={e => set('order_id', e.target.value)}>
                <option value="">Select order...</option>
                {orders.map(o => (
                  <option key={o.id} value={o.id}>{o.order_no} — {o.client_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Document No *</label>
              <input className={input} value={form.doc_no} onChange={e => set('doc_no', e.target.value)} required placeholder="RH/25-26/GDS-004" />
            </div>
            <div>
              <label className={label}>Document Date *</label>
              <input type="date" className={input} value={form.doc_date} onChange={e => set('doc_date', e.target.value)} required />
            </div>
            <div>
              <label className={label}>Document Type</label>
              <select className={input} value={form.doc_type} onChange={e => set('doc_type', e.target.value)}>
                <option value="INV">Tax Invoice</option>
                <option value="BIL">Bill of Supply</option>
                <option value="BOE">Bill of Entry</option>
                <option value="CHL">Delivery Challan</option>
              </select>
            </div>
            <div>
              <label className={label}>Supply Type</label>
              <select className={input} value={form.supply_type} onChange={e => set('supply_type', e.target.value)}>
                <option value="outward">Outward (Sales)</option>
                <option value="inward">Inward (Purchase)</option>
              </select>
            </div>
            <div>
              <label className={label}>E-Way Bill No (if generated)</label>
              <input className={input} value={form.eway_bill_no} onChange={e => set('eway_bill_no', e.target.value)} placeholder="12-digit from NIC portal" />
            </div>
          </div>
        </div>

        {/* From / To */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`${glass} p-6`}>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">From (Consignor)</h2>
            <div className="space-y-3">
              <div><label className={label}>GSTIN *</label><input className={input} value={form.from_gstin} onChange={e => set('from_gstin', e.target.value)} required /></div>
              <div><label className={label}>Name *</label><input className={input} value={form.from_name} onChange={e => set('from_name', e.target.value)} required /></div>
              <div><label className={label}>Address *</label><input className={input} value={form.from_address} onChange={e => set('from_address', e.target.value)} required /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className={label}>Place *</label><input className={input} value={form.from_place} onChange={e => set('from_place', e.target.value)} required /></div>
                <div><label className={label}>Pincode *</label><input className={input} value={form.from_pincode} onChange={e => set('from_pincode', e.target.value)} required /></div>
                <div><label className={label}>State Code *</label><input className={input} value={form.from_state_code} onChange={e => set('from_state_code', e.target.value)} required /></div>
              </div>
            </div>
          </div>

          <div className={`${glass} p-6`}>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">To (Consignee)</h2>
            <div className="space-y-3">
              <div><label className={label}>GSTIN</label><input className={input} value={form.to_gstin} onChange={e => set('to_gstin', e.target.value)} /></div>
              <div><label className={label}>Name *</label><input className={input} value={form.to_name} onChange={e => set('to_name', e.target.value)} required /></div>
              <div><label className={label}>Address *</label><input className={input} value={form.to_address} onChange={e => set('to_address', e.target.value)} required /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className={label}>Place *</label><input className={input} value={form.to_place} onChange={e => set('to_place', e.target.value)} required /></div>
                <div><label className={label}>Pincode *</label><input className={input} value={form.to_pincode} onChange={e => set('to_pincode', e.target.value)} required /></div>
                <div><label className={label}>State Code *</label><input className={input} value={form.to_state_code} onChange={e => set('to_state_code', e.target.value)} required /></div>
              </div>
            </div>
          </div>
        </div>

        {/* Goods */}
        <div className={`${glass} p-6`}>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">Goods Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><label className={label}>HSN Code *</label><input className={input} value={form.hsn_code} onChange={e => set('hsn_code', e.target.value)} required /></div>
            <div className="md:col-span-3"><label className={label}>Description</label><input className={input} value={form.description} onChange={e => set('description', e.target.value)} /></div>
            <div><label className={label}>Quantity</label><input className={input} type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)} /></div>
            <div><label className={label}>Unit</label><input className={input} value={form.unit} onChange={e => set('unit', e.target.value)} /></div>
            <div><label className={label}>Taxable Value *</label><input className={input} type="number" step="0.01" value={form.taxable_value} onChange={e => set('taxable_value', e.target.value)} required /></div>
            <div><label className={label}>Total Value *</label><input className={input} type="number" step="0.01" value={form.total_value} onChange={e => set('total_value', e.target.value)} required /></div>
            <div><label className={label}>CGST</label><input className={input} type="number" step="0.01" value={form.cgst_amount} onChange={e => set('cgst_amount', e.target.value)} /></div>
            <div><label className={label}>SGST</label><input className={input} type="number" step="0.01" value={form.sgst_amount} onChange={e => set('sgst_amount', e.target.value)} /></div>
            <div><label className={label}>IGST</label><input className={input} type="number" step="0.01" value={form.igst_amount} onChange={e => set('igst_amount', e.target.value)} /></div>
          </div>
        </div>

        {/* Transport (Part B) */}
        <div className={`${glass} p-6`}>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">Transport Details (Part B)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={label}>Transport Mode</label>
              <select className={input} value={form.transport_mode} onChange={e => set('transport_mode', e.target.value)}>
                <option value="road">Road</option>
                <option value="rail">Rail</option>
                <option value="air">Air</option>
                <option value="ship">Ship</option>
              </select>
            </div>
            <div><label className={label}>Vehicle No</label><input className={input} value={form.vehicle_no} onChange={e => set('vehicle_no', e.target.value)} placeholder="TN 01 AB 1234" /></div>
            <div><label className={label}>Distance (KM)</label><input className={input} type="number" value={form.distance_km} onChange={e => set('distance_km', e.target.value)} placeholder="e.g. 1600" /></div>
            <div><label className={label}>Transporter Name</label><input className={input} value={form.transporter_name} onChange={e => set('transporter_name', e.target.value)} placeholder="ARC Limited" /></div>
            <div><label className={label}>Transporter GSTIN</label><input className={input} value={form.transporter_id} onChange={e => set('transporter_id', e.target.value)} /></div>
            <div><label className={label}>LR/GR No</label><input className={input} value={form.trans_doc_no} onChange={e => set('trans_doc_no', e.target.value)} placeholder="B4002064885" /></div>
            <div><label className={label}>Transport Doc Date</label><input type="date" className={input} value={form.trans_doc_date} onChange={e => set('trans_doc_date', e.target.value)} /></div>
          </div>
        </div>

        {/* Notes */}
        <div className={`${glass} p-6`}>
          <label className={label}>Notes</label>
          <textarea className={`${input} resize-none`} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional notes..." />
        </div>

        <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-500 transition-colors disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck className="h-4 w-4" />}
          Create E-Way Bill
        </button>
      </form>
    </div>
  );
}
