'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

const inputCls = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none transition-colors';
const label = 'block text-xs font-medium text-zinc-400 mb-1.5';
const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm p-6 space-y-5';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold text-zinc-300">{children}</h2>;
}

export default function EditEmployeePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    // Engagement fields
    role: '',
    department: '',
    reporting_manager: '',
    employment_type: '',
    rex_subtype: '',
    status: '',
    join_date: '',
    end_date: '',
    termination_type: '',
    termination_date: '',
    termination_reason: '',
    basic_salary: '',
    allowance: '',
    bonus: '',
    // Personal / rex_member fields
    full_name: '',
    phone: '',
    email: '',
    address: '',
    national_id: '',
    date_of_birth: '',
    bank_name: '',
    bank_account: '',
    bank_ifsc: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  const [hasRexMember, setHasRexMember] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/employees/${id}`);
        if (!res.ok) throw new Error('Failed to load employee');
        const { data } = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const member = data.rex_members as any;
        setHasRexMember(!!member);
        setForm({
          role: data.role ?? '',
          department: data.department ?? '',
          reporting_manager: data.reporting_manager ?? '',
          employment_type: data.employment_type ?? '',
          rex_subtype: data.rex_subtype ?? '',
          status: data.status ?? 'active',
          join_date: data.join_date ?? '',
          end_date: data.end_date ?? '',
          termination_type: data.termination_type ?? '',
          termination_date: data.termination_date ?? '',
          termination_reason: data.termination_reason ?? '',
          basic_salary: data.basic_salary != null ? String(data.basic_salary) : '',
          allowance: data.allowance != null ? String(data.allowance) : '',
          bonus: data.bonus != null ? String(data.bonus) : '',
          full_name: member?.full_name ?? data.full_name ?? '',
          phone: member?.phone ?? '',
          email: member?.email ?? '',
          address: member?.address ?? '',
          national_id: member?.national_id ?? '',
          date_of_birth: member?.date_of_birth ?? '',
          bank_name: member?.bank_name ?? '',
          bank_account: member?.bank_account ?? '',
          bank_ifsc: member?.bank_ifsc ?? '',
          emergency_contact_name: member?.emergency_contact_name ?? '',
          emergency_contact_phone: member?.emergency_contact_phone ?? '',
        });
      } catch {
        setError('Could not load employee.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const body: Record<string, unknown> = {
      role: form.role,
      department: form.department || null,
      reporting_manager: form.reporting_manager || null,
      employment_type: form.employment_type,
      rex_subtype: form.rex_subtype || null,
      status: form.status,
      join_date: form.join_date || null,
      end_date: form.end_date || null,
      basic_salary: form.basic_salary ? parseFloat(form.basic_salary) : null,
      allowance: form.allowance ? parseFloat(form.allowance) : null,
      bonus: form.bonus ? parseFloat(form.bonus) : null,
    };

    // Include personal fields if rex_member exists
    if (hasRexMember) {
      body.full_name = form.full_name;
      body.phone = form.phone || null;
      body.email = form.email || null;
      body.address = form.address || null;
      body.national_id = form.national_id || null;
      body.date_of_birth = form.date_of_birth || null;
      body.bank_name = form.bank_name || null;
      body.bank_account = form.bank_account || null;
      body.bank_ifsc = form.bank_ifsc || null;
      body.emergency_contact_name = form.emergency_contact_name || null;
      body.emergency_contact_phone = form.emergency_contact_phone || null;
    }

    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
      router.push(`/dashboard/hr/employees/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-zinc-400">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading employee...
      </div>
    );
  }

  const isRex = form.employment_type === 'rex_network';

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div>
        <Link href={`/dashboard/hr/employees/${id}`}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Employee
        </Link>
        <h1 className="text-2xl font-black text-white">Edit Engagement</h1>
        <p className="text-sm text-zinc-500 mt-1">Update engagement and personal details.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Engagement Details */}
        <div className={glass}>
          <SectionTitle>Engagement Details</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={label}>Employment Type *</label>
              <select name="employment_type" value={form.employment_type} onChange={handleChange} required className={inputCls}>
                <option value="full_time">Full-time</option>
                <option value="rex_network">REX Network</option>
                <option value="board_member">Board Member</option>
              </select>
            </div>
            {isRex && (
              <div>
                <label className={label}>REX Sub-type</label>
                <select name="rex_subtype" value={form.rex_subtype} onChange={handleChange} className={inputCls}>
                  <option value="">-- select --</option>
                  <option value="part_time">Part-time</option>
                  <option value="consultant">Consultant</option>
                  <option value="contract">Contract</option>
                  <option value="intern">Intern</option>
                </select>
              </div>
            )}
            <div>
              <label className={label}>Status *</label>
              <select name="status" value={form.status} onChange={handleChange} required className={inputCls}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            {(form.status === 'terminated' || form.status === 'completed') && (
              <>
                <div>
                  <label className={label}>Termination Type</label>
                  <select name="termination_type" value={form.termination_type} onChange={handleChange} className={inputCls}>
                    <option value="">Select…</option>
                    <option value="resignation">Resignation</option>
                    <option value="termination">Termination</option>
                    <option value="contract_end">Contract End</option>
                    <option value="retirement">Retirement</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={label}>Termination Date</label>
                  <input type="date" name="termination_date" value={form.termination_date} onChange={handleChange} className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className={label}>Termination Reason</label>
                  <textarea name="termination_reason" value={form.termination_reason} onChange={handleChange}
                    rows={2} placeholder="Reason for separation…" className={inputCls} />
                </div>
              </>
            )}
            <div>
              <label className={label}>Role / Designation *</label>
              <input type="text" name="role" value={form.role} onChange={handleChange}
                required placeholder="e.g. Process Engineer" className={inputCls} />
            </div>
            <div>
              <label className={label}>Department</label>
              <input type="text" name="department" value={form.department} onChange={handleChange}
                placeholder="e.g. Engineering" className={inputCls} />
            </div>
            <div>
              <label className={label}>Reporting Manager</label>
              <input type="text" name="reporting_manager" value={form.reporting_manager} onChange={handleChange}
                placeholder="Manager's name" className={inputCls} />
            </div>
            <div>
              <label className={label}>Join Date</label>
              <input type="date" name="join_date" value={form.join_date} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={label}>End Date</label>
              <input type="date" name="end_date" value={form.end_date} onChange={handleChange} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Salary */}
        <div className={glass}>
          <SectionTitle>Salary (INR / month)</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className={label}>Basic Salary</label>
              <input type="number" name="basic_salary" value={form.basic_salary} onChange={handleChange}
                min="0" step="0.01" placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className={label}>Allowance</label>
              <input type="number" name="allowance" value={form.allowance} onChange={handleChange}
                min="0" step="0.01" placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className={label}>Bonus</label>
              <input type="number" name="bonus" value={form.bonus} onChange={handleChange}
                min="0" step="0.01" placeholder="0.00" className={inputCls} />
            </div>
          </div>
        </div>

        {/* Personal Details */}
        {hasRexMember && (
          <>
            <div className={glass}>
              <SectionTitle>Personal Details</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className={label}>Full Name *</label>
                  <input type="text" name="full_name" value={form.full_name} onChange={handleChange}
                    required placeholder="As per official ID" className={inputCls} />
                </div>
                <div>
                  <label className={label}>Date of Birth</label>
                  <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label className={label}>Phone</label>
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                    placeholder="+91 00000 00000" className={inputCls} />
                </div>
                <div>
                  <label className={label}>Email</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange}
                    placeholder="member@example.com" className={inputCls} />
                </div>
                <div>
                  <label className={label}>National ID</label>
                  <input type="text" name="national_id" value={form.national_id} onChange={handleChange}
                    placeholder="Aadhaar / PAN / Passport" className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className={label}>Address</label>
                  <textarea name="address" value={form.address} onChange={handleChange}
                    rows={2} placeholder="Residential address" className={`${inputCls} resize-none`} />
                </div>
              </div>
            </div>

            <div className={glass}>
              <SectionTitle>Bank Details</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className={label}>Bank Name</label>
                  <input type="text" name="bank_name" value={form.bank_name} onChange={handleChange}
                    placeholder="e.g. State Bank of India" className={inputCls} />
                </div>
                <div>
                  <label className={label}>Account Number</label>
                  <input type="text" name="bank_account" value={form.bank_account} onChange={handleChange}
                    placeholder="Account number" className={inputCls} />
                </div>
                <div>
                  <label className={label}>IFSC Code</label>
                  <input type="text" name="bank_ifsc" value={form.bank_ifsc} onChange={handleChange}
                    placeholder="e.g. SBIN0001234" className={inputCls} />
                </div>
              </div>
            </div>

            <div className={glass}>
              <SectionTitle>Emergency Contact</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={label}>Contact Name</label>
                  <input type="text" name="emergency_contact_name" value={form.emergency_contact_name} onChange={handleChange}
                    placeholder="Full name" className={inputCls} />
                </div>
                <div>
                  <label className={label}>Contact Phone</label>
                  <input type="tel" name="emergency_contact_phone" value={form.emergency_contact_phone} onChange={handleChange}
                    placeholder="+91 00000 00000" className={inputCls} />
                </div>
              </div>
            </div>
          </>
        )}

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 px-6 py-2.5 text-sm font-semibold text-white transition-colors">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href={`/dashboard/hr/employees/${id}`}
            className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-6 py-2.5 text-sm font-semibold text-zinc-300 hover:border-zinc-600 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
