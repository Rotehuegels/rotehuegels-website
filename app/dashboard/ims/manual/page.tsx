// ── IMS Manual viewer ───────────────────────────────────────────────────────
// Renders the full Integrated Management System manual through the same
// smart-PDF report container used everywhere else in the ERP. The PDF itself
// is generated live at /api/ims/manual/pdf from lib/sops.ts + lib/imsRegister.ts
// — edit the SOPs or registers and the manual reflects on next view.

import { BookText } from 'lucide-react';
import PDFDocumentViewer from '@/components/PDFDocumentViewer';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'IMS Manual — Rotehügels' };

export default function IMSManualPage() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <BookText className="h-6 w-6 text-amber-400" />
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Integrated Management System Manual</h1>
          <p className="text-xs text-zinc-500">
            ISO 9001:2015 · ISO 14001:2015 · ISO 45001:2018 — generated live from the SOP &amp; register sources.
          </p>
        </div>
      </div>

      <PDFDocumentViewer
        pdfUrl="/api/ims/manual/pdf"
        filename="Rotehuegels-IMS-Manual-Rev-1.0"
      />
    </div>
  );
}
