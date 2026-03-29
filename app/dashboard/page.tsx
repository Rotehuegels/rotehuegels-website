import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Users, Network, Package, UserPlus, ArrowRight } from 'lucide-react';
import Link from 'next/link';

async function getStats() {
  const [rex, suppliers, employees] = await Promise.all([
    supabaseAdmin.from('rex_members').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('suppliers').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('employees').select('*', { count: 'exact', head: true }),
  ]);
  return {
    rex: rex.count ?? 0,
    suppliers: suppliers.count ?? 0,
    employees: employees.count ?? 0,
  };
}

async function getRecentRex() {
  const { data } = await supabaseAdmin
    .from('rex_members')
    .select('rex_id, full_name, member_type, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  return data ?? [];
}

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

export default async function DashboardPage() {
  const [stats, recentRex] = await Promise.all([getStats(), getRecentRex()]);

  const statCards = [
    { label: 'REX Members', value: stats.rex, icon: Network, href: '/dashboard/rex', color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { label: 'Employees', value: stats.employees, icon: Users, href: '/dashboard/hr/employees', color: 'text-sky-400', bg: 'bg-sky-500/10' },
    { label: 'Suppliers', value: stats.suppliers, icon: Package, href: '/dashboard/suppliers', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  const typeLabel: Record<string, string> = {
    student: 'Student', professional: 'Professional',
    academic: 'Academic', enthusiast: 'Enthusiast',
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">Rotehügels internal management portal</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {statCards.map(({ label, value, icon: Icon, href, color, bg }) => (
          <Link key={label} href={href}
            className={`${glass} p-6 flex items-center justify-between hover:border-zinc-700 transition-colors`}>
            <div>
              <p className="text-sm text-zinc-500">{label}</p>
              <p className={`text-4xl font-black mt-1 ${color}`}>{value}</p>
            </div>
            <div className={`${bg} rounded-xl p-3`}>
              <Icon className={`h-6 w-6 ${color}`} />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className={`${glass} p-6`}>
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/hr/add"
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 transition-colors">
            <UserPlus className="h-4 w-4" /> Add Employee
          </Link>
          <Link href="/dashboard/rex"
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:border-zinc-600 transition-colors">
            <Network className="h-4 w-4" /> View REX Members
          </Link>
        </div>
      </div>

      {/* Recent REX registrations */}
      <div className={`${glass} p-6`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-zinc-300">Recent REX registrations</h2>
          <Link href="/dashboard/rex" className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {recentRex.length === 0 ? (
          <p className="text-sm text-zinc-600">No registrations yet.</p>
        ) : (
          <div className="divide-y divide-zinc-800">
            {recentRex.map((m) => (
              <div key={m.rex_id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-white">{m.full_name}</p>
                  <p className="text-xs text-zinc-500 font-mono">{m.rex_id}</p>
                </div>
                <span className="text-xs rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-zinc-400">
                  {typeLabel[m.member_type] ?? m.member_type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
