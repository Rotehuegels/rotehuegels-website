import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const TYPE_LABEL: Record<string, string> = {
  full_time:    'Full-time',
  rex_network:  'REX Network',
  board_member: 'Board Member',
};

const SUBTYPE_LABEL: Record<string, string> = {
  part_time:  'Part-time',
  consultant: 'Consultant',
  contract:   'Contract',
  intern:     'Intern',
};

const STATUS_STYLE: Record<string, string> = {
  active:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  inactive:   'bg-zinc-500/10 text-zinc-400 border-zinc-600/20',
  terminated: 'bg-red-500/10 text-red-400 border-red-500/20',
  completed:  'bg-sky-500/10 text-sky-400 border-sky-500/20',
};

export default async function EmployeesPage() {
  const { data: engagements } = await supabaseAdmin
    .from('employees')
    .select('id, engagement_id, rex_id, full_name, role, department, employment_type, rex_subtype, status, join_date, end_date, rex_members(full_name, email)')
    .order('created_at', { ascending: true });

  const staff = (engagements ?? []).filter(e => e.employment_type !== 'board_member');
  const board = (engagements ?? []).filter(e => e.employment_type === 'board_member');

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Engagements</h1>
          <p className="mt-1 text-sm text-zinc-400">{staff.length} staff · {board.length} board</p>
        </div>
        <Link href="/dashboard/hr/add"
          className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 transition-colors">
          <UserPlus className="h-4 w-4" /> Add Engagement
        </Link>
      </div>

      {/* Staff */}
      <div className={glass}>
        <div className="border-b border-zinc-800 px-5 py-3">
          <h2 className="font-semibold text-white text-sm">Staff Engagements</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Full-time and REX Network members</p>
        </div>
        <EngagementTable engagements={staff} emptyMsg="No staff engagements yet." />
      </div>

      {/* Board */}
      <div className={glass}>
        <div className="border-b border-zinc-800 px-5 py-3">
          <h2 className="font-semibold text-white text-sm">Board of Directors</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Shareholders & directors · 50% each · excluded from payroll runs</p>
        </div>
        <EngagementTable engagements={board} emptyMsg="No board members." boardSection />
      </div>
    </div>
  );
}

function EngagementTable({
  engagements,
  emptyMsg,
  boardSection = false,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  engagements: any[];
  emptyMsg: string;
  boardSection?: boolean;
}) {
  if (engagements.length === 0) {
    return (
      <div className="p-10 text-center">
        <p className="text-zinc-500 text-sm">{emptyMsg}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left">
            <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
              {boardSection ? 'RBC ID' : 'Engagement ID'}
            </th>
            {!boardSection && (
              <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">REX ID</th>
            )}
            <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Role</th>
            <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">Department</th>
            {!boardSection && (
              <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Type</th>
            )}
            <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Joined</th>
            <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60">
          {engagements.map((eng) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const member = eng.rex_members as any;
            const name   = member?.full_name ?? eng.full_name ?? '—';
            return (
              <tr key={eng.id} className="hover:bg-zinc-800/20 transition-colors">
                <td className="px-6 py-4">
                  <span className={`font-mono text-xs font-semibold rounded px-1.5 py-0.5 ${
                    boardSection
                      ? 'text-violet-400 bg-violet-500/10'
                      : 'text-amber-400 bg-amber-500/10'
                  }`}>
                    {eng.engagement_id ?? '—'}
                  </span>
                </td>
                {!boardSection && (
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-semibold text-indigo-400 bg-indigo-500/10 rounded px-1.5 py-0.5">
                      {eng.rex_id ?? '—'}
                    </span>
                  </td>
                )}
                <td className="px-6 py-4">
                  <p className="font-medium text-white">{name}</p>
                  {member?.email && <p className="text-xs text-zinc-500 mt-0.5">{member.email}</p>}
                </td>
                <td className="px-6 py-4 text-zinc-300">{eng.role}</td>
                <td className="px-6 py-4 text-zinc-400 hidden md:table-cell">{eng.department ?? '—'}</td>
                {!boardSection && (
                  <td className="px-6 py-4 text-zinc-400 hidden lg:table-cell">
                    <p>{TYPE_LABEL[eng.employment_type] ?? eng.employment_type}</p>
                    {eng.rex_subtype && (
                      <p className="text-xs text-indigo-400 mt-0.5">{SUBTYPE_LABEL[eng.rex_subtype] ?? eng.rex_subtype}</p>
                    )}
                  </td>
                )}
                <td className="px-6 py-4 text-zinc-400 hidden lg:table-cell">
                  {eng.join_date ? new Date(eng.join_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  {eng.end_date && (
                    <p className="text-xs text-zinc-600 mt-0.5">
                      → {new Date(eng.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[eng.status] ?? STATUS_STYLE.inactive}`}>
                    {eng.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
