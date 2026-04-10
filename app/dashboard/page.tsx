import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  Users, Network, Package, UserPlus, ArrowRight, Eye,
  MousePointerClick, Globe, Monitor, ReceiptText, Wallet,
  Briefcase, AlertCircle, Clock, CheckCircle2, Activity,
  Landmark, TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

// ── Shared style ──────────────────────────────────────────────────────────────
const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

// ── Data fetchers ─────────────────────────────────────────────────────────────

async function getStats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    rex, suppliers, employees,
    ordersThisMonth, expensesThisMonth,
    openApps, payrollDraft, unreconciledBank,
  ] = await Promise.all([
    supabaseAdmin.from('rex_members').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('suppliers').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('employees').select('*', { count: 'exact', head: true }),

    // Orders this month
    supabaseAdmin
      .from('orders')
      .select('id, total_value_incl_gst, order_payments(amount_received)')
      .gte('order_date', monthStart)
      .neq('status', 'cancelled'),

    // Expenses this month
    supabaseAdmin
      .from('expenses')
      .select('amount')
      .gte('expense_date', monthStart),

    // Open job applications (not rejected, not hired)
    supabaseAdmin
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .not('stage', 'in', '("rejected","hired")'),

    // Payroll runs in draft
    supabaseAdmin
      .from('payroll_runs')
      .select('id, month, year, status')
      .eq('status', 'draft')
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(3),

    // Unreconciled bank transactions
    supabaseAdmin
      .from('bank_transactions')
      .select('id', { count: 'exact', head: true })
      .is('reconciled_at', null),
  ]);

  // Compute orders total + pending receivables this month
  type OrderRow = {
    id: string;
    total_value_incl_gst: number;
    order_payments: { amount_received: number }[];
  };
  const orderRows = (ordersThisMonth.data ?? []) as OrderRow[];
  const totalOrdersMonth = orderRows.reduce((s, o) => s + (o.total_value_incl_gst ?? 0), 0);
  const totalReceivedMonth = orderRows.reduce((s, o) => {
    return s + (o.order_payments ?? []).reduce((ps, p) => ps + (p.amount_received ?? 0), 0);
  }, 0);
  const pendingReceivables = totalOrdersMonth - totalReceivedMonth;

  const totalExpensesMonth = (expensesThisMonth.data ?? []).reduce((s, e) => s + (e.amount ?? 0), 0);

  return {
    rex: rex.count ?? 0,
    suppliers: suppliers.count ?? 0,
    employees: employees.count ?? 0,
    totalOrdersMonth,
    pendingReceivables,
    totalExpensesMonth,
    openApplications: openApps.count ?? 0,
    payrollDrafts: payrollDraft.data ?? [],
    unreconciledBank: unreconciledBank.count ?? 0,
  };
}

async function getActionItems() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [overdueOrders, newApplications] = await Promise.all([
    // Orders with pending payments and oldest payment stage > 30 days
    supabaseAdmin
      .from('orders')
      .select('id, order_no, client_name, total_value_incl_gst, order_date, order_payments(amount_received)')
      .lte('order_date', thirtyDaysAgo)
      .neq('status', 'cancelled')
      .order('order_date', { ascending: true })
      .limit(5),

    // Applications in 'applied' stage needing screening
    supabaseAdmin
      .from('applications')
      .select('id, applicant_name, job_id, created_at, stage')
      .eq('stage', 'applied')
      .order('created_at', { ascending: true })
      .limit(5),
  ]);

  type OrderRow = {
    id: string;
    order_no: string;
    client_name: string;
    total_value_incl_gst: number;
    order_date: string;
    order_payments: { amount_received: number }[];
  };
  const overdue = ((overdueOrders.data ?? []) as OrderRow[]).filter(o => {
    const received = (o.order_payments ?? []).reduce((s, p) => s + (p.amount_received ?? 0), 0);
    return received < o.total_value_incl_gst;
  });

  return {
    overdueOrders: overdue,
    newApplications: newApplications.data ?? [],
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

  const uniqueVisitorsWeek = new Set((weekRes.data ?? []).map(r => r.visitor_id)).size;

  const pageCounts: Record<string, number> = {};
  for (const { path } of (topPagesRes.data ?? [])) {
    pageCounts[path] = (pageCounts[path] ?? 0) + 1;
  }
  const topPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

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

async function getActivityFeed() {
  const { data } = await supabaseAdmin
    .from('audit_log')
    .select('id, created_at, action, entity_type, entity_id, entity_label, user_email')
    .order('created_at', { ascending: false })
    .limit(15);
  return data ?? [];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function entityHref(entityType: string, entityId: string | null): string | null {
  if (!entityId) return null;
  const map: Record<string, string> = {
    order:    `/dashboard/accounts/orders/${entityId}`,
    customer: `/dashboard/accounts/customers/${entityId}`,
    expense:  `/dashboard/accounts/expenses`,
    supplier: `/dashboard/accounts/suppliers/${entityId}`,
    employee: `/dashboard/hr/employees/${entityId}`,
    quote:    `/dashboard/accounts/quotes/${entityId}`,
    payroll:  `/dashboard/payroll/${entityId}`,
    application: `/dashboard/ats/applications/${entityId}`,
  };
  return map[entityType.toLowerCase()] ?? null;
}

const ACTION_BADGE: Record<string, string> = {
  create:        'bg-emerald-500/15 text-emerald-400',
  update:        'bg-sky-500/15 text-sky-400',
  delete:        'bg-rose-500/15 text-rose-400',
  status_change: 'bg-amber-500/15 text-amber-400',
  login:         'bg-violet-500/15 text-violet-400',
  export:        'bg-zinc-500/15 text-zinc-400',
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const [stats, visitors, recentRex, activity, actions] = await Promise.all([
    getStats(),
    getVisitorStats(),
    getRecentRex(),
    getActivityFeed(),
    getActionItems(),
  ]);

  const typeLabel: Record<string, string> = {
    student: 'Student', professional: 'Professional',
    academic: 'Academic', enthusiast: 'Enthusiast',
  };

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date();

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">Rotehügels internal management portal</p>
      </div>

      {/* ── Quick Stats ──────────────────────────────────────────────────────── */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-600">This month</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Orders */}
          <Link href="/dashboard/accounts/orders"
            className={`${glass} p-5 hover:border-zinc-700 transition-colors`}>
            <div className="flex items-center gap-2 mb-2">
              <ReceiptText className="h-4 w-4 text-sky-400" />
              <p className="text-xs text-zinc-500">Orders invoiced</p>
            </div>
            <p className="text-2xl font-black text-sky-400">{fmt(stats.totalOrdersMonth)}</p>
            <p className="mt-1 text-xs text-zinc-600">
              Pending: <span className="text-rose-400 font-semibold">{fmt(stats.pendingReceivables)}</span>
            </p>
          </Link>

          {/* Expenses */}
          <Link href="/dashboard/accounts/expenses"
            className={`${glass} p-5 hover:border-zinc-700 transition-colors`}>
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-rose-400" />
              <p className="text-xs text-zinc-500">Expenses</p>
            </div>
            <p className="text-2xl font-black text-rose-400">{fmt(stats.totalExpensesMonth)}</p>
            <p className="mt-1 text-xs text-zinc-600">{MONTH_NAMES[now.getMonth()]} {now.getFullYear()}</p>
          </Link>

          {/* Employees */}
          <Link href="/dashboard/hr/employees"
            className={`${glass} p-5 hover:border-zinc-700 transition-colors`}>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-emerald-400" />
              <p className="text-xs text-zinc-500">Active employees</p>
            </div>
            <p className="text-2xl font-black text-emerald-400">{stats.employees}</p>
            <p className="mt-1 text-xs text-zinc-600">REX: {stats.rex}</p>
          </Link>

          {/* Open applications */}
          <Link href="/dashboard/ats/applications"
            className={`${glass} p-5 hover:border-zinc-700 transition-colors`}>
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="h-4 w-4 text-amber-400" />
              <p className="text-xs text-zinc-500">Open applications</p>
            </div>
            <p className="text-2xl font-black text-amber-400">{stats.openApplications}</p>
            <p className="mt-1 text-xs text-zinc-600">Not hired/rejected</p>
          </Link>

          {/* Bank unreconciled */}
          <Link href="/dashboard/accounts/bank"
            className={`${glass} p-5 hover:border-zinc-700 transition-colors`}>
            <div className="flex items-center gap-2 mb-2">
              <Landmark className="h-4 w-4 text-violet-400" />
              <p className="text-xs text-zinc-500">Unreconciled txns</p>
            </div>
            <p className="text-2xl font-black text-violet-400">{stats.unreconciledBank}</p>
            <p className="mt-1 text-xs text-zinc-600">Bank transactions</p>
          </Link>

          {/* Suppliers */}
          <Link href="/dashboard/accounts/suppliers"
            className={`${glass} p-5 hover:border-zinc-700 transition-colors`}>
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-orange-400" />
              <p className="text-xs text-zinc-500">Suppliers</p>
            </div>
            <p className="text-2xl font-black text-orange-400">{stats.suppliers}</p>
            <p className="mt-1 text-xs text-zinc-600">Registered vendors</p>
          </Link>
        </div>
      </section>

      {/* ── Action Items ─────────────────────────────────────────────────────── */}
      {(stats.payrollDrafts.length > 0 || actions.overdueOrders.length > 0 || actions.newApplications.length > 0 || stats.unreconciledBank > 0) && (
        <section className={`${glass} p-6`}>
          <div className="flex items-center gap-2 mb-5">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-zinc-300">Action items</h2>
          </div>

          <div className="space-y-3">
            {/* Draft payroll runs */}
            {stats.payrollDrafts.map((run: { id: string; month: number; year: number; status: string }) => (
              <Link key={run.id} href={`/dashboard/payroll/${run.id}`}
                className="flex items-center gap-3 rounded-xl border border-amber-900/30 bg-amber-500/5 px-4 py-3 hover:bg-amber-500/10 transition-colors">
                <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-200">
                    Payroll draft — {MONTH_NAMES[run.month - 1]} {run.year}
                  </p>
                  <p className="text-xs text-amber-600">Needs review and processing</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              </Link>
            ))}

            {/* Overdue orders */}
            {actions.overdueOrders.map((o: { id: string; order_no: string; client_name: string; total_value_incl_gst: number; order_date: string; order_payments: { amount_received: number }[] }) => {
              const received = (o.order_payments ?? []).reduce((s: number, p: { amount_received: number }) => s + (p.amount_received ?? 0), 0);
              const pending = o.total_value_incl_gst - received;
              return (
                <Link key={o.id} href={`/dashboard/accounts/orders/${o.id}`}
                  className="flex items-center gap-3 rounded-xl border border-rose-900/30 bg-rose-500/5 px-4 py-3 hover:bg-rose-500/10 transition-colors">
                  <TrendingUp className="h-4 w-4 text-rose-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-rose-200">{o.order_no} — {o.client_name}</p>
                    <p className="text-xs text-rose-600">
                      {fmt(pending)} pending · overdue since {new Date(o.order_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                </Link>
              );
            })}

            {/* Applications needing screening */}
            {actions.newApplications.map((a: { id: string; applicant_name: string; job_id: string; created_at: string }) => (
              <Link key={a.id} href={`/dashboard/ats/applications/${a.id}`}
                className="flex items-center gap-3 rounded-xl border border-sky-900/30 bg-sky-500/5 px-4 py-3 hover:bg-sky-500/10 transition-colors">
                <Briefcase className="h-4 w-4 text-sky-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sky-200">{a.applicant_name}</p>
                  <p className="text-xs text-sky-600">New application · {relativeTime(a.created_at)}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-sky-600 shrink-0" />
              </Link>
            ))}

            {/* Unreconciled bank transactions */}
            {stats.unreconciledBank > 0 && (
              <Link href="/dashboard/accounts/bank"
                className="flex items-center gap-3 rounded-xl border border-violet-900/30 bg-violet-500/5 px-4 py-3 hover:bg-violet-500/10 transition-colors">
                <Landmark className="h-4 w-4 text-violet-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-violet-200">{stats.unreconciledBank} unreconciled bank transactions</p>
                  <p className="text-xs text-violet-600">Open bank statement for reconciliation</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-violet-600 shrink-0" />
              </Link>
            )}
          </div>
        </section>
      )}

      {/* ── Activity Feed + Quick actions ─────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Activity Feed */}
        <section className={`${glass} p-6`}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-rose-400" />
              <h2 className="text-sm font-semibold text-zinc-300">Recent activity</h2>
            </div>
            <Link href="/dashboard/audit" className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors">
              All logs <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {activity.length === 0 ? (
            <p className="text-sm text-zinc-600">No activity yet.</p>
          ) : (
            <div className="space-y-1">
              {activity.map((entry: {
                id: string;
                created_at: string;
                action: string;
                entity_type: string;
                entity_id: string | null;
                entity_label: string | null;
                user_email: string | null;
              }) => {
                const href = entityHref(entry.entity_type, entry.entity_id);
                const content = (
                  <div className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-zinc-800/40 transition-colors group">
                    <div className="shrink-0 mt-0.5">
                      <span className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${ACTION_BADGE[entry.action] ?? 'bg-zinc-500/15 text-zinc-400'}`}>
                        {entry.action.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 truncate">
                        <span className="font-medium text-zinc-200">{entry.entity_type}</span>
                        {entry.entity_label ? ` · ${entry.entity_label}` : ''}
                      </p>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        {entry.user_email ?? 'system'} · {relativeTime(entry.created_at)}
                      </p>
                    </div>
                    {href && <ArrowRight className="h-3 w-3 text-zinc-700 group-hover:text-zinc-500 shrink-0 mt-1 transition-colors" />}
                  </div>
                );

                return href ? (
                  <Link key={entry.id} href={href}>{content}</Link>
                ) : (
                  <div key={entry.id}>{content}</div>
                );
              })}
            </div>
          )}
        </section>

        {/* Quick actions + REX recent */}
        <div className="space-y-6">
          {/* Quick actions */}
          <section className={`${glass} p-6`}>
            <h2 className="text-sm font-semibold text-zinc-300 mb-4">Quick actions</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/hr/add"
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 transition-colors">
                <UserPlus className="h-4 w-4" /> Add Employee
              </Link>
              <Link href="/dashboard/accounts/orders/new"
                className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:border-zinc-600 transition-colors">
                <ReceiptText className="h-4 w-4" /> New Order
              </Link>
              <Link href="/dashboard/accounts/expenses/new"
                className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:border-zinc-600 transition-colors">
                <Wallet className="h-4 w-4" /> Add Expense
              </Link>
              <Link href="/dashboard/payroll/new"
                className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:border-zinc-600 transition-colors">
                <CheckCircle2 className="h-4 w-4" /> Run Payroll
              </Link>
              <Link href="/dashboard/rex"
                className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:border-zinc-600 transition-colors">
                <Network className="h-4 w-4" /> REX Members
              </Link>
            </div>
          </section>

          {/* Recent REX registrations */}
          <section className={`${glass} p-6`}>
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
                {recentRex.map((m: { rex_id: string; full_name: string; member_type: string; created_at: string }) => (
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
          </section>
        </div>
      </div>

      {/* ── Website Visitor Analytics ─────────────────────────────────────── */}
      <section className={`${glass} p-6`}>
        <div className="flex items-center gap-2 mb-5">
          <Eye className="h-4 w-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-zinc-300">Website Visitors</h2>
          <span className="text-xs text-zinc-600 ml-1">(anonymous, cookie-based)</span>
        </div>

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
      </section>
    </div>
  );
}
