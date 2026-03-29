import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { Briefcase, Users, ArrowRight, Plus } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const STAGE_STYLE: Record<string, string> = {
  applied: 'bg-zinc-500/10 text-zinc-400 border-zinc-600/30',
  shortlisted: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  interview: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  offer: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  hired: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default async function AtsOverviewPage() {
  const [{ data: jobs }, { data: applications, count }] = await Promise.all([
    supabaseAdmin
      .from('job_postings')
      .select('id, title, department, status, employment_type')
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('applications')
      .select('id, full_name, job_title, stage, rex_id, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const published = jobs?.filter(j => j.status === 'published').length ?? 0;
  const drafts = jobs?.filter(j => j.status === 'draft').length ?? 0;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">ATS — Applicant Tracking</h1>
          <p className="mt-1 text-sm text-zinc-400">Manage job postings and candidate pipeline</p>
        </div>
        <Link href="/dashboard/ats/jobs/new"
          className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 transition-colors">
          <Plus className="h-4 w-4" /> Post a Job
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Jobs', value: jobs?.length ?? 0, color: 'text-white' },
          { label: 'Published', value: published, color: 'text-emerald-400' },
          { label: 'Drafts', value: drafts, color: 'text-amber-400' },
          { label: 'Applications', value: count ?? 0, color: 'text-rose-400' },
        ].map(s => (
          <div key={s.label} className={`${glass} p-5 text-center`}>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="mt-1 text-xs text-zinc-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Job postings */}
        <div className={glass}>
          <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-rose-400" />
              <h2 className="text-sm font-semibold text-zinc-300">Job Postings</h2>
            </div>
            <Link href="/dashboard/ats/jobs" className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {!jobs?.length ? (
            <div className="p-8 text-center">
              <p className="text-sm text-zinc-600">No jobs posted yet.</p>
              <Link href="/dashboard/ats/jobs/new"
                className="mt-3 inline-block rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 transition-colors">
                Post your first job
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {jobs.slice(0, 5).map(job => (
                <Link key={job.id} href={`/dashboard/ats/jobs/${job.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-zinc-800/20 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-white">{job.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{job.department ?? 'General'}</p>
                  </div>
                  <span className={`text-xs rounded-full border px-2.5 py-0.5 font-medium capitalize ${
                    job.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    job.status === 'closed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>{job.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent applications */}
        <div className={glass}>
          <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-rose-400" />
              <h2 className="text-sm font-semibold text-zinc-300">Recent Applications</h2>
            </div>
          </div>
          {!applications?.length ? (
            <div className="p-8 text-center">
              <p className="text-sm text-zinc-600">No applications yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {applications.map(app => (
                <div key={app.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{app.full_name}</p>
                      {app.rex_id && (
                        <span className="text-[10px] rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 font-mono">REX</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">{app.job_title}</p>
                  </div>
                  <span className={`text-xs rounded-full border px-2.5 py-0.5 font-medium capitalize ${STAGE_STYLE[app.stage] ?? STAGE_STYLE.applied}`}>
                    {app.stage}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
