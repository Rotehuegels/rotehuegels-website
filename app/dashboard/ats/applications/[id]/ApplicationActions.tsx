'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, ChevronRight, X, Calendar, MessageSquare, Plus } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const inputCls = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-rose-400/60 focus:ring-1 focus:ring-rose-400/30';
const btnPrimary = 'rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 transition-colors disabled:opacity-50';
const btnSecondary = 'rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:border-zinc-600 transition-colors disabled:opacity-50';

const STAGES = ['applied', 'shortlisted', 'interview', 'offer', 'hired'] as const;
const ROUND_TYPES = ['phone', 'technical', 'hr', 'culture', 'final'] as const;

type Props = {
  applicationId: string;
  currentStage: string;
  currentRating: number | null;
  currentNotes: string | null;
  interviewCount: number;
};

export default function ApplicationActions({ applicationId, currentStage, currentRating, currentNotes, interviewCount }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(currentRating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [notes, setNotes] = useState(currentNotes ?? '');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState<string | null>(null);

  // Interview form state
  const [roundType, setRoundType] = useState<string>('phone');
  const [scheduledAt, setScheduledAt] = useState('');
  const [interviewer, setInterviewer] = useState('');

  // Feedback form state
  const [fbStatus, setFbStatus] = useState('completed');
  const [fbFeedback, setFbFeedback] = useState('');
  const [fbRating, setFbRating] = useState(0);
  const [fbDecision, setFbDecision] = useState('');

  const stageIndex = STAGES.indexOf(currentStage as typeof STAGES[number]);
  const canAdvance = stageIndex >= 0 && stageIndex < STAGES.length - 1 && currentStage !== 'rejected';
  const nextStage = canAdvance ? STAGES[stageIndex + 1] : null;

  async function updateApplication(data: Record<string, unknown>) {
    setLoading(true);
    await fetch(`/api/ats/applications/${applicationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setLoading(false);
    router.refresh();
  }

  async function handleAdvance() {
    if (!nextStage) return;
    await updateApplication({ stage: nextStage });
  }

  async function handleReject() {
    await updateApplication({ stage: 'rejected', rejection_reason: rejectionReason || null });
    setShowRejectForm(false);
  }

  async function handleRating(value: number) {
    setRating(value);
    await updateApplication({ rating: value });
  }

  async function handleSaveNotes() {
    await updateApplication({ notes });
  }

  async function handleScheduleInterview() {
    setLoading(true);
    await fetch(`/api/ats/applications/${applicationId}/interviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        round_type: roundType,
        scheduled_at: scheduledAt || undefined,
        interviewer: interviewer || undefined,
      }),
    });
    setShowInterviewForm(false);
    setRoundType('phone');
    setScheduledAt('');
    setInterviewer('');
    setLoading(false);
    router.refresh();
  }

  async function handleSaveFeedback(roundId: string) {
    setLoading(true);
    await fetch(`/api/ats/applications/${applicationId}/interviews/${roundId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: fbStatus,
        feedback: fbFeedback || undefined,
        rating: fbRating || undefined,
        decision: fbDecision || undefined,
      }),
    });
    setShowFeedbackForm(null);
    setFbStatus('completed');
    setFbFeedback('');
    setFbRating(0);
    setFbDecision('');
    setLoading(false);
    router.refresh();
  }

  return (
    <>
      {/* Rating */}
      <div className={`${glass} p-5`}>
        <p className="text-xs font-medium text-zinc-500 mb-2">Rating</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => handleRating(n)}
              disabled={loading}
              className="p-0.5 transition-transform hover:scale-110 disabled:opacity-50"
            >
              <Star
                className={`h-5 w-5 transition-colors ${
                  n <= (hoverRating || rating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-zinc-700'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Stage actions */}
      {currentStage !== 'rejected' && currentStage !== 'hired' && (
        <div className={`${glass} p-5 space-y-3`}>
          <p className="text-xs font-medium text-zinc-500">Actions</p>
          {canAdvance && (
            <button onClick={handleAdvance} disabled={loading} className={`${btnPrimary} w-full flex items-center justify-center gap-2`}>
              <span>Advance to {nextStage}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
          {!showRejectForm ? (
            <button onClick={() => setShowRejectForm(true)} className={`${btnSecondary} w-full flex items-center justify-center gap-2 text-red-400 border-red-500/20 hover:border-red-500/40`}>
              <X className="h-4 w-4" /> Reject
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection (optional)"
                rows={3}
                className={`${inputCls} resize-none`}
              />
              <div className="flex gap-2">
                <button onClick={handleReject} disabled={loading} className={`${btnPrimary} flex-1 !bg-red-600 hover:!bg-red-500`}>
                  Confirm Reject
                </button>
                <button onClick={() => setShowRejectForm(false)} className={`${btnSecondary} flex-1`}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schedule interview */}
      <div className={`${glass} p-5 space-y-3`}>
        <p className="text-xs font-medium text-zinc-500">Interviews</p>
        {!showInterviewForm ? (
          <button onClick={() => setShowInterviewForm(true)} className={`${btnSecondary} w-full flex items-center justify-center gap-2`}>
            <Plus className="h-4 w-4" /> Schedule Interview
          </button>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-medium text-zinc-500 mb-1">Round type</label>
              <select value={roundType} onChange={e => setRoundType(e.target.value)} className={`${inputCls} cursor-pointer`}>
                {ROUND_TYPES.map(rt => (
                  <option key={rt} value={rt} className="bg-zinc-900">{rt.charAt(0).toUpperCase() + rt.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-zinc-500 mb-1">Date &amp; Time</label>
              <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-zinc-500 mb-1">Interviewer</label>
              <input value={interviewer} onChange={e => setInterviewer(e.target.value)} placeholder="e.g. Sivakumar" className={inputCls} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleScheduleInterview} disabled={loading} className={`${btnPrimary} flex-1 flex items-center justify-center gap-2`}>
                <Calendar className="h-4 w-4" /> Schedule
              </button>
              <button onClick={() => setShowInterviewForm(false)} className={`${btnSecondary} flex-1`}>
                Cancel
              </button>
            </div>
          </div>
        )}
        {interviewCount > 0 && !showFeedbackForm && (
          <button
            onClick={() => setShowFeedbackForm('latest')}
            className={`${btnSecondary} w-full flex items-center justify-center gap-2 text-xs`}
          >
            <MessageSquare className="h-3.5 w-3.5" /> Add Feedback to Latest Round
          </button>
        )}
      </div>

      {/* Notes */}
      <div className={`${glass} p-5 space-y-3`}>
        <p className="text-xs font-medium text-zinc-500">Notes</p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Internal notes about this candidate..."
          rows={4}
          className={`${inputCls} resize-none`}
        />
        <button onClick={handleSaveNotes} disabled={loading} className={`${btnSecondary} w-full`}>
          Save Notes
        </button>
      </div>
    </>
  );
}
