import FYSelector from './FYSelector';
import { BadgePercent } from 'lucide-react';
import PDFDocumentViewer from '@/components/PDFDocumentViewer';

export default async function GSTPage({ searchParams }: { searchParams: Promise<{ fy?: string }> }) {
  const { fy: fyParam } = await searchParams;
  const fy = fyParam ?? '2025-26';
  const [startYear] = fy.split('-').map(Number);
  const label = `FY ${startYear}-${startYear + 1}`;

  return (
    <div className="p-4 print:p-0">
      <div className="flex items-center justify-between mb-4 no-print">
        <div className="flex items-center gap-3">
          <BadgePercent className="h-5 w-5 text-amber-400" />
          <h1 className="text-lg font-bold text-white">GST Report</h1>
          <span className="text-xs text-zinc-500">{label}</span>
        </div>
        <FYSelector current={fy} />
      </div>
      <PDFDocumentViewer
        pdfUrl={`/api/accounts/gst/pdf?fy=${fy}`}
        filename={`GST-Report-${fy}`}
      />
    </div>
  );
}
