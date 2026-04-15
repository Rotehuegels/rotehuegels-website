import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import {
  FolderKanban, Plus, MapPin, User, ExternalLink,
  PlayCircle, PauseCircle, CheckCircle2, XCircle, Clock,
} from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  planning:  { color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',    icon: Clock },
  active:    { color: 'text-emerald-400',  bg: 'bg-emerald-500/10 border-emerald-500/20', icon: PlayCircle },
  on_hold:   { color: 'text-amber-400',    bg: 'bg-amber-500/10 border-amber-500/20',  icon: PauseCircle },
  completed: { color: 'text-zinc-400',     bg: 'bg-zinc-500/10 border-zinc-500/20',    icon: CheckCircle2 },
  cancelled: { color: 'text-red-400',      bg: 'bg-red-500/10 border-red-500/20',      icon: XCircle },
};

export default async function AdminProjectsPage() {
  const { data: projects } = await supabaseAdmin
    .from('projects')
    .select('*, customers(name, customer_id)')
    .order('created_at', { ascending: false });

  const list = projects ?? [];

  const active    = list.filter(p => p.status === 'active').length;
  const planning  = list.filter(p => p.status === 'planning').length;
  const onHold    = list.filter(p => p.status === 'on_hold').length;
  const completed = list.filter(p => p.status === 'completed').length;
  const avgProgress = list.length > 0
    ? Math.round(list.reduce((s, p) => s + (p.completion_pct ?? 0), 0) / list.length)
    : 0;

  return (
    <div className="p-5 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderKanban className="h-6 w-6 text-rose-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <p className="mt-0.5 text-sm text-zinc-500">{list.length} projects &middot; {avgProgress}% avg completion</p>
          </div>
        </div>
        <Link
          href="/d/projects/new"
          className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-500 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Project
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: list.length, color: 'text-white' },
          { label: 'Active', value: active, color: 'text-emerald-400' },
          { label: 'Planning', value: planning, color: 'text-blue-400' },
          { label: 'On Hold', value: onHold, color: 'text-amber-400' },
          { label: 'Completed', value: completed, color: 'text-zinc-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`${glass} p-4`}>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</p>
            <p className={`text-2xl font-black mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Project list */}
      {list.length === 0 ? (
        <div className={`${glass} p-12 text-center`}>
          <FolderKanban className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No projects yet. Create your first project.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {list.map((p: any) => {
            const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.planning;
            const Icon = cfg.icon;
            const pct = p.completion_pct ?? 0;

            return (
              <Link
                key={p.id}
                href={`/d/projects/${p.id}`}
                className={`${glass} p-5 block hover:border-zinc-700 transition-colors group`}
              >
                {/* Top row: code + status */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-zinc-600">{p.project_code}</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
                    <Icon className="h-3 w-3" />
                    {(p.status as string).replace('_', ' ')}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-base font-semibold text-white group-hover:text-rose-400 transition-colors">{p.name}</h2>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-zinc-500">
                  {p.customers?.name && (
                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{p.customers.name}</span>
                  )}
                  {p.site_location && (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.site_location}</span>
                  )}
                  <ExternalLink className="h-3 w-3 text-zinc-700 group-hover:text-rose-400 transition-colors ml-auto" />
                </div>

                {/* Progress bar */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-rose-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold ${
                    pct >= 100 ? 'text-emerald-400' : 'text-zinc-400'
                  }`}>{pct}%</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
