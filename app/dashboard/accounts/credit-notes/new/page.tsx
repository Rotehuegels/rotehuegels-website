'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const input = 'w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600';
const label = 'text-xs text-zinc-500 mb-1 block';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

export default function NewCreditNotePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<AnyObj[]>([]);

  const [form, setForm] = useState({
    note_type: 'credit',
    note_date: new Date().toISOString().split('T')[0],
    order_id: '',
    original_invoice: '',
    party_name: '',
    party_gstin: '',
    party_address: '',
    reason: '',
    hsn_code: '',
    taxable_value: '',
    gst_rate: '18',
    total_value: '',
    notes: '',
  });

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  useEffect(() => {
    fetch('/api/accounts/orders').then(r => r.json()).then(d => setOrders(d.data ?? []));
  }, []);

  // Auto-fill from order
  useEffect(() => {
    if (!form.order_id) return;
    const order = orders.find(o => o.id === form.order_id);
    if (!order) return;
    const fy = (() => {
      const d = new Date(order.invoice_date ?? order.order_date);
      const y = d.getFullYear(); const m = d.getMonth() + 1;
      return m >= 4 ? `${String(y).slice(2)}-${String(y + 1).slice(2)}` : `${String(y - 1).slice(2)}-${String(y).slice(2)}`;
    })();
    set('original_invoice', `RH/${fy}/${order.order_no}`);
    set('party_name', order.client_name ?? '');
    set('party_gstin', order.client_gstin ?? '');
    set('party_address', order.client_address ?? '');
    set('hsn_code', order.hsn_sac_code ?? '');
  }, [form.order_id, orders]);

  // Auto-calculate total
  useEffect(() => {
    const taxable = Number(form.taxable_value) || 0;
    const gst = Number(form.gst_rate) || 0;
    set('total_value', String(Math.round(taxable * (1 + gst / 100))));
  }, [form.taxable_value, form.gst_rate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');

    const taxable = Number(form.taxable_value);
    const gstRate = Number(form.gst_rate);
    const halfGst = parseFloat((taxable * gstRate / 200).toFixed(2));
    const isIntra = form.party_gstin?.startsWith('33');

    try {
      const res = await fetch('/api/credit-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          order_id: form.order_id || null,
          taxable_value: taxable,
          gst_rate: gstRate,
          cgst_amount: isIntra ? halfGst : 0,
          sgst_amount: isIntra ? halfGst : 0,
          igst_amount: isIntra ? 0 : halfGst * 2,
          total_value: Number(form.total_value),
        }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else router.push('/d/credit-notes');
    } catch { setError('Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-8 max-w-[1800px] space-y-6">
      <Link href="/d/credit-notes" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div className="flex items-center gap-3">
        <FileText className="h-7 w-7 text-violet-400" />
        <h1 className="text-2xl font-bold text-white">New Credit / Debit Note</h1>
      </div>

      {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={`${glass} p-6`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={label}>Note Type *</label>
              <select className={input} value={form.note_type} onChange={e => set('note_type', e.target.value)}>
                <option value="credit">Credit Note (refund/discount)</option>
                <option value="debit">Debit Note (additional charge)</option>
              </select>
            </div>
            <div>
              <label className={label}>Date *</label>
              <input type="date" className={input} value={form.note_date} onChange={e => set('note_date', e.target.value)} required />
            </div>
            <div>
              <label className={label}>Link to Order</label>
              <select className={input} value={form.order_id} onChange={e => set('order_id', e.target.value)}>
                <option value="">Select order...</option>
                {orders.map(o => <option key={o.id} value={o.id}>{o.order_no} — {o.client_name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className={`${glass} p-6`}>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">Party Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={label}>Party Name *</label><input className={input} value={form.party_name} onChange={e => set('party_name', e.target.value)} required /></div>
            <div><label className={label}>GSTIN</label><input className={input} value={form.party_gstin} onChange={e => set('party_gstin', e.target.value)} /></div>
            <div><label className={label}>Original Invoice</label><input className={input} value={form.original_invoice} onChange={e => set('original_invoice', e.target.value)} /></div>
            <div><label className={label}>Reason *</label><input className={input} value={form.reason} onChange={e => set('reason', e.target.value)} required placeholder="Rate difference / Goods returned / Discount" /></div>
          </div>
        </div>

        <div className={`${glass} p-6`}>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">Amount</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><label className={label}>HSN/SAC</label><input className={input} value={form.hsn_code} onChange={e => set('hsn_code', e.target.value)} /></div>
            <div><label className={label}>Taxable Value *</label><input className={input} type="number" step="0.01" value={form.taxable_value} onChange={e => set('taxable_value', e.target.value)} required /></div>
            <div><label className={label}>GST Rate %</label><input className={input} type="number" value={form.gst_rate} onChange={e => set('gst_rate', e.target.value)} /></div>
            <div><label className={label}>Total Value</label><input className={input} value={form.total_value} readOnly /></div>
          </div>
        </div>

        <div className={`${glass} p-6`}>
          <label className={label}>Notes</label>
          <textarea className={`${input} resize-none`} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>

        <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          Issue {form.note_type === 'credit' ? 'Credit' : 'Debit'} Note
        </button>
      </form>
    </div>
  );
}
