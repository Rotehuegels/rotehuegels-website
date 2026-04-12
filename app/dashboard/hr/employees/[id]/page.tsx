import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Briefcase, CreditCard, Phone, Mail, MapPin, Calendar, Pencil, Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  inactive: 'bg-zinc-500/10 text-zinc-400 border-zinc-600/20',
  terminated: 'bg-red-500/10 text-red-400 border-red-500/20',
  completed: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
};

const TYPE_LABEL: Record<string, string> = {
  full_time: 'Full-time',
  rex_network: 'REX Network',
  board_member: 'Board Member',
};

const SUBTYPE_LABEL: Record<string, string> = {
  part_time: 'Part-time',
  consultant: 'Consultant',
  contract: 'Contract',
  intern: 'Intern',
};

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: eng, error } = await supabaseAdmin
    .from('employees')
    .select('*, rex_members(full_name, email, phone, address, national_id, date_of_birth, bank_name, bank_account, bank_ifsc, emergency_contact_name, emergency_contact_phone)')
    .eq('id', id)
    .single();

  if (error || !eng) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const member = eng.rex_members as any;
  const name = member?.full_name ?? eng.full_name ?? 'Unknown';

  const totalSalary = (eng.basic_salary ?? 0) + (eng.allowance ?? 0) + (eng.bonus ?? 0);

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <Link href="/d/employees"
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Engagements
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              {eng.engagement_id && (
                <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                  eng.employment_type === 'board_member'
                    ? 'text-violet-400 bg-violet-500/10'
                    : 'text-amber-400 bg-amber-500/10'
                }`}>
                  {eng.engagement_id}
                </span>
              )}
              {eng.rex_id && (
                <span className="font-mono text-xs font-semibold text-indigo-400 bg-indigo-500/10 rounded px-2 py-0.5">
                  {eng.rex_id}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-white">{name}</h1>
            <p className="text-sm text-zinc-400 mt-0.5">{eng.role}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href={`/d/employees/${id}/edit`}
              className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-600 transition-colors">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Link>
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLE[eng.status] ?? STATUS_STYLE.inactive}`}>
              {eng.status}
            </span>
          </div>
        </div>
      </div>

      {/* Engagement Details */}
      <div className={`${glass} p-6`}>
        <h2 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-amber-400" /> Engagement Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-zinc-500">Employment Type</p>
            <p className="text-sm text-zinc-200 mt-0.5">{TYPE_LABEL[eng.employment_type] ?? eng.employment_type}</p>
            {eng.rex_subtype && (
              <p className="text-xs text-indigo-400 mt-0.5">{SUBTYPE_LABEL[eng.rex_subtype] ?? eng.rex_subtype}</p>
            )}
          </div>
          {eng.department && (
            <div>
              <p className="text-xs text-zinc-500">Department</p>
              <p className="text-sm text-zinc-200 mt-0.5">{eng.department}</p>
            </div>
          )}
          {eng.reporting_manager && (
            <div>
              <p className="text-xs text-zinc-500">Reporting Manager</p>
              <p className="text-sm text-zinc-200 mt-0.5">{eng.reporting_manager}</p>
            </div>
          )}
          {eng.join_date && (
            <div>
              <p className="text-xs text-zinc-500">Date of Joining</p>
              <p className="text-sm text-zinc-200 mt-0.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                {fmtDate(eng.join_date)}
              </p>
            </div>
          )}
          {eng.end_date && (
            <div>
              <p className="text-xs text-zinc-500">End Date</p>
              <p className="text-sm text-zinc-200 mt-0.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                {fmtDate(eng.end_date)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Details */}
      {member && (
        <div className={`${glass} p-6`}>
          <h2 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-amber-400" /> Personal Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {member.date_of_birth && (
              <div>
                <p className="text-xs text-zinc-500">Date of Birth</p>
                <p className="text-sm text-zinc-200 mt-0.5">{fmtDate(member.date_of_birth)}</p>
              </div>
            )}
            {member.email && (
              <div>
                <p className="text-xs text-zinc-500">Email</p>
                <p className="text-sm text-zinc-200 mt-0.5 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-zinc-500" />
                  {member.email}
                </p>
              </div>
            )}
            {member.phone && (
              <div>
                <p className="text-xs text-zinc-500">Phone</p>
                <p className="text-sm text-zinc-200 mt-0.5 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-zinc-500" />
                  {member.phone}
                </p>
              </div>
            )}
            {member.address && (
              <div className="sm:col-span-2">
                <p className="text-xs text-zinc-500">Address</p>
                <p className="text-sm text-zinc-300 mt-0.5 flex items-start gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-zinc-500 shrink-0 mt-0.5" />
                  {member.address}
                </p>
              </div>
            )}
            {member.national_id && (
              <div>
                <p className="text-xs text-zinc-500">National ID</p>
                <p className="text-sm font-mono text-zinc-200 mt-0.5">{member.national_id}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Salary */}
      {totalSalary > 0 && (
        <div className={`${glass} p-6`}>
          <h2 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-amber-400" /> Salary (Monthly)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-zinc-500">Basic</p>
              <p className="text-sm font-semibold text-zinc-200 mt-0.5">{fmt(eng.basic_salary ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Allowance</p>
              <p className="text-sm font-semibold text-zinc-200 mt-0.5">{fmt(eng.allowance ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Bonus</p>
              <p className="text-sm font-semibold text-zinc-200 mt-0.5">{fmt(eng.bonus ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Total CTC</p>
              <p className="text-sm font-bold text-amber-400 mt-0.5">{fmt(totalSalary)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bank Details */}
      {member && (member.bank_name || member.bank_account) && (
        <div className={`${glass} p-6`}>
          <h2 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-amber-400" /> Bank Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {member.bank_name && (
              <div>
                <p className="text-xs text-zinc-500">Bank Name</p>
                <p className="text-sm text-zinc-200 mt-0.5">{member.bank_name}</p>
              </div>
            )}
            {member.bank_account && (
              <div>
                <p className="text-xs text-zinc-500">Account Number</p>
                <p className="text-sm font-mono text-zinc-200 mt-0.5">{member.bank_account}</p>
              </div>
            )}
            {member.bank_ifsc && (
              <div>
                <p className="text-xs text-zinc-500">IFSC Code</p>
                <p className="text-sm font-mono text-zinc-200 mt-0.5">{member.bank_ifsc}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Emergency Contact */}
      {member && (member.emergency_contact_name || member.emergency_contact_phone) && (
        <div className={`${glass} p-6`}>
          <h2 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-400" /> Emergency Contact
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {member.emergency_contact_name && (
              <div>
                <p className="text-xs text-zinc-500">Contact Name</p>
                <p className="text-sm text-zinc-200 mt-0.5">{member.emergency_contact_name}</p>
              </div>
            )}
            {member.emergency_contact_phone && (
              <div>
                <p className="text-xs text-zinc-500">Contact Phone</p>
                <p className="text-sm text-zinc-200 mt-0.5 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-zinc-500" />
                  {member.emergency_contact_phone}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Meta */}
      <div className="flex items-center gap-4 text-[10px] text-zinc-600">
        {eng.created_at && <span>Created {fmtDate(eng.created_at)}</span>}
      </div>
    </div>
  );
}
