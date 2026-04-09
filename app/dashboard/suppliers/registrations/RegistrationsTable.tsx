'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface Registration {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  gstin: string | null;
  pan: string | null;
  categories: string[];
  certifications: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

export default function RegistrationsTable({
  registrations,
  currentStatus,
}: {
  registrations: Registration[];
  currentStatus: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading]   = useState<string | null>(null);
  const [error, setError]       = useState('');

  async function review(id: string, action: 'approved' | 'rejected', reason?: string) {
    setLoading(id);
    setError('');
    const res = await fetch(`/api/supplier-registrations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: action, rejection_reason: reason }),
    });
    setLoading(null);
    if (!res.ok) { const j = await res.json(); setError(j.error ?? 'Failed'); return; }
    startTransition(() => router.refresh());
  }

  if (registrations.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-zinc-500 text-sm">No {currentStatus} registrations.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-800/60">
      {error && (
        <div className="px-5 py-3 text-sm text-rose-400 bg-rose-500/10">{error}</div>
      )}
      {registrations.map((r) => {
        const isExpanded = expanded === r.id;
        return (
          <div key={r.id} className="p-5">
            {/* Summary row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-white">{r.company_name}</p>
                  {r.gstin && (
                    <span className="font-mono text-xs text-zinc-500 bg-zinc-800 rounded px-1.5 py-0.5">{r.gstin}</span>
                  )}
                </div>
                <p className="text-sm text-zinc-400 mt-0.5">{r.contact_person} · {r.email}{r.phone ? ` · ${r.phone}` : ''}</p>
                {(r.city || r.state) && (
                  <p className="text-xs text-zinc-500 mt-0.5">{[r.city, r.state].filter(Boolean).join(', ')}</p>
                )}
                {/* Categories */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {r.categories.slice(0, 4).map(cat => (
                    <span key={cat} className="rounded-full bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-xs text-zinc-300">{cat}</span>
                  ))}
                  {r.categories.length > 4 && (
                    <span className="rounded-full bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-xs text-zinc-500">
                      +{r.categories.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-zinc-600">
                  {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <button
                  onClick={() => setExpanded(isExpanded ? null : r.id)}
                  className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3 text-sm">
                {r.categories.length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5">All Categories</p>
                    <div className="flex flex-wrap gap-1.5">
                      {r.categories.map(cat => (
                        <span key={cat} className="rounded-full bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-xs text-zinc-300">{cat}</span>
                      ))}
                    </div>
                  </div>
                )}
                {r.certifications && (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Certifications</p>
                    <p className="text-zinc-300">{r.certifications}</p>
                  </div>
                )}
                {r.notes && (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Notes</p>
                    <p className="text-zinc-300">{r.notes}</p>
                  </div>
                )}
                {r.pan && (
                  <p className="text-xs text-zinc-500">PAN: <span className="font-mono text-zinc-300">{r.pan}</span></p>
                )}
              </div>
            )}

            {/* Actions */}
            {currentStatus === 'pending' && (
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => review(r.id, 'approved')}
                  disabled={loading === r.id}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                >
                  {loading === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  Approve
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Reason for rejection (optional):') ?? undefined;
                    review(r.id, 'rejected', reason);
                  }}
                  disabled={loading === r.id}
                  className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                >
                  <X className="h-3 w-3" /> Reject
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
