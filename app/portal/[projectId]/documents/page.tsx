import { redirect, notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getPortalUser } from '@/lib/portalAuth';
import { FileText, Download, File, Image, FileSpreadsheet } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const fmtSize = (bytes: number | null) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const typeIcon: Record<string, React.ElementType> = {
  drawing:      Image,
  report:       FileText,
  test_result:  FileSpreadsheet,
  certificate:  FileText,
  other:        File,
};

const typeLabel: Record<string, string> = {
  drawing:      'Drawing',
  report:       'Report',
  test_result:  'Test Result',
  certificate:  'Certificate',
  other:        'Document',
};

export default async function DocumentsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const portalUser = await getPortalUser();
  if (!portalUser) redirect('/login?next=/portal');

  const { projectId } = await params;

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .eq('customer_id', portalUser.customerId)
    .single();

  if (!project) notFound();

  const { data: documents } = await supabaseAdmin
    .from('project_documents')
    .select('*')
    .eq('project_id', projectId)
    .eq('visible_to_client', true)
    .order('created_at', { ascending: false });

  const list = documents ?? [];

  // Group by type
  const grouped = list.reduce<Record<string, typeof list>>((acc, doc) => {
    const type = doc.file_type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(doc);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-white mb-1">Documents</h1>
      <p className="text-sm text-zinc-500 mb-6">{project.name}</p>

      {list.length === 0 ? (
        <div className={`${glass} p-12 text-center`}>
          <FileText className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No documents shared yet.</p>
          <p className="text-zinc-600 text-xs mt-1">Documents will appear here when the team shares them.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([type, docs]) => {
            const Icon = typeIcon[type] ?? File;
            return (
              <div key={type}>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5" />
                  {typeLabel[type] ?? type}s ({docs.length})
                </h2>
                <div className="space-y-2">
                  {docs.map(doc => (
                    <div key={doc.id} className={`${glass} p-4 flex items-center justify-between gap-3`}>
                      <div className="min-w-0">
                        <p className="text-sm text-white font-medium truncate">{doc.file_name}</p>
                        <div className="flex gap-3 text-xs text-zinc-500 mt-0.5">
                          {doc.description && <span>{doc.description}</span>}
                          {doc.file_size && <span>{fmtSize(doc.file_size)}</span>}
                          <span>{fmtDate(doc.created_at)}</span>
                          {doc.uploaded_by && <span>by {doc.uploaded_by}</span>}
                        </div>
                      </div>
                      <a
                        href={`/api/projects/${projectId}/documents/${doc.id}/download`}
                        className="shrink-0 flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
