'use client';

import { Download, Printer } from 'lucide-react';

interface Props {
  sopId: string;
  sopTitle: string;
}

export default function SOPViewer({ sopId, sopTitle }: Props) {
  const pdfUrl = `/api/ims/sops/${sopId}/pdf`;
  const downloadUrl = `${pdfUrl}?download=1`;
  const filename = `${sopId}-${sopTitle.replace(/\s+/g, '-')}`;

  const handlePrint = () => {
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print();
      });
    }
  };

  return (
    <div className="mx-auto max-w-[850px]">
      {/* Action bar */}
      <div className="flex items-center justify-end gap-2 mb-3">
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-500 transition-colors"
        >
          <Printer className="h-3.5 w-3.5" />
          Print
        </button>
        <a
          href={downloadUrl}
          download={`${filename}.pdf`}
          className="flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 px-4 py-2 text-xs font-semibold text-white transition-colors shadow-lg"
        >
          <Download className="h-3.5 w-3.5" />
          Download PDF
        </a>
      </div>

      {/* PDF Viewer */}
      <div className="rounded-xl overflow-hidden shadow-2xl shadow-black/30 border border-zinc-800 bg-zinc-900">
        <object
          data={pdfUrl}
          type="application/pdf"
          className="w-full"
          style={{ height: 'calc(100vh - 160px)', minHeight: '600px' }}
        >
          {/* Fallback for browsers that don't support embedded PDF */}
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
            <p className="text-sm text-zinc-400">
              PDF preview is not available in this browser.
            </p>
            <a
              href={downloadUrl}
              download={`${filename}.pdf`}
              className="flex items-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </a>
          </div>
        </object>
      </div>
    </div>
  );
}
