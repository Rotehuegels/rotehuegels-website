'use client';

import { useRef, useState, useCallback } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';

interface Props {
  /** Filename for the downloaded PDF, e.g. "PL-FY2025-26" (no .pdf extension) */
  filename: string;
  /** Optional version number appended to filename */
  version?: string;
  /** The document content — rendered inside an A4 container */
  children: React.ReactNode;
}

export default function ReportViewer({ filename, version, children }: Props) {
  const docRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const fullFilename = version
    ? `${filename}-v${version}.pdf`
    : `${filename}.pdf`;

  const savePDF = useCallback(async () => {
    if (!docRef.current || saving) return;
    setSaving(true);

    try {
      const el = docRef.current;
      const W = 210;
      const H = 297;

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
      a.download = fullFilename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('PDF save failed:', e);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [saving, fullFilename]);

  return (
    <div>
      {/* A4 document container — visible on screen */}
      <div className="mx-auto max-w-[800px] relative">
        {/* Save button — floating top-right */}
        <div className="absolute -top-10 right-0 z-10 no-print">
          <button
            onClick={savePDF}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 transition-colors shadow-lg"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {saving ? 'Generating...' : `Save PDF`}
          </button>
        </div>

        {/* The A4 document */}
        <div
          ref={docRef}
          className="bg-white rounded-xl shadow-2xl shadow-black/30 overflow-hidden"
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
