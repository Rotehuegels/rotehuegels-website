'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, CheckCircle, AlertCircle, X, Trash2 } from 'lucide-react';
import { lookupGstin as fetchGstinData } from '@/lib/gstinLookup';

const inp   = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none transition-colors';
const lbl   = 'block text-xs font-medium text-zinc-400 mb-1.5';
const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm p-6 space-y-5';

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

interface Supplier {
  id: string;
  legal_name: string;
  trade_name: string | null;
  gstin: string | null;
  pan: string | null;
  entity_type: string | null;
  gst_status: string | null;
  reg_date: string | null;
  address: string | null;
  state: string | null;
  pincode: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
}

export default function SupplierEditForm({ supplier }: { supplier: Supplier }) {
  const router = useRouter();
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [lookupState, setLookupState] = useState<'idle' | 'loading' | 'found' | 'error'>('idle');
  const [lookupMsg, setLookupMsg]     = useState('');
  const [error, setError]             = useState('');
  const [credits, setCredits] = useState<{ remaining: number; expiry: string } | null>(null);

  useEffect(() => {
    fetch('/api/gstin?credits=1')
      .then(r => r.json())
      .then(d => setCredits({ remaining: d.remaining, expiry: d.expiry }))
      .catch(() => null);
  }, []);

  const [form, setForm] = useState({
    legal_name:  supplier.legal_name,
    trade_name:  supplier.trade_name  ?? '',
    gstin:       supplier.gstin       ?? '',
    pan:         supplier.pan         ?? '',
    entity_type: supplier.entity_type ?? '',
    gst_status:  supplier.gst_status  ?? '',
    reg_date:    supplier.reg_date    ?? '',
    address:     supplier.address     ?? '',
    state:       supplier.state       ?? '',
    pincode:     supplier.pincode     ?? '',
    email:       supplier.email       ?? '',
    phone:       supplier.phone       ?? '',
    notes:       supplier.notes       ?? '',
  });

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    set(e.target.name, e.target.value);
  }

  async function lookupGstin() {
    const gstin = form.gstin.trim().toUpperCase();
    if (!GSTIN_RE.test(gstin)) {
      setLookupState('error');
      setLookupMsg('Invalid GSTIN — must be 15 characters (e.g. 33AAPCR0554G1ZE).');
      return;
    }
    setLookupState('loading');
    setLookupMsg('');

    try {
      const data = await fetchGstinData(gstin);
      setForm(f => ({
        ...f,
        gstin:       data.gstin       || f.gstin,
        legal_name:  data.legal_name  || f.legal_name,
        trade_name:  data.trade_name  || f.trade_name,
        entity_type: data.entity_type || f.entity_type,
        gst_status:  data.gst_status  || f.gst_status,
        state:       data.state       || f.state,
        pincode:     data.pincode     || f.pincode,
        address:     data.address     || f.address,
        reg_date:    data.reg_date    || f.reg_date,
        pan:         f.pan || gstin.slice(2, 12),
      }));
      if ('credits_remaining' in data && 'credits_expiry' in data) {
        setCredits({ remaining: data.credits_remaining as number, expiry: data.credits_expiry as string });
      }
      setLookupState('found');
      setLookupMsg(`Found: ${data.legal_name} — ${data.gst_status}`);
    } catch (err) {
      setLookupState('error');
      setLookupMsg(err instanceof Error ? err.message : 'Lookup failed. Enter details manually.');
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/accounts/suppliers/${supplier.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legal_name:  form.legal_name  || null,
          trade_name:  form.trade_name  || null,
          gstin:       form.gstin       || null,
          pan:         form.pan         || null,
          entity_type: form.entity_type || null,
          gst_status:  form.gst_status  || null,
          reg_date:    form.reg_date    || null,
          address:     form.address     || null,
          state:       form.state       || null,
          pincode:     form.pincode     || null,
          email:       form.email       || null,
          phone:       form.phone       || null,
          notes:       form.notes       || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data.error));
      router.push('/dashboard/suppliers');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${supplier.legal_name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/accounts/suppliers/${supplier.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed.');
      router.push('/dashboard/suppliers');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-3xl">

      {/* GSTIN Lookup */}
      <div className={glass}>
        <h2 className="text-sm font-semibold text-zinc-300">GSTIN Lookup</h2>
        <p className="text-xs text-zinc-500 -mt-3">Enter GSTIN and click Lookup to auto-fill all details from the GST portal.</p>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text" name="gstin" value={form.gstin}
              onChange={e => {
                set('gstin', e.target.value.toUpperCase());
                if (lookupState !== 'idle') { setLookupState('idle'); setLookupMsg(''); }
              }}
              placeholder="e.g. 33AAPCR0554G1ZE" maxLength={15}
              className={`${inp} font-mono uppercase pr-8`}
            />
            {form.gstin && (
              <button type="button" onClick={() => { set('gstin', ''); setLookupState('idle'); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button type="button" onClick={lookupGstin}
            disabled={lookupState === 'loading' || !form.gstin}
            className="flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition-colors shrink-0">
            {lookupState === 'loading'
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Looking up…</>
              : <><Search className="h-4 w-4" /> Lookup</>}
          </button>
        </div>

        {/* API credit counter */}
        {credits !== null && (
          <p className="text-[11px] -mt-3 flex items-center gap-1.5">
            <span className={`font-semibold ${credits.remaining <= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {credits.remaining} credit{credits.remaining !== 1 ? 's' : ''} remaining
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-500">expires {new Date(credits.expiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </p>
        )}

        {lookupState === 'found' && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-sm text-emerald-400">
            <CheckCircle className="h-4 w-4 shrink-0" />{lookupMsg}
          </div>
        )}
        {lookupState === 'error' && (
          <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 text-sm text-amber-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{lookupMsg}
          </div>
        )}
        <p className="text-[11px] text-zinc-600 -mt-3">
          {form.gstin.length}/15
          {form.gstin.length === 15 && GSTIN_RE.test(form.gstin) ? ' — valid format ✓' : ''}
        </p>
      </div>

      {/* Company details */}
      <div className={glass}>
        <h2 className="text-sm font-semibold text-zinc-300">Company Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className={lbl}>Legal Name *</label>
            <input type="text" name="legal_name" value={form.legal_name} onChange={handleChange}
              required className={inp} />
          </div>
          <div>
            <label className={lbl}>Trade Name</label>
            <input type="text" name="trade_name" value={form.trade_name} onChange={handleChange}
              placeholder="Brand / trading name" className={inp} />
          </div>
          <div>
            <label className={lbl}>Entity Type</label>
            <input type="text" name="entity_type" value={form.entity_type} onChange={handleChange}
              placeholder="Private Limited / Proprietorship…" className={inp} />
          </div>
          <div>
            <label className={lbl}>PAN</label>
            <input type="text" name="pan" value={form.pan} onChange={handleChange}
              placeholder="AAAAA0000A" maxLength={10}
              className={`${inp} font-mono uppercase`} />
          </div>
          <div>
            <label className={lbl}>GST Status</label>
            <select name="gst_status" value={form.gst_status} onChange={handleChange} className={inp}>
              <option value="">— select —</option>
              <option value="Active">Active</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Suspended">Suspended</option>
              <option value="Not Registered">Not Registered</option>
            </select>
          </div>
          <div>
            <label className={lbl}>GST Registration Date</label>
            <input type="date" name="reg_date" value={form.reg_date} onChange={handleChange} className={inp} />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className={glass}>
        <h2 className="text-sm font-semibold text-zinc-300">Address</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className={lbl}>Registered Address</label>
            <textarea name="address" value={form.address} onChange={handleChange}
              rows={3} className={`${inp} resize-none`} />
          </div>
          <div>
            <label className={lbl}>State</label>
            <input type="text" name="state" value={form.state} onChange={handleChange} className={inp} />
          </div>
          <div>
            <label className={lbl}>Pincode</label>
            <input type="text" name="pincode" value={form.pincode} onChange={handleChange}
              maxLength={6} className={`${inp} font-mono`} />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className={glass}>
        <h2 className="text-sm font-semibold text-zinc-300">Contact</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={lbl}>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="vendor@example.com" className={inp} />
          </div>
          <div>
            <label className={lbl}>Phone</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange}
              placeholder="+91 98000 00000" className={inp} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange}
              rows={2} className={`${inp} resize-none`} />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 px-6 py-2.5 text-sm font-semibold text-white transition-colors">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <a href="/dashboard/suppliers"
            className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-6 py-2.5 text-sm font-semibold text-zinc-300 hover:border-zinc-600 transition-colors">
            Cancel
          </a>
        </div>
        <button type="button" onClick={handleDelete} disabled={deleting}
          className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors">
          <Trash2 className="h-4 w-4" />
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </form>
  );
}
