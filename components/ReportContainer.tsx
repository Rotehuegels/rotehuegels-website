'use client';

import { useRef, useState } from 'react';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import { Download, Loader2 } from 'lucide-react';
import DocumentFooter from '@/components/DocumentFooter';

interface Props {
  filename: string;
  children: React.ReactNode;
  /**
   * Auto-scale content to fit a single A4 page when it slightly overflows.
   * - If content overflows by up to ~20%, it scales down gently to fit one page.
   * - If content is too large for one page (even with gentle scaling), it flows
   *   naturally across multiple pages without forcing a squeeze.
   * Default: true
   */
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

export default function ReportContainer({
  filename, children,
  fitToPage = true,
  docNumber, docStatus, docVersion, docRevision, docPreparedBy, docApprovedBy,
}: Props) {
  const docRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  async function downloadPDF() {
    if (!docRef.current || saving) return;
    setSaving(true);

    try {
      const el = docRef.current;

      // Capture at high resolution
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
      // Content height in mm when rendered at A4 width
      const totalH = A4_W * (img.height / img.width);

      if (fitToPage && totalH <= A4_H) {
        // Already fits — place as-is
        pdf.addImage(jpeg, 'JPEG', 0, 0, A4_W, totalH);
      } else if (fitToPage && totalH <= A4_H * 1.20) {
        // Slight overflow (up to 20%) — scale gently to fit one page
        // This keeps text readable while avoiding a second page for a few mm of overflow
        const scale = A4_H / totalH;
        const scaledW = A4_W * scale;
        const offsetX = (A4_W - scaledW) / 2;
        pdf.addImage(jpeg, 'JPEG', offsetX, 0, scaledW, A4_H);
      } else {
        // Content is genuinely large — paginate across multiple pages
        // Use the full width, let it flow naturally
        const nPages = Math.ceil(totalH / A4_H);
        for (let i = 0; i < nPages; i++) {
          const remaining = totalH - i * A4_H;
          if (remaining < 4) break; // skip near-empty trailing pages
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

      {/* Document — visible on screen at natural size, scaled only in PDF output */}
      <div
        ref={docRef}
        className="bg-white rounded-xl shadow-2xl shadow-black/30 overflow-hidden"
        style={{ fontFamily: 'Arial, sans-serif' }}
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
