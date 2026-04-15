import { Scale } from 'lucide-react';
import PDFDocumentViewer from '@/components/PDFDocumentViewer';

export default async function TrialBalancePage({ searchParams }: { searchParams: Promise<{ fy?: string }> }) {
  const { fy: fyParam } = await searchParams;
  const fy = fyParam ?? '2025-26';
  const [startYear] = fy.split('-').map(Number);

  return (
    <div className="p-4 print:p-0">
      <div className="flex items-center justify-between mb-4 no-print">
        <div className="flex items-center gap-3">
          <Scale className="h-5 w-5 text-amber-400" />
          <h1 className="text-lg font-bold text-white">Trial Balance</h1>
          <span className="text-xs text-zinc-500">FY {startYear}-{startYear + 1}</span>
        </div>
        <select
          defaultValue={fy}
          onChange={() => {}}
          className="rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2 text-sm text-white"
        >
          <option value="2025-26">FY 2025-26</option>
          <option value="2024-25">FY 2024-25</option>
        </select>
      </div>
      <PDFDocumentViewer
        pdfUrl={`/api/accounts/trial-balance?fy=${fy}`}
        filename={`Trial-Balance-${fy}`}
      />
    </div>
  );
}
