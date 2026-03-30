'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddExpenseForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    expense_type: 'purchase',
    category: '',
    description: '',
    vendor_name: '',
    vendor_gstin: '',
    amount: '',
    gst_input_credit: '',
    expense_date: today,
    reference_no: '',
    payment_mode: '',
    notes: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const body = {
      ...form,
      amount: parseFloat(form.amount),
      gst_input_credit: form.gst_input_credit ? parseFloat(form.gst_input_credit) : 0,
    };

    try {
      const res = await fetch('/api/accounts/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data.error));
      setSuccess('Expense recorded.');
      setForm({
        expense_type: 'purchase', category: '', description: '',
        vendor_name: '', vendor_gstin: '', amount: '', gst_input_credit: '',
        expense_date: today, reference_no: '', payment_mode: '', notes: '',
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save expense.');
    } finally {
      setLoading(false);
    }
  }

  const input = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none transition-colors';
  const label = 'block text-xs font-medium text-zinc-400 mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className={label}>Type *</label>
          <select name="expense_type" value={form.expense_type} onChange={handleChange} className={input}>
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
            placeholder="e.g. Raw Materials, Utilities" className={input} />
        </div>
        <div>
          <label className={label}>Expense Date *</label>
          <input type="date" name="expense_date" value={form.expense_date} onChange={handleChange}
            required className={input} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Description *</label>
          <input type="text" name="description" value={form.description} onChange={handleChange}
            required placeholder="What was this expense for?" className={input} />
        </div>
        <div>
          <label className={label}>Amount *</label>
          <input type="number" name="amount" value={form.amount} onChange={handleChange}
            required min="0" step="0.01" placeholder="0.00" className={input} />
        </div>
        <div>
          <label className={label}>Vendor / Payee</label>
          <input type="text" name="vendor_name" value={form.vendor_name} onChange={handleChange}
            placeholder="Vendor name" className={input} />
        </div>
        <div>
          <label className={label}>Vendor GSTIN</label>
          <input type="text" name="vendor_gstin" value={form.vendor_gstin} onChange={handleChange}
            placeholder="GSTIN (if applicable)" className={input} />
        </div>
        <div>
          <label className={label}>GST Input Credit</label>
          <input type="number" name="gst_input_credit" value={form.gst_input_credit} onChange={handleChange}
            min="0" step="0.01" placeholder="0.00" className={input} />
        </div>
        <div>
          <label className={label}>Payment Mode</label>
          <input type="text" name="payment_mode" value={form.payment_mode} onChange={handleChange}
            placeholder="NEFT / Cash / Cheque" className={input} />
        </div>
        <div>
          <label className={label}>Reference No.</label>
          <input type="text" name="reference_no" value={form.reference_no} onChange={handleChange}
            placeholder="UTR / invoice no." className={input} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Notes</label>
          <input type="text" name="notes" value={form.notes} onChange={handleChange}
            placeholder="Optional notes" className={input} />
        </div>
      </div>

      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}
      {success && <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">{success}</p>}

      <button type="submit" disabled={loading}
        className="rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50 transition-colors">
        {loading ? 'Saving…' : 'Add Expense'}
      </button>
    </form>
  );
}
