import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Users, Network, Package, UserPlus, ArrowRight, Eye, MousePointerClick, Globe, Monitor } from 'lucide-react';
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

async function getVisitorStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [totalRes, todayRes, weekRes, topPagesRes, devicesRes] = await Promise.all([
    supabaseAdmin.from('page_views').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('page_views').select('id', { count: 'exact', head: true }).gte('viewed_at', todayStart),
    supabaseAdmin.from('page_views').select('visitor_id').gte('viewed_at', weekStart),
    supabaseAdmin.from('page_views').select('path').gte('viewed_at', weekStart),
    supabaseAdmin.from('page_views').select('device_type').gte('viewed_at', weekStart),
  ]);

  // Unique visitors this week
  const uniqueVisitorsWeek = new Set((weekRes.data ?? []).map(r => r.visitor_id)).size;

  // Top pages this week
  const pageCounts: Record<string, number> = {};
  for (const { path } of (topPagesRes.data ?? [])) {
    pageCounts[path] = (pageCounts[path] ?? 0) + 1;
  }
  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Device breakdown this week
  const deviceCounts: Record<string, number> = {};
  for (const { device_type } of (devicesRes.data ?? [])) {
    const d = device_type ?? 'unknown';
    deviceCounts[d] = (deviceCounts[d] ?? 0) + 1;
  }

  return {
    total: totalRes.count ?? 0,
    today: todayRes.count ?? 0,
    uniqueWeek: uniqueVisitorsWeek,
    topPages,
    deviceCounts,
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
  const [stats, recentRex, visitors] = await Promise.all([getStats(), getRecentRex(), getVisitorStats()]);

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

      {/* Website visitor analytics */}
      <div className={`${glass} p-6`}>
        <div className="flex items-center gap-2 mb-5">
          <Eye className="h-4 w-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-zinc-300">Website Visitors</h2>
          <span className="text-xs text-zinc-600 ml-1">(anonymous, cookie-based)</span>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total page views', value: visitors.total, icon: Eye, color: 'text-violet-400' },
            { label: 'Views today', value: visitors.today, icon: MousePointerClick, color: 'text-amber-400' },
            { label: 'Unique visitors (7d)', value: visitors.uniqueWeek, icon: Globe, color: 'text-sky-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-3.5 w-3.5 ${color}`} />
                <p className="text-xs text-zinc-500">{label}</p>
              </div>
              <p className={`text-2xl font-black ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Top pages */}
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Top pages (7d)</p>
            {visitors.topPages.length === 0 ? (
              <p className="text-xs text-zinc-700">No data yet.</p>
            ) : (
              <div className="space-y-2">
                {visitors.topPages.map(([path, count]) => (
                  <div key={path} className="flex items-center justify-between gap-3">
                    <span className="text-xs text-zinc-400 font-mono truncate">{path}</span>
                    <span className="text-xs font-semibold text-violet-400 shrink-0">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Device breakdown */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Monitor className="h-3.5 w-3.5 text-zinc-500" />
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Devices (7d)</p>
            </div>
            {Object.keys(visitors.deviceCounts).length === 0 ? (
              <p className="text-xs text-zinc-700">No data yet.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(visitors.deviceCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([device, count]) => (
                    <div key={device} className="flex items-center justify-between gap-3">
                      <span className="text-xs text-zinc-400 capitalize">{device}</span>
                      <span className="text-xs font-semibold text-emerald-400">{count}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
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
