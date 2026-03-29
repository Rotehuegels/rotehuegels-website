'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STAGES = ['applied', 'shortlisted', 'interview', 'offer', 'hired', 'rejected'] as const;

const STYLE: Record<string, string> = {
  applied: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  shortlisted: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  interview: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  offer: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  hired: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/30',
};

export default function StageSelector({ applicationId, currentStage }: { applicationId: string; currentStage: string }) {
  const router = useRouter();
  const [stage, setStage] = useState(currentStage);
  const [loading, setLoading] = useState(false);

  async function change(newStage: string) {
    if (newStage === stage) return;
    setLoading(true);
    setStage(newStage);
    await fetch(`/api/ats/applications/${applicationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <select
      value={stage}
      onChange={e => change(e.target.value)}
      disabled={loading}
      className={`rounded-xl border px-3 py-1.5 text-xs font-medium capitalize cursor-pointer outline-none transition-opacity disabled:opacity-50 ${STYLE[stage] ?? STYLE.applied}`}
    >
      {STAGES.map(s => (
        <option key={s} value={s} className="bg-zinc-900 text-white capitalize">{s}</option>
      ))}
    </select>
  );
}
