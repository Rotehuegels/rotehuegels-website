'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Truck, Loader2 } from 'lucide-react';

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
      <main className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          <Image src="/logo.png" alt="Rotehügels" width={150} height={42} className="mx-auto mb-6" priority />
          <div className="rounded-2xl border border-emerald-800/60 bg-emerald-900/20 p-8 space-y-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
            <h1 className="text-lg font-bold text-white">Registration Submitted!</h1>
            <p className="text-sm text-zinc-400">
              Thank you for registering as a supplier with Rotehügels. Our procurement team will review your
              submission and reach out when your categories match our requirements.
            </p>
          </div>
          <Link href="/" className="inline-block mt-6 text-sm text-zinc-400 hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <Link href="/"><Image src="/logo.png" alt="Rotehügels" width={150} height={42} className="mx-auto" priority /></Link>
          <h1 className="mt-4 text-xl font-bold text-white flex items-center justify-center gap-2">
            <Truck className="h-5 w-5 text-rose-400" /> Supplier Registration
          </h1>
          <p className="mt-2 text-sm text-zinc-500">Join our supplier network to receive procurement enquiries</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-6 sm:p-8">

          {/* Company Info */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-4">Company Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Company Name *</label>
                <input name="company_name" required placeholder="Legal or trade name" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Contact Person *</label>
                <input name="contact_person" required placeholder="Full name" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email *</label>
                <input name="email" type="email" required placeholder="business@example.com" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input name="phone" type="tel" className={inputCls} placeholder="+91-XXXXX XXXXX" />
              </div>
              <div>
                <label className={labelCls}>City</label>
                <input name="city" className={inputCls} placeholder="City" />
              </div>
              <div>
                <label className={labelCls}>State</label>
                <select name="state" className={inputCls} defaultValue="">
                  <option value="">Select…</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>GSTIN</label>
                <input name="gstin" className={inputCls} placeholder="e.g., 33AABCU9603R1ZM" maxLength={15} />
              </div>
              <div>
                <label className={labelCls}>PAN</label>
                <input name="pan" className={inputCls} placeholder="e.g., AABCU9603R" maxLength={10} />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-1">Supply Categories *</h2>
            <p className="text-xs text-zinc-500 mb-4">Select all that apply — we'll match you to relevant enquiries</p>
            {CATEGORIES.map(group => (
              <div key={group.group} className="mb-4">
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
          <div>
            <h2 className="text-sm font-semibold text-white mb-4">Additional Information</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={labelCls}>Certifications (ISO, BIS, etc.)</label>
                <input name="certifications" className={inputCls} placeholder="e.g., ISO 9001:2015, BIS" />
              </div>
              <div>
                <label className={labelCls}>Notes</label>
                <textarea name="notes" rows={3} className={inputCls}
                  placeholder="Capacity, specialisation, export experience, etc." />
              </div>
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50 transition-colors"
          >
            {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
            {status === 'loading' ? 'Submitting…' : 'Submit Registration'}
          </button>

          <p className="text-xs text-zinc-600 text-center">
            By submitting, you agree to be contacted by Rotehügels for procurement enquiries matching your categories.
          </p>
        </form>

        <p className="text-center text-xs text-zinc-600 mt-6">
          Need help? Contact us at <a href="mailto:procurements@rotehuegels.com" className="text-rose-400 hover:text-rose-300">procurements@rotehuegels.com</a>
        </p>
      </div>
    </main>
  );
}
