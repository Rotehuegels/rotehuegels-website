'use client';

import { useState, useEffect } from 'react';
import { History, ChevronDown, User } from 'lucide-react';

type Version = {
  id: string;
  version_no: number;
  title: string | null;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  description: string | null;
  requirements: string | null;
  status: string | null;
  edited_by_email: string | null;
  snapshot_at: string;
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function JobVersions({ jobId }: { jobId: string }) {
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [versions, setVersions] = useState<Version[] | null>(null);

  useEffect(() => {
    if (!open || versions !== null) return;
    setLoading(true);
    fetch(`/api/ats/jobs/${jobId}/versions`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setVersions(d.data ?? []))
      .catch(() => setVersions([]))
      .finally(() => setLoading(false));
  }, [open, jobId, versions]);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
          <History className="h-4 w-4 text-zinc-500" />
          Edit history
          {versions !== null && <span className="text-xs text-zinc-600 font-normal">({versions.length})</span>}
        </span>
        <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-6 pb-5 -mt-1">
          {loading && <p className="text-xs text-zinc-500">Loading…</p>}
          {!loading && versions !== null && versions.length === 0 && (
            <p className="text-xs text-zinc-500">No edits yet — this is the original posting.</p>
          )}
          {!loading && versions && versions.length > 0 && (
            <ul className="space-y-2 text-sm">
              {versions.map(v => (
                <li key={v.id} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-mono text-zinc-300">v{v.version_no}</span>
                    <span className="text-zinc-500">{fmtDate(v.snapshot_at)}</span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-400">
                    <div><span className="text-zinc-600">Title:</span> <span className="text-zinc-300">{v.title}</span></div>
                    <div><span className="text-zinc-600">Status:</span> <span className="text-zinc-300 capitalize">{v.status}</span></div>
                    {v.department && <div><span className="text-zinc-600">Dept:</span> {v.department}</div>}
                    {v.location && <div><span className="text-zinc-600">Loc:</span> {v.location}</div>}
                    {v.employment_type && <div><span className="text-zinc-600">Type:</span> {v.employment_type}</div>}
                  </div>
                  {v.edited_by_email && (
                    <div className="mt-1.5 flex items-center gap-1 text-[11px] text-zinc-500">
                      <User className="h-3 w-3" /> Replaced by edit from {v.edited_by_email}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
