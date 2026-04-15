'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Loader2, CheckCircle2, Recycle } from 'lucide-react';

const input = 'w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50';

const CATEGORIES = [
  'Computers & Laptops', 'Mobile Phones & Tablets', 'Batteries', 'Monitors & Displays',
  'Printers & Peripherals', 'Cables & Wiring', 'PCBs & Circuit Boards', 'UPS & Power Supply',
  'Networking Equipment', 'Home Appliances', 'Medical Equipment', 'Industrial Electronics',
  'Solar Panels & Inverters', 'Black Mass / Battery Waste', 'Other',
];

const CONDITIONS = [
  { value: 'working', label: 'Working' },
  { value: 'partially_working', label: 'Partially Working' },
  { value: 'non_working', label: 'Not Working' },
  { value: 'damaged', label: 'Damaged' },
];

interface Item {
  category_name: string;
  description: string;
  quantity: number;
  unit: string;
  estimated_weight_kg: number;
  condition: string;
}

export default function EWasteRequestPage() {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ request_no: string; id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    generator_name: '', generator_email: '', generator_phone: '',
    generator_company: '', generator_address: '', generator_city: '',
    generator_state: 'Tamil Nadu', generator_pincode: '',
    generator_type: 'individual' as string,
    preferred_date: '', preferred_time_slot: '' as string,
    access_instructions: '', notes: '',
  });

  const [items, setItems] = useState<Item[]>([{
    category_name: '', description: '', quantity: 1, unit: 'units',
    estimated_weight_kg: 0, condition: 'non_working',
  }]);

  const addItem = () => setItems(prev => [...prev, {
    category_name: '', description: '', quantity: 1, unit: 'units',
    estimated_weight_kg: 0, condition: 'non_working',
  }]);

  const updateItem = (idx: number, field: string, value: string | number) =>
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/ewaste/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, items: items.filter(i => i.category_name) }),
      });
      const data = await res.json();
      if (data.error) {
        setError(typeof data.error === 'string' ? data.error : 'Please fill all required fields.');
      } else {
        setResult(data);
      }
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6 py-20">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Pickup Scheduled!</h1>
          <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Your Tracking Number</p>
            <p className="text-3xl font-black text-emerald-400 mt-2">{result.request_no}</p>
          </div>
          <p className="text-sm text-zinc-400">
            A confirmation email has been sent. We&apos;ll assign a recycler and notify you with the pickup schedule.
          </p>
          <div className="flex flex-col gap-3">
            <Link href={`/ewaste/track/${result.id}`}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors">
              Track Your Request
            </Link>
            <Link href="/ewaste" className="text-sm text-zinc-500 hover:text-zinc-300">
              Back to E-Waste Collection
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/ewaste" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-6">
          <ArrowLeft className="h-3 w-3" /> Back to E-Waste Collection
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Recycle className="h-7 w-7 text-emerald-400" />
          <div>
            <h1 className="text-2xl font-bold">Schedule E-Waste Pickup</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Free doorstep collection — takes 2 minutes</p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 mb-6">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Your Details */}
          <section>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Your Details</h2>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Full Name *</label>
                  <input className={input} required value={form.generator_name} onChange={e => setForm(f => ({ ...f, generator_name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Type</label>
                  <select className={input} value={form.generator_type} onChange={e => setForm(f => ({ ...f, generator_type: e.target.value }))}>
                    <option value="individual">Individual</option>
                    <option value="business">Business</option>
                    <option value="institution">Institution</option>
                    <option value="government">Government</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Email *</label>
                  <input type="email" className={input} required value={form.generator_email} onChange={e => setForm(f => ({ ...f, generator_email: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Phone *</label>
                  <input type="tel" className={input} required value={form.generator_phone} onChange={e => setForm(f => ({ ...f, generator_phone: e.target.value }))} />
                </div>
              </div>
              {form.generator_type !== 'individual' && (
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Company / Organisation</label>
                  <input className={input} value={form.generator_company} onChange={e => setForm(f => ({ ...f, generator_company: e.target.value }))} />
                </div>
              )}
            </div>
          </section>

          {/* Pickup Location */}
          <section>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Pickup Location</h2>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Address *</label>
                <textarea className={`${input} resize-none`} rows={2} required value={form.generator_address} onChange={e => setForm(f => ({ ...f, generator_address: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">City *</label>
                  <input className={input} required value={form.generator_city} onChange={e => setForm(f => ({ ...f, generator_city: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">State</label>
                  <input className={input} value={form.generator_state} onChange={e => setForm(f => ({ ...f, generator_state: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Pincode</label>
                  <input className={input} value={form.generator_pincode} onChange={e => setForm(f => ({ ...f, generator_pincode: e.target.value }))} />
                </div>
              </div>
            </div>
          </section>

          {/* E-Waste Items */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">E-Waste Items</h2>
              <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300">
                <Plus className="h-3.5 w-3.5" /> Add Item
              </button>
            </div>
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Item {idx + 1}</span>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Category *</label>
                      <select className={input} required value={item.category_name} onChange={e => updateItem(idx, 'category_name', e.target.value)}>
                        <option value="">Select category...</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Condition</label>
                      <select className={input} value={item.condition} onChange={e => updateItem(idx, 'condition', e.target.value)}>
                        {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Description</label>
                    <input className={input} placeholder="e.g., 5 old Dell laptops, 2017 model" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Quantity</label>
                      <input type="number" min={1} className={input} value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Approx Weight (kg)</label>
                      <input type="number" min={0} className={input} value={item.estimated_weight_kg || ''} onChange={e => updateItem(idx, 'estimated_weight_kg', Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Schedule */}
          <section>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Preferred Schedule</h2>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Preferred Date</label>
                  <input type="date" className={input} value={form.preferred_date} onChange={e => setForm(f => ({ ...f, preferred_date: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Time Slot</label>
                  <select className={input} value={form.preferred_time_slot} onChange={e => setForm(f => ({ ...f, preferred_time_slot: e.target.value }))}>
                    <option value="">Any time</option>
                    <option value="morning">Morning (9 AM - 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                    <option value="evening">Evening (4 PM - 7 PM)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Access Instructions</label>
                <input className={input} placeholder="Gate code, floor number, landmark..." value={form.access_instructions} onChange={e => setForm(f => ({ ...f, access_instructions: e.target.value }))} />
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-4 text-base font-semibold text-white transition-colors disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Recycle className="h-5 w-5" />}
            Schedule Free Pickup
          </button>

          <p className="text-xs text-zinc-600 text-center">
            By submitting, you confirm the items listed are e-waste suitable for recycling.
            All waste is sent to CPCB-registered recyclers.
          </p>
        </form>
      </div>
    </div>
  );
}
