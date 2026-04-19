'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FlaskConical, ArrowLeft, Loader2, CheckCircle2, AlertTriangle,
  Filter, Beaker,
} from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const SAMPLE_TYPES = ['all', 'zinc', 'electrolyte', 'dross', 'water'] as const;

const typeColor: Record<string, string> = {
  zinc:        'bg-blue-500/10 text-blue-400 border-blue-500/30',
  electrolyte: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  dross:       'bg-amber-500/10 text-amber-400 border-amber-500/30',
  water:       'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
};

const statusColor: Record<string, string> = {
  pending:     'bg-zinc-500/10 text-zinc-400',
  in_progress: 'bg-blue-500/10 text-blue-400',
  completed:   'bg-emerald-500/10 text-emerald-400',
  cancelled:   'bg-red-500/10 text-red-400',
};

interface Sample {
  id: string;
  sample_code: string;
  sample_type: string;
  status: string;
  collected_at: string;
  result_count: number;
  out_of_spec_count: number;
}

export default function LabDashboardPage() {
  const { projectId } = useParams();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetch(`/api/portal/projects/${projectId}/operations/lab`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setSamples(d); })
      .finally(() => setLoading(false));
  }, [projectId]);

  const filtered = filter === 'all'
    ? samples
    : samples.filter(s => s.sample_type === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1800px] mx-auto space-y-6">

      {/* Back + Header */}
      <div>
        <Link
          href={`/portal/${projectId}/operations`}
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mb-3"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Operations
        </Link>
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-rose-400" />
          <h1 className="text-xl font-bold text-white">LabREX &mdash; Quality Control</h1>
        </div>
        <p className="text-sm text-zinc-500 mt-0.5">Laboratory Results Explorer</p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-zinc-500" />
        {SAMPLE_TYPES.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === t
                ? 'bg-rose-600 text-white'
                : 'bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            {t === 'all' ? 'All Samples' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Samples */}
      {filtered.length === 0 ? (
        <div className={`${glass} p-12 text-center`}>
          <Beaker className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500">
            {samples.length === 0
              ? 'No lab samples recorded yet.'
              : 'No samples match the selected filter.'}
          </p>
          {samples.length === 0 && (
            <p className="text-xs text-zinc-600 mt-1">Samples will appear here once lab testing begins.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(sample => {
            const allInSpec = sample.out_of_spec_count === 0 && sample.result_count > 0;
            const hasOutOfSpec = sample.out_of_spec_count > 0;
            const tColor = typeColor[sample.sample_type] ?? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30';
            const sColor = statusColor[sample.status] ?? statusColor.pending;

            return (
              <Link
                key={sample.id}
                href={`/portal/${projectId}/operations/lab/${sample.id}`}
                className={`${glass} p-4 hover:border-zinc-700 transition-colors group block`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-rose-400 transition-colors">
                      {sample.sample_code}
                    </p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium border ${tColor}`}>
                      {sample.sample_type}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sColor}`}>
                    {sample.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
                  <span>Collected: {fmtDate(sample.collected_at)}</span>
                  <span>{sample.result_count} result{sample.result_count !== 1 ? 's' : ''}</span>
                </div>

                {/* Spec Compliance */}
                <div className="flex items-center gap-2">
                  {allInSpec && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      All within spec
                    </span>
                  )}
                  {hasOutOfSpec && (
                    <span className="flex items-center gap-1 text-xs text-red-400">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {sample.out_of_spec_count} out of spec
                    </span>
                  )}
                  {sample.result_count === 0 && (
                    <span className="text-xs text-zinc-600">Awaiting results</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
