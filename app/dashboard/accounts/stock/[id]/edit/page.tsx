'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const input = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none transition-colors';
const lbl   = 'block text-xs font-medium text-zinc-400 mb-1.5';
const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm p-6';

export default function EditStockItemPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  const [form, setForm] = useState({
    item_name:   '',
    item_code:   '',
    description: '',
    category:    '',
    hsn_code:    '',
    unit:        'pcs',
    quantity:    '',
    unit_cost:   '',
    notes:       '',
  });

  const load = useCallback(async () => {
    const res = await fetch(`/api/accounts/stock/${id}`);
    if (!res.ok) { router.push('/dashboard/accounts/stock'); return; }
    const { data } = await res.json();
    setForm({
      item_name:   data.item_name   ?? '',
      item_code:   data.item_code   ?? '',
      description: data.description ?? '',
      category:    data.category    ?? '',
      hsn_code:    data.hsn_code    ?? '',
      unit:        data.unit        ?? 'pcs',
      quantity:    data.quantity != null ? String(data.quantity) : '',
      unit_cost:   data.unit_cost != null ? String(data.unit_cost) : '',
      notes:       data.notes       ?? '',
    });
    setPageLoading(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const body = {
      item_name:   form.item_name,
      item_code:   form.item_code   || null,
      description: form.description || null,
      category:    form.category    || null,
      hsn_code:    form.hsn_code    || null,
      unit:        form.unit,
      quantity:    form.quantity    ? parseFloat(form.quantity)  : 0,
      unit_cost:   form.unit_cost   ? parseFloat(form.unit_cost) : 0,
      notes:       form.notes       || null,
    };

    try {
      const res = await fetch(`/api/accounts/stock/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
      router.push('/dashboard/accounts/stock');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
      setSaving(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <Link href="/d/stock"
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-2 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Stock
        </Link>
        <h1 className="text-xl font-bold text-white">Edit Stock Item</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Update item details, quantity, or unit cost</p>
      </div>

      <form onSubmit={handleSubmit} className={glass}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className={lbl}>Item Name *</label>
            <input type="text" name="item_name" value={form.item_name} onChange={handleChange}
              required placeholder="e.g. Lead Anode 200mm" className={input} />
          </div>
          <div>
            <label className={lbl}>Item Code</label>
            <input type="text" name="item_code" value={form.item_code} onChange={handleChange}
              placeholder="SKU / item code" className={input} />
          </div>
          <div>
            <label className={lbl}>Category</label>
            <input type="text" name="category" value={form.category} onChange={handleChange}
              placeholder="e.g. Raw Material, Finished Goods" className={input} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Description</label>
            <input type="text" name="description" value={form.description} onChange={handleChange}
              placeholder="Specifications, grade, size…" className={input} />
          </div>
          <div>
            <label className={lbl}>HSN Code</label>
            <input type="text" name="hsn_code" value={form.hsn_code} onChange={handleChange}
              placeholder="HSN / SAC code" className={input} />
          </div>
          <div>
            <label className={lbl}>Quantity</label>
            <input type="number" name="quantity" value={form.quantity} onChange={handleChange}
              min="0" step="0.001" placeholder="0" className={input} />
          </div>
          <div>
            <label className={lbl}>Unit</label>
            <input type="text" name="unit" value={form.unit} onChange={handleChange}
              placeholder="pcs / kg / m / set" className={input} />
          </div>
          <div>
            <label className={lbl}>Unit Cost (₹)</label>
            <input type="number" name="unit_cost" value={form.unit_cost} onChange={handleChange}
              min="0" step="0.01" placeholder="0.00" className={input} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Notes</label>
            <input type="text" name="notes" value={form.notes} onChange={handleChange}
              placeholder="Optional notes" className={input} />
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
        )}

        <div className="flex items-center gap-3 mt-6">
          <button type="submit" disabled={saving}
            className="rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <Link href="/d/stock"
            className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-6 py-2.5 text-sm font-semibold text-zinc-300 hover:border-zinc-600 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
