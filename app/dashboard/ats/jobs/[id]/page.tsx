import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Network } from 'lucide-react';
import StageSelector from './StageSelector';
import JobVersions from './JobVersions';
import DeleteButton from '@/components/DeleteButton';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const STAGE_STYLE: Record<string, string> = {
  applied: 'bg-zinc-500/10 text-zinc-400 border-zinc-600/30',
  shortlisted: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  interview: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  offer: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  hired: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const TYPE_LABEL: Record<string, string> = {
  full_time: 'Full-time', part_time: 'Part-time',
  consultant: 'Consultant', contract: 'Contract',
};

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [{ data: job }, { data: applications }] = await Promise.all([
    supabaseAdmin.from('job_postings').select('*').eq('id', id).single(),
    supabaseAdmin.from('applications')
      .select('id, full_name, email, phone, linkedin_url, cv_url, cover_letter, rex_id, stage, notes, created_at')
      .eq('job_id', id)
      .order('created_at', { ascending: false }),
  ]);

  if (!job) notFound();

  const stageCounts = (applications ?? []).reduce<Record<string, number>>((acc, a) => {
    acc[a.stage] = (acc[a.stage] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <Link href="/d/jobs" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          ← Back to Jobs
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{job.title}</h1>
            <p className="mt-1 text-sm text-zinc-400">
              {job.department && `${job.department} · `}{job.location} · {TYPE_LABEL[job.employment_type] ?? job.employment_type}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
              job.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              job.status === 'closed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
              'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>{job.status}</span>
            {(applications?.length ?? 0) === 0 && (
              <DeleteButton
                entityName="job posting"
                entityLabel={job.title}
                deleteUrl={`/api/ats/jobs/${id}`}
                redirectUrl="/d/jobs"
              />
            )}
          </div>
        </div>
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {['applied', 'shortlisted', 'interview', 'offer', 'hired', 'rejected'].map(stage => (
          <div key={stage} className={`${glass} p-4 text-center`}>
            <p className={`text-2xl font-black ${STAGE_STYLE[stage].split(' ')[1]}`}>{stageCounts[stage] ?? 0}</p>
            <p className="mt-1 text-xs text-zinc-500 capitalize">{stage}</p>
          </div>
        ))}
      </div>

      {/* Applicants */}
      <div className={glass}>
        <div className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-300">
            Applicants <span className="text-zinc-600 font-normal">({applications?.length ?? 0})</span>
          </h2>
        </div>

        {/* Share link & view pipeline */}
        <div className="px-6 py-3 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          {job.status === 'published' && (
            <p className="text-xs text-zinc-500">
              Share: <code className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-zinc-400">https://rotehuegels.com/careers/{id}/apply</code>
            </p>
          )}
          {(applications?.length ?? 0) > 0 && (
            <Link href={`/dashboard/ats/applications?job_id=${id}`}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium">
              View in Pipeline &rarr;
            </Link>
          )}
        </div>

        {!applications?.length ? (
          <div className="p-12 text-center">
            <p className="text-sm text-zinc-600">No applications yet.</p>
            {job.status === 'published' && (
              <p className="mt-2 text-xs text-zinc-600">
                Share the link: <span className="font-mono text-zinc-500">/careers/{id}/apply</span>
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {applications.map(app => (
              <div key={app.id} className="px-6 py-5 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/d/applications/${app.id}`} className="font-semibold text-white hover:text-rose-400 transition-colors">{app.full_name}</Link>
                      {app.rex_id && (
                        <span className="flex items-center gap-1 text-[10px] rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5">
                          <Network className="h-2.5 w-2.5" /> {app.rex_id}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-500">
                      <span>{app.email}</span>
                      {app.phone && <span>{app.phone}</span>}
                      {app.linkedin_url && (
                        <a href={app.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:text-rose-300 underline">LinkedIn</a>
                      )}
                      {app.cv_url && (
                        <a href={app.cv_url} target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:text-rose-300 underline">CV</a>
                      )}
                    </div>
                  </div>
                  <StageSelector applicationId={app.id} currentStage={app.stage} />
                </div>

                {app.cover_letter && (
                  <p className="text-sm text-zinc-400 bg-zinc-800/40 rounded-xl px-4 py-3 leading-relaxed">
                    {app.cover_letter}
                  </p>
                )}

                <p className="text-xs text-zinc-600">
                  Applied {new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit history */}
      <JobVersions jobId={job.id} />
    </div>
  );
}
