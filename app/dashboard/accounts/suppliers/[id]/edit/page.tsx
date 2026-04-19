'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

const inputCls = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none transition-colors';
const label = 'block text-xs font-medium text-zinc-400 mb-1.5';
const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm p-6 space-y-5';

export default function EditSupplierPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    legal_name: '',
    trade_name: '',
    gstin: '',
    pan: '',
    entity_type: '',
    gst_status: '',
    reg_date: '',
    address: '',
    state: '',
    pincode: '',
    email: '',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/accounts/suppliers/${id}`);
        if (!res.ok) throw new Error('Failed to load supplier');
        const { data } = await res.json();
        setForm({
          legal_name: data.legal_name ?? '',
          trade_name: data.trade_name ?? '',
          gstin: data.gstin ?? '',
          pan: data.pan ?? '',
          entity_type: data.entity_type ?? '',
          gst_status: data.gst_status ?? '',
          reg_date: data.reg_date ?? '',
          address: data.address ?? '',
          state: data.state ?? '',
          pincode: data.pincode ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          notes: data.notes ?? '',
        });
      } catch {
        setError('Could not load supplier.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const body = {
      legal_name: form.legal_name || null,
      gstin: form.gstin || null,
      trade_name: form.trade_name || null,
      pan: form.pan || null,
      entity_type: form.entity_type || null,
      gst_status: form.gst_status || null,
      reg_date: form.reg_date || null,
      address: form.address || null,
      state: form.state || null,
      pincode: form.pincode || null,
      email: form.email || null,
      phone: form.phone || null,
      notes: form.notes || null,
    };

    try {
      const res = await fetch(`/api/accounts/suppliers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
      router.push(`/d/suppliers/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-zinc-400">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading supplier...
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-[1800px]">
      <div>
        <Link href={`/d/suppliers/${id}`}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Supplier
        </Link>
        <h1 className="text-2xl font-black text-white">Edit Supplier</h1>
        <p className="text-sm text-zinc-500 mt-1">Update supplier details.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company details */}
        <div className={glass}>
          <h2 className="text-sm font-semibold text-zinc-300">Company Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className={label}>Legal Name *</label>
              <input type="text" name="legal_name" value={form.legal_name} onChange={handleChange}
                required placeholder="As registered with GST" className={inputCls} />
            </div>
            <div>
              <label className={label}>Trade Name</label>
              <input type="text" name="trade_name" value={form.trade_name} onChange={handleChange}
                placeholder="Brand / trading name" className={inputCls} />
            </div>
            <div>
              <label className={label}>GSTIN</label>
              <input type="text" name="gstin" value={form.gstin} onChange={handleChange}
                placeholder="15-char GSTIN" maxLength={15} className={`${inputCls} font-mono uppercase`} />
            </div>
            <div>
              <label className={label}>Entity Type</label>
              <input type="text" name="entity_type" value={form.entity_type} onChange={handleChange}
                placeholder="Private Limited / Proprietorship..." className={inputCls} />
            </div>
            <div>
              <label className={label}>PAN</label>
              <input type="text" name="pan" value={form.pan} onChange={handleChange}
                placeholder="AAAAA0000A" maxLength={10} className={`${inputCls} font-mono uppercase`} />
            </div>
            <div>
              <label className={label}>GST Status</label>
              <select name="gst_status" value={form.gst_status} onChange={handleChange} className={inputCls}>
                <option value="">-- select --</option>
                <option value="Active">Active</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Suspended">Suspended</option>
                <option value="Not Registered">Not Registered</option>
              </select>
            </div>
            <div>
              <label className={label}>GST Registration Date</label>
              <input type="date" name="reg_date" value={form.reg_date} onChange={handleChange} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className={glass}>
          <h2 className="text-sm font-semibold text-zinc-300">Address</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className={label}>Registered Address</label>
              <textarea name="address" value={form.address} onChange={handleChange}
                rows={3} placeholder="Street, locality, city..." className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label className={label}>State</label>
              <input type="text" name="state" value={form.state} onChange={handleChange}
                placeholder="Tamil Nadu" className={inputCls} />
            </div>
            <div>
              <label className={label}>Pincode</label>
              <input type="text" name="pincode" value={form.pincode} onChange={handleChange}
                placeholder="600001" maxLength={6} className={`${inputCls} font-mono`} />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className={glass}>
          <h2 className="text-sm font-semibold text-zinc-300">Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={label}>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="vendor@example.com" className={inputCls} />
            </div>
            <div>
              <label className={label}>Phone</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                placeholder="+91 98000 00000" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange}
                rows={2} placeholder="Payment terms, category, remarks..." className={`${inputCls} resize-none`} />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 px-6 py-2.5 text-sm font-semibold text-white transition-colors">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href={`/d/suppliers/${id}`}
            className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-6 py-2.5 text-sm font-semibold text-zinc-300 hover:border-zinc-600 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
