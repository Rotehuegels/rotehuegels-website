'use client';
import { useEffect, useRef, useState } from 'react';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';

interface Props {
  contentId?: string;        // single element to slice across pages (PO / quote / invoice)
  pages?: string[];          // one element ID per logical page — each auto-scaled to fit A4
  filename: string;
  toolbar: React.ReactNode;
  children: React.ReactNode;
}

export default function PDFViewer({ contentId, pages, filename, toolbar, children }: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(true);
  const [error, setError] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let objectUrl: string;

    async function generate() {
      const W = 210, H = 297;
      const opts = { pixelRatio: 2, quality: 0.97, backgroundColor: '#ffffff' } as const;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const loadImg = (src: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.onerror = reject;
          i.src = src;
        });

      try {
        if (pages && pages.length > 0) {
          // ── Multi-page: capture each section individually, auto-scale to fit A4 ──
          for (let p = 0; p < pages.length; p++) {
            const el = document.getElementById(pages[p]);
            if (!el) continue;

            const jpeg = await toJpeg(el, opts);
            const img  = await loadImg(jpeg);

            if (p > 0) pdf.addPage();

            const naturalH = W * (img.height / img.width);
            if (naturalH > H) {
              // Taller than A4 — scale down proportionally to fit height
              const scale = H / naturalH;
              const rW = W * scale;
              pdf.addImage(jpeg, 'JPEG', (W - rW) / 2, 0, rW, H);
            } else {
              // Shorter than A4 — render at natural size, top-aligned
              pdf.addImage(jpeg, 'JPEG', 0, 0, W, naturalH);
            }
          }
        } else if (contentId) {
          // ── Single element: slice tall content across multiple pages ──
          const el = document.getElementById(contentId);
          if (!el) throw new Error('content element not found');

          const jpeg = await toJpeg(el, opts);
          const img  = await loadImg(jpeg);

          const totalH = W * (img.height / img.width);
          const nPages = Math.ceil(totalH / H);
          for (let i = 0; i < nPages; i++) {
            if (totalH - i * H < 4) break; // skip near-empty trailing page
            if (i > 0) pdf.addPage();
            pdf.addImage(jpeg, 'JPEG', 0, -(H * i), W, totalH);
          }
        } else {
          throw new Error('Either contentId or pages must be provided');
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      {/* Hidden render area — used only for capture */}
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
