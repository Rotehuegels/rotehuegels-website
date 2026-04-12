'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const input = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none transition-colors';
const label = 'block text-xs font-medium text-zinc-400 mb-1.5';
const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm p-6 space-y-5';

const UNITS_GOODS = ['kg', 'MT', 'g', 'pcs', 'nos', 'litre', 'ml', 'set', 'box', 'roll', 'sheet', 'pair'];
const UNITS_SERVICE = ['hours', 'days', 'weeks', 'months', 'project', 'lump sum', 'visit'];
const GST_RATES = [0, 5, 12, 18, 28];

export default function NewItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    item_type: 'goods' as 'goods' | 'service',
    name: '', description: '', hsn_code: '', sac_code: '',
    unit: 'kg', mrp: '', default_gst_rate: '18', category: '', notes: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(f => {
      const updated = { ...f, [name]: value };
      // Reset unit when switching type
      if (name === 'item_type') {
        updated.unit = value === 'goods' ? 'kg' : 'hours';
      }
      return updated;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const body = {
      item_type:        form.item_type,
      name:             form.name,
      description:      form.description || undefined,
      hsn_code:         form.item_type === 'goods' ? (form.hsn_code || undefined) : undefined,
      sac_code:         form.item_type === 'service' ? (form.sac_code || undefined) : undefined,
      unit:             form.unit,
      mrp:              form.mrp ? parseFloat(form.mrp) : undefined,
      default_gst_rate: parseFloat(form.default_gst_rate),
      category:         form.category || undefined,
      notes:            form.notes || undefined,
    };

    try {
      const res = await fetch('/api/accounts/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data.error));
      router.push(`/d/catalog/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item.');
      setLoading(false);
    }
  }

  const units = form.item_type === 'goods' ? UNITS_GOODS : UNITS_SERVICE;

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Add Item to Catalog</h1>
        <p className="text-xs text-zinc-500 mt-0.5">SKU ID will be auto-generated (SKU-NNN or SRV-NNN)</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={glass}>
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">Item Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={label}>Type *</label>
              <select name="item_type" value={form.item_type} onChange={handleChange} className={input}>
                <option value="goods">Goods (Physical Product)</option>
                <option value="service">Service</option>
              </select>
            </div>
            <div>
              <label className={label}>Category</label>
              <input type="text" name="category" value={form.category} onChange={handleChange}
                placeholder="e.g. Metals, Consulting, Lab" className={input} />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Item Name *</label>
              <input type="text" name="name" value={form.name} onChange={handleChange}
                required placeholder="e.g. High Purity Lead Anodes" className={input} />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange}
                rows={2} placeholder="Detailed description, specs, grade…"
                className={`${input} resize-none`} />
            </div>

            {form.item_type === 'goods' ? (
              <div>
                <label className={label}>HSN Code</label>
                <input type="text" name="hsn_code" value={form.hsn_code} onChange={handleChange}
                  placeholder="e.g. 7804" className={input} />
              </div>
            ) : (
              <div>
                <label className={label}>SAC Code</label>
                <input type="text" name="sac_code" value={form.sac_code} onChange={handleChange}
                  placeholder="e.g. 9983" className={input} />
              </div>
            )}

            <div>
              <label className={label}>Unit *</label>
              <select name="unit" value={form.unit} onChange={handleChange} className={input}>
                {units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div>
              <label className={label}>MRP / Standard Price (₹)</label>
              <input type="number" name="mrp" value={form.mrp} onChange={handleChange}
                min="0" step="0.01" placeholder="0.00" className={input} />
            </div>

            <div>
              <label className={label}>Default GST Rate *</label>
              <select name="default_gst_rate" value={form.default_gst_rate} onChange={handleChange} className={input}>
                {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className={glass}>
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">Notes</h2>
          <textarea name="notes" value={form.notes} onChange={handleChange}
            rows={2} placeholder="Any internal notes…"
            className={`${input} resize-none`} />
        </div>

        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading}
            className="rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50 transition-colors">
            {loading ? 'Saving…' : 'Save Item'}
          </button>
          <a href="/d/catalog"
            className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-6 py-2.5 text-sm font-semibold text-zinc-300 hover:border-zinc-600 transition-colors">
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
