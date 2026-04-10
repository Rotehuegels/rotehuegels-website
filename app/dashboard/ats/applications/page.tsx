import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { Star } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const STAGES = ['applied', 'shortlisted', 'interview', 'offer', 'hired', 'rejected'] as const;

const STAGE_COLOR: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  applied:     { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-600/30', dot: 'bg-zinc-400' },
  shortlisted: { bg: 'bg-sky-500/10',  text: 'text-sky-400',  border: 'border-sky-500/20',  dot: 'bg-sky-400' },
  interview:   { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-400' },
  offer:       { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
  hired:       { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', dot: 'bg-green-400' },
  rejected:    { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', dot: 'bg-red-400' },
};

const SOURCE_BADGE: Record<string, string> = {
  website: 'bg-zinc-700/50 text-zinc-300',
  linkedin: 'bg-blue-500/10 text-blue-400',
  referral: 'bg-purple-500/10 text-purple-400',
  naukri: 'bg-orange-500/10 text-orange-400',
  other: 'bg-zinc-700/50 text-zinc-400',
};

export default async function ApplicationsPipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ job_id?: string }>;
}) {
  const sp = await searchParams;
  const jobFilter = sp.job_id;

  const [{ data: jobs }, { data: applications }] = await Promise.all([
    supabaseAdmin
      .from('job_postings')
      .select('id, title')
      .order('created_at', { ascending: false }),
    (() => {
      let q = supabaseAdmin
        .from('applications')
        .select('id, full_name, email, job_id, job_title, stage, rating, source, current_company, current_role, experience_years, created_at')
        .order('created_at', { ascending: false });
      if (jobFilter) q = q.eq('job_id', jobFilter);
      return q;
    })(),
  ]);

  const grouped = STAGES.reduce<Record<string, typeof applications>>((acc, stage) => {
    acc[stage] = (applications ?? []).filter(a => a.stage === stage);
    return acc;
  }, {} as Record<string, typeof applications>);

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Applications Pipeline</h1>
          <p className="mt-1 text-sm text-zinc-400">{applications?.length ?? 0} total applications</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Job filter */}
          <form className="flex items-center gap-2">
            <select
              name="job_id"
              defaultValue={jobFilter ?? ''}
              className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-white outline-none cursor-pointer"
            >
              <option value="">All jobs</option>
              {jobs?.map(j => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
            <button type="submit" className="rounded-xl bg-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-600 transition-colors">
              Filter
            </button>
          </form>
        </div>
      </div>

      {/* Kanban board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4" style={{ minWidth: `${STAGES.length * 280}px` }}>
          {STAGES.map(stage => {
            const items = grouped[stage] ?? [];
            const c = STAGE_COLOR[stage];
            return (
              <div key={stage} className="flex-1 min-w-[260px]">
                {/* Column header */}
                <div className={`${glass} px-4 py-3 mb-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                    <span className={`text-sm font-semibold capitalize ${c.text}`}>{stage}</span>
                  </div>
                  <span className={`rounded-full ${c.bg} ${c.text} border ${c.border} px-2 py-0.5 text-xs font-bold`}>
                    {items.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {items.map(app => (
                    <Link
                      key={app.id}
                      href={`/dashboard/ats/applications/${app.id}`}
                      className={`block ${glass} p-4 hover:bg-zinc-800/40 transition-colors cursor-pointer`}
                    >
                      <p className="text-sm font-semibold text-white truncate">{app.full_name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5 truncate">{app.job_title}</p>
                      {(app.current_company || app.current_role) && (
                        <p className="text-xs text-zinc-600 mt-1 truncate">
                          {app.current_role}{app.current_role && app.current_company ? ' at ' : ''}{app.current_company}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {/* Rating stars */}
                        {app.rating && (
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(n => (
                              <Star
                                key={n}
                                className={`h-3 w-3 ${n <= app.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}`}
                              />
                            ))}
                          </div>
                        )}
                        {/* Source badge */}
                        {app.source && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${SOURCE_BADGE[app.source] ?? SOURCE_BADGE.other}`}>
                            {app.source}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-[10px] text-zinc-600">
                        {new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        {app.experience_years != null && ` \u00b7 ${app.experience_years}y exp`}
                      </p>
                    </Link>
                  ))}
                  {items.length === 0 && (
                    <div className={`${glass} p-6 text-center`}>
                      <p className="text-xs text-zinc-600">No candidates</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
