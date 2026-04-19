'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { GitPullRequest, Plus, Clock, CheckCircle2, XCircle, Search, Loader2 } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  requested:    { icon: Clock,        color: 'text-amber-400 bg-amber-500/10',   label: 'Requested' },
  under_review: { icon: Search,       color: 'text-blue-400 bg-blue-500/10',     label: 'Under Review' },
  approved:     { icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10', label: 'Approved' },
  rejected:     { icon: XCircle,      color: 'text-red-400 bg-red-500/10',       label: 'Rejected' },
  implemented:  { icon: CheckCircle2, color: 'text-cyan-400 bg-cyan-500/10',     label: 'Implemented' },
};

interface ChangeRequest {
  id: string;
  change_no: string;
  title: string;
  description: string;
  reason: string | null;
  cost_impact: number;
  schedule_impact: string | null;
  status: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  created_at: string;
}

export default function ChangesPage() {
  const { projectId } = useParams();
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/portal/projects/${projectId}/changes`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setChanges(d); })
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1800px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Change Requests</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Request scope changes for this project</p>
        </div>
        <Link
          href={`/portal/${projectId}/changes/new`}
          className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Request
        </Link>
      </div>

      {changes.length === 0 ? (
        <div className={`${glass} p-12 text-center`}>
          <GitPullRequest className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No change requests yet.</p>
          <p className="text-zinc-600 text-xs mt-1">Use the button above to request a scope change.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {changes.map(cr => {
            const cfg = statusConfig[cr.status] ?? statusConfig.requested;
            const Icon = cfg.icon;
            return (
              <div key={cr.id} className={`${glass} p-5`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-zinc-600">{cr.change_no}</span>
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white">{cr.title}</h3>
                  </div>
                  <span className="text-xs text-zinc-600 shrink-0">{fmtDate(cr.created_at)}</span>
                </div>

                <p className="text-xs text-zinc-400 mb-2">{cr.description}</p>

                {cr.reason && (
                  <p className="text-xs text-zinc-500 mb-2"><strong>Reason:</strong> {cr.reason}</p>
                )}

                <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
                  {cr.cost_impact !== 0 && (
                    <span className={cr.cost_impact > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                      Cost impact: {cr.cost_impact > 0 ? '+' : ''}{fmt(cr.cost_impact)}
                    </span>
                  )}
                  {cr.schedule_impact && (
                    <span>Schedule: {cr.schedule_impact}</span>
                  )}
                </div>

                {cr.admin_notes && (
                  <div className="mt-3 pt-3 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500"><strong>Response:</strong> {cr.admin_notes}</p>
                    {cr.reviewed_by && <p className="text-xs text-zinc-600 mt-0.5">— {cr.reviewed_by}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
