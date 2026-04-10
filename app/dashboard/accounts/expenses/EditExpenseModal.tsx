'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2 } from 'lucide-react';

const inputCls = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none transition-colors';
const label = 'block text-xs font-medium text-zinc-400 mb-1.5';

interface Expense {
  id: string;
  expense_type: string;
  category: string | null;
  description: string;
  vendor_name: string | null;
  vendor_gstin: string | null;
  amount: number;
  gst_input_credit: number;
  expense_date: string;
  reference_no: string | null;
  payment_mode: string | null;
  notes: string | null;
}

export default function EditExpenseModal({ expense, onClose }: { expense: Expense; onClose: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    expense_type: expense.expense_type,
    category: expense.category ?? '',
    description: expense.description,
    vendor_name: expense.vendor_name ?? '',
    vendor_gstin: expense.vendor_gstin ?? '',
    amount: String(expense.amount),
    gst_input_credit: String(expense.gst_input_credit ?? 0),
    expense_date: expense.expense_date,
    reference_no: expense.reference_no ?? '',
    payment_mode: expense.payment_mode ?? '',
    notes: expense.notes ?? '',
  });

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const body = {
      expense_type: form.expense_type,
      category: form.category || null,
      description: form.description,
      vendor_name: form.vendor_name || null,
      vendor_gstin: form.vendor_gstin || null,
      amount: parseFloat(form.amount),
      gst_input_credit: form.gst_input_credit ? parseFloat(form.gst_input_credit) : 0,
      expense_date: form.expense_date,
      reference_no: form.reference_no || null,
      payment_mode: form.payment_mode || null,
      notes: form.notes || null,
    };

    try {
      const res = await fetch(`/api/accounts/expenses/${expense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Edit Expense</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={label}>Type *</label>
              <select name="expense_type" value={form.expense_type} onChange={handleChange} className={inputCls}>
                <option value="salary">Salary</option>
                <option value="purchase">Purchase</option>
                <option value="tds_paid">TDS Paid (to govt)</option>
                <option value="advance_tax">Advance Tax</option>
                <option value="gst_paid">GST Paid (to govt)</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={label}>Category</label>
              <input type="text" name="category" value={form.category} onChange={handleChange}
                placeholder="e.g. Raw Materials, Utilities" className={inputCls} />
            </div>
            <div>
              <label className={label}>Expense Date *</label>
              <input type="date" name="expense_date" value={form.expense_date} onChange={handleChange}
                required className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Description *</label>
              <input type="text" name="description" value={form.description} onChange={handleChange}
                required placeholder="What was this expense for?" className={inputCls} />
            </div>
            <div>
              <label className={label}>Amount *</label>
              <input type="number" name="amount" value={form.amount} onChange={handleChange}
                required min="0" step="0.01" placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className={label}>Vendor / Payee</label>
              <input type="text" name="vendor_name" value={form.vendor_name} onChange={handleChange}
                placeholder="Vendor name" className={inputCls} />
            </div>
            <div>
              <label className={label}>Vendor GSTIN</label>
              <input type="text" name="vendor_gstin" value={form.vendor_gstin} onChange={handleChange}
                placeholder="GSTIN (if applicable)" className={inputCls} />
            </div>
            <div>
              <label className={label}>GST Input Credit</label>
              <input type="number" name="gst_input_credit" value={form.gst_input_credit} onChange={handleChange}
                min="0" step="0.01" placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className={label}>Payment Mode</label>
              <input type="text" name="payment_mode" value={form.payment_mode} onChange={handleChange}
                placeholder="NEFT / Cash / Cheque" className={inputCls} />
            </div>
            <div>
              <label className={label}>Reference No.</label>
              <input type="text" name="reference_no" value={form.reference_no} onChange={handleChange}
                placeholder="UTR / invoice no." className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Notes</label>
              <input type="text" name="notes" value={form.notes} onChange={handleChange}
                placeholder="Optional notes" className={inputCls} />
            </div>
          </div>

          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving}
              className="rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50 transition-colors">
              {saving ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving...</span> : 'Save Changes'}
            </button>
            <button type="button" onClick={onClose}
              className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-6 py-2.5 text-sm font-semibold text-zinc-300 hover:border-zinc-600 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
