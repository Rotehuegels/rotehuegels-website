import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { FileCheck, Search } from 'lucide-react';
import DocumentsFilterBar from './DocumentsFilterBar';
import { Suspense } from 'react';

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

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function DocumentRegistryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : '';
  const typeFilter = typeof sp.type === 'string' ? sp.type : 'all';
  const statusFilter = typeof sp.status === 'string' ? sp.status : 'all';
  const deptFilter = typeof sp.department === 'string' ? sp.department : 'all';

  let query = supabaseAdmin
    .from('document_registry')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (typeFilter !== 'all') query = query.eq('doc_type', typeFilter);
  if (statusFilter !== 'all') query = query.eq('status', statusFilter);
  if (deptFilter !== 'all') query = query.eq('department', deptFilter);
  if (q) query = query.or(`doc_number.ilike.%${q}%,title.ilike.%${q}%`);

  const { data: docs } = await query;
  const documents = docs ?? [];

  // Stats
  const total = documents.length;
  const approved = documents.filter(d => d.status === 'approved').length;
  const underReview = documents.filter(d => d.status === 'under_review').length;
  const drafts = documents.filter(d => d.status === 'draft').length;

  return (
    <div className="p-5 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileCheck className="h-5 w-5 text-emerald-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Document Registry</h1>
            <p className="mt-0.5 text-sm text-zinc-500">IMS controlled documents (ISO 9001:2015 &sect;7.5)</p>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Documents', value: total, color: 'text-white' },
          { label: 'Approved', value: approved, color: 'text-emerald-400' },
          { label: 'Under Review', value: underReview, color: 'text-sky-400' },
          { label: 'Drafts', value: drafts, color: 'text-zinc-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`${glass} p-4`}>
            <p className="text-xs text-zinc-500">{label}</p>
            <p className={`text-lg font-black mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <Suspense fallback={null}>
        <DocumentsFilterBar />
      </Suspense>

      {/* Documents table */}
      <div className={glass}>
        {documents.length === 0 ? (
          <div className="p-12 text-center">
            <Search className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No documents found.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="hidden lg:grid grid-cols-[180px_1fr_110px_100px_110px_100px_90px_70px] gap-4 px-6 py-3 border-b border-zinc-800/60 text-[11px] font-medium uppercase tracking-wider text-zinc-600">
              <span>Doc Number</span>
              <span>Title</span>
              <span>Type</span>
              <span>Ver / Rev</span>
              <span>Status</span>
              <span>Department</span>
              <span>Date</span>
              <span></span>
            </div>

            <div className="divide-y divide-zinc-800/60">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className="flex flex-col lg:grid lg:grid-cols-[180px_1fr_110px_100px_110px_100px_90px_70px] gap-2 lg:gap-4 px-6 py-4 hover:bg-zinc-800/20 transition-colors items-start lg:items-center"
                >
                  <div>
                    <p className="text-sm font-mono font-semibold text-amber-400">{doc.doc_number}</p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{doc.title}</p>
                    {doc.description && (
                      <p className="text-xs text-zinc-500 truncate mt-0.5">{doc.description}</p>
                    )}
                  </div>

                  <div>
                    <span className="text-xs text-zinc-400">{TYPE_LABEL[doc.doc_type] ?? doc.doc_type}</span>
                  </div>

                  <div>
                    <span className="text-xs font-mono text-zinc-300">v{doc.version} / {doc.revision}</span>
                  </div>

                  <div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLE[doc.status] ?? STATUS_STYLE.draft}`}>
                      {STATUS_LABEL[doc.status] ?? doc.status}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-zinc-400 capitalize">{doc.department ?? '—'}</span>
                  </div>

                  <div>
                    <span className="text-xs text-zinc-500">{formatDate(doc.created_at)}</span>
                  </div>

                  <div>
                    <Link
                      href={`/dashboard/documents/${doc.id}`}
                      className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-600 transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
