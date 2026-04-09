import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const TYPE_LABEL: Record<string, string> = {
  full_time:  'Full-time',
  part_time:  'Part-time',
  consultant: 'Consultant',
  contract:   'Contract',
  intern:     'Intern',
};

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  inactive: 'bg-zinc-500/10 text-zinc-400 border-zinc-600/20',
  terminated: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default async function EmployeesPage() {
  const { data: employees } = await supabaseAdmin
    .from('employees')
    .select('id, employee_code, full_name, role, department, employment_type, email, status, join_date')
    .order('created_at', { ascending: false });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Employees</h1>
          <p className="mt-1 text-sm text-zinc-400">{employees?.length ?? 0} total</p>
        </div>
        <Link href="/dashboard/hr/add"
          className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 transition-colors">
          <UserPlus className="h-4 w-4" /> Add Employee
        </Link>
      </div>

      <div className={glass}>
        {!employees || employees.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-zinc-500 text-sm">No employees yet.</p>
            <Link href="/dashboard/hr/add"
              className="mt-4 inline-block rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 transition-colors">
              Add your first employee
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left">
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Emp ID</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">Department</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Type</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold text-indigo-400 bg-indigo-500/10 rounded px-1.5 py-0.5">
                        {emp.employee_code ?? '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{emp.full_name}</p>
                      {emp.email && <p className="text-xs text-zinc-500 mt-0.5">{emp.email}</p>}
                    </td>
                    <td className="px-6 py-4 text-zinc-300">{emp.role}</td>
                    <td className="px-6 py-4 text-zinc-400 hidden md:table-cell">{emp.department ?? '—'}</td>
                    <td className="px-6 py-4 text-zinc-400 hidden lg:table-cell">{TYPE_LABEL[emp.employment_type] ?? emp.employment_type}</td>
                    <td className="px-6 py-4 text-zinc-400 hidden lg:table-cell">
                      {emp.join_date ? new Date(emp.join_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[emp.status] ?? STATUS_STYLE.inactive}`}>
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
