import Link from 'next/link';
import { getSOPById } from '@/lib/sops';
import { notFound } from 'next/navigation';
import SOPViewer from './SOPViewer';

export default async function SOPDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sop = getSOPById(id);
  if (!sop) return notFound();

  return (
    <div className="p-4 print:p-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 no-print">
        <div className="flex items-center gap-3">
          <Link href="/d/ims/sops" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            &larr; Back to SOPs
          </Link>
          <span className="text-zinc-700">|</span>
          <span className="font-mono text-sm text-amber-400 font-bold">{sop.id}</span>
          <span className="text-sm text-zinc-500">{sop.title}</span>
        </div>
      </div>

      {/* PDF Viewer */}
      <SOPViewer sopId={sop.id} sopTitle={sop.title} />
    </div>
  );
}
