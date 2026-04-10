import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ApplicationActions from './ApplicationActions';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const STAGES = ['applied', 'shortlisted', 'interview', 'offer', 'hired'] as const;

const STAGE_COLOR: Record<string, string> = {
  applied: 'bg-zinc-400',
  shortlisted: 'bg-sky-400',
  interview: 'bg-amber-400',
  offer: 'bg-emerald-400',
  hired: 'bg-green-400',
  rejected: 'bg-red-400',
};

const ROUND_TYPE_LABEL: Record<string, string> = {
  phone: 'Phone Screen',
  technical: 'Technical',
  hr: 'HR',
  culture: 'Culture Fit',
  final: 'Final',
};

const STATUS_STYLE: Record<string, string> = {
  scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cancelled: 'bg-zinc-500/10 text-zinc-400 border-zinc-600/30',
  no_show: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const DECISION_STYLE: Record<string, string> = {
  advance: 'text-emerald-400',
  hold: 'text-amber-400',
  reject: 'text-red-400',
};

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [{ data: app }, { data: interviews }] = await Promise.all([
    supabaseAdmin.from('applications').select('*').eq('id', id).single(),
    supabaseAdmin
      .from('interview_rounds')
      .select('*')
      .eq('application_id', id)
      .order('round_number', { ascending: true }),
  ]);

  if (!app) notFound();

  const isRejected = app.stage === 'rejected';
  const currentStageIndex = STAGES.indexOf(app.stage as typeof STAGES[number]);

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <Link href="/dashboard/ats/applications" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          &larr; Back to Pipeline
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{app.full_name}</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Applied for <Link href={`/dashboard/ats/jobs/${app.job_id}`} className="text-rose-400 hover:text-rose-300">{app.job_title}</Link>
            </p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
            isRejected
              ? 'bg-red-500/10 text-red-400 border-red-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            {app.stage}
          </span>
        </div>
      </div>

      {/* Stage progress bar */}
      <div className={`${glass} p-5`}>
        <div className="flex items-center justify-between gap-1">
          {STAGES.map((stage, i) => {
            const isPast = !isRejected && currentStageIndex >= i;
            const isCurrent = !isRejected && app.stage === stage;
            return (
              <div key={stage} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-center">
                  {i > 0 && (
                    <div className={`flex-1 h-0.5 ${isPast ? STAGE_COLOR[stage] : 'bg-zinc-800'}`} />
                  )}
                  <div className={`h-3 w-3 rounded-full shrink-0 ${
                    isCurrent ? `${STAGE_COLOR[stage]} ring-2 ring-offset-1 ring-offset-zinc-900 ring-current` :
                    isPast ? STAGE_COLOR[stage] : 'bg-zinc-800'
                  }`} />
                  {i < STAGES.length - 1 && (
                    <div className={`flex-1 h-0.5 ${isPast && currentStageIndex > i ? STAGE_COLOR[STAGES[i + 1]] : 'bg-zinc-800'}`} />
                  )}
                </div>
                <span className={`text-[10px] font-medium capitalize ${isCurrent ? 'text-white' : 'text-zinc-600'}`}>
                  {stage}
                </span>
              </div>
            );
          })}
        </div>
        {isRejected && (
          <div className="mt-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5">
            <p className="text-xs font-medium text-red-400">Rejected</p>
            {app.rejection_reason && <p className="text-xs text-red-300/70 mt-0.5">{app.rejection_reason}</p>}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column: candidate info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Candidate details */}
          <div className={glass}>
            <div className="px-6 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-300">Candidate Details</h2>
            </div>
            <div className="p-6 grid sm:grid-cols-2 gap-4">
              <Detail label="Email" value={app.email} isLink />
              <Detail label="Phone" value={app.phone} />
              <Detail label="Current Company" value={app.current_company} />
              <Detail label="Current Role" value={app.current_role} />
              <Detail label="Experience" value={app.experience_years != null ? `${app.experience_years} years` : null} />
              <Detail label="Notice Period" value={app.notice_period} />
              <Detail label="Current CTC" value={app.current_ctc} />
              <Detail label="Expected CTC" value={app.expected_ctc} />
              <Detail label="Source" value={app.source} />
              <Detail label="Applied" value={new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
              {app.linkedin_url && (
                <div>
                  <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">LinkedIn</p>
                  <a href={app.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm text-rose-400 hover:text-rose-300 underline">View Profile</a>
                </div>
              )}
              {app.cv_url && (
                <div>
                  <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">CV</p>
                  <a href={app.cv_url} target="_blank" rel="noopener noreferrer" className="text-sm text-rose-400 hover:text-rose-300 underline">Download CV</a>
                </div>
              )}
            </div>
          </div>

          {/* Cover letter */}
          {app.cover_letter && (
            <div className={glass}>
              <div className="px-6 py-4 border-b border-zinc-800">
                <h2 className="text-sm font-semibold text-zinc-300">Cover Letter</h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{app.cover_letter}</p>
              </div>
            </div>
          )}

          {/* Interview rounds */}
          <div className={glass}>
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-300">
                Interview Rounds <span className="text-zinc-600 font-normal">({interviews?.length ?? 0})</span>
              </h2>
            </div>
            {!interviews?.length ? (
              <div className="p-8 text-center">
                <p className="text-sm text-zinc-600">No interviews scheduled yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60">
                {interviews.map(round => (
                  <div key={round.id} className="px-6 py-5 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-500">Round {round.round_number}</span>
                          <span className="text-sm font-semibold text-white">
                            {ROUND_TYPE_LABEL[round.round_type] ?? round.round_type}
                          </span>
                        </div>
                        {round.interviewer && (
                          <p className="text-xs text-zinc-500 mt-0.5">Interviewer: {round.interviewer}</p>
                        )}
                        {round.scheduled_at && (
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {new Date(round.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {round.decision && (
                          <span className={`text-xs font-semibold capitalize ${DECISION_STYLE[round.decision] ?? 'text-zinc-400'}`}>
                            {round.decision}
                          </span>
                        )}
                        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium capitalize ${STATUS_STYLE[round.status] ?? STATUS_STYLE.scheduled}`}>
                          {round.status === 'no_show' ? 'No Show' : round.status}
                        </span>
                      </div>
                    </div>
                    {round.feedback && (
                      <div className="rounded-xl bg-zinc-800/40 px-4 py-3">
                        <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-1">Feedback</p>
                        <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{round.feedback}</p>
                      </div>
                    )}
                    {round.rating && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-zinc-600 mr-1">Rating:</span>
                        {[1, 2, 3, 4, 5].map(n => (
                          <span key={n} className={`text-xs ${n <= round.rating ? 'text-amber-400' : 'text-zinc-700'}`}>&#9733;</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          {app.notes && (
            <div className={glass}>
              <div className="px-6 py-4 border-b border-zinc-800">
                <h2 className="text-sm font-semibold text-zinc-300">Notes</h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{app.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right column: actions */}
        <div className="space-y-6">
          <ApplicationActions
            applicationId={app.id}
            currentStage={app.stage}
            currentRating={app.rating}
            currentNotes={app.notes}
            interviewCount={interviews?.length ?? 0}
          />
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, isLink }: { label: string; value: string | null | undefined; isLink?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">{label}</p>
      {isLink && value ? (
        <a href={`mailto:${value}`} className="text-sm text-rose-400 hover:text-rose-300">{value}</a>
      ) : (
        <p className="text-sm text-zinc-300 mt-0.5">{value || <span className="text-zinc-700">-</span>}</p>
      )}
    </div>
  );
}
