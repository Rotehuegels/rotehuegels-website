'use client';

import { Download, Loader2, Send } from 'lucide-react';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { useState } from 'react';

interface Props {
  orderId: string;
  invoiceNo: string;
  queryString: string;
}

export default function InvoiceViewer({ orderId, invoiceNo, queryString }: Props) {
  const pdfUrl = `/api/accounts/orders/${orderId}/invoice/pdf${queryString}`;
  const downloadUrl = `${pdfUrl}${queryString ? '&' : '?'}download=1`;
  const filename = `Invoice-${invoiceNo.replace(/\//g, '-')}`;

  const [emailing, setEmailing] = useState(false);
  const [emailResult, setEmailResult] = useState<string | null>(null);

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: () => [],
  });

  const handleEmail = async () => {
    setEmailing(true);
    setEmailResult(null);
    try {
      const res = await fetch('/api/accounts/reinvoice/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      });
      const data = await res.json();
      if (data.error) setEmailResult(`Error: ${data.error}`);
      else setEmailResult(`Sent to ${data.sent_to}`);
    } catch { setEmailResult('Failed to send'); }
    finally { setEmailing(false); }
  };

  return (
    <div className="w-full">
      {/* Action bar */}
      <div className="flex items-center justify-end gap-2 mb-3 flex-wrap">
        {emailResult && (
          <span className={`text-xs px-3 py-1.5 rounded-lg ${emailResult.startsWith('Error') ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
            {emailResult}
          </span>
        )}
        <button
          onClick={handleEmail}
          disabled={emailing}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-500 transition-colors disabled:opacity-50"
        >
          {emailing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Email to Customer
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
      <div
        className="rounded-xl overflow-hidden shadow-2xl shadow-black/30 border border-zinc-800"
        style={{ height: 'calc(100vh - 150px)', minHeight: '600px' }}
      >
        <Worker workerUrl="/fonts/pdf.worker.min.js">
          <Viewer
            fileUrl={pdfUrl}
            plugins={[defaultLayoutPluginInstance]}
            defaultScale={SpecialZoomLevel.PageWidth}
            renderLoader={(percentages: number) => (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
                <p className="text-sm text-zinc-400">Loading invoice... {Math.round(percentages)}%</p>
              </div>
            )}
          />
        </Worker>
      </div>
    </div>
  );
}
