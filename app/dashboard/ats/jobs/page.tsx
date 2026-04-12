import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import JobStatusToggle from './JobStatusToggle';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const TYPE_LABEL: Record<string, string> = {
  full_time: 'Full-time', part_time: 'Part-time',
  consultant: 'Consultant', contract: 'Contract',
};

export default async function JobsListPage() {
  const { data: jobs } = await supabaseAdmin
    .from('job_postings')
    .select('id, title, department, location, employment_type, status, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Job Postings</h1>
          <p className="mt-1 text-sm text-zinc-400">{jobs?.length ?? 0} total</p>
        </div>
        <Link href="/d/jobs/new"
          className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 transition-colors">
          <Plus className="h-4 w-4" /> New Job
        </Link>
      </div>

      <div className={glass}>
        {!jobs?.length ? (
          <div className="p-12 text-center">
            <p className="text-zinc-500 text-sm">No job postings yet.</p>
            <Link href="/d/jobs/new"
              className="mt-4 inline-block rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 transition-colors">
              Create your first job posting
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {jobs.map(job => (
              <div key={job.id} className="flex items-center justify-between px-6 py-5 hover:bg-zinc-800/20 transition-colors">
                <div className="min-w-0 flex-1">
                  <Link href={`/d/jobs/${job.id}`} className="text-sm font-semibold text-white hover:text-rose-400 transition-colors">
                    {job.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    {job.department && <span>{job.department}</span>}
                    <span>·</span>
                    <span>{job.location}</span>
                    <span>·</span>
                    <span>{TYPE_LABEL[job.employment_type] ?? job.employment_type}</span>
                    <span>·</span>
                    <span>{new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <JobStatusToggle jobId={job.id} currentStatus={job.status} />
                  <Link href={`/d/jobs/${job.id}`}
                    className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-600 transition-colors">
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
