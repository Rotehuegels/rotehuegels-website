import { redirect, notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getPortalUser } from '@/lib/portalAuth';
import { CheckCircle2, Clock, AlertCircle, SkipForward } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  completed:   { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', label: 'Completed' },
  in_progress: { icon: Clock,        color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30',    label: 'In Progress' },
  pending:     { icon: AlertCircle,   color: 'text-zinc-500',    bg: 'bg-zinc-800/60 border-zinc-700',       label: 'Pending' },
  skipped:     { icon: SkipForward,   color: 'text-zinc-600',    bg: 'bg-zinc-800/40 border-zinc-800',       label: 'Skipped' },
};

export default async function MilestonesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const portalUser = await getPortalUser();
  if (!portalUser) redirect('/login?next=/portal');

  const { projectId } = await params;

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .eq('customer_id', portalUser.customerId)
    .single();

  if (!project) notFound();

  const { data: milestones } = await supabaseAdmin
    .from('project_milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('milestone_no');

  const list = milestones ?? [];

  return (
    <div className="p-6 max-w-[1800px] mx-auto">
      <h1 className="text-xl font-bold text-white mb-1">Milestones & Timeline</h1>
      <p className="text-sm text-zinc-500 mb-6">{project.name}</p>

      {list.length === 0 ? (
        <div className={`${glass} p-12 text-center`}>
          <p className="text-zinc-500">No milestones defined yet.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-zinc-800" />

          <div className="space-y-6">
            {list.map((m, idx) => {
              const cfg = statusConfig[m.status] ?? statusConfig.pending;
              const Icon = cfg.icon;
              return (
                <div key={m.id} className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border ${cfg.bg}`}>
                    <Icon className={`h-5 w-5 ${cfg.color}`} />
                  </div>

                  {/* Card */}
                  <div className={`${glass} p-4 flex-1`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-zinc-600">#{m.milestone_no}</span>
                        <h3 className="text-sm font-semibold text-white">{m.title}</h3>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color} ${cfg.bg}`}>
                        {cfg.label}
                      </span>
                    </div>

                    {m.phase && <p className="text-xs text-zinc-500 mb-2">{m.phase}</p>}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 mb-2">
                      {m.start_date && <span>Start: {fmtDate(m.start_date)}</span>}
                      <span>Target: {fmtDate(m.target_date)}</span>
                      {m.completed_date && <span className="text-emerald-400">Done: {fmtDate(m.completed_date)}</span>}
                    </div>

                    {/* Progress */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${m.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                          style={{ width: `${m.completion_pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-400 w-8 text-right">{m.completion_pct}%</span>
                    </div>

                    {m.deliverables && (
                      <div className="mt-3 pt-2 border-t border-zinc-800">
                        <p className="text-xs text-zinc-500 font-medium mb-1">Deliverables</p>
                        <p className="text-xs text-zinc-400">{m.deliverables}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
