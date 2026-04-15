'use client';

import { Download, Loader2 } from 'lucide-react';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

interface Props {
  sopId: string;
  sopTitle: string;
}

export default function SOPViewer({ sopId, sopTitle }: Props) {
  const pdfUrl = `/api/ims/sops/${sopId}/pdf`;
  const downloadUrl = `${pdfUrl}?download=1`;
  const filename = `${sopId}-${sopTitle.replace(/\s+/g, '-')}`;

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: () => [],
    toolbarPlugin: {
      fullScreenPlugin: { onEnterFullScreen: () => {}, onExitFullScreen: () => {} },
    },
  });

  return (
    <div className="w-full">
      {/* Download button */}
      <div className="flex items-center justify-end gap-2 mb-3">
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
      <div
        className="rounded-xl overflow-hidden shadow-2xl shadow-black/30 border border-zinc-800"
        style={{ height: 'calc(100vh - 150px)', minHeight: '600px' }}
      >
        <Worker workerUrl="/fonts/pdf.worker.min.js">
          <Viewer
            fileUrl={pdfUrl}
            plugins={[defaultLayoutPluginInstance]}
            defaultScale={SpecialZoomLevel.PageFit}
            renderLoader={(percentages: number) => (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
                <p className="text-sm text-zinc-400">Loading PDF... {Math.round(percentages)}%</p>
              </div>
            )}
          />
        </Worker>
      </div>
    </div>
  );
}
