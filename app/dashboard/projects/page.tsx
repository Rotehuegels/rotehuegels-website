import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { FolderKanban, Plus, MapPin, User, ExternalLink } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const statusColor: Record<string, string> = {
  planning:  'bg-blue-500/10 text-blue-400',
  active:    'bg-emerald-500/10 text-emerald-400',
  on_hold:   'bg-amber-500/10 text-amber-400',
  completed: 'bg-zinc-500/10 text-zinc-400',
  cancelled: 'bg-red-500/10 text-red-400',
};

export default async function AdminProjectsPage() {
  const { data: projects } = await supabaseAdmin
    .from('projects')
    .select('*, customers(name, customer_id)')
    .order('created_at', { ascending: false });

  const list = projects ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FolderKanban className="h-5 w-5 text-rose-400" />
          <h1 className="text-xl font-bold text-white">Projects</h1>
          <span className="text-xs text-zinc-500 bg-zinc-800 rounded-full px-2 py-0.5">{list.length}</span>
        </div>
        <Link
          href="/d/projects/new"
          className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      {list.length === 0 ? (
        <div className={`${glass} p-12 text-center`}>
          <FolderKanban className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No projects yet. Create your first project.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {list.map((p: any) => (
              <Link
                key={p.id}
                href={`/d/projects/${p.id}`}
                className={`${glass} p-5 block hover:border-zinc-700 transition-colors group`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-zinc-600">{p.project_code}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[p.status] ?? ''}`}>
                        {p.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h2 className="text-base font-semibold text-white mt-1">{p.name}</h2>
                  </div>
                  <ExternalLink className="h-4 w-4 text-zinc-600 group-hover:text-rose-400 transition-colors" />
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                  {p.customers?.name && <span className="flex items-center gap-1"><User className="h-3 w-3" />{p.customers.name}</span>}
                  {p.site_location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.site_location}</span>}
                  <span>{p.completion_pct}% complete</span>
                </div>

                <div className="mt-2 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full rounded-full bg-rose-500" style={{ width: `${p.completion_pct}%` }} />
                </div>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
