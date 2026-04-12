'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Network, Search } from 'lucide-react';

type Status = 'idle' | 'loading' | 'error';

const inputCls = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-rose-400/60 focus:ring-1 focus:ring-rose-400/30';
const selectCls = `${inputCls} cursor-pointer`;
const labelCls = 'block text-xs font-medium text-zinc-400 mb-1.5';

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}{required && <span className="text-rose-400 ml-0.5">*</span>}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-full pt-2">
      <h2 className="text-sm font-semibold text-zinc-300 border-b border-zinc-800 pb-2">{children}</h2>
    </div>
  );
}

type RexMember = {
  full_name: string; phone?: string; email?: string; address?: string;
  national_id?: string; bank_name?: string; bank_account?: string; bank_ifsc?: string;
  emergency_contact_name?: string; emergency_contact_phone?: string; date_of_birth?: string;
};

export default function AddEngagementPage() {
  const router = useRouter();
  const [status, setStatus]         = useState<Status>('idle');
  const [errorMsg, setError]        = useState('');
  const [empType, setEmpType]       = useState('');
  const [rexId, setRexId]           = useState('');
  const [existingMember, setExisting] = useState<RexMember | null>(null);
  const [lookupDone, setLookupDone] = useState(false);

  const isRex         = empType === 'rex_network';
  const isFullTime    = empType === 'full_time';
  const isBoardMember = empType === 'board_member';

  async function lookupRex() {
    if (!rexId.trim()) return;
    const res = await fetch(`/api/rex-members/${encodeURIComponent(rexId.trim().toUpperCase())}`);
    if (res.ok) {
      const { data } = await res.json();
      setExisting(data ?? null);
    } else {
      setExisting(null);
    }
    setLookupDone(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setError('');

    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {};
    fd.forEach((val, key) => { if (val !== '') body[key] = val; });

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        const firstErr = typeof data.error === 'string'
          ? data.error
          : Object.values(data.error as Record<string, string[]>)[0]?.[0] ?? 'Something went wrong.';
        setError(firstErr);
        setStatus('error');
        return;
      }

      router.push('/dashboard/hr/employees');
    } catch {
      setError('Network error. Please try again.');
      setStatus('error');
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/d/employees" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          ← Back to Engagements
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-white">New Engagement</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Look up the REX member first — if they exist, personal details are pre-filled. Full-time and REX Network engagements get an auto-assigned ENG-YY-NNN ID. Board members do not.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* ── REX ID lookup ─────────────────────────────────────── */}
        <SectionTitle>REX Member</SectionTitle>

        <div className="col-span-full">
          <Field label="REX Network ID" required={!isBoardMember} hint={isBoardMember ? "Optional for board members." : "Lookup fetches existing member details. If new, fill in details below."}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Network className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400 pointer-events-none" />
                <input
                  name="rex_id"
                  required={!isBoardMember}
                  value={rexId}
                  onChange={e => { setRexId(e.target.value); setLookupDone(false); setExisting(null); }}
                  className={`${inputCls} pl-9`}
                  placeholder="e.g. REX-2847"
                  pattern="[A-Za-z0-9\-]+"
                />
              </div>
              <button type="button" onClick={lookupRex}
                className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-2.5 text-sm font-medium text-indigo-300 hover:bg-indigo-500/20 transition-colors">
                <Search className="h-3.5 w-3.5" /> Lookup
              </button>
            </div>
          </Field>
          {lookupDone && existingMember && (
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-xs text-emerald-300">
              <span className="font-semibold">Existing member:</span> {existingMember.full_name} — personal details pre-filled.
            </div>
          )}
          {lookupDone && !existingMember && (
            <div className="mt-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-300">
              New REX member — fill in personal details below.
            </div>
          )}
        </div>

        {/* ── Personal details ─────────────────────────────────── */}
        <SectionTitle>Personal Details</SectionTitle>

        <div className="col-span-full">
          <Field label="Full name" required>
            <input name="full_name" required className={inputCls} placeholder="As per official ID"
              defaultValue={existingMember?.full_name ?? ''} key={existingMember?.full_name} />
          </Field>
        </div>

        <Field label="Date of birth">
          <input name="date_of_birth" type="date" className={`${inputCls} [color-scheme:dark]`}
            defaultValue={existingMember?.date_of_birth ?? ''} key={existingMember?.date_of_birth} />
        </Field>

        <Field label="Phone">
          <input name="phone" type="tel" className={inputCls} placeholder="+91 00000 00000"
            defaultValue={existingMember?.phone ?? ''} key={existingMember?.phone} />
        </Field>

        <Field label="Email">
          <input name="email" type="email" className={inputCls} placeholder="member@example.com"
            defaultValue={existingMember?.email ?? ''} key={existingMember?.email} />
        </Field>

        <div className="col-span-full">
          <Field label="Address">
            <textarea name="address" rows={2} className={`${inputCls} resize-none`} placeholder="Residential address"
              defaultValue={existingMember?.address ?? ''} key={existingMember?.address} />
          </Field>
        </div>

        <div className="col-span-full">
          <Field label="National ID (Aadhaar / PAN / Passport)">
            <input name="national_id" className={inputCls} placeholder="ID number"
              defaultValue={existingMember?.national_id ?? ''} key={existingMember?.national_id} />
          </Field>
        </div>

        <SectionTitle>Bank Details</SectionTitle>

        <Field label="Bank name">
          <input name="bank_name" className={inputCls} placeholder="e.g. State Bank of India"
            defaultValue={existingMember?.bank_name ?? ''} key={existingMember?.bank_name} />
        </Field>

        <Field label="Account number">
          <input name="bank_account" className={inputCls} placeholder="Account number"
            defaultValue={existingMember?.bank_account ?? ''} key={existingMember?.bank_account} />
        </Field>

        <Field label="IFSC code">
          <input name="bank_ifsc" className={inputCls} placeholder="e.g. SBIN0001234"
            defaultValue={existingMember?.bank_ifsc ?? ''} key={existingMember?.bank_ifsc} />
        </Field>

        <SectionTitle>Emergency Contact</SectionTitle>

        <Field label="Contact name">
          <input name="emergency_contact_name" className={inputCls} placeholder="Full name"
            defaultValue={existingMember?.emergency_contact_name ?? ''} key={existingMember?.emergency_contact_name} />
        </Field>

        <Field label="Contact phone">
          <input name="emergency_contact_phone" type="tel" className={inputCls} placeholder="+91 00000 00000"
            defaultValue={existingMember?.emergency_contact_phone ?? ''} key={existingMember?.emergency_contact_phone} />
        </Field>

        {/* ── Engagement details ────────────────────────────────── */}
        <SectionTitle>Engagement Details</SectionTitle>

        <Field label="Employment type" required>
          <select name="employment_type" required defaultValue="" className={selectCls}
            onChange={(e) => setEmpType(e.target.value)}>
            <option value="" disabled>Select…</option>
            <option value="full_time">Full-time</option>
            <option value="rex_network">REX Network</option>
            <option value="board_member">Board Member</option>
          </select>
        </Field>

        {isRex ? (
          <Field label="REX Sub-type" required>
            <select name="rex_subtype" required defaultValue="" className={selectCls}>
              <option value="" disabled>Select…</option>
              <option value="part_time">Part-time</option>
              <option value="consultant">Consultant</option>
              <option value="contract">Contract</option>
              <option value="intern">Intern</option>
            </select>
          </Field>
        ) : isFullTime ? (
          <div className="flex items-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3 text-xs text-indigo-300 self-end mb-0.5">
            <Network className="h-4 w-4 shrink-0" />
            Full-time engagement · Engagement ID auto-assigned as ENG-YY-NNN
          </div>
        ) : isBoardMember ? (
          <div className="flex items-center gap-2 rounded-xl border border-zinc-600/30 bg-zinc-800/40 px-4 py-3 text-xs text-zinc-400 self-end mb-0.5">
            <Network className="h-4 w-4 shrink-0" />
            Board member · No engagement ID assigned
          </div>
        ) : <div />}

        <Field label="Join date">
          <input name="join_date" type="date" defaultValue={new Date().toISOString().split('T')[0]}
            className={`${inputCls} [color-scheme:dark]`} />
        </Field>

        <Field label="Role / Designation" required>
          <input name="role" required className={inputCls} placeholder="e.g. Process Engineer" />
        </Field>

        <Field label="Department">
          <input name="department" className={inputCls} placeholder="e.g. Engineering" />
        </Field>

        <div className="col-span-full">
          <Field label="Reporting manager">
            <input name="reporting_manager" className={inputCls} placeholder="Manager's name" />
          </Field>
        </div>

        <SectionTitle>Salary (INR / month)</SectionTitle>

        <Field label="Basic salary">
          <input name="basic_salary" type="number" min="0" className={inputCls} placeholder="0.00" />
        </Field>

        <Field label="Allowance">
          <input name="allowance" type="number" min="0" className={inputCls} placeholder="0.00" />
        </Field>

        <Field label="Bonus">
          <input name="bonus" type="number" min="0" className={inputCls} placeholder="0.00" />
        </Field>

        {errorMsg && (
          <div className="col-span-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {errorMsg}
          </div>
        )}

        <div className="col-span-full flex gap-3 pt-2">
          <button type="submit" disabled={status === 'loading'}
            className="rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {status === 'loading' ? 'Saving…' : 'Create Engagement'}
          </button>
          <Link href="/d/employees"
            className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-6 py-2.5 text-sm font-semibold text-zinc-300 hover:border-zinc-600 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
