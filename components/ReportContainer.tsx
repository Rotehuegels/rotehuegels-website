'use client';

import { useEffect, useRef, useState } from 'react';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import { Download, Loader2, RefreshCw } from 'lucide-react';

interface Props {
  /** Filename for download (without .pdf) */
  filename: string;
  /** The document HTML to render as PDF */
  children: React.ReactNode;
}

export default function ReportContainer({ filename, children }: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(true);
  const [error, setError] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const generate = async () => {
    setGenerating(true);
    setError(false);
    setPdfUrl(null);

    // Small delay to let the hidden content render fully
    await new Promise(r => setTimeout(r, 500));

    try {
      const el = contentRef.current;
      if (!el) throw new Error('Content not found');

      const W = 210, H = 297;
      const jpeg = await toJpeg(el, { pixelRatio: 2, quality: 0.97, backgroundColor: '#ffffff' });
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = jpeg;
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const totalH = W * (img.height / img.width);
      const nPages = Math.ceil(totalH / H);

      for (let i = 0; i < nPages; i++) {
        if (totalH - i * H < 4) break;
        if (i > 0) pdf.addPage();
        pdf.addImage(jpeg, 'JPEG', 0, -(H * i), W, totalH);
      }

      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (e) {
      console.error('PDF generation failed:', e);
      setError(true);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    generate();
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `${filename}.pdf`;
    a.click();
  };

  return (
    <div className="mx-auto max-w-[900px]">
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2 mb-3">
        {generating && (
          <span className="text-xs text-amber-400 animate-pulse flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" /> Generating PDF...
          </span>
        )}
        {!generating && !error && (
          <button onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 px-3 py-2 text-xs font-semibold text-white transition-colors">
            <Download className="h-3.5 w-3.5" /> Download PDF
          </button>
        )}
        {!generating && (
          <button onClick={generate}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
            <RefreshCw className="h-3.5 w-3.5" /> Regenerate
          </button>
        )}
      </div>

      {/* Hidden render area for capture */}
      <div className="absolute -left-[9999px] top-0 pointer-events-none" ref={contentRef}>
        <div style={{ width: '800px', fontFamily: 'Arial, sans-serif' }}>
          {children}
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900/40" style={{ height: '80vh' }}>
        {generating && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-amber-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-zinc-400">Rendering document...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-sm text-red-400 mb-2">PDF generation failed</p>
              <button onClick={generate} className="text-xs text-amber-400 hover:underline">Try again</button>
            </div>
          </div>
        )}
        {pdfUrl && (
          <iframe src={pdfUrl} className="w-full h-full border-0" title="Document Preview" />
        )}
      </div>
    </div>
  );
}
