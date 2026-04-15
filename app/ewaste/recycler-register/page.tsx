'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Recycle, Loader2, CheckCircle2, Upload } from 'lucide-react';

const input = 'w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50';

const EWASTE_CATEGORIES = [
  'Computers & Laptops', 'Mobile Phones & Tablets', 'Batteries (Li-ion, Lead-acid, NiMH)',
  'Monitors & Displays (CRT, LCD, LED)', 'Printers & Peripherals', 'Cables & Wiring (Copper, Data)',
  'PCBs & Circuit Boards', 'UPS & Power Supply Units', 'Networking Equipment',
  'Home Appliances (AC, Fridge, Washing Machine)', 'Medical Equipment', 'Industrial Electronics (PLCs, Drives)',
  'Solar Panels & Inverters', 'Black Mass / Battery Waste', 'E-Waste Mixed / Unsorted',
];

export default function RecyclerRegisterPage() {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ recycler_code: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    company_name: '', contact_person: '', email: '', phone: '',
    address: '', city: '', state: '', pincode: '',
    gstin: '', cpcb_registration: '', spcb_registration: '',
    license_valid_until: '', capabilities: [] as string[],
    capacity_per_month: '', service_radius_km: 100,
    notes: '',
  });

  const toggleCategory = (cat: string) => {
    setForm(f => ({
      ...f,
      capabilities: f.capabilities.includes(cat)
        ? f.capabilities.filter(c => c !== cat)
        : [...f.capabilities, cat],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.capabilities.length === 0) { setError('Select at least one e-waste category'); return; }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/ewaste/recyclers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) {
        setError(typeof data.error === 'string' ? data.error : 'Please fill all required fields.');
      } else {
        setResult(data);
      }
    } catch { setError('Failed to submit. Please try again.'); }
    finally { setSubmitting(false); }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6 py-20">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Registration Submitted!</h1>
          <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Your Recycler Code</p>
            <p className="text-3xl font-black text-emerald-400 mt-2">{result.recycler_code}</p>
          </div>
          <p className="text-sm text-zinc-400">
            Your registration is under review. We will verify your CPCB/SPCB credentials
            and activate your account once approved. You&apos;ll receive a confirmation email.
          </p>
          <Link href="/ewaste" className="inline-block text-sm text-zinc-500 hover:text-zinc-300">
            Back to E-Waste Collection
          </Link>
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

        <div className="flex items-center gap-3 mb-2">
          <Recycle className="h-7 w-7 text-emerald-400" />
          <h1 className="text-2xl font-bold">Register as E-Waste Recycler</h1>
        </div>
        <p className="text-sm text-zinc-500 mb-8">
          Join the Roteh&uuml;gels network of registered recyclers. CPCB/SPCB registration required.
        </p>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 mb-6">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company Details */}
          <section>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Company Details</h2>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Company Name *</label>
                  <input className={input} required value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Contact Person *</label>
                  <input className={input} required value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Email *</label>
                  <input type="email" className={input} required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Phone *</label>
                  <input type="tel" className={input} required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">GSTIN</label>
                <input className={input} placeholder="33XXXXXXXXX1ZX" value={form.gstin} onChange={e => setForm(f => ({ ...f, gstin: e.target.value }))} />
              </div>
            </div>
          </section>

          {/* Address */}
          <section>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Recycling Facility Address</h2>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Address *</label>
                <textarea className={`${input} resize-none`} rows={2} required value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">City *</label>
                  <input className={input} required value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">State *</label>
                  <input className={input} required value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Pincode</label>
                  <input className={input} value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} />
                </div>
              </div>
            </div>
          </section>

          {/* Regulatory */}
          <section>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Regulatory Credentials</h2>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
              <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3 text-xs text-amber-400">
                CPCB or SPCB registration is mandatory for e-waste recycling in India. Your credentials will be verified before activation.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">CPCB Registration No. *</label>
                  <input className={input} required placeholder="Central Pollution Control Board" value={form.cpcb_registration} onChange={e => setForm(f => ({ ...f, cpcb_registration: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">SPCB Registration No.</label>
                  <input className={input} placeholder="State Pollution Control Board" value={form.spcb_registration} onChange={e => setForm(f => ({ ...f, spcb_registration: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">License Valid Until</label>
                  <input type="date" className={input} value={form.license_valid_until} onChange={e => setForm(f => ({ ...f, license_valid_until: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Processing Capacity</label>
                  <input className={input} placeholder="e.g., 500 MT/month" value={form.capacity_per_month} onChange={e => setForm(f => ({ ...f, capacity_per_month: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Service Radius (km)</label>
                <input type="number" className={input} value={form.service_radius_km} onChange={e => setForm(f => ({ ...f, service_radius_km: Number(e.target.value) }))} />
              </div>
            </div>
          </section>

          {/* E-Waste Categories */}
          <section>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
              E-Waste Categories You Accept *
            </h2>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
              <p className="text-xs text-zinc-500 mb-4">Select all categories your facility can process. We&apos;ll match waste generators to you based on these.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {EWASTE_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`text-left rounded-xl px-4 py-2.5 text-sm transition-colors ${
                      form.capabilities.includes(cat)
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-zinc-800/40 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {form.capabilities.length > 0 && (
                <p className="text-xs text-emerald-400 mt-3">{form.capabilities.length} categories selected</p>
              )}
            </div>
          </section>

          {/* Additional Info */}
          <section>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Additional Information</h2>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
              <textarea className={`${input} resize-none`} rows={3} placeholder="Certifications, specializations, processing methods, previous experience..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </section>

          {/* Compliance notice */}
          <div className="rounded-xl bg-zinc-800/40 border border-zinc-700 p-4 text-xs text-zinc-500 space-y-2">
            <p><strong className="text-zinc-400">Compliance Notice:</strong></p>
            <p>By registering, you confirm that your facility holds valid CPCB/SPCB authorization for e-waste recycling under the E-Waste (Management) Rules, 2022.</p>
            <p>All waste received through Roteh&uuml;gels will be fully traceable. You agree to provide processing certificates and maintain records as required by law.</p>
            <p>Delivery/transportation charges to your facility will be borne by you (the recycler).</p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-4 text-base font-semibold text-white transition-colors disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Recycle className="h-5 w-5" />}
            Submit Registration
          </button>
        </form>
      </div>
    </div>
  );
}
