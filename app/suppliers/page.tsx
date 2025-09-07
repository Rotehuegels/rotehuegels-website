// app/suppliers/page.tsx
'use client';

import React, { useState } from 'react';

type FormState = {
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  country: string;
  website: string;
  product_categories: string;
  certifications?: string;
  notes?: string;
};

export default function SuppliersPage() {
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState<null | boolean>(null);
  const [msg, setMsg] = useState<string>('');

  const [form, setForm] = useState<FormState>({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    country: '',
    website: '',
    product_categories: '',
    certifications: '',
    notes: '',
  });

  const update =
    (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((s) => ({ ...s, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setOk(null);
    setMsg('');

    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          product_service: form.product_categories,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setOk(false);
        setMsg(data?.error || 'Submission failed');
      } else {
        setOk(true);
        setMsg('Thanks! Your details were submitted.');
        setForm({
          company_name: '',
          contact_person: '',
          email: '',
          phone: '',
          country: '',
          website: '',
          product_categories: '',
          certifications: '',
          notes: '',
        });
      }
    } catch (err: any) {
      setOk(false);
      setMsg(err?.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-12">
      <section className="py-8">
        <h1 className="text-3xl font-bold">Supplier Registration</h1>
        <p className="text-zinc-300 mt-2">
          Share your details to collaborate with Rotehügel Research Business Consultancy Private Limited.
        </p>
      </section>

      <form onSubmit={onSubmit} className="grid gap-6 max-w-2xl">
        <div className="grid gap-2">
          <label className="text-sm">Company Name *</label>
          <input className="rounded-lg bg-zinc-900 border border-zinc-800 p-3" value={form.company_name} onChange={update('company_name')} required />
        </div>

        <div className="grid gap-2">
          <label className="text-sm">Contact Person *</label>
          <input className="rounded-lg bg-zinc-900 border border-zinc-800 p-3" value={form.contact_person} onChange={update('contact_person')} required />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <label className="text-sm">Email *</label>
            <input type="email" className="rounded-lg bg-zinc-900 border border-zinc-800 p-3" value={form.email} onChange={update('email')} required />
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Phone</label>
            <input className="rounded-lg bg-zinc-900 border border-zinc-800 p-3" value={form.phone} onChange={update('phone')} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <label className="text-sm">Country</label>
            <input className="rounded-lg bg-zinc-900 border border-zinc-800 p-3" value={form.country} onChange={update('country')} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Website</label>
            <input className="rounded-lg bg-zinc-900 border border-zinc-800 p-3" value={form.website} onChange={update('website')} placeholder="https://..." />
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm">Product Categories *</label>
          <input className="rounded-lg bg-zinc-900 border border-zinc-800 p-3" value={form.product_categories} onChange={update('product_categories')} placeholder="e.g., SX/EW equipment; Reagents" required />
        </div>

        <div className="grid gap-2">
          <label className="text-sm">Certifications</label>
          <input className="rounded-lg bg-zinc-900 border border-zinc-800 p-3" value={form.certifications} onChange={update('certifications')} placeholder="ISO 9001, ISO 14001" />
        </div>

        <div className="grid gap-2">
          <label className="text-sm">Notes</label>
          <textarea className="rounded-lg bg-zinc-900 border border-zinc-800 p-3 min-h-28" value={form.notes} onChange={update('notes')} />
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
            {submitting ? 'Submitting…' : 'Submit'}
          </button>

          {ok === true && <span className="text-green-400">{msg}</span>}
          {ok === false && <span className="text-rose-400">{msg}</span>}
        </div>
      </form>
    </div>
  );
}