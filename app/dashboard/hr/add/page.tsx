'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Status = 'idle' | 'loading' | 'error';

const inputCls = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-rose-400/60 focus:ring-1 focus:ring-rose-400/30';
const selectCls = `${inputCls} cursor-pointer`;
const labelCls = 'block text-xs font-medium text-zinc-400 mb-1.5';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}{required && <span className="text-rose-400 ml-0.5">*</span>}</label>
      {children}
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

export default function AddEmployeePage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [empType, setEmpType] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

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
        setErrorMsg(firstErr);
        setStatus('error');
        return;
      }

      router.push('/dashboard/hr/employees');
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/dashboard/hr/employees" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          ← Back to Employees
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-white">Add Employee</h1>
        <p className="mt-1 text-sm text-zinc-400">Register a new team member into the system.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SectionTitle>Basic Information</SectionTitle>

        <div className="col-span-full">
          <Field label="Full name" required>
            <input name="full_name" required className={inputCls} placeholder="As per official ID" />
          </Field>
        </div>

        <Field label="Employment type" required>
          <select name="employment_type" required defaultValue="" className={selectCls}
            onChange={(e) => setEmpType(e.target.value)}>
            <option value="" disabled>Select…</option>
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="consultant">Consultant</option>
            <option value="contract">Contract</option>
            <option value="intern">Intern</option>
          </select>
        </Field>

        {empType === 'intern' ? (
          <Field label="REX ID" required>
            <input name="rex_id" required className={inputCls} placeholder="REX Network ID (mandatory for interns)"
              pattern="[A-Za-z0-9\-]+" title="Enter a valid REX ID" />
            <p className="mt-1 text-xs text-zinc-500">Interns must be registered in the REX Network. Their REX ID becomes their Employee ID.</p>
          </Field>
        ) : (
          <div /> /* keeps grid alignment */
        )}

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

        <SectionTitle>Contact Details</SectionTitle>

        <Field label="Phone">
          <input name="phone" type="tel" className={inputCls} placeholder="+91 00000 00000" />
        </Field>

        <Field label="Email">
          <input name="email" type="email" className={inputCls} placeholder="employee@example.com" />
        </Field>

        <div className="col-span-full">
          <Field label="Address">
            <textarea name="address" rows={2} className={`${inputCls} resize-none`} placeholder="Residential address" />
          </Field>
        </div>

        <SectionTitle>Identity</SectionTitle>

        <div className="col-span-full">
          <Field label="National ID (Aadhaar / PAN / Passport)">
            <input name="national_id" className={inputCls} placeholder="ID number" />
          </Field>
        </div>

        <SectionTitle>Bank Details</SectionTitle>

        <Field label="Bank name">
          <input name="bank_name" className={inputCls} placeholder="e.g. State Bank of India" />
        </Field>

        <Field label="Account number">
          <input name="bank_account" className={inputCls} placeholder="Account number" />
        </Field>

        <Field label="IFSC code">
          <input name="bank_ifsc" className={inputCls} placeholder="e.g. SBIN0001234" />
        </Field>

        <SectionTitle>Emergency Contact</SectionTitle>

        <Field label="Contact name">
          <input name="emergency_contact_name" className={inputCls} placeholder="Full name" />
        </Field>

        <Field label="Contact phone">
          <input name="emergency_contact_phone" type="tel" className={inputCls} placeholder="+91 00000 00000" />
        </Field>

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

        {/* Error */}
        {errorMsg && (
          <div className="col-span-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {errorMsg}
          </div>
        )}

        <div className="col-span-full flex gap-3 pt-2">
          <button type="submit" disabled={status === 'loading'}
            className="rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {status === 'loading' ? 'Saving…' : 'Add Employee'}
          </button>
          <Link href="/dashboard/hr/employees"
            className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-6 py-2.5 text-sm font-semibold text-zinc-300 hover:border-zinc-600 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
