'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Receipt, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const input = 'w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600';
const label = 'text-xs text-zinc-500 mb-1 block';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

export default function NewReceiptPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<AnyObj[]>([]);

  const [form, setForm] = useState({
    receipt_date: new Date().toISOString().split('T')[0],
    order_id: '',
    received_from: '',
    party_gstin: '',
    amount: '',
    payment_mode: 'NEFT',
    reference_no: '',
    bank_name: '',
    notes: '',
  });

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  useEffect(() => {
    fetch('/api/accounts/orders').then(r => r.json()).then(d => setOrders(d.data ?? []));
  }, []);

  useEffect(() => {
    if (!form.order_id) return;
    const order = orders.find(o => o.id === form.order_id);
    if (!order) return;
    set('received_from', order.client_name ?? '');
    set('party_gstin', order.client_gstin ?? '');
  }, [form.order_id, orders]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          order_id: form.order_id || null,
          amount: Number(form.amount),
        }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else router.push('/d/receipts');
    } catch { setError('Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <Link href="/d/receipts" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div className="flex items-center gap-3">
        <Receipt className="h-7 w-7 text-emerald-400" />
        <h1 className="text-2xl font-bold text-white">New Payment Receipt</h1>
      </div>

      {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={`${glass} p-6`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={label}>Receipt Date *</label>
              <input type="date" className={input} value={form.receipt_date} onChange={e => set('receipt_date', e.target.value)} required />
            </div>
            <div>
              <label className={label}>Link to Order</label>
              <select className={input} value={form.order_id} onChange={e => set('order_id', e.target.value)}>
                <option value="">Select order...</option>
                {orders.map(o => <option key={o.id} value={o.id}>{o.order_no} — {o.client_name}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Amount *</label>
              <input className={input} type="number" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} required placeholder="₹" />
            </div>
          </div>
        </div>

        <div className={`${glass} p-6`}>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">Received From</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={label}>Name *</label><input className={input} value={form.received_from} onChange={e => set('received_from', e.target.value)} required /></div>
            <div><label className={label}>GSTIN</label><input className={input} value={form.party_gstin} onChange={e => set('party_gstin', e.target.value)} /></div>
          </div>
        </div>

        <div className={`${glass} p-6`}>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">Payment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={label}>Payment Mode *</label>
              <select className={input} value={form.payment_mode} onChange={e => set('payment_mode', e.target.value)}>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="NEFT">NEFT</option>
                <option value="RTGS">RTGS</option>
                <option value="Cheque">Cheque</option>
                <option value="DD">Demand Draft</option>
              </select>
            </div>
            <div><label className={label}>Reference / UTR No</label><input className={input} value={form.reference_no} onChange={e => set('reference_no', e.target.value)} placeholder="UTR / Cheque No" /></div>
            <div><label className={label}>Bank Name</label><input className={input} value={form.bank_name} onChange={e => set('bank_name', e.target.value)} /></div>
          </div>
        </div>

        <div className={`${glass} p-6`}>
          <label className={label}>Notes</label>
          <textarea className={`${input} resize-none`} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>

        <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
          Issue Receipt
        </button>
      </form>
    </div>
  );
}
