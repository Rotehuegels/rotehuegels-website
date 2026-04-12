'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Scale, Loader2, AlertTriangle } from 'lucide-react';

const COMMODITIES = [
  'Copper (Cu)', 'Zinc (Zn)', 'Lead (Pb)', 'Tin (Sn)', 'Nickel (Ni)',
  'Aluminium (Al)', 'Gold (Au)', 'Silver (Ag)', 'Platinum (Pt)', 'Palladium (Pd)',
  'Cobalt (Co)', 'Lithium (Li)', 'Manganese (Mn)', 'Iron Ore', 'Chrome Ore',
  'Titanium', 'Vanadium', 'Rare Earth Elements', 'Black Mass',
  'Copper Concentrate', 'Zinc Concentrate', 'Lead Concentrate',
  'Dross & Residues', 'E-Waste / Scrap', 'Other',
];

const COUNTRIES = [
  'India', 'Australia', 'Brazil', 'Canada', 'Chile', 'China', 'DR Congo',
  'Germany', 'Indonesia', 'Japan', 'Mexico', 'Peru', 'Philippines', 'Russia',
  'Saudi Arabia', 'Singapore', 'South Africa', 'South Korea', 'Turkey',
  'United Arab Emirates', 'United Kingdom', 'United States', 'Zambia', 'Zimbabwe', 'Other',
];

const inputCls = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-rose-400/60 focus:ring-1 focus:ring-rose-400/30';
const labelCls = 'block text-xs font-medium text-zinc-400 mb-1.5';

export default function TradingPartnerRegisterPage() {
  const [commodities, setCommodities] = useState<string[]>([]);
  const [origins, setOrigins] = useState<string[]>([]);
  const [terms, setTerms] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setError] = useState('');
  const [regNo, setRegNo] = useState('');

  const toggle = (arr: string[], setArr: (v: string[]) => void, item: string) => {
    setArr(arr.includes(item) ? arr.filter(c => c !== item) : [...arr, item]);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (commodities.length === 0) { setError('Select at least one commodity.'); return; }
    if (!terms) { setError('You must accept the trading terms.'); return; }
    setStatus('loading'); setError('');

    const fd = new FormData(e.currentTarget);
    const body = {
      company_name: fd.get('company_name'),
      contact_person: fd.get('contact_person'),
      email: fd.get('email'),
      phone: fd.get('phone') || undefined,
      website: fd.get('website') || undefined,
      country: fd.get('country') || 'India',
      gstin: fd.get('gstin') || undefined,
      pan: fd.get('pan') || undefined,
      tax_id: fd.get('tax_id') || undefined,
      business_type: fd.get('business_type') || undefined,
      commodities,
      trade_type: fd.get('trade_type') || 'seller',
      typical_volume: fd.get('typical_volume') || undefined,
      origin_countries: origins.length > 0 ? origins : undefined,
      certifications: fd.get('certifications') || undefined,
      terms_accepted: terms,
      notes: fd.get('notes') || undefined,
    };

    try {
      const res = await fetch('/api/trading-partners', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : Object.values(data.error).flat().join(', '));
        setStatus('error'); return;
      }
      setRegNo(data.reg_no);
      setStatus('success');
    } catch {
      setError('Something went wrong.'); setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          <Image src="/logo.png" alt="Rotehügels" width={150} height={42} className="mx-auto mb-6" priority />
          <div className="rounded-2xl border border-emerald-800/60 bg-emerald-900/20 p-8 space-y-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
            <h1 className="text-lg font-bold text-white">Registration Submitted!</h1>
            <p className="text-sm text-zinc-400">
              Reference: <strong className="text-emerald-400">{regNo}</strong>
            </p>
            <p className="text-sm text-zinc-400">
              Our team will verify your details and contact you once approved.
              Verified trading partners are eligible to participate in commodity trades facilitated by Rotehügels.
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
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <Link href="/"><Image src="/logo.png" alt="Rotehügels" width={150} height={42} className="mx-auto" priority /></Link>
          <h1 className="mt-4 text-xl font-bold text-white flex items-center justify-center gap-2">
            <Scale className="h-5 w-5 text-rose-400" /> Trading Partner Registration
          </h1>
          <p className="mt-2 text-sm text-zinc-500">Register as a commodity trading partner with Rotehügels</p>
        </div>

        {/* Disclaimer banner */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/80 leading-relaxed">
              <strong className="text-amber-300">Important — Trading Intermediary Disclaimer</strong>
              <p className="mt-1">
                Rotehügels acts solely as a <strong>verified intermediary</strong> in commodity transactions.
                We facilitate introductions between verified trading partners and our clients. Rotehügels does
                not guarantee the quality, quantity, specifications, or delivery of any commodity traded through
                our network.
              </p>
              <p className="mt-1">
                <strong>Sample verification required:</strong> Upon client interest, trading partners must submit
                representative commodity samples to our office. Samples are sent to internationally accredited
                third-party laboratories (SGS, Bureau Veritas, Intertek, ALS Global, or equivalent NABL/ISO 17025
                accredited labs) for independent analysis and certification of all claims (grade, composition, origin).
                Trades proceed only after certified lab results are satisfactory.
              </p>
              <p className="mt-1">
                Buyers are responsible for independent verification and inspection before placing orders.
                Disputes arising from trades are between the buyer and seller — Rotehügels' role is limited
                to coordination, facilitation, and arranging third-party sample verification.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-6 sm:p-8">

          {/* Company Info */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-4">Company Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Company / Trading Name *</label>
                <input name="company_name" required placeholder="Legal or trade name" className={inputCls} />
              </div>
              <div><label className={labelCls}>Contact Person *</label><input name="contact_person" required placeholder="Full name" className={inputCls} /></div>
              <div><label className={labelCls}>Email *</label><input name="email" type="email" required placeholder="trading@example.com" className={inputCls} /></div>
              <div><label className={labelCls}>Phone</label><input name="phone" type="tel" placeholder="+91-XXXXX XXXXX" className={inputCls} /></div>
              <div><label className={labelCls}>Website</label><input name="website" placeholder="www.example.com" className={inputCls} /></div>
              <div>
                <label className={labelCls}>Country</label>
                <select name="country" className={inputCls} defaultValue="India">
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>GSTIN / Tax ID</label><input name="gstin" placeholder="GSTIN or international tax ID" className={inputCls} /></div>
            </div>
          </div>

          {/* Trading Details */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-1">Trading Details</h2>
            <p className="text-xs text-zinc-500 mb-4">What do you trade?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelCls}>Trade Type *</label>
                <select name="trade_type" className={inputCls}>
                  <option value="seller">Seller (I supply commodities)</option>
                  <option value="buyer">Buyer (I purchase commodities)</option>
                  <option value="both">Both (Buyer & Seller)</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Typical Monthly Volume</label>
                <input name="typical_volume" placeholder="e.g., 50-100 MT/month" className={inputCls} />
              </div>
            </div>

            <label className={labelCls}>Commodities * (select all that apply)</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {COMMODITIES.map(c => {
                const sel = commodities.includes(c);
                return (
                  <button key={c} type="button" onClick={() => toggle(commodities, setCommodities, c)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                      sel ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                    }`}>
                    {sel && '✓ '}{c}
                  </button>
                );
              })}
            </div>
            {commodities.length > 0 && <p className="text-xs text-emerald-400 mb-4">{commodities.length} selected</p>}

            <label className={labelCls}>Source / Origin Countries (select all)</label>
            <div className="flex flex-wrap gap-2">
              {COUNTRIES.map(c => {
                const sel = origins.includes(c);
                return (
                  <button key={c} type="button" onClick={() => toggle(origins, setOrigins, c)}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] border transition-colors ${
                      sel ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-zinc-800/60 border-zinc-700 text-zinc-500 hover:border-zinc-500'
                    }`}>
                    {sel && '✓ '}{c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additional */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-4">Additional Information</h2>
            <div className="grid grid-cols-1 gap-4">
              <div><label className={labelCls}>Certifications (ISO, LBMA, LME approved, etc.)</label><input name="certifications" className={inputCls} /></div>
              <div><label className={labelCls}>Notes</label><textarea name="notes" rows={3} className={inputCls} placeholder="Any additional details about your trading operations..." /></div>
            </div>
          </div>

          {/* Terms */}
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/40 p-4">
            <div className="flex items-start gap-3">
              <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-rose-500 focus:ring-rose-500" />
              <label className="text-xs text-zinc-400 leading-relaxed">
                <strong className="text-zinc-300">I acknowledge and accept the following terms:</strong>
                <ul className="mt-2 space-y-1 list-disc pl-4">
                  <li>Rotehügels acts as an intermediary and does not take ownership of any commodity.</li>
                  <li>All commodity claims (quality, quantity, origin, certifications) are my responsibility to substantiate.</li>
                  <li>I agree to submit representative samples for laboratory verification upon client interest, at my own cost.</li>
                  <li>Trades proceed only after Rotehügels' independent sample analysis is satisfactory.</li>
                  <li>Buyers are responsible for independent verification and inspection before completing any transaction.</li>
                  <li>Rotehügels is not liable for disputes, losses, or damages arising from trades facilitated through its network.</li>
                  <li>Registration is subject to verification per Rotehügels' internal compliance policy.</li>
                  <li>Rotehügels reserves the right to suspend or terminate trading partner status at any time.</li>
                </ul>
              </label>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{errorMsg}</div>
          )}

          <button type="submit" disabled={status === 'loading' || !terms}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50 transition-colors">
            {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scale className="h-4 w-4" />}
            {status === 'loading' ? 'Submitting…' : 'Submit Trading Partner Registration'}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-600 mt-6">
          Need help? Contact us at <a href="mailto:sales@rotehuegels.com" className="text-rose-400 hover:text-rose-300">sales@rotehuegels.com</a>
        </p>
      </div>
    </main>
  );
}
