'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, HelpCircle, Loader2 } from 'lucide-react';

const statuses = [
  { value: 'met', label: 'Met', icon: Check, color: 'text-emerald-400 hover:bg-emerald-500/10' },
  { value: 'partially_met', label: 'Partial', icon: HelpCircle, color: 'text-amber-400 hover:bg-amber-500/10' },
  { value: 'missed', label: 'Missed', icon: X, color: 'text-red-400 hover:bg-red-500/10' },
];

export default function ClaimActions({ claimId, currentStatus }: { claimId: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: string) {
    setLoading(true);
    try {
      await fetch(`/api/investments/claims/${claimId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />;

  return (
    <div className="flex items-center gap-1 shrink-0">
      {statuses.map((s) => {
        const Icon = s.icon;
        const active = currentStatus === s.value;
        return (
          <button
            key={s.value}
            onClick={() => updateStatus(s.value)}
            title={s.label}
            className={`p-1.5 rounded-lg transition-colors ${
              active ? 'bg-zinc-700' : ''
            } ${s.color}`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
