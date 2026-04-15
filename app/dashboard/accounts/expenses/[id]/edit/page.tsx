'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const input = 'w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600';

const TYPES = [
  { value: 'salary', label: 'Salary & Wages' },
  { value: 'purchase', label: 'Purchases / Raw Materials' },
  { value: 'tds_paid', label: 'TDS Paid to Govt' },
  { value: 'advance_tax', label: 'Advance Tax' },
  { value: 'gst_paid', label: 'GST Paid to Govt' },
  { value: 'other', label: 'Other Expenses' },
];

export default function EditExpensePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    expense_type: 'other', description: '', vendor_name: '', amount: 0,
    gst_input_credit: 0, expense_date: '', payment_mode: '', notes: '', reference_no: '',
  });

  useEffect(() => {
    fetch(`/api/accounts/expenses/${id}`).then(r => r.json()).then(d => {
      if (d.data) setForm(d.data);
      setLoading(false);
    });
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/accounts/expenses/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    if (res.ok) router.push(`/d/expenses/${id}`);
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading...</div>;

  return (
    <div className="p-5 md:p-8 max-w-2xl space-y-6">
      <Link href={`/d/expenses/${id}`} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
        <ArrowLeft className="h-3 w-3" /> Back to Expense
      </Link>
      <h1 className="text-2xl font-bold text-white">Edit Expense</h1>

      <div className={`${glass} p-6 space-y-4`}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Type</label>
            <select className={input} value={form.expense_type} onChange={e => setForm(f => ({ ...f, expense_type: e.target.value }))}>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Date</label>
            <input type="date" className={input} value={form.expense_date?.split('T')[0] ?? ''} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Description</label>
          <input className={input} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Vendor Name</label>
          <input className={input} value={form.vendor_name ?? ''} onChange={e => setForm(f => ({ ...f, vendor_name: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Amount (INR)</label>
            <input type="number" className={input} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">GST Input Credit</label>
            <input type="number" className={input} value={form.gst_input_credit} onChange={e => setForm(f => ({ ...f, gst_input_credit: Number(e.target.value) }))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Payment Mode</label>
            <select className={input} value={form.payment_mode ?? ''} onChange={e => setForm(f => ({ ...f, payment_mode: e.target.value }))}>
              <option value="">Select...</option>
              <option value="NEFT">NEFT</option><option value="UPI">UPI</option>
              <option value="Cash">Cash</option><option value="Cheque">Cheque</option>
              <option value="Card">Card</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Reference No</label>
            <input className={input} value={form.reference_no ?? ''} onChange={e => setForm(f => ({ ...f, reference_no: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Notes</label>
          <textarea className={`${input} resize-none`} rows={3} value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save Changes
      </button>
    </div>
  );
}
