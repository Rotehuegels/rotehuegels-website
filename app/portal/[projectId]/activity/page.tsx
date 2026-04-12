import { redirect, notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getPortalUser } from '@/lib/portalAuth';
import {
  Activity, Milestone, CreditCard, FileText, GitPullRequest,
  MessageSquare, Package,
} from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const typeConfig: Record<string, { icon: React.ElementType; color: string }> = {
  status_change:     { icon: Activity,         color: 'text-amber-400' },
  milestone_update:  { icon: Milestone,        color: 'text-blue-400' },
  payment_received:  { icon: CreditCard,       color: 'text-emerald-400' },
  document_uploaded: { icon: FileText,         color: 'text-violet-400' },
  change_request:    { icon: GitPullRequest,   color: 'text-rose-400' },
  note:              { icon: MessageSquare,     color: 'text-zinc-400' },
  deliverable:       { icon: Package,          color: 'text-cyan-400' },
};

export default async function ActivityPage({ params }: { params: Promise<{ projectId: string }> }) {
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

  const { data: activities } = await supabaseAdmin
    .from('project_activities')
    .select('*')
    .eq('project_id', projectId)
    .eq('visible_to_client', true)
    .order('created_at', { ascending: false })
    .limit(100);

  const list = activities ?? [];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-white mb-1">Activity Feed</h1>
      <p className="text-sm text-zinc-500 mb-6">{project.name}</p>

      {list.length === 0 ? (
        <div className={`${glass} p-12 text-center`}>
          <Activity className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500">No activity recorded yet.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-zinc-800" />

          <div className="space-y-4">
            {list.map(a => {
              const cfg = typeConfig[a.activity_type] ?? typeConfig.note;
              const Icon = cfg.icon;
              return (
                <div key={a.id} className="relative flex gap-4">
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
                    <Icon className={`h-4 w-4 ${cfg.color}`} />
                  </div>
                  <div className={`${glass} p-4 flex-1`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-white font-medium">{a.title}</p>
                      <span className="text-xs text-zinc-600 shrink-0">{fmtDate(a.created_at)}</span>
                    </div>
                    {a.description && (
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{a.description}</p>
                    )}
                    {a.actor && (
                      <p className="text-xs text-zinc-600 mt-1">— {a.actor}</p>
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
