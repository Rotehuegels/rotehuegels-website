'use client';
import { useEffect, useRef, useState } from 'react';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';

interface Props {
  contentId: string;        // id of the A4 div to capture
  filename: string;         // e.g. "PO-2026-001.pdf"
  toolbar: React.ReactNode; // the Back/Print toolbar
  children: React.ReactNode; // the A4 content div
}

export default function PDFViewer({ contentId, filename, toolbar, children }: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(true);
  const [error, setError] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let objectUrl: string;

    async function generate() {
      try {
        const el = document.getElementById(contentId);
        if (!el) throw new Error('content element not found');

        // Capture at 2× as JPEG (quality 0.92) — sharp text, ~1–2 MB output
        const jpeg = await toJpeg(el, { pixelRatio: 2, quality: 0.97, backgroundColor: '#ffffff' });

        // Load image to get natural dimensions
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.onerror = reject;
          i.src = jpeg;
        });

        // A4 in mm — slice tall captures across multiple pages
        const W = 210, H = 297;
        const totalHeightMm = W * (img.height / img.width);
        // Skip a page if it would contain less than 4mm of content (avoids blank trailing pages)
        const totalPages = Math.ceil(totalHeightMm / H);
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        for (let i = 0; i < totalPages; i++) {
          const remainingMm = totalHeightMm - i * H;
          if (remainingMm < 4) break;
          if (i > 0) pdf.addPage();
          pdf.addImage(jpeg, 'JPEG', 0, -(H * i), W, totalHeightMm);
        }

        const blob = pdf.output('blob');
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      } catch (e) {
        console.error('PDF generation failed', e);
        setError(true);
      } finally {
        setGenerating(false);
      }
    }

    generate();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [contentId]);

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = filename;
    a.click();
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Toolbar */}
      <div className="flex-none flex items-center justify-between px-6 py-3 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800">
        {toolbar}
        <div className="flex items-center gap-3">
          {generating && (
            <span className="text-xs text-zinc-400 animate-pulse">Generating PDF…</span>
          )}
          {!generating && !error && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors"
            >
              ⬇ Download PDF
            </button>
          )}
        </div>
      </div>

      {/* Hidden A4 render area — used only for capture */}
      <div className="absolute -left-[9999px] top-0" ref={contentRef}>
        {children}
      </div>

      {/* PDF viewer */}
      <div className="flex-1 relative">
        {generating && (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
            <div className="text-center">
              <div className="text-2xl mb-2">⏳</div>
              <div className="text-sm">Rendering PDF…</div>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
            <div className="text-center">
              <div className="text-2xl mb-2">⚠️</div>
              <div className="text-sm">PDF generation failed. Use Print instead.</div>
            </div>
          </div>
        )}
        {pdfUrl && (
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0"
            title="PDF Preview"
          />
        )}
      </div>
    </div>
  );
}
