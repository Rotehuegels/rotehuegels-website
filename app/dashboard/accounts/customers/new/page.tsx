'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const input = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none transition-colors';
const label = 'block text-xs font-medium text-zinc-400 mb-1.5';
const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm p-6 space-y-5';
const sectionTitle = 'text-sm font-semibold text-zinc-300 mb-4';

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '', gstin: '', pan: '',
    contact_person: '', email: '', phone: '', state: '', state_code: '', notes: '',
    billing_line1: '', billing_line2: '', billing_city: '', billing_state: '', billing_pincode: '',
    shipping_same: true,
    shipping_line1: '', shipping_line2: '', shipping_city: '', shipping_state: '', shipping_pincode: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setForm(f => ({ ...f, [name]: val }));

    // Auto-fill state from GSTIN
    if (name === 'gstin' && typeof value === 'string' && value.length >= 2) {
      const stateMap: Record<string, [string, string]> = {
        '33': ['Tamil Nadu', '33'], '27': ['Maharashtra', '27'],
        '07': ['Delhi', '07'],     '29': ['Karnataka', '29'],
        '32': ['Kerala', '32'],    '36': ['Telangana', '36'],
        '37': ['Andhra Pradesh', '37'], '24': ['Gujarat', '24'],
        '06': ['Haryana', '06'],   '09': ['Uttar Pradesh', '09'],
        '20': ['Jharkhand', '20'], '10': ['Bihar', '10'],
        '21': ['Odisha', '21'],    '19': ['West Bengal', '19'],
      };
      const code = value.slice(0, 2);
      if (stateMap[code]) {
        setForm(f => ({ ...f, state: stateMap[code][0], state_code: stateMap[code][1] }));
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const body = {
      name:           form.name,
      gstin:          form.gstin || undefined,
      pan:            form.pan || undefined,
      contact_person: form.contact_person || undefined,
      email:          form.email || undefined,
      phone:          form.phone || undefined,
      state:          form.state || undefined,
      state_code:     form.state_code || undefined,
      notes:          form.notes || undefined,
      billing_address: {
        line1:   form.billing_line1,
        line2:   form.billing_line2 || undefined,
        city:    form.billing_city,
        state:   form.billing_state,
        pincode: form.billing_pincode || undefined,
      },
      shipping_address: form.shipping_same ? undefined : {
        line1:   form.shipping_line1,
        line2:   form.shipping_line2 || undefined,
        city:    form.shipping_city,
        state:   form.shipping_state,
        pincode: form.shipping_pincode || undefined,
      },
    };

    try {
      const res = await fetch('/api/accounts/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data.error));
      router.push(`/dashboard/accounts/customers/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create customer.');
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Add Customer</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Customer ID will be auto-generated (CUST-NNN)</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className={glass}>
          <h2 className={sectionTitle}>Customer Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className={label}>Company / Customer Name *</label>
              <input type="text" name="name" value={form.name} onChange={handleChange}
                required placeholder="e.g. India Zinc Ltd" className={input} />
            </div>
            <div>
              <label className={label}>GSTIN</label>
              <input type="text" name="gstin" value={form.gstin} onChange={handleChange}
                placeholder="22AAAAA0000A1Z5" className={`${input} uppercase`} maxLength={15} />
            </div>
            <div>
              <label className={label}>PAN</label>
              <input type="text" name="pan" value={form.pan} onChange={handleChange}
                placeholder="AAAAA0000A" className={`${input} uppercase`} maxLength={10} />
            </div>
            <div>
              <label className={label}>State</label>
              <input type="text" name="state" value={form.state} onChange={handleChange}
                placeholder="Auto-filled from GSTIN" className={input} />
            </div>
            <div>
              <label className={label}>State Code</label>
              <input type="text" name="state_code" value={form.state_code} onChange={handleChange}
                placeholder="e.g. 33" className={input} maxLength={2} />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className={glass}>
          <h2 className={sectionTitle}>Contact Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={label}>Contact Person</label>
              <input type="text" name="contact_person" value={form.contact_person} onChange={handleChange}
                placeholder="Mr. / Ms. Name" className={input} />
            </div>
            <div>
              <label className={label}>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="accounts@company.com" className={input} />
            </div>
            <div>
              <label className={label}>Phone</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                placeholder="+91 98765 43210" className={input} />
            </div>
          </div>
        </div>

        {/* Billing Address */}
        <div className={glass}>
          <h2 className={sectionTitle}>Billing Address</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className={label}>Address Line 1 *</label>
              <input type="text" name="billing_line1" value={form.billing_line1} onChange={handleChange}
                required placeholder="Door no., Street" className={input} />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Address Line 2</label>
              <input type="text" name="billing_line2" value={form.billing_line2} onChange={handleChange}
                placeholder="Area, Locality" className={input} />
            </div>
            <div>
              <label className={label}>City *</label>
              <input type="text" name="billing_city" value={form.billing_city} onChange={handleChange}
                required placeholder="City" className={input} />
            </div>
            <div>
              <label className={label}>State *</label>
              <input type="text" name="billing_state" value={form.billing_state} onChange={handleChange}
                required placeholder="State" className={input} />
            </div>
            <div>
              <label className={label}>Pincode</label>
              <input type="text" name="billing_pincode" value={form.billing_pincode} onChange={handleChange}
                placeholder="600001" maxLength={6} className={input} />
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className={glass}>
          <h2 className={sectionTitle}>Shipping Address</h2>
          <div className="flex items-center gap-3 mb-4">
            <input type="checkbox" id="shipping_same" name="shipping_same"
              checked={form.shipping_same}
              onChange={e => setForm(f => ({ ...f, shipping_same: e.target.checked }))}
              className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500" />
            <label htmlFor="shipping_same" className="text-sm text-zinc-300">Same as billing address</label>
          </div>
          {!form.shipping_same && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className={label}>Address Line 1 *</label>
                <input type="text" name="shipping_line1" value={form.shipping_line1} onChange={handleChange}
                  required placeholder="Door no., Street" className={input} />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Address Line 2</label>
                <input type="text" name="shipping_line2" value={form.shipping_line2} onChange={handleChange}
                  placeholder="Area, Locality" className={input} />
              </div>
              <div>
                <label className={label}>City *</label>
                <input type="text" name="shipping_city" value={form.shipping_city} onChange={handleChange}
                  required placeholder="City" className={input} />
              </div>
              <div>
                <label className={label}>State *</label>
                <input type="text" name="shipping_state" value={form.shipping_state} onChange={handleChange}
                  required placeholder="State" className={input} />
              </div>
              <div>
                <label className={label}>Pincode</label>
                <input type="text" name="shipping_pincode" value={form.shipping_pincode} onChange={handleChange}
                  placeholder="600001" maxLength={6} className={input} />
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className={glass}>
          <h2 className={sectionTitle}>Notes</h2>
          <textarea name="notes" value={form.notes} onChange={handleChange}
            rows={3} placeholder="Any notes about this customer…"
            className={`${input} resize-none`} />
        </div>

        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading}
            className="rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50 transition-colors">
            {loading ? 'Saving…' : 'Save Customer'}
          </button>
          <a href="/dashboard/accounts/customers"
            className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-6 py-2.5 text-sm font-semibold text-zinc-300 hover:border-zinc-600 transition-colors">
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
