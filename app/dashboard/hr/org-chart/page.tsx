import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Users, Building2 } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const ROLE_COLORS: Record<string, string> = {
  'CEO': 'border-amber-500/40 bg-amber-500/5',
  'Director': 'border-indigo-500/40 bg-indigo-500/5',
  'Manager': 'border-sky-500/40 bg-sky-500/5',
  'Lead': 'border-emerald-500/40 bg-emerald-500/5',
  'default': 'border-zinc-700 bg-zinc-800/30',
};

function getRoleColor(role: string): string {
  for (const [key, cls] of Object.entries(ROLE_COLORS)) {
    if (key !== 'default' && role.toLowerCase().includes(key.toLowerCase())) return cls;
  }
  return ROLE_COLORS.default;
}

const TYPE_BADGE: Record<string, { cls: string; label: string }> = {
  'full-time': { cls: 'bg-emerald-500/10 text-emerald-400', label: 'Full-time' },
  'rex_network': { cls: 'bg-rose-500/10 text-rose-400', label: 'REX' },
  'board_member': { cls: 'bg-indigo-500/10 text-indigo-400', label: 'Board' },
  'part-time': { cls: 'bg-sky-500/10 text-sky-400', label: 'Part-time' },
  'consultant': { cls: 'bg-amber-500/10 text-amber-400', label: 'Consultant' },
  'contract': { cls: 'bg-orange-500/10 text-orange-400', label: 'Contract' },
  'intern': { cls: 'bg-pink-500/10 text-pink-400', label: 'Intern' },
};

export default async function OrgChartPage() {
  const { data: employees } = await supabaseAdmin
    .from('employees')
    .select('id, full_name, role, department, employment_type, employment_subtype, status')
    .eq('status', 'active')
    .order('department')
    .order('role');

  const list = employees ?? [];

  // Group by department
  const departments = new Map<string, typeof list>();
  for (const emp of list) {
    const dept = emp.department ?? 'Unassigned';
    if (!departments.has(dept)) departments.set(dept, []);
    departments.get(dept)!.push(emp);
  }

  // Find leadership (CEO, Directors, Board)
  const leadership = list.filter(e =>
    e.role?.toLowerCase().includes('ceo') ||
    e.role?.toLowerCase().includes('director') ||
    e.employment_type === 'board_member'
  );

  const deptEntries = Array.from(departments.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="p-5 md:p-8 space-y-8">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Organisation Chart</h1>
          <p className="mt-0.5 text-sm text-zinc-500">{list.length} active members &middot; {departments.size} departments</p>
        </div>
      </div>

      {/* Leadership row */}
      {leadership.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">Leadership</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            {leadership.map(emp => {
              const badge = TYPE_BADGE[emp.employment_type] ?? TYPE_BADGE[emp.employment_subtype ?? ''] ?? null;
              return (
                <div key={emp.id} className={`rounded-xl border-2 ${getRoleColor(emp.role ?? '')} p-5 text-center min-w-[160px]`}>
                  <div className="h-12 w-12 rounded-full bg-zinc-800 border-2 border-zinc-600 flex items-center justify-center mx-auto mb-3">
                    <span className="text-lg font-bold text-white">
                      {emp.full_name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white">{emp.full_name}</p>
                  <p className="text-xs text-amber-400 font-medium mt-0.5">{emp.role}</p>
                  {badge && (
                    <span className={`inline-block mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
                      {badge.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {/* Connector line */}
          <div className="flex justify-center my-4">
            <div className="w-0.5 h-8 bg-zinc-700" />
          </div>
        </div>
      )}

      {/* Department cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deptEntries.map(([dept, members]) => (
          <div key={dept} className={glass}>
            <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-800/60">
              <Building2 className="h-4 w-4 text-zinc-500" />
              <h3 className="text-sm font-semibold text-white">{dept}</h3>
              <span className="text-[10px] text-zinc-600 bg-zinc-800 rounded-full px-2 py-0.5 ml-auto">{members.length}</span>
            </div>
            <div className="divide-y divide-zinc-800/40">
              {members.map(emp => {
                const badge = TYPE_BADGE[emp.employment_type] ?? TYPE_BADGE[emp.employment_subtype ?? ''] ?? null;
                return (
                  <div key={emp.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-zinc-400">
                        {emp.full_name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{emp.full_name}</p>
                      <p className="text-xs text-zinc-500">{emp.role ?? 'Team Member'}</p>
                    </div>
                    {badge && (
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${badge.cls}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
