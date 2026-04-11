import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileCheck, Clock, CheckCircle2, XCircle, Eye } from 'lucide-react';
import DocumentActions from './DocumentActions';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  under_review: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  obsolete: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  superseded: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  under_review: 'Under Review',
  approved: 'Approved',
  obsolete: 'Obsolete',
  superseded: 'Superseded',
};

const TYPE_LABEL: Record<string, string> = {
  invoice: 'Invoice',
  quote: 'Quote',
  purchase_order: 'Purchase Order',
  proforma: 'Proforma',
  pl_statement: 'P&L Statement',
  gst_report: 'GST Report',
  customer_statement: 'Customer Statement',
  policy: 'Policy',
  procedure: 'SOP',
  form: 'Form',
  record: 'Record',
};

const ENTITY_LINKS: Record<string, string> = {
  order: '/dashboard/accounts/orders',
  quote: '/dashboard/accounts/quotes',
  purchase_order: '/dashboard/accounts/purchase-orders',
  expense: '/dashboard/accounts/expenses',
  customer: '/dashboard/accounts/customers',
  employee: '/dashboard/hr/employees',
};

const REVISION_ICONS: Record<string, typeof Clock> = {
  draft: Clock,
  under_review: Eye,
  approved: CheckCircle2,
  obsolete: XCircle,
};

function formatDateTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: doc } = await supabaseAdmin
    .from('document_registry')
    .select('*')
    .eq('id', id)
    .single();

  if (!doc) notFound();

  const { data: revisions } = await supabaseAdmin
    .from('document_revisions')
    .select('*')
    .eq('document_id', id)
    .order('changed_at', { ascending: false });

  const entityLink = doc.entity_type && doc.entity_id
    ? `${ENTITY_LINKS[doc.entity_type] ?? '#'}/${doc.entity_id}`
    : null;

  return (
    <div className="p-5 md:p-8 space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/documents"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to registry
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileCheck className="h-6 w-6 text-emerald-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">{doc.doc_number}</h1>
            <p className="mt-0.5 text-sm text-zinc-400">{doc.title}</p>
          </div>
        </div>
        <span className={`self-start text-sm font-semibold px-4 py-1.5 rounded-full border ${STATUS_STYLE[doc.status] ?? STATUS_STYLE.draft}`}>
          {STATUS_LABEL[doc.status] ?? doc.status}
        </span>
      </div>

      {/* Metadata grid */}
      <div className={`${glass} p-6`}>
        <h2 className="text-sm font-semibold text-white mb-4">Document Metadata</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
          {([
            ['Document Type', TYPE_LABEL[doc.doc_type] ?? doc.doc_type],
            ['Version / Revision', `v${doc.version} / ${doc.revision}`],
            ['Department', doc.department ? doc.department.charAt(0).toUpperCase() + doc.department.slice(1) : '—'],
            ['Classification', doc.classification ? doc.classification.charAt(0).toUpperCase() + doc.classification.slice(1) : '—'],
            ['Prepared By', doc.prepared_by ?? '—'],
            ['Prepared At', formatDateTime(doc.prepared_at)],
            ['Reviewed By', doc.reviewed_by ?? '—'],
            ['Reviewed At', formatDateTime(doc.reviewed_at)],
            ['Approved By', doc.approved_by ?? '—'],
            ['Approved At', formatDateTime(doc.approved_at)],
            ['Retention', `${doc.retention_years} years (expires ${doc.retention_expiry ?? '—'})`],
            ['Change Summary', doc.change_summary ?? '—'],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label}>
              <p className="text-[11px] uppercase tracking-wider text-zinc-600 font-medium">{label}</p>
              <p className="text-sm text-zinc-300 mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {doc.description && (
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <p className="text-[11px] uppercase tracking-wider text-zinc-600 font-medium">Description</p>
            <p className="text-sm text-zinc-300 mt-0.5">{doc.description}</p>
          </div>
        )}

        {doc.approval_notes && (
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <p className="text-[11px] uppercase tracking-wider text-zinc-600 font-medium">Approval Notes</p>
            <p className="text-sm text-zinc-300 mt-0.5">{doc.approval_notes}</p>
          </div>
        )}

        {entityLink && (
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <p className="text-[11px] uppercase tracking-wider text-zinc-600 font-medium mb-1">Linked Entity</p>
            <Link
              href={entityLink}
              className="inline-flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              View {doc.entity_type} &rarr;
            </Link>
          </div>
        )}

        {doc.tags && doc.tags.length > 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <p className="text-[11px] uppercase tracking-wider text-zinc-600 font-medium mb-1">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {doc.tags.map((tag: string) => (
                <span key={tag} className="rounded-full bg-zinc-800 border border-zinc-700 px-2.5 py-0.5 text-xs text-zinc-400">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <DocumentActions documentId={doc.id} currentStatus={doc.status} />

      {/* Revision history */}
      <div className={glass}>
        <div className="border-b border-zinc-800 px-6 py-3">
          <h2 className="font-semibold text-white text-sm">
            Revision History
            <span className="ml-2 text-zinc-500 font-normal">({(revisions ?? []).length} entries)</span>
          </h2>
        </div>

        {(!revisions || revisions.length === 0) ? (
          <div className="p-8 text-center">
            <p className="text-zinc-500 text-sm">No revision history.</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="relative border-l-2 border-zinc-800 ml-3 space-y-6">
              {revisions.map((rev) => {
                const Icon = REVISION_ICONS[rev.status] ?? Clock;
                return (
                  <div key={rev.id} className="relative pl-8">
                    {/* Timeline dot */}
                    <div className="absolute -left-[11px] top-0.5 rounded-full bg-zinc-900 border-2 border-zinc-700 p-1">
                      <Icon className="h-3 w-3 text-zinc-400" />
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-white">
                            v{rev.version} / {rev.revision}
                          </span>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLE[rev.status] ?? STATUS_STYLE.draft}`}>
                            {STATUS_LABEL[rev.status] ?? rev.status}
                          </span>
                        </div>
                        {rev.change_summary && (
                          <p className="text-xs text-zinc-400 mt-1">{rev.change_summary}</p>
                        )}
                        {rev.changed_by && (
                          <p className="text-[11px] text-zinc-600 mt-0.5">by {rev.changed_by}</p>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 shrink-0">{formatDateTime(rev.changed_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
