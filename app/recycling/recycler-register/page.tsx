'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Recycle, Loader2 } from 'lucide-react';

const WASTE_CATEGORIES: { group: string; items: string[] }[] = [
  { group: 'E-Waste / Electronics', items: [
    'Computers & Laptops',
    'Mobile Phones & Tablets',
    'Monitors & Displays (CRT, LCD, LED)',
    'Printers & Peripherals',
    'Networking Equipment',
    'Home Appliances (AC, Fridge, Washing Machine)',
    'Industrial Electronics (PLCs, Drives)',
    'Medical Equipment',
    'E-Waste Mixed / Unsorted',
  ]},
  { group: 'Batteries & Energy Storage', items: [
    'Li-Ion Batteries',
    'Lead-Acid Batteries',
    'NiMH / NiCd Batteries',
    'Black Mass / Battery Waste',
    'UPS & Power Supply Units',
    'Solar Panels & Inverters',
  ]},
  { group: 'Non-Ferrous Metals', items: [
    'Copper Scrap / Copper Dross',
    'Brass Scrap / Brass Dross',
    'Zinc Dross / Zinc Ash / Zinc Skimmings',
    'Aluminium Scrap / Aluminium Dross',
    'Copper Oxide Mill Scale',
    'Copper Reverts / Copper Druid',
    'Insulated Copper Wire Scrap',
    'Spent Catalyst (Ni, Cu, Co, Zn)',
  ]},
  { group: 'Other Materials', items: [
    'PCBs & Circuit Boards',
    'Cables & Wiring',
    'Precious Metals (Au, Ag, Pt, Pd)',
    'Lead Scrap',
    'Plastic Waste (from electronics)',
  ]},
];

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman & Nicobar Islands','Chandigarh','Delhi','Jammu & Kashmir','Ladakh','Puducherry',
];

const inputCls = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-rose-400/60 focus:ring-1 focus:ring-rose-400/30';
const labelCls = 'block text-xs font-medium text-zinc-400 mb-1.5';

export default function RecyclerRegisterPage() {
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setError] = useState('');
  const [regCode, setRegCode] = useState('');

  function toggleCategory(cat: string) {
    setCapabilities(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (capabilities.length === 0) { setError('Please select at least one waste category.'); return; }
    setStatus('loading');
    setError('');

    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = { capabilities };
    fd.forEach((val, key) => { if (val !== '') body[key] = val; });
    body.service_radius_km = Number(body.service_radius_km) || 100;

    const res = await fetch('/api/recycling/recyclers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      setRegCode(data.recycler_code ?? '');
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
            {regCode && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Your Recycler Code</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">{regCode}</p>
              </div>
            )}
            <p className="text-sm text-zinc-400">
              Thank you for registering with Roteh&uuml;gels. We will verify your
              regulatory credentials and activate your account once approved.
            </p>
          </div>
          <Link href="/recycling" className="inline-block mt-6 text-sm text-zinc-400 hover:text-white transition-colors">
            &larr; Back to Recycling
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <Link href="/"><Image src="/logo.png" alt="Rotehügels" width={150} height={42} className="mx-auto" priority /></Link>
          <h1 className="mt-4 text-xl font-bold text-white flex items-center justify-center gap-2">
            <Recycle className="h-5 w-5 text-emerald-400" /> Recycler & Reprocessor Registration
          </h1>
          <p className="mt-2 text-sm text-zinc-500">Join our network of authorized recyclers, dismantlers and metal reprocessors</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-6 sm:p-8">

          {errorMsg && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">{errorMsg}</div>
          )}

          {/* Company Info */}
          <fieldset>
            <legend className="text-sm font-semibold text-zinc-300 mb-4">Company Details</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Company Name <span className="text-rose-400">*</span></label>
                <input name="company_name" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Contact Person <span className="text-rose-400">*</span></label>
                <input name="contact_person" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email <span className="text-rose-400">*</span></label>
                <input name="email" type="email" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone <span className="text-rose-400">*</span></label>
                <input name="phone" type="tel" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>GSTIN</label>
                <input name="gstin" placeholder="33XXXXXXXXX1ZX" className={inputCls} />
              </div>
            </div>
          </fieldset>

          {/* Facility Address */}
          <fieldset>
            <legend className="text-sm font-semibold text-zinc-300 mb-4">Recycling Facility Address</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className={labelCls}>Address <span className="text-rose-400">*</span></label>
                <textarea name="address" rows={2} required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>City <span className="text-rose-400">*</span></label>
                <input name="city" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>State <span className="text-rose-400">*</span></label>
                <select name="state" required className={inputCls} defaultValue="">
                  <option value="" disabled>Select state...</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Pincode</label>
                <input name="pincode" className={inputCls} />
              </div>
            </div>
          </fieldset>

          {/* Regulatory Credentials */}
          <fieldset>
            <legend className="text-sm font-semibold text-zinc-300 mb-4">Regulatory Credentials</legend>
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3 text-xs text-amber-400 mb-4">
              Valid authorization from CPCB, SPCB, or MoEF is required for recycling/reprocessing operations in India. Your credentials will be verified before activation.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>CPCB Registration No. <span className="text-rose-400">*</span></label>
                <input name="cpcb_registration" required placeholder="Central Pollution Control Board" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>SPCB Registration No.</label>
                <input name="spcb_registration" placeholder="State Pollution Control Board" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>License Valid Until</label>
                <input name="license_valid_until" type="date" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Processing Capacity</label>
                <input name="capacity_per_month" placeholder="e.g., 500 MT/month" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Service Radius (km)</label>
                <input name="service_radius_km" type="number" defaultValue={100} className={inputCls} />
              </div>
            </div>
          </fieldset>

          {/* E-Waste Categories */}
          <fieldset>
            <legend className="text-sm font-semibold text-zinc-300 mb-4">
              Waste Categories You Accept <span className="text-rose-400">*</span>
            </legend>
            <p className="text-xs text-zinc-500 mb-4">Select all waste types and materials your facility can process.</p>
            <div className="space-y-5">
              {WASTE_CATEGORIES.map(grp => (
                <div key={grp.group}>
                  <p className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">{grp.group}</p>
                  <div className="flex flex-wrap gap-2">
                    {grp.items.map(cat => (
                      <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors ${
                          capabilities.includes(cat)
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                            : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                        }`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {capabilities.length > 0 && (
              <p className="text-xs text-emerald-400 mt-3">{capabilities.length} categor{capabilities.length === 1 ? 'y' : 'ies'} selected</p>
            )}
          </fieldset>

          {/* Additional Notes */}
          <fieldset>
            <legend className="text-sm font-semibold text-zinc-300 mb-4">Additional Information</legend>
            <textarea name="notes" rows={3} placeholder="Certifications, specializations, processing methods, previous experience..." className={inputCls} />
          </fieldset>

          {/* Compliance */}
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/40 px-5 py-4 text-xs text-zinc-500 space-y-1.5">
            <p>By submitting, you confirm that your facility holds valid authorization from CPCB/SPCB/MoEF for recycling or reprocessing operations under applicable waste management rules.</p>
            <p>You agree to provide processing certificates and maintain records as required by law. Delivery/transportation charges to your facility will be borne by you.</p>
          </div>

          <button type="submit" disabled={status === 'loading'}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-60">
            {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Recycle className="h-4 w-4" />}
            Submit Registration
          </button>
        </form>
      </div>
    </main>
  );
}
