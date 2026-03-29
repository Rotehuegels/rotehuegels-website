'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const NEXT_STATUS: Record<string, { label: string; next: string }> = {
  draft: { label: 'Draft', next: 'published' },
  published: { label: 'Published', next: 'closed' },
  closed: { label: 'Closed', next: 'published' },
};

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  published: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  closed: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function JobStatusToggle({ jobId, currentStatus }: { jobId: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(currentStatus);

  async function toggle() {
    const next = NEXT_STATUS[status]?.next ?? 'draft';
    setLoading(true);
    await fetch(`/api/ats/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    setStatus(next);
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={toggle} disabled={loading}
      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize transition-opacity disabled:opacity-50 ${STATUS_STYLE[status] ?? STATUS_STYLE.draft}`}>
      {loading ? '…' : NEXT_STATUS[status]?.label ?? status}
    </button>
  );
}
