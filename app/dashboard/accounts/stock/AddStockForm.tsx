'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddStockForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    item_name: '',
    item_code: '',
    description: '',
    category: '',
    hsn_code: '',
    unit: 'pcs',
    quantity: '',
    unit_cost: '',
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
      quantity: form.quantity ? parseFloat(form.quantity) : 0,
      unit_cost: form.unit_cost ? parseFloat(form.unit_cost) : 0,
    };

    try {
      const res = await fetch('/api/accounts/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data.error));
      setSuccess('Stock item added.');
      setForm({ item_name: '', item_code: '', description: '', category: '', hsn_code: '', unit: 'pcs', quantity: '', unit_cost: '', notes: '' });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add stock item.');
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
          <label className={label}>Item Name *</label>
          <input type="text" name="item_name" value={form.item_name} onChange={handleChange}
            required placeholder="e.g. Lead Anode 200mm" className={input} />
        </div>
        <div>
          <label className={label}>Item Code</label>
          <input type="text" name="item_code" value={form.item_code} onChange={handleChange}
            placeholder="SKU / item code" className={input} />
        </div>
        <div>
          <label className={label}>Category</label>
          <input type="text" name="category" value={form.category} onChange={handleChange}
            placeholder="e.g. Raw Material, Finished Goods" className={input} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Description</label>
          <input type="text" name="description" value={form.description} onChange={handleChange}
            placeholder="Specifications, grade, size…" className={input} />
        </div>
        <div>
          <label className={label}>HSN Code</label>
          <input type="text" name="hsn_code" value={form.hsn_code} onChange={handleChange}
            placeholder="HSN / SAC code" className={input} />
        </div>
        <div>
          <label className={label}>Quantity</label>
          <input type="number" name="quantity" value={form.quantity} onChange={handleChange}
            min="0" step="0.001" placeholder="0" className={input} />
        </div>
        <div>
          <label className={label}>Unit</label>
          <input type="text" name="unit" value={form.unit} onChange={handleChange}
            placeholder="pcs / kg / m / set" className={input} />
        </div>
        <div>
          <label className={label}>Unit Cost (₹)</label>
          <input type="number" name="unit_cost" value={form.unit_cost} onChange={handleChange}
            min="0" step="0.01" placeholder="0.00" className={input} />
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
        {loading ? 'Adding…' : 'Add Stock Item'}
      </button>
    </form>
  );
}
