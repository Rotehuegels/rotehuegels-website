'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { lookupGstin as fetchGstinData } from '@/lib/gstinLookup';

const input   = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none transition-colors';
const label   = 'block text-xs font-medium text-zinc-400 mb-1.5';
const glass   = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm p-6 space-y-5';

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export default function AddSupplierForm() {
  const router = useRouter();
  const [loading, setLoading]       = useState(false);
  const [lookupState, setLookupState] = useState<'idle' | 'loading' | 'found' | 'error'>('idle');
  const [lookupMsg, setLookupMsg]   = useState('');
  const [submitError, setSubmitError] = useState('');
  const [credits, setCredits] = useState<{ remaining: number; expiry: string } | null>(null);

  useEffect(() => {
    fetch('/api/gstin?credits=1')
      .then(r => r.json())
      .then(d => setCredits({ remaining: d.remaining, expiry: d.expiry }))
      .catch(() => null);
  }, []);

  const [form, setForm] = useState({
    gstin:       '',
    legal_name:  '',
    trade_name:  '',
    pan:         '',
    entity_type: '',
    gst_status:  '',
    reg_date:    '',
    address:     '',
    state:       '',
    pincode:     '',
    email:       '',
    phone:       '',
    notes:       '',
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
      setLookupMsg('Invalid GSTIN format. Must be 15 characters (e.g. 33AAPCR0554G1ZE).');
      return;
    }

    setLookupState('loading');
    setLookupMsg('');

    try {
      const data = await fetchGstinData(gstin);
      setForm(f => ({
        ...f,
        gstin:       data.gstin,
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

  function clearLookup() {
    setLookupState('idle');
    setLookupMsg('');
    setForm(f => ({
      ...f,
      gstin: '',
      legal_name: '', trade_name: '', pan: '',
      entity_type: '', gst_status: '', reg_date: '',
      address: '', state: '', pincode: '',
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.legal_name.trim()) { setSubmitError('Legal name is required.'); return; }
    setSubmitError('');
    setLoading(true);

    try {
      const body = {
        legal_name:  form.legal_name  || null,
        gstin:       form.gstin       || null,
        trade_name:  form.trade_name  || null,
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
      };

      const res = await fetch('/api/accounts/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data.error));
      router.push('/dashboard/suppliers');
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save supplier.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-[1800px]">

      {/* GSTIN Lookup */}
      <div className={glass}>
        <h2 className="text-sm font-semibold text-zinc-300">GST Lookup</h2>
        <p className="text-xs text-zinc-500 -mt-3">
          Enter the supplier&apos;s GSTIN and click Lookup — name and address will be auto-fetched from the GST portal.
        </p>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              name="gstin"
              value={form.gstin}
              onChange={e => {
                set('gstin', e.target.value.toUpperCase());
                if (lookupState !== 'idle') { setLookupState('idle'); setLookupMsg(''); }
              }}
              placeholder="e.g. 33AAPCR0554G1ZE"
              maxLength={15}
              className={`${input} font-mono uppercase pr-8`}
            />
            {form.gstin && (
              <button type="button" onClick={clearLookup}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={lookupGstin}
            disabled={lookupState === 'loading' || !form.gstin}
            className="flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition-colors shrink-0"
          >
            {lookupState === 'loading'
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Looking up…</>
              : <><Search className="h-4 w-4" /> Lookup</>
            }
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

        {/* Lookup result banner */}
        {lookupState === 'found' && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-sm text-emerald-400">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{lookupMsg}</span>
          </div>
        )}
        {lookupState === 'error' && (
          <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 text-sm text-amber-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{lookupMsg}</span>
          </div>
        )}

        {/* GSTIN character count hint */}
        <p className="text-[11px] text-zinc-600 -mt-3">
          {form.gstin.length}/15 characters
          {form.gstin.length === 15 && GSTIN_RE.test(form.gstin)
            ? ' — valid format ✓'
            : form.gstin.length === 15
            ? ' — invalid format'
            : ''}
        </p>
      </div>

      {/* Company details */}
      <div className={glass}>
        <h2 className="text-sm font-semibold text-zinc-300">Company Details</h2>
        <p className="text-xs text-zinc-500 -mt-3">Auto-filled from GST portal. You can edit any field.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className={label}>Legal Name *</label>
            <input type="text" name="legal_name" value={form.legal_name} onChange={handleChange}
              required placeholder="As registered with GST" className={input} />
          </div>
          <div>
            <label className={label}>Trade Name</label>
            <input type="text" name="trade_name" value={form.trade_name} onChange={handleChange}
              placeholder="Brand / trading name (if different)" className={input} />
          </div>
          <div>
            <label className={label}>Entity Type</label>
            <input type="text" name="entity_type" value={form.entity_type} onChange={handleChange}
              placeholder="Private Limited / Proprietorship…" className={input} />
          </div>
          <div>
            <label className={label}>PAN</label>
            <input type="text" name="pan" value={form.pan} onChange={handleChange}
              placeholder="AAAAA0000A" maxLength={10}
              className={`${input} font-mono uppercase`} />
          </div>
          <div>
            <label className={label}>GST Status</label>
            <select name="gst_status" value={form.gst_status} onChange={handleChange} className={input}>
              <option value="">— select —</option>
              <option value="Active">Active</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Suspended">Suspended</option>
              <option value="Not Registered">Not Registered</option>
            </select>
          </div>
          <div>
            <label className={label}>GST Registration Date</label>
            <input type="date" name="reg_date" value={form.reg_date} onChange={handleChange} className={input} />
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
              rows={3} placeholder="Street, locality, city…"
              className={`${input} resize-none`} />
          </div>
          <div>
            <label className={label}>State</label>
            <input type="text" name="state" value={form.state} onChange={handleChange}
              placeholder="Tamil Nadu" className={input} />
          </div>
          <div>
            <label className={label}>Pincode</label>
            <input type="text" name="pincode" value={form.pincode} onChange={handleChange}
              placeholder="600001" maxLength={6} className={`${input} font-mono`} />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className={glass}>
        <h2 className="text-sm font-semibold text-zinc-300">Contact (Optional)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={label}>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="vendor@example.com" className={input} />
          </div>
          <div>
            <label className={label}>Phone</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange}
              placeholder="+91 98000 00000" className={input} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange}
              rows={2} placeholder="Payment terms, category, remarks…"
              className={`${input} resize-none`} />
          </div>
        </div>
      </div>

      {submitError && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{submitError}</p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading}
          className="rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 px-6 py-2.5 text-sm font-semibold text-white transition-colors">
          {loading ? 'Saving…' : 'Add Supplier'}
        </button>
        <a href="/dashboard/suppliers"
          className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-6 py-2.5 text-sm font-semibold text-zinc-300 hover:border-zinc-600 transition-colors">
          Cancel
        </a>
      </div>
    </form>
  );
}
