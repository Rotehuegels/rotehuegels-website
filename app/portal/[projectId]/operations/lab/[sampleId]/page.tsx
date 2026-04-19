/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect, notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getPortalUser } from '@/lib/portalAuth';
import Link from 'next/link';
import {
  FlaskConical, ArrowLeft, CheckCircle2, XCircle, Clock, User, Calendar, Tag,
} from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

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

export default async function SampleDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; sampleId: string }>;
}) {
  const portalUser = await getPortalUser();
  if (!portalUser) redirect('/login?next=/portal');

  const { projectId, sampleId } = await params;

  // Verify project ownership
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .eq('customer_id', portalUser.customerId)
    .single();

  if (!project) notFound();

  // Fetch sample with results directly
  const { data: sample } = await supabaseAdmin
    .from('lab_samples')
    .select('*, lab_results(*, lab_parameters(name, unit))')
    .eq('id', sampleId)
    .single();

  if (!sample) notFound();

  const rawResults = (sample.lab_results ?? []) as any[];
  const results = rawResults.map((r: any) => ({
    parameter_name: r.lab_parameters?.name ?? 'Unknown',
    value: r.value,
    unit: r.unit || r.lab_parameters?.unit || '',
    min_spec: r.min_spec,
    max_spec: r.max_spec,
    within_spec: r.is_within_spec,
  }));

  const withinSpecCount = results.filter((r: any) => r.within_spec === true).length;
  const totalResults = results.length;

  const tColor = typeColor[sample.sample_type] ?? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30';
  const sColor = statusColor[sample.status] ?? statusColor.pending;

  return (
    <div className="p-6 max-w-[1800px] mx-auto space-y-6">

      {/* Back Link */}
      <Link
        href={`/p/${projectId}/operations/lab`}
        className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
      >
        <ArrowLeft className="h-3 w-3" /> Back to LabREX Dashboard
      </Link>

      {/* Sample Header */}
      <div className={`${glass} p-5`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-6 w-6 text-rose-400 shrink-0" />
            <div>
              <h1 className="text-xl font-bold text-white">{sample.sample_code}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${tColor}`}>
                  {sample.sample_type}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sColor}`}>
                  {(sample.status ?? 'pending').replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-zinc-500 shrink-0" />
            <div>
              <p className="text-xs text-zinc-500">Collected</p>
              <p className="text-zinc-300">{fmtDate(sample.collected_at ?? sample.collected_date)}</p>
            </div>
          </div>
          {sample.collected_by && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-zinc-500 shrink-0" />
              <div>
                <p className="text-xs text-zinc-500">Collected By</p>
                <p className="text-zinc-300">{sample.collected_by}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-zinc-500 shrink-0" />
            <div>
              <p className="text-xs text-zinc-500">Type</p>
              <p className="text-zinc-300 capitalize">{sample.sample_type}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-zinc-500 shrink-0" />
            <div>
              <p className="text-xs text-zinc-500">Status</p>
              <p className="text-zinc-300 capitalize">{(sample.status ?? 'pending').replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      {results.length === 0 ? (
        <div className={`${glass} p-12 text-center`}>
          <FlaskConical className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500">No test results recorded yet for this sample.</p>
          <p className="text-xs text-zinc-600 mt-1">Results will appear here once lab analysis is complete.</p>
        </div>
      ) : (
        <div className={`${glass} p-5`}>
          <h2 className="text-sm font-semibold text-white mb-4">Test Results</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[580px]">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wide">
                  <th className="text-left py-2 pr-4">Parameter</th>
                  <th className="text-right py-2 pr-4">Value</th>
                  <th className="text-left py-2 pr-4">Unit</th>
                  <th className="text-right py-2 pr-4">Min Spec</th>
                  <th className="text-right py-2 pr-4">Max Spec</th>
                  <th className="text-center py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r: any, i: number) => {
                  const pass = r.within_spec === true;
                  const fail = r.within_spec === false;
                  return (
                    <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                      <td className="py-2.5 pr-4 text-zinc-300 font-medium">{r.parameter_name ?? r.parameter}</td>
                      <td className={`py-2.5 pr-4 text-right font-mono ${fail ? 'text-red-400 font-semibold' : 'text-white'}`}>
                        {r.value ?? '—'}
                      </td>
                      <td className="py-2.5 pr-4 text-zinc-500">{r.unit ?? ''}</td>
                      <td className="py-2.5 pr-4 text-right text-zinc-500">{r.min_spec ?? '—'}</td>
                      <td className="py-2.5 pr-4 text-right text-zinc-500">{r.max_spec ?? '—'}</td>
                      <td className="py-2.5 text-center">
                        {pass && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Pass
                          </span>
                        )}
                        {fail && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400">
                            <XCircle className="h-3 w-3" />
                            Fail
                          </span>
                        )}
                        {!pass && !fail && (
                          <span className="text-xs text-zinc-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
            <p className="text-sm text-zinc-400">
              <span className="font-medium text-white">{withinSpecCount}</span> of{' '}
              <span className="font-medium text-white">{totalResults}</span> parameters within specification
            </p>
            {withinSpecCount === totalResults ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                All within spec
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-red-400 font-medium">
                <XCircle className="h-4 w-4" />
                {totalResults - withinSpecCount} out of spec
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
