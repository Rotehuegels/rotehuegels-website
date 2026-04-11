'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';

interface Props {
  /** ID of the DOM element to capture */
  targetId: string;
  /** Filename without .pdf extension */
  filename: string;
}

export default function SavePDFButton({ targetId, filename }: Props) {
  const [saving, setSaving] = useState(false);

  async function save() {
    if (saving) return;
    setSaving(true);

    try {
      const el = document.getElementById(targetId);
      if (!el) throw new Error('Document element not found');

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
      const a = document.createElement('a');
      a.href = url; a.download = `${filename}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('PDF save failed:', e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button onClick={save} disabled={saving}
      className="flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 transition-colors">
      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      {saving ? 'Saving...' : 'Save PDF'}
    </button>
  );
}
