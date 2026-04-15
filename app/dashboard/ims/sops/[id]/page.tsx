import Link from 'next/link';
import { FileText, ArrowLeft, BookOpen, Users, ListChecks, Link2, Target } from 'lucide-react';
import { ALL_SOPS, getSOPById } from '@/lib/sops';
import { notFound } from 'next/navigation';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

export function generateStaticParams() {
  return ALL_SOPS.map(sop => ({ id: sop.id }));
}

export default async function SOPDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sop = getSOPById(id);
  if (!sop) return notFound();

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-4xl">
      {/* Back link */}
      <Link
        href="/d/ims/sops"
        className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to SOPs
      </Link>

      {/* Header */}
      <div className={`${glass} p-6`}>
        <div className="flex items-start gap-3">
          <FileText className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-mono text-amber-400 font-semibold">{sop.id}</p>
            <h1 className="text-xl font-bold text-white mt-1">{sop.title}</h1>
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-zinc-500">
              <span>Department: <strong className="text-zinc-300">{sop.department}</strong></span>
              <span>Category: <strong className="text-zinc-300">{sop.category}</strong></span>
              <span>Version: <strong className="text-zinc-300">{sop.version}</strong></span>
              <span>Effective: <strong className="text-zinc-300">{sop.effectiveDate}</strong></span>
              <span>Review: <strong className="text-zinc-300">{sop.reviewDate}</strong></span>
            </div>
            <p className="text-xs text-zinc-600 mt-2">Approved by: {sop.approvedBy}</p>
          </div>
        </div>
      </div>

      {/* Purpose */}
      <div className={`${glass} p-6`}>
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-sky-400" />
          <h2 className="text-sm font-semibold text-white">1. Purpose</h2>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed">{sop.purpose}</p>
      </div>

      {/* Scope */}
      <div className={`${glass} p-6`}>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-white">2. Scope</h2>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed">{sop.scope}</p>
      </div>

      {/* Responsibilities */}
      <div className={`${glass} p-6`}>
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-white">3. Responsibilities</h2>
        </div>
        <ul className="space-y-2">
          {sop.responsibilities.map((r, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="text-amber-400 shrink-0 mt-0.5">&#9679;</span>
              <span className="text-zinc-400">{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Procedure */}
      <div className={`${glass} p-6`}>
        <div className="flex items-center gap-2 mb-4">
          <ListChecks className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">4. Procedure</h2>
        </div>
        <div className="space-y-4">
          {sop.procedure.map(step => (
            <div key={step.step} className="flex gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <span className="text-xs font-bold text-emerald-400">{step.step}</span>
              </div>
              <div className="flex-1 pt-0.5">
                <h3 className="text-sm font-semibold text-white">{step.action}</h3>
                <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{step.detail}</p>
                {step.system && (
                  <p className="text-xs text-zinc-600 mt-1.5 font-mono">
                    System: {step.system}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      {sop.kpis && sop.kpis.length > 0 && (
        <div className={`${glass} p-6`}>
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-rose-400" />
            <h2 className="text-sm font-semibold text-white">5. Key Performance Indicators</h2>
          </div>
          <ul className="space-y-2">
            {sop.kpis.map((kpi, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="text-rose-400 shrink-0 mt-0.5">&#9670;</span>
                <span className="text-zinc-400">{kpi}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Related Documents */}
      <div className={`${glass} p-6`}>
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">6. Related Documents</h2>
        </div>
        <ul className="space-y-1.5">
          {sop.relatedDocs.map((doc, i) => (
            <li key={i} className="text-sm text-zinc-400 flex gap-2">
              <span className="text-cyan-400 shrink-0">&#8212;</span>
              {doc}
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-zinc-600 py-4">
        <p>This is a controlled document under the Rotehügels Integrated Management System.</p>
        <p>Uncontrolled when printed. Always refer to the ERP for the current version.</p>
      </div>
    </div>
  );
}
