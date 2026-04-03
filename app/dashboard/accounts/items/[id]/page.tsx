'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const input = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none transition-colors';
const label = 'block text-xs font-medium text-zinc-400 mb-1.5';
const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm p-6 space-y-5';
const UNITS_GOODS = ['kg', 'MT', 'g', 'pcs', 'nos', 'litre', 'ml', 'set', 'box', 'roll', 'sheet', 'pair'];
const UNITS_SERVICE = ['hours', 'days', 'weeks', 'months', 'project', 'lump sum', 'visit'];

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    sku_id: '', item_type: 'goods', name: '', description: '',
    hsn_code: '', sac_code: '', unit: 'kg',
    mrp: '', default_gst_rate: '18', category: '', is_active: true, notes: '',
  });

  useEffect(() => {
    fetch(`/api/accounts/items/${id}`)
      .then(r => r.json())
      .then(d => {
        const item = d.data;
        if (item) setForm({
          sku_id:           item.sku_id ?? '',
          item_type:        item.item_type ?? 'goods',
          name:             item.name ?? '',
          description:      item.description ?? '',
          hsn_code:         item.hsn_code ?? '',
          sac_code:         item.sac_code ?? '',
          unit:             item.unit ?? 'kg',
          mrp:              item.mrp != null ? String(item.mrp) : '',
          default_gst_rate: String(item.default_gst_rate ?? 18),
          category:         item.category ?? '',
          is_active:        item.is_active ?? true,
          notes:            item.notes ?? '',
        });
        setLoading(false);
      });
  }, [id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setForm(f => ({ ...f, [name]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const body = {
      name:             form.name,
      description:      form.description || undefined,
      hsn_code:         form.item_type === 'goods' ? (form.hsn_code || undefined) : undefined,
      sac_code:         form.item_type === 'service' ? (form.sac_code || undefined) : undefined,
      unit:             form.unit,
      mrp:              form.mrp ? parseFloat(form.mrp) : undefined,
      default_gst_rate: parseFloat(form.default_gst_rate),
      category:         form.category || undefined,
      is_active:        form.is_active,
      notes:            form.notes || undefined,
    };

    const res = await fetch(`/api/accounts/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setError(JSON.stringify(data.error)); setSaving(false); return; }
    router.push('/dashboard/accounts/items');
  }

  const units = form.item_type === 'goods' ? UNITS_GOODS : UNITS_SERVICE;

  if (loading) return <div className="p-6 text-zinc-500 text-sm">Loading…</div>;

  return (
    <div className="p-6 max-w-2xl">
      <Link href="/dashboard/accounts/items" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-5 transition-colors">
        <ArrowLeft className="h-3 w-3" /> Item Catalog
      </Link>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="font-mono text-sm text-amber-400 font-bold">{form.sku_id}</span>
          <h1 className="text-xl font-bold text-white">{form.name}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={glass}>
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">Item Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className={label}>Item Name *</label>
              <input type="text" name="name" value={form.name} onChange={handleChange}
                required className={input} />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange}
                rows={2} className={`${input} resize-none`} />
            </div>
            {form.item_type === 'goods' ? (
              <div>
                <label className={label}>HSN Code</label>
                <input type="text" name="hsn_code" value={form.hsn_code} onChange={handleChange} className={input} />
              </div>
            ) : (
              <div>
                <label className={label}>SAC Code</label>
                <input type="text" name="sac_code" value={form.sac_code} onChange={handleChange} className={input} />
              </div>
            )}
            <div>
              <label className={label}>Unit</label>
              <select name="unit" value={form.unit} onChange={handleChange} className={input}>
                {units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>MRP (₹)</label>
              <input type="number" name="mrp" value={form.mrp} onChange={handleChange}
                min="0" step="0.01" className={input} />
            </div>
            <div>
              <label className={label}>Default GST Rate</label>
              <select name="default_gst_rate" value={form.default_gst_rate} onChange={handleChange} className={input}>
                {[0,5,12,18,28].map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Category</label>
              <input type="text" name="category" value={form.category} onChange={handleChange} className={input} />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange}
                rows={2} className={`${input} resize-none`} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_active" name="is_active"
                checked={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500" />
              <label htmlFor="is_active" className="text-sm text-zinc-300">Active (visible in quotes)</label>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <Link href="/dashboard/accounts/items"
            className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-6 py-2.5 text-sm font-semibold text-zinc-300 hover:border-zinc-600 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
