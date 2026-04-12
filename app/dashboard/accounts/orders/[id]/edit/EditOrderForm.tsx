'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Order {
  id: string;
  order_no: string;
  order_type: string;
  client_name: string;
  client_gstin: string | null;
  client_pan: string | null;
  description: string | null;
  order_date: string;
  entry_date: string;
  total_value_incl_gst: number;
  base_value: number | null;
  gst_rate: number | null;
  cgst_amount: number | null;
  sgst_amount: number | null;
  igst_amount: number | null;
  tds_applicable: boolean;
  tds_rate: number | null;
  tds_deducted_total: number | null;
  status: string;
  notes: string | null;
  hsn_sac_code: string | null;
}

export default function EditOrderForm({ order }: { order: Order }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    order_type: order.order_type,
    client_name: order.client_name,
    client_gstin: order.client_gstin ?? '',
    client_pan: order.client_pan ?? '',
    description: order.description ?? '',
    order_date: order.order_date,
    entry_date: order.entry_date,
    total_value_incl_gst: String(order.total_value_incl_gst),
    base_value: String(order.base_value ?? ''),
    gst_rate: String(order.gst_rate ?? 18),
    cgst_amount: String(order.cgst_amount ?? ''),
    sgst_amount: String(order.sgst_amount ?? ''),
    igst_amount: String(order.igst_amount ?? ''),
    tds_applicable: order.tds_applicable,
    tds_rate: String(order.tds_rate ?? ''),
    tds_deducted_total: String(order.tds_deducted_total ?? 0),
    status: order.status,
    notes: order.notes ?? '',
    hsn_sac_code: order.hsn_sac_code ?? '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setForm(f => ({ ...f, [name]: val }));
  }

  // Auto-compute base/GST split from total
  function computeFromTotal() {
    const total = parseFloat(form.total_value_incl_gst || '0');
    const rate = parseFloat(form.gst_rate || '18');
    if (total > 0 && rate >= 0) {
      const base = total / (1 + rate / 100);
      const gst = total - base;
      const half = gst / 2;
      setForm(f => ({
        ...f,
        base_value: base.toFixed(2),
        cgst_amount: half.toFixed(2),
        sgst_amount: half.toFixed(2),
        igst_amount: '0',
      }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const body: Record<string, unknown> = {
      order_type: form.order_type,
      client_name: form.client_name,
      client_gstin: form.client_gstin || null,
      client_pan: form.client_pan || null,
      description: form.description || null,
      order_date: form.order_date,
      entry_date: form.entry_date,
      total_value_incl_gst: parseFloat(form.total_value_incl_gst),
      base_value: form.base_value ? parseFloat(form.base_value) : null,
      gst_rate: parseFloat(form.gst_rate || '18'),
      cgst_amount: form.cgst_amount ? parseFloat(form.cgst_amount) : 0,
      sgst_amount: form.sgst_amount ? parseFloat(form.sgst_amount) : 0,
      igst_amount: form.igst_amount ? parseFloat(form.igst_amount) : 0,
      tds_applicable: form.tds_applicable,
      tds_rate: form.tds_rate ? parseFloat(form.tds_rate) : 0,
      tds_deducted_total: form.tds_deducted_total ? parseFloat(form.tds_deducted_total) : 0,
      status: form.status,
      notes: form.notes || null,
      hsn_sac_code: form.hsn_sac_code || null,
    };

    try {
      const res = await fetch(`/api/accounts/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data.error));
      router.push(`/d/orders/${order.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order.');
      setLoading(false);
    }
  }

  const input = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none transition-colors';
  const label = 'block text-xs font-medium text-zinc-400 mb-1.5';
  const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm p-6 space-y-5';
  const sectionTitle = 'text-sm font-semibold text-zinc-300 mb-4';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">

      {/* Order details */}
      <div className={glass}>
        <h2 className={sectionTitle}>Order Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={label}>Order Type *</label>
            <select name="order_type" value={form.order_type} onChange={handleChange} className={input}>
              <option value="goods">Goods</option>
              <option value="service">Service</option>
            </select>
          </div>
          <div>
            <label className={label}>Status *</label>
            <select name="status" value={form.status} onChange={handleChange} className={input}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className={label}>Client Name *</label>
            <input type="text" name="client_name" value={form.client_name} onChange={handleChange}
              required placeholder="Client / Company name" className={input} />
          </div>
          <div>
            <label className={label}>Client GSTIN</label>
            <input type="text" name="client_gstin" value={form.client_gstin} onChange={handleChange}
              placeholder="22AAAAA0000A1Z5" className={input} />
          </div>
          <div>
            <label className={label}>Client PAN</label>
            <input type="text" name="client_pan" value={form.client_pan} onChange={handleChange}
              placeholder="AAAAA0000A" className={input} />
          </div>
          <div>
            <label className={label}>HSN / SAC Code</label>
            <input type="text" name="hsn_sac_code" value={form.hsn_sac_code} onChange={handleChange}
              placeholder="e.g. 9983 or 78011010"
              maxLength={8}
              className={`${input} font-mono`} />
            <p className="mt-1 text-xs text-zinc-600">4-digit or 8-digit code. Services → SAC (9983…). Goods → HSN (7801, 9027…)</p>
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              rows={3} placeholder="Order description, scope, specifications…"
              className={`${input} resize-none`} />
          </div>
          <div>
            <label className={label}>Order Received Date *</label>
            <input type="date" name="order_date" value={form.order_date} onChange={handleChange}
              required className={input} />
          </div>
          <div>
            <label className={label}>Entry Date *</label>
            <input type="date" name="entry_date" value={form.entry_date} onChange={handleChange}
              required className={input} />
          </div>
        </div>
      </div>

      {/* Financial */}
      <div className={glass}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-300">Financial Details</h2>
          <button type="button" onClick={computeFromTotal}
            className="text-xs text-amber-400 hover:text-amber-300 transition-colors underline underline-offset-2">
            Auto-compute base & GST
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className={label}>Total Value (incl GST) *</label>
            <input type="number" name="total_value_incl_gst" value={form.total_value_incl_gst}
              onChange={handleChange} required min="0" step="0.01" className={input} />
          </div>
          <div>
            <label className={label}>GST Rate (%)</label>
            <input type="number" name="gst_rate" value={form.gst_rate} onChange={handleChange}
              min="0" max="28" step="0.01" className={input} />
          </div>
          <div>
            <label className={label}>Base Value (excl GST)</label>
            <input type="number" name="base_value" value={form.base_value} onChange={handleChange}
              min="0" step="0.01" placeholder="Auto-computed" className={input} />
          </div>
          <div>
            <label className={label}>CGST Amount</label>
            <input type="number" name="cgst_amount" value={form.cgst_amount} onChange={handleChange}
              min="0" step="0.01" className={input} />
          </div>
          <div>
            <label className={label}>SGST Amount</label>
            <input type="number" name="sgst_amount" value={form.sgst_amount} onChange={handleChange}
              min="0" step="0.01" className={input} />
          </div>
          <div>
            <label className={label}>IGST Amount</label>
            <input type="number" name="igst_amount" value={form.igst_amount} onChange={handleChange}
              min="0" step="0.01" placeholder="0.00 (inter-state only)" className={input} />
          </div>
        </div>
      </div>

      {/* TDS */}
      <div className={glass}>
        <h2 className={sectionTitle}>TDS Details</h2>
        <div className="flex items-center gap-3 mb-4">
          <input type="checkbox" id="tds_applicable" name="tds_applicable"
            checked={form.tds_applicable} onChange={handleChange}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500" />
          <label htmlFor="tds_applicable" className="text-sm text-zinc-300">TDS applicable on this order</label>
        </div>
        {form.tds_applicable && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={label}>TDS Rate (%)</label>
              <input type="number" name="tds_rate" value={form.tds_rate} onChange={handleChange}
                min="0" max="30" step="0.01" placeholder="e.g. 2 for 194C, 10 for 194J" className={input} />
            </div>
            <div>
              <label className={label}>TDS Deducted So Far (₹)</label>
              <input type="number" name="tds_deducted_total" value={form.tds_deducted_total}
                onChange={handleChange} min="0" step="0.01" className={input} />
              <p className="mt-1 text-xs text-zinc-600">Auto-updated when payments are recorded — edit only if correcting a mismatch</p>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className={glass}>
        <h2 className={sectionTitle}>Notes</h2>
        <textarea name="notes" value={form.notes} onChange={handleChange}
          rows={4} placeholder="Payment terms, conditions, remarks…"
          className={`${input} resize-none`} />
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading}
          className="rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50 transition-colors">
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
        <a href={`/d/orders/${order.id}`}
          className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-6 py-2.5 text-sm font-semibold text-zinc-300 hover:border-zinc-600 transition-colors">
          Cancel
        </a>
      </div>
    </form>
  );
}
