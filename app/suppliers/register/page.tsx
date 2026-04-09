'use client';

import { useState } from 'react';
import Link from 'next/link';

const CATEGORIES: { group: string; items: string[] }[] = [
  { group: 'Raw Materials & Metals', items: [
    'Ferrous Metals (Steel, Iron)',
    'Non-Ferrous Metals (Copper, Aluminium, Zinc, Lead, Nickel, Tin)',
    'Precious Metals',
    'Scrap & Recyclables',
    'Metal Alloys',
  ]},
  { group: 'Chemicals & Consumables', items: [
    'Industrial Chemicals',
    'Electrolytes & Reagents',
    'Lubricants & Oils',
    'Packaging Materials',
  ]},
  { group: 'Plant & Equipment', items: [
    'Machinery & Equipment',
    'Electrical & Instrumentation',
    'Automation & Control Systems',
    'Spare Parts & Components',
    'Material Handling Equipment',
  ]},
  { group: 'Services', items: [
    'Engineering & Fabrication',
    'Testing & Inspection',
    'Logistics & Freight',
    'Customs & Compliance',
    'Environmental & Waste Management',
    'IT & Software',
    'Legal & Consulting',
  ]},
  { group: 'Utilities & Infrastructure', items: [
    'Power & Energy',
    'Water Treatment',
    'Civil & Construction',
  ]},
];

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman & Nicobar Islands','Chandigarh','Dadra & Nagar Haveli','Daman & Diu',
  'Delhi','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry',
];

const inputCls = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-rose-400/60 focus:ring-1 focus:ring-rose-400/30';
const labelCls = 'block text-xs font-medium text-zinc-400 mb-1.5';

export default function SupplierRegisterPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [status, setStatus]         = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setError]        = useState('');

  function toggleCategory(cat: string) {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (categories.length === 0) { setError('Please select at least one category.'); return; }
    setStatus('loading');
    setError('');

    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = { categories };
    fd.forEach((val, key) => { if (val !== '') body[key] = val; });

    const res = await fetch('/api/supplier-registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setStatus('success');
    } else {
      const j = await res.json();
      const msg = typeof j.error === 'string' ? j.error
        : Object.values(j.error as Record<string, string[]>)[0]?.[0] ?? 'Something went wrong.';
      setError(msg);
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-5xl">✓</div>
          <h1 className="text-2xl font-bold text-white">Registration Submitted</h1>
          <p className="text-zinc-400 text-sm">
            Thank you for registering as a supplier with Rotehügels. Our team will review your
            submission and reach out when your categories match our procurement requirements.
          </p>
          <Link href="/" className="inline-block mt-4 text-sm text-rose-400 hover:text-rose-300 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-white">Rotehügels</Link>
        <span className="text-xs text-zinc-500">Supplier Registration</span>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Register as a Supplier</h1>
          <p className="mt-2 text-zinc-400 text-sm">
            Join our supplier network. When your categories match our procurement needs,
            we'll reach out directly with enquiries.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Company Info */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-5">
            <h2 className="font-semibold text-white text-sm border-b border-zinc-800 pb-3">Company Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className={labelCls}>Company Name <span className="text-rose-400">*</span></label>
                <input name="company_name" required className={inputCls} placeholder="Legal or trade name" />
              </div>
              <div>
                <label className={labelCls}>Contact Person <span className="text-rose-400">*</span></label>
                <input name="contact_person" required className={inputCls} placeholder="Full name" />
              </div>
              <div>
                <label className={labelCls}>Email <span className="text-rose-400">*</span></label>
                <input name="email" type="email" required className={inputCls} placeholder="business@example.com" />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input name="phone" type="tel" className={inputCls} placeholder="+91 00000 00000" />
              </div>
              <div>
                <label className={labelCls}>City</label>
                <input name="city" className={inputCls} placeholder="City" />
              </div>
              <div>
                <label className={labelCls}>State</label>
                <select name="state" className={`${inputCls} cursor-pointer`} defaultValue="">
                  <option value="">Select state…</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>GSTIN</label>
                <input name="gstin" className={inputCls} placeholder="22AAAAA0000A1Z5" />
              </div>
              <div>
                <label className={labelCls}>PAN</label>
                <input name="pan" className={inputCls} placeholder="AAAAA0000A" />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-5">
            <div className="border-b border-zinc-800 pb-3">
              <h2 className="font-semibold text-white text-sm">Supply Categories <span className="text-rose-400">*</span></h2>
              <p className="text-xs text-zinc-500 mt-0.5">Select all that apply — we'll match you to relevant enquiries</p>
            </div>
            {CATEGORIES.map(group => (
              <div key={group.group}>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{group.group}</p>
                <div className="flex flex-wrap gap-2">
                  {group.items.map(item => {
                    const selected = categories.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleCategory(item)}
                        className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                          selected
                            ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                            : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {selected && '✓ '}{item}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {categories.length > 0 && (
              <p className="text-xs text-emerald-400">{categories.length} categor{categories.length === 1 ? 'y' : 'ies'} selected</p>
            )}
          </div>

          {/* Additional Info */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-5">
            <h2 className="font-semibold text-white text-sm border-b border-zinc-800 pb-3">Additional Information</h2>
            <div>
              <label className={labelCls}>Certifications (ISO, BIS, etc.)</label>
              <input name="certifications" className={inputCls} placeholder="e.g. ISO 9001:2015, BIS" />
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <textarea name="notes" rows={3} className={`${inputCls} resize-none`}
                placeholder="Anything else you'd like us to know — capacity, specialisation, export experience, etc." />
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full rounded-xl bg-rose-600 py-3 text-sm font-semibold text-white hover:bg-rose-500 transition-colors disabled:opacity-50"
          >
            {status === 'loading' ? 'Submitting…' : 'Submit Registration'}
          </button>

          <p className="text-xs text-zinc-600 text-center">
            By submitting, you agree to be contacted by Rotehügels for procurement enquiries matching your categories.
          </p>
        </form>
      </div>
    </div>
  );
}
