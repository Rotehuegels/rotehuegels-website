'use client';

import { useMemo, useState } from 'react';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

type Cat = { id: string; group_code: string; label: string; typical_unit: string | null };

const GROUP_LABELS: Record<string, string> = {
  virgin_supply: 'Virgin metals & minerals',
  secondary_supply: 'Secondary (recycled) metals',
  intermediate_battery: 'Battery chain intermediates',
  eol_feedstock: 'End-of-life feedstock',
  byproduct: 'Byproducts & intermediates',
  plastics_paper_tyres: 'Plastics / paper / tyres',
  consumable: 'Consumables & reagents',
};

const input = 'w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500';

export default function ListingForm({ categories, states }: { categories: Cat[]; states: string[] }) {
  const [mode, setMode] = useState<'sell' | 'buy'>('sell');
  const [group, setGroup] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [quantityValue, setQuantityValue] = useState('');
  const [quantityUnit, setQuantityUnit] = useState('MT');
  const [priceInr, setPriceInr] = useState('');
  const [locationState, setLocationState] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [validUntil, setValidUntil] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cats = useMemo(() => categories.filter(c => !group || c.group_code === group), [categories, group]);
  const selectedCat = cats.find(c => c.id === categoryId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null); setSubmitting(true);
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_type: mode,
          item_category_id: categoryId,
          title,
          description: description || null,
          quantity_value: quantityValue ? Number(quantityValue) : null,
          quantity_unit: quantityUnit || null,
          price_inr_per_unit: priceInr ? Number(priceInr) : null,
          location_state: locationState,
          location_city: locationCity || null,
          company_name: companyName || null,
          submitter_name: submitterName,
          contact_email: contactEmail,
          contact_phone: contactPhone || null,
          valid_until: validUntil || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
      } else {
        setSuccess(data.message ?? 'Listing submitted. It will be reviewed within 24 hours.');
        // Clear form on success
        setTitle(''); setDescription(''); setQuantityValue(''); setPriceInr('');
        setLocationCity(''); setCompanyName(''); setSubmitterName('');
        setContactEmail(''); setContactPhone(''); setValidUntil('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
        <p className="text-emerald-300 font-semibold mb-1">Listing received</p>
        <p className="text-sm text-zinc-400">{success}</p>
        <div className="flex justify-center gap-3 mt-6">
          <a href="/marketplace" className="text-xs text-emerald-400 hover:text-emerald-300">← Back to Marketplace</a>
          <button onClick={() => setSuccess(null)} className="text-xs text-zinc-500 hover:text-zinc-300">Post another</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 flex gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* Mode tabs */}
      <div className="inline-flex rounded-lg bg-zinc-900 border border-zinc-800 p-1">
        {(['sell', 'buy'] as const).map(m => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              mode === m ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}>
            {m === 'sell' ? 'I want to sell' : 'I want to buy'}
          </button>
        ))}
      </div>

      {/* Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Tier *</label>
          <select value={group} onChange={e => { setGroup(e.target.value); setCategoryId(''); }} className={input} required>
            <option value="">Select a tier</option>
            {Object.entries(GROUP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Item category *</label>
          <select value={categoryId} onChange={e => {
            setCategoryId(e.target.value);
            const c = cats.find(cc => cc.id === e.target.value);
            if (c?.typical_unit) setQuantityUnit(c.typical_unit);
          }} className={input} required disabled={!group}>
            <option value="">{group ? 'Select a category' : 'Select tier first'}</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {/* Title + description */}
      <div>
        <label className="block text-xs text-zinc-400 mb-1">Title * <span className="text-zinc-600">(10–140 characters)</span></label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} required minLength={10} maxLength={140}
          placeholder={mode === 'sell' ? 'e.g. 5 MT secondary aluminium ADC-12 ingots, ex-Pune' : 'e.g. Looking for 2 MT NMC black mass, monthly contract'}
          className={input} />
      </div>
      <div>
        <label className="block text-xs text-zinc-400 mb-1">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={2000} rows={4}
          placeholder="Specifications, ISRI grade, delivery terms, any context buyers/sellers should know."
          className={input} />
      </div>

      {/* Quantity + price */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Quantity</label>
          <input type="number" step="0.01" min="0" value={quantityValue} onChange={e => setQuantityValue(e.target.value)}
            placeholder="e.g. 5" className={input} />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Unit</label>
          <input type="text" value={quantityUnit} onChange={e => setQuantityUnit(e.target.value)}
            placeholder="MT / kg / units" className={input} />
          {selectedCat?.typical_unit && (
            <p className="text-[10px] text-zinc-600 mt-1">Typical: {selectedCat.typical_unit}</p>
          )}
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Price per unit (INR)</label>
          <input type="number" step="1" min="0" value={priceInr} onChange={e => setPriceInr(e.target.value)}
            placeholder="Optional" className={input} />
        </div>
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">State *</label>
          <select value={locationState} onChange={e => setLocationState(e.target.value)} className={input} required>
            <option value="">Select state</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">City</label>
          <input type="text" value={locationCity} onChange={e => setLocationCity(e.target.value)}
            placeholder="e.g. Pune" className={input} />
        </div>
      </div>

      {/* Company */}
      <div>
        <label className="block text-xs text-zinc-400 mb-1">Company name <span className="text-zinc-600">(optional)</span></label>
        <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
          placeholder="Your company / facility name if applicable" className={input} />
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Your name *</label>
          <input type="text" value={submitterName} onChange={e => setSubmitterName(e.target.value)}
            required minLength={2} maxLength={120} className={input} />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Contact email *</label>
          <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)}
            required className={input} />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Contact phone</label>
          <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)}
            placeholder="+91 XXXXX XXXXX" className={input} />
        </div>
      </div>

      {/* Validity */}
      <div>
        <label className="block text-xs text-zinc-400 mb-1">Listing valid until</label>
        <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)}
          min={new Date().toISOString().slice(0, 10)} className={input + ' md:max-w-xs'} />
      </div>

      {/* Submit */}
      <div className="pt-4">
        <button type="submit" disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-6 py-3 text-sm font-semibold text-white transition-colors">
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : 'Submit for review'}
        </button>
      </div>
    </form>
  );
}
