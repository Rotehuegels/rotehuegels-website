'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Loader2, Check, X } from 'lucide-react';

const input = 'w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600';

interface Props {
  paymentId: string;
  amountReceived: number;
  tdsDeducted: number;
  paymentDate: string;
  paymentMode: string;
  referenceNo: string;
  notes: string;
}

export default function PaymentActions({ paymentId, amountReceived, tdsDeducted, paymentDate, paymentMode, referenceNo, notes }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    amount_received: amountReceived,
    tds_deducted: tdsDeducted,
    payment_date: paymentDate?.split('T')[0] ?? '',
    payment_mode: paymentMode ?? 'NEFT',
    reference_no: referenceNo ?? '',
    notes: notes ?? '',
  });

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/accounts/payments/${paymentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        net_received: form.amount_received - form.tds_deducted,
      }),
    });
    if (res.ok) { setEditing(false); router.refresh(); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this payment record?')) return;
    setDeleting(true);
    const res = await fetch(`/api/accounts/payments/${paymentId}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
    setDeleting(false);
  };

  if (!editing) {
    return (
      <div className="flex gap-1">
        <button onClick={() => setEditing(true)} title="Edit payment"
          className="rounded-lg border border-zinc-700 bg-zinc-800/60 p-1.5 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors">
          <Pencil className="h-3 w-3" />
        </button>
        <button onClick={handleDelete} disabled={deleting} title="Delete payment"
          className="rounded-lg border border-zinc-700 bg-zinc-800/60 p-1.5 text-red-400/60 hover:text-red-400 hover:border-red-500/50 transition-colors disabled:opacity-50">
          {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
        </button>
      </div>
    );
  }

  return (
    <div className="col-span-full bg-zinc-800/30 rounded-xl p-4 space-y-3 border border-zinc-700">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] text-zinc-500 block mb-1">Amount Received</label>
          <input type="number" step="0.01" className={input} value={form.amount_received}
            onChange={e => setForm(f => ({ ...f, amount_received: Number(e.target.value) }))} />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 block mb-1">TDS Deducted</label>
          <input type="number" step="0.01" className={input} value={form.tds_deducted}
            onChange={e => setForm(f => ({ ...f, tds_deducted: Number(e.target.value) }))} />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 block mb-1">Date</label>
          <input type="date" className={input} value={form.payment_date}
            onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] text-zinc-500 block mb-1">Mode</label>
          <select className={input} value={form.payment_mode} onChange={e => setForm(f => ({ ...f, payment_mode: e.target.value }))}>
            <option>NEFT</option><option>RTGS</option><option>UPI</option><option>Cash</option><option>Cheque</option><option>IMPS</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 block mb-1">Reference No.</label>
          <input className={input} value={form.reference_no} onChange={e => setForm(f => ({ ...f, reference_no: e.target.value }))} />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 block mb-1">Notes</label>
          <input className={input} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50">
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save
        </button>
        <button onClick={() => setEditing(false)}
          className="flex items-center gap-1 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-white">
          <X className="h-3 w-3" /> Cancel
        </button>
      </div>
    </div>
  );
}
