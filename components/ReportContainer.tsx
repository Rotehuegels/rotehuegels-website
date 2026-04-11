'use client';

import { useRef, useState } from 'react';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import { Download, Loader2 } from 'lucide-react';
import DocumentFooter from '@/components/DocumentFooter';

interface Props {
  filename: string;
  children: React.ReactNode;
  docNumber?: string;
  docStatus?: 'draft' | 'under_review' | 'approved' | 'obsolete' | 'superseded';
  docVersion?: number;
  docRevision?: string;
  docPreparedBy?: string;
  docApprovedBy?: string;
}

export default function ReportContainer({
  filename, children,
  docNumber, docStatus, docVersion, docRevision, docPreparedBy, docApprovedBy,
}: Props) {
  const docRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  async function downloadPDF() {
    if (!docRef.current || saving) return;
    setSaving(true);

    try {
      const el = docRef.current;
      const W = 210, H = 297;

      const jpeg = await toJpeg(el, {
        pixelRatio: 2,
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
      const totalH = W * (img.height / img.width);
      const nPages = Math.ceil(totalH / H);

      for (let i = 0; i < nPages; i++) {
        if (totalH - i * H < 4) break;
        if (i > 0) pdf.addPage();
        pdf.addImage(jpeg, 'JPEG', 0, -(H * i), W, totalH);
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
