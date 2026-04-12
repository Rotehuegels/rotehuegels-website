import { redirect, notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getPortalUser } from '@/lib/portalAuth';
import Link from 'next/link';
import {
  Milestone, CreditCard, GitPullRequest, Activity,
  FileText, MapPin, User, Calendar, CheckCircle2, Clock, AlertCircle,
} from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const statusColor: Record<string, string> = {
  planning:    'bg-blue-500/10 text-blue-400',
  active:      'bg-emerald-500/10 text-emerald-400',
  on_hold:     'bg-amber-500/10 text-amber-400',
  completed:   'bg-zinc-500/10 text-zinc-400',
  cancelled:   'bg-red-500/10 text-red-400',
  pending:     'bg-zinc-500/10 text-zinc-400',
  in_progress: 'bg-blue-500/10 text-blue-400',
};

const milestoneIcon: Record<string, React.ElementType> = {
  completed:   CheckCircle2,
  in_progress: Clock,
  pending:     AlertCircle,
};

export default async function ProjectDashboardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const portalUser = await getPortalUser();
  if (!portalUser) redirect('/login?next=/portal');

  const { projectId } = await params;

  // Fetch project
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('customer_id', portalUser.customerId)
    .single();

  if (!project) notFound();

  // Fetch linked orders financials
  const { data: links } = await supabaseAdmin
    .from('project_orders')
    .select('order_id')
    .eq('project_id', projectId);

  const orderIds = (links ?? []).map(l => l.order_id);
  let totalContract = 0, totalPaid = 0;

  if (orderIds.length > 0) {
    const [ordersRes, paymentsRes] = await Promise.all([
      supabaseAdmin.from('orders').select('total_value_incl_gst').in('id', orderIds),
      supabaseAdmin.from('order_payments').select('amount_received, tds_deducted').in('order_id', orderIds),
    ]);
    totalContract = (ordersRes.data ?? []).reduce((s, o) => s + (o.total_value_incl_gst ?? 0), 0);
    totalPaid = (paymentsRes.data ?? []).reduce((s, p) => s + (p.amount_received ?? 0) + (p.tds_deducted ?? 0), 0);
  }

  const totalPending = totalContract - totalPaid;

  // Milestones
  const { data: milestones } = await supabaseAdmin
    .from('project_milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('milestone_no');

  const nextMilestone = (milestones ?? []).find(m => m.status !== 'completed' && m.status !== 'skipped');

  // Recent activities
  const { data: activities } = await supabaseAdmin
    .from('project_activities')
    .select('*')
    .eq('project_id', projectId)
    .eq('visible_to_client', true)
    .order('created_at', { ascending: false })
    .limit(5);

  // Pending change requests
  const { count: pendingChanges } = await supabaseAdmin
    .from('change_requests')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .in('status', ['requested', 'under_review']);

  const base = `/portal/${projectId}`;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div>
        <span className="text-xs font-mono text-zinc-500">{project.project_code}</span>
        <h1 className="text-xl font-bold text-white">{project.name}</h1>
        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-zinc-500">
          <span className={`px-2 py-0.5 rounded-full font-medium ${statusColor[project.status]}`}>
            {project.status.replace('_', ' ')}
          </span>
          {project.site_location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{project.site_location}</span>}
          {project.project_manager && <span className="flex items-center gap-1"><User className="h-3 w-3" />{project.project_manager}</span>}
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(project.start_date)} — {fmtDate(project.target_end_date)}</span>
        </div>
      </div>

      {/* Progress */}
      <div className={`${glass} p-5`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-400">Overall Progress</span>
          <span className="text-lg font-bold text-white">{project.completion_pct}%</span>
        </div>
        <div className="h-3 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all"
            style={{ width: `${project.completion_pct}%` }}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className={`${glass} p-5`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Contract Value</p>
          <p className="text-lg font-bold text-white mt-1">{fmt(totalContract)}</p>
        </div>
        <div className={`${glass} p-5`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Amount Received</p>
          <p className="text-lg font-bold text-emerald-400 mt-1">{fmt(totalPaid)}</p>
        </div>
        <div className={`${glass} p-5`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Pending</p>
          <p className={`text-lg font-bold mt-1 ${totalPending > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {fmt(totalPending)}
          </p>
        </div>
      </div>

      {/* Two-column: Next Milestone + Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">

        {/* Next Milestone */}
        <div className={`${glass} p-5`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Next Milestone</h2>
            <Link href={`${base}/milestones`} className="text-xs text-rose-400 hover:text-rose-300">View all →</Link>
          </div>
          {nextMilestone ? (
            <div>
              <div className="flex items-center gap-2 mb-1">
                {(() => { const Icon = milestoneIcon[nextMilestone.status] ?? AlertCircle; return <Icon className="h-4 w-4 text-blue-400" />; })()}
                <span className="text-sm text-white font-medium">{nextMilestone.title}</span>
              </div>
              <p className="text-xs text-zinc-500">{nextMilestone.phase}</p>
              <p className="text-xs text-zinc-500 mt-1">Target: {fmtDate(nextMilestone.target_date)}</p>
              <div className="mt-2 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${nextMilestone.completion_pct}%` }} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">All milestones completed</p>
          )}
        </div>

        {/* Quick Links */}
        <div className={`${glass} p-5`}>
          <h2 className="text-sm font-semibold text-white mb-3">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: 'View Milestones',   href: `${base}/milestones`, icon: Milestone, count: `${(milestones ?? []).filter(m => m.status === 'completed').length}/${(milestones ?? []).length} done` },
              { label: 'Payment History',    href: `${base}/payments`,   icon: CreditCard, count: totalPaid > 0 ? `${fmt(totalPaid)} received` : 'No payments yet' },
              { label: 'Change Requests',    href: `${base}/changes`,    icon: GitPullRequest, count: (pendingChanges ?? 0) > 0 ? `${pendingChanges} pending` : 'None pending' },
              { label: 'Documents',          href: `${base}/documents`,  icon: FileText },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-zinc-800/60 transition-colors group"
              >
                <span className="flex items-center gap-2.5 text-sm text-zinc-400 group-hover:text-white">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </span>
                {item.count && <span className="text-xs text-zinc-600">{item.count}</span>}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={`${glass} p-5`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
          <Link href={`${base}/activity`} className="text-xs text-rose-400 hover:text-rose-300">View all →</Link>
        </div>
        {(activities ?? []).length === 0 ? (
          <p className="text-sm text-zinc-500">No recent activity.</p>
        ) : (
          <div className="space-y-3">
            {(activities ?? []).map(a => (
              <div key={a.id} className="flex items-start gap-3">
                <Activity className="h-4 w-4 text-zinc-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-zinc-300">{a.title}</p>
                  {a.description && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{a.description}</p>}
                  <p className="text-xs text-zinc-600 mt-0.5">{fmtDate(a.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      {project.description && (
        <div className={`${glass} p-5`}>
          <h2 className="text-sm font-semibold text-white mb-2">Project Description</h2>
          <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">{project.description}</p>
        </div>
      )}
    </div>
  );
}
