import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Users, Building2, Crown, ShieldCheck } from 'lucide-react';
import AssignButton from './AssignButton';

export const dynamic = 'force-dynamic';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

type Position = {
  id: string;
  title: string;
  short_title: string | null;
  department_id: string | null;
  reports_to_id: string | null;
  is_head: boolean;
  level: number;
  sort_order: number;
  filled_by_employee_id: string | null;
};

type Employee = {
  id: string;
  full_name: string;
  email: string | null;
  department: string | null;
  status: string | null;
};

type Department = {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  sort_order: number;
};

const initials = (name?: string | null) =>
  (name ?? '?').split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join('');

export default async function OrgChartPage() {
  const [{ data: positions }, { data: employees }, { data: departments }] = await Promise.all([
    supabaseAdmin.from('positions').select('*').eq('active', true).order('sort_order'),
    // ilike not eq — production data has 'ACTIVE' (uppercase) while older code wrote 'active'.
    supabaseAdmin.from('employees').select('id, full_name, email, department, status').ilike('status', 'active').order('full_name'),
    supabaseAdmin.from('departments').select('*').eq('active', true).order('sort_order'),
  ]);

  const allPos: Position[] = (positions ?? []) as Position[];
  const allEmp: Employee[] = (employees ?? []) as Employee[];
  const allDept: Department[] = (departments ?? []) as Department[];

  const empById = new Map(allEmp.map((e) => [e.id, e]));
  const posById = new Map(allPos.map((p) => [p.id, p]));

  // Resolve effective approver: walk reports_to_id until a filled position is found.
  function resolveApprover(positionId: string | null): { positionId: string | null; employee: Employee | null } {
    let cur = positionId ? posById.get(positionId) : null;
    let guard = 0;
    while (cur && guard < 20) {
      if (cur.filled_by_employee_id) {
        const emp = empById.get(cur.filled_by_employee_id) ?? null;
        return { positionId: cur.id, employee: emp };
      }
      cur = cur.reports_to_id ? posById.get(cur.reports_to_id) ?? null : null;
      guard++;
    }
    return { positionId: null, employee: null };
  }

  const ceo  = allPos.find((p) => p.id === 'ceo');
  const cxos = allPos.filter((p) => p.level === 1).sort((a, b) => a.sort_order - b.sort_order);

  // Heads grouped by their reports_to (CEO direct or one of the CXOs)
  const headsByParent = new Map<string, Position[]>();
  for (const p of allPos.filter((x) => x.level === 2)) {
    const k = p.reports_to_id ?? 'orphan';
    if (!headsByParent.has(k)) headsByParent.set(k, []);
    headsByParent.get(k)!.push(p);
  }
  for (const arr of headsByParent.values()) arr.sort((a, b) => a.sort_order - b.sort_order);

  // Assistants by head_id
  const asstsByHead = new Map<string, Position[]>();
  for (const p of allPos.filter((x) => x.level === 3)) {
    const k = p.reports_to_id ?? 'orphan';
    if (!asstsByHead.has(k)) asstsByHead.set(k, []);
    asstsByHead.get(k)!.push(p);
  }

  const filledCount = allPos.filter((p) => p.filled_by_employee_id).length;
  const vacantCount = allPos.length - filledCount;

  return (
    <div className="p-5 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-indigo-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Organisation Chart</h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              {allDept.filter((d) => d.id !== 'executive').length} departments &middot; {allPos.length} positions ·{' '}
              <span className="text-emerald-400">{filledCount} filled</span> ·{' '}
              <span className="text-amber-400">{vacantCount} vacant</span>
            </p>
          </div>
        </div>
        <p className="text-xs text-zinc-500 max-w-md text-right">
          Vacant positions cascade approvals to the next filled position up the reporting chain.
        </p>
      </div>

      {/* CEO */}
      {ceo && (
        <div className="flex flex-col items-center">
          <PositionCard position={ceo} employee={ceo.filled_by_employee_id ? empById.get(ceo.filled_by_employee_id) ?? null : null} employees={allEmp} resolveApprover={resolveApprover} accent="amber" />
          <div className="w-0.5 h-6 bg-zinc-700" />
        </div>
      )}

      {/* CXOs row */}
      {cxos.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cxos.map((p) => (
              <div key={p.id} className="flex flex-col items-center">
                <PositionCard position={p} employee={p.filled_by_employee_id ? empById.get(p.filled_by_employee_id) ?? null : null} employees={allEmp} resolveApprover={resolveApprover} accent="indigo" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Department panels — each panel groups by its CXO parent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...cxos, ceo!].filter(Boolean).map((parent) => {
          const heads = headsByParent.get(parent.id) ?? [];
          if (heads.length === 0) return null;
          return (
            <div key={parent.id} className={glass}>
              <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-800/60">
                <ShieldCheck className="h-4 w-4 text-zinc-500" />
                <h3 className="text-sm font-semibold text-white">Reports to {parent.short_title ?? parent.title}</h3>
                <span className="text-[10px] text-zinc-600 ml-auto">{heads.length} departments</span>
              </div>
              <div className="p-4 space-y-3">
                {heads.map((head) => {
                  const dept = head.department_id ? allDept.find((d) => d.id === head.department_id) : null;
                  const headEmp = head.filled_by_employee_id ? empById.get(head.filled_by_employee_id) ?? null : null;
                  const assts = asstsByHead.get(head.id) ?? [];
                  return (
                    <div key={head.id} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
                      <div className="flex items-start gap-2 mb-2">
                        <Building2 className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-zinc-200">{dept?.name ?? head.title}</p>
                          {dept?.description && <p className="text-[11px] text-zinc-500 mt-0.5">{dept.description}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <PositionCard position={head} employee={headEmp} employees={allEmp} resolveApprover={resolveApprover} accent="emerald" compact />
                        {assts.map((a) => (
                          <PositionCard key={a.id}
                            position={a}
                            employee={a.filled_by_employee_id ? empById.get(a.filled_by_employee_id) ?? null : null}
                            employees={allEmp}
                            resolveApprover={resolveApprover}
                            accent="zinc"
                            compact
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PositionCard({
  position, employee, employees, resolveApprover, accent, compact = false,
}: {
  position: Position;
  employee: Employee | null;
  employees: Employee[];
  resolveApprover: (id: string | null) => { positionId: string | null; employee: Employee | null };
  accent: 'amber' | 'indigo' | 'emerald' | 'zinc';
  compact?: boolean;
}) {
  const accentCls: Record<string, string> = {
    amber:   'border-amber-500/40 bg-amber-500/5',
    indigo:  'border-indigo-500/40 bg-indigo-500/5',
    emerald: 'border-emerald-500/30 bg-emerald-500/5',
    zinc:    'border-zinc-700 bg-zinc-900/40',
  };
  const titleCls: Record<string, string> = {
    amber:   'text-amber-300',
    indigo:  'text-indigo-300',
    emerald: 'text-emerald-300',
    zinc:    'text-zinc-400',
  };

  const isVacant = !employee;
  const cascade  = isVacant ? resolveApprover(position.reports_to_id) : null;

  return (
    <div className={`rounded-xl border-2 ${accentCls[accent]} ${compact ? 'p-3' : 'p-4'} text-center relative`}>
      {position.id === 'ceo' && (
        <Crown className="h-4 w-4 text-amber-400 absolute top-2 right-2" />
      )}
      <div className={`${compact ? 'h-9 w-9' : 'h-12 w-12'} rounded-full ${isVacant ? 'bg-zinc-900 border-2 border-dashed border-zinc-700' : 'bg-zinc-800 border-2 border-zinc-600'} flex items-center justify-center mx-auto ${compact ? 'mb-2' : 'mb-3'}`}>
        <span className={`${compact ? 'text-xs' : 'text-base'} font-bold ${isVacant ? 'text-zinc-600' : 'text-white'}`}>
          {isVacant ? '—' : initials(employee?.full_name)}
        </span>
      </div>

      <p className={`${compact ? 'text-[11px]' : 'text-xs'} font-semibold ${titleCls[accent]} ${compact ? '' : 'mb-1'}`}>
        {position.short_title ?? position.title}
      </p>

      {employee ? (
        <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-white truncate`}>{employee.full_name}</p>
      ) : (
        <p className={`${compact ? 'text-[11px]' : 'text-xs'} text-zinc-600 italic`}>Vacant</p>
      )}

      {isVacant && cascade?.employee && (
        <p className={`mt-1 ${compact ? 'text-[10px]' : 'text-[11px]'} text-zinc-600`}>
          Approvals → {cascade.employee.full_name}
        </p>
      )}

      <div className={`${compact ? 'mt-2' : 'mt-3'}`}>
        <AssignButton positionId={position.id} currentEmployeeId={employee?.id ?? null} employees={employees} />
      </div>
    </div>
  );
}
