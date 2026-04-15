'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Recycle, Plus, Trash2, Loader2, CheckCircle2, Send } from 'lucide-react';

const input = 'w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50';

const CATEGORIES = [
  'Computers & Laptops', 'Mobile Phones & Tablets', 'Batteries (Li-ion)',
  'Batteries (Lead-acid)', 'Monitors & Displays', 'Printers & Peripherals',
  'Cables & Copper Wiring', 'PCBs & Circuit Boards', 'UPS & Power Supply',
  'Networking Equipment', 'Home Appliances', 'Industrial Electronics',
  'Solar Panels & Inverters', 'Mixed E-Waste', 'Other',
];

interface Item { category: string; quantity: number; condition: string; description: string; }

export default function EWasteQuotePage() {
  const [items, setItems] = useState<Item[]>([{ category: '', quantity: 1, condition: 'non_working', description: '' }]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('individual');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const addItem = () => setItems(prev => [...prev, { category: '', quantity: 1, condition: 'non_working', description: '' }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string | number) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const validItems = items.filter(i => i.category);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validItems.length === 0) { setError('Add at least one e-waste item'); return; }
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/ewaste/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generator_name: name,
          generator_email: email,
          generator_phone: phone,
          generator_city: city,
          generator_type: type,
          generator_address: city, // minimal — we'll get full address later
          generator_state: 'India',
          source: 'quote_request',
          notes: 'Quote request — not a collection request. Contact to provide pricing.',
          items: validItems.map(i => ({
            category_name: i.category,
            quantity: i.quantity,
            condition: i.condition,
            description: i.description,
            unit: 'units',
          })),
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(typeof data.error === 'string' ? data.error : 'Please fill all required fields.');
      } else {
        setSubmitted(true);
      }
    } catch { setError('Failed to submit.'); }
    finally { setSubmitting(false); }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6 py-20">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Request Received!</h1>
          <p className="text-sm text-zinc-400">
            We&apos;ve received your e-waste details. Our team will check with registered recyclers
            in your area and get back to you with a quote within 24-48 hours.
          </p>
          <Link href="/ewaste" className="inline-block text-sm text-zinc-500 hover:text-zinc-300">
            &larr; Back to E-Waste Recycling
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/ewaste" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-6">
          <ArrowLeft className="h-3 w-3" /> Back to E-Waste Recycling
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Recycle className="h-7 w-7 text-emerald-400" />
          <h1 className="text-2xl font-bold">Get a Quote for Your E-Waste</h1>
        </div>
        <p className="text-sm text-zinc-500 mb-8">
          Tell us what you have — we&apos;ll check with our recycler network and get back with actual pricing.
          No commitment, no obligation.
        </p>

        {error && <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Your Details */}
          <section>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Your Details</h2>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Name *</label>
                  <input className={input} required value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Type</label>
                  <select className={input} value={type} onChange={e => setType(e.target.value)}>
                    <option value="individual">Individual / Home</option>
                    <option value="business">Business / Office</option>
                    <option value="institution">Institution / School</option>
                    <option value="government">Government</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Email *</label>
                  <input type="email" className={input} required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Phone *</label>
                  <input type="tel" className={input} required value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">City *</label>
                  <input className={input} required value={city} onChange={e => setCity(e.target.value)} />
                </div>
              </div>
            </div>
          </section>

          {/* E-Waste Items */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">What Do You Have?</h2>
              <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300">
                <Plus className="h-3.5 w-3.5" /> Add Item
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Item {idx + 1}</span>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="text-red-400/60 hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Category *</label>
                      <select className={input} required value={item.category} onChange={e => updateItem(idx, 'category', e.target.value)}>
                        <option value="">Select...</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Quantity</label>
                      <input type="number" min={1} className={input} value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Condition</label>
                      <select className={input} value={item.condition} onChange={e => updateItem(idx, 'condition', e.target.value)}>
                        <option value="working">Working</option>
                        <option value="partially_working">Partially Working</option>
                        <option value="non_working">Not Working</option>
                        <option value="damaged">Damaged</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Description (optional)</label>
                    <input className={input} placeholder="e.g., 5 Dell laptops 2018 model, 10 old UPS batteries..." value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <button type="submit" disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-4 text-base font-semibold text-white transition-colors disabled:opacity-50">
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            Request Quote
          </button>

          <p className="text-xs text-zinc-600 text-center">
            No commitment. We&apos;ll check with recyclers in your area and respond within 24-48 hours.
            Roteh&uuml;gels is a digital facilitator — we do not physically handle e-waste.
          </p>
        </form>
      </div>
    </div>
  );
}
