'use client';

import { useEffect, useState } from 'react';
import {
  Building2, MapPin, FileText, Phone, Landmark, Save, Loader2, CheckCircle2,
} from 'lucide-react';

interface CompanySettings {
  name: string;
  short_name: string;
  address_line1: string;
  address_line2: string;
  cin: string;
  gstin: string;
  pan: string;
  tan: string;
  email: string;
  procurement_email: string;
  noreply_email: string;
  phone: string;
  website: string;
  bank_name: string;
  bank_account: string;
  bank_ifsc: string;
  bank_branch: string;
  upi_id: string;
  fy_start_month: number;
}

const EMPTY: CompanySettings = {
  name: '', short_name: '',
  address_line1: '', address_line2: '',
  cin: '', gstin: '', pan: '', tan: '',
  email: '', procurement_email: '', noreply_email: '',
  phone: '', website: '',
  bank_name: '', bank_account: '', bank_ifsc: '', bank_branch: '',
  upi_id: '', fy_start_month: 4,
};

function Field({ label, name, value, onChange, span = 1 }: {
  label: string; name: string; value: string; onChange: (n: string, v: string) => void; span?: number;
}) {
  return (
    <div className={span === 2 ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
      <input
        name={name}
        value={value}
        onChange={e => onChange(name, e.target.value)}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-colors"
      />
    </div>
  );
}

function Section({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
          <Icon className="h-4 w-4 text-rose-400" />
        </div>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [form, setForm] = useState<CompanySettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings/company')
      .then(r => r.json())
      .then(d => { if (d && !d.error) setForm(d); })
      .finally(() => setLoading(false));
  }, []);

  const set = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Company Settings</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Manage company details used across invoices, reports, and emails
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save Changes'}
        </button>
      </div>

      {/* Company Identity */}
      <Section icon={Building2} title="Company Identity">
        <Field label="Full Legal Name" name="name" value={form.name} onChange={set} span={2} />
        <Field label="Short / Trading Name" name="short_name" value={form.short_name} onChange={set} />
        <Field label="Website" name="website" value={form.website} onChange={set} />
      </Section>

      {/* Address */}
      <Section icon={MapPin} title="Registered Address">
        <Field label="Address Line 1" name="address_line1" value={form.address_line1} onChange={set} span={2} />
        <Field label="Address Line 2" name="address_line2" value={form.address_line2} onChange={set} span={2} />
      </Section>

      {/* Statutory / Tax */}
      <Section icon={FileText} title="Statutory & Tax Details">
        <Field label="CIN" name="cin" value={form.cin} onChange={set} />
        <Field label="GSTIN" name="gstin" value={form.gstin} onChange={set} />
        <Field label="PAN" name="pan" value={form.pan} onChange={set} />
        <Field label="TAN" name="tan" value={form.tan} onChange={set} />
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">FY Start Month</label>
          <select
            value={form.fy_start_month}
            onChange={e => set('fy_start_month', e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-colors"
          >
            {['January','February','March','April','May','June','July','August','September','October','November','December']
              .map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
        </div>
      </Section>

      {/* Contact */}
      <Section icon={Phone} title="Contact Details">
        <Field label="Sales Email" name="email" value={form.email} onChange={set} />
        <Field label="Procurement Email" name="procurement_email" value={form.procurement_email} onChange={set} />
        <Field label="No-Reply Email" name="noreply_email" value={form.noreply_email} onChange={set} />
        <Field label="Phone" name="phone" value={form.phone} onChange={set} />
      </Section>

      {/* Bank */}
      <Section icon={Landmark} title="Bank Details">
        <Field label="Bank Name" name="bank_name" value={form.bank_name} onChange={set} span={2} />
        <Field label="Account Number" name="bank_account" value={form.bank_account} onChange={set} />
        <Field label="IFSC Code" name="bank_ifsc" value={form.bank_ifsc} onChange={set} />
        <Field label="Branch" name="bank_branch" value={form.bank_branch} onChange={set} />
        <Field label="UPI ID" name="upi_id" value={form.upi_id} onChange={set} />
      </Section>
    </div>
  );
}
