'use client';

import { useRef, useState, useEffect } from 'react';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import { Download, Loader2 } from 'lucide-react';
import DocumentFooter from '@/components/DocumentFooter';

interface Props {
  filename: string;
  children: React.ReactNode;
  /** Auto-scale content to fit a single A4 page (default: true) */
  fitToPage?: boolean;
  docNumber?: string;
  docStatus?: 'draft' | 'under_review' | 'approved' | 'obsolete' | 'superseded';
  docVersion?: number;
  docRevision?: string;
  docPreparedBy?: string;
  docApprovedBy?: string;
}

// A4 dimensions in mm
const A4_W = 210;
const A4_H = 297;
// A4 aspect ratio — content taller than this (relative to width) overflows
const A4_RATIO = A4_H / A4_W; // ~1.414

export default function ReportContainer({
  filename, children,
  fitToPage = true,
  docNumber, docStatus, docVersion, docRevision, docPreparedBy, docApprovedBy,
}: Props) {
  const docRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [scale, setScale] = useState(1);

  // Auto-scale: measure content and compute scale to fit A4
  useEffect(() => {
    if (!fitToPage || !docRef.current) { setScale(1); return; }

    const observer = new ResizeObserver(() => {
      const el = docRef.current;
      if (!el) return;
      const contentW = el.scrollWidth;
      const contentH = el.scrollHeight;
      const maxH = contentW * A4_RATIO;
      if (contentH > maxH) {
        // Scale down to fit, with a floor of 0.65 to keep readability
        setScale(Math.max(0.65, maxH / contentH));
      } else {
        setScale(1);
      }
    });

    observer.observe(docRef.current);
    return () => observer.disconnect();
  }, [fitToPage]);

  async function downloadPDF() {
    if (!docRef.current || saving) return;
    setSaving(true);

    try {
      const el = docRef.current;

      const jpeg = await toJpeg(el, {
        pixelRatio: 2.5,
        quality: 0.97,
        backgroundColor: '#ffffff',
      });

      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = jpeg;
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const totalH = A4_W * (img.height / img.width);

      if (fitToPage && totalH <= A4_H * 1.15) {
        // Fits one page (with up to 15% overflow tolerance — scale to fit)
        if (totalH > A4_H) {
          // Scale down to fit exactly
          const s = A4_H / totalH;
          const scaledW = A4_W * s;
          const scaledH = A4_H;
          const offsetX = (A4_W - scaledW) / 2;
          pdf.addImage(jpeg, 'JPEG', offsetX, 0, scaledW, scaledH);
        } else {
          pdf.addImage(jpeg, 'JPEG', 0, 0, A4_W, totalH);
        }
      } else {
        // Multi-page: paginate
        const nPages = Math.ceil(totalH / A4_H);
        for (let i = 0; i < nPages; i++) {
          if (totalH - i * A4_H < 4) break;
          if (i > 0) pdf.addPage();
          pdf.addImage(jpeg, 'JPEG', 0, -(A4_H * i), A4_W, totalH);
        }
      }

      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('PDF generation failed:', e);
    } finally {
      setSaving(false);
    }
  }

  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="mx-auto max-w-[800px]">
      {/* Download button */}
      <div className="flex justify-end mb-3">
        <button
          onClick={downloadPDF}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 transition-colors shadow-lg"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          {saving ? 'Generating PDF...' : 'Download PDF'}
        </button>
      </div>

      {/* Document — visible on screen, captured for PDF on download */}
      <div
        ref={docRef}
        className="bg-white rounded-xl shadow-2xl shadow-black/30 overflow-hidden"
        style={{
          fontFamily: 'Arial, sans-serif',
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top center',
        }}
      >
        {children}

        {docNumber && (
          <DocumentFooter
            docNumber={docNumber}
            version={docVersion}
            revision={docRevision}
            status={docStatus}
            preparedBy={docPreparedBy}
            approvedBy={docApprovedBy}
            date={today}
          />
        )}
      </div>
    </div>
  );
}
