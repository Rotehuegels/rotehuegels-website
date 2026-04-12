import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getPortalUser } from '@/lib/portalAuth';
import Link from 'next/link';
import { FolderOpen, MapPin, User, ArrowRight } from 'lucide-react';

const statusColor: Record<string, string> = {
  planning:  'bg-blue-500/10 text-blue-400',
  active:    'bg-emerald-500/10 text-emerald-400',
  on_hold:   'bg-amber-500/10 text-amber-400',
  completed: 'bg-zinc-500/10 text-zinc-400',
  cancelled: 'bg-red-500/10 text-red-400',
};

export default async function PortalHomePage() {
  const portalUser = await getPortalUser();
  if (!portalUser) redirect('/login?next=/portal');

  const { data: projects } = await supabaseAdmin
    .from('projects')
    .select('id, project_code, name, status, completion_pct, start_date, target_end_date, site_location, project_manager')
    .eq('customer_id', portalUser.customerId)
    .order('created_at', { ascending: false });

  const list = projects ?? [];

  // If only one project, go straight to it
  if (list.length === 1) redirect(`/portal/${list[0].id}`);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Your Projects</h1>
        <p className="text-sm text-zinc-500 mt-1">Select a project to view details</p>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center">
          <FolderOpen className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No projects found for your account.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map(p => (
            <Link
              key={p.id}
              href={`/portal/${p.id}`}
              className="block rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 hover:border-zinc-700 hover:bg-zinc-900/60 transition-colors group"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs font-mono text-zinc-500">{p.project_code}</span>
                  <h2 className="text-base font-semibold text-white">{p.name}</h2>
                </div>
                <ArrowRight className="h-5 w-5 text-zinc-600 group-hover:text-rose-400 transition-colors" />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[p.status] ?? ''}`}>
                  {p.status}
                </span>
                {p.site_location && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.site_location}</span>
                )}
                {p.project_manager && (
                  <span className="flex items-center gap-1"><User className="h-3 w-3" />{p.project_manager}</span>
                )}
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-500">Progress</span>
                  <span className="text-white font-medium">{p.completion_pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-rose-500 transition-all"
                    style={{ width: `${p.completion_pct}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
