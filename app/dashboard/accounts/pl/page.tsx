import FYSelector from './FYSelector';
import { FileText } from 'lucide-react';
import PDFDocumentViewer from '@/components/PDFDocumentViewer';

export default async function PLPage({ searchParams }: { searchParams: Promise<{ fy?: string }> }) {
  const { fy: fyParam } = await searchParams;
  const fy = fyParam ?? '2025-26';
  const [startYear] = fy.split('-').map(Number);
  const label = `FY ${startYear}-${startYear + 1}`;

  return (
    <div className="p-4 print:p-0">
      <div className="flex items-center justify-between mb-4 no-print">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-amber-400" />
          <h1 className="text-lg font-bold text-white">P&amp;L Statement</h1>
          <span className="text-xs text-zinc-500">{label}</span>
        </div>
        <FYSelector current={fy} />
      </div>
      <PDFDocumentViewer
        pdfUrl={`/api/accounts/pl/pdf?fy=${fy}`}
        filename={`PL-Statement-${fy}`}
      />
    </div>
  );
}
