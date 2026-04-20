// lib/reports/builder.ts
// ═══════════════════════════════════════════════════════════════════════════════
// Composes a PDF from a ReportConfig. Every migrated PDF builder in lib/ is a
// thin adapter: (1) load the domain row, (2) shape a ReportConfig, (3) call
// buildReport(cfg). All layout / sectioning / fonts / colours live here.
// ═══════════════════════════════════════════════════════════════════════════════

/* eslint-disable @typescript-eslint/no-explicit-any */

import { generateSmartPdf, getLogoDataUrl } from '@/lib/pdfConfig';
import { buildFooter } from '@/lib/pdfTemplate';
import { getCompanyCO } from '@/lib/company';
import type { ReportConfig, ReportResult } from './types';
import {
  buildDocHeader, buildSubtitle, buildPartyBlock, buildItemsTable,
  buildTotalsTable, buildAmountInWords, buildPaymentSummaryBlock,
  buildBankBlock, buildNotesTerms, buildUpiDisclaimer, buildFooterDisclaimer,
  buildSignatureOnly,
} from './sections';

/** Compose the PDF from the resolved config. */
export async function buildReport(cfg: ReportConfig): Promise<ReportResult> {
  const CO = await getCompanyCO();
  const logoUrl = getLogoDataUrl();

  const content: any[] = [];
  const push = (node: any) => {
    if (node == null) return;
    if (Array.isArray(node)) { for (const n of node) push(n); return; }
    content.push(node);
  };

  // 1. Header
  push(buildDocHeader(cfg, logoUrl));

  // 2. headerExtras (PO's AMENDMENT banner, etc.)
  if (cfg.headerExtras) {
    for (const ex of cfg.headerExtras) {
      push({
        text: ex.text, fontSize: 8, bold: ex.bold ?? true,
        color: ex.color ?? '#92400e',
        alignment: ex.alignment ?? 'right',
        margin: [0, 0, 0, 2],
      });
    }
  }

  // 3. Subtitle (e.g. "Not a tax invoice")
  push(buildSubtitle(cfg));

  // 4. Party block (+ optional above-party meta for PO)
  push(buildPartyBlock(cfg));

  // 5. Items table (+ optional inline TOTAL row)
  push(buildItemsTable(cfg));

  // 6. Standalone totals table (quote / PO)
  push(buildTotalsTable(cfg));

  // 7. Amount in Words
  push(buildAmountInWords(cfg));

  // 8. Notes/Terms — "after-items" position (used by PO)
  if (cfg.sections.notesTermsPosition === 'after-items') {
    push(buildNotesTerms(cfg));
  }

  // 9. Payment summary (invoice only)
  push(buildPaymentSummaryBlock(cfg));

  // 10. Notes/Terms — "before-bank" position (used by invoice)
  if (cfg.sections.notesTermsPosition === 'before-bank') {
    push(buildNotesTerms(cfg));
  }

  // 11. Bank block (customer-facing docs only)
  push(await buildBankBlock(cfg, CO));

  // 12. UPI disclaimer (under bank block)
  push(buildUpiDisclaimer(cfg));

  // 13. Notes/Terms — "after-bank" position (used by quote)
  if (cfg.sections.notesTermsPosition === 'after-bank') {
    push(buildNotesTerms(cfg));
  }

  // 14. Signature-only block (when no bank block — PO)
  push(buildSignatureOnly(cfg));

  // 15. postTotalsExtras (PO's amendment notes blurb, etc.)
  if (cfg.postTotalsExtras) {
    for (const ex of cfg.postTotalsExtras) {
      push({
        text: ex.text, fontSize: 8,
        color: ex.color ?? '#555', bold: ex.bold ?? false,
        margin: [0, 0, 0, 6],
      });
    }
  }

  // 16. Footer italic disclaimer
  push(buildFooterDisclaimer(cfg));

  // ── Footer (page-bottom band) ────────────────────────────────────────────
  const firstBoldMeta = cfg.meta.find(m => m.bold)?.value ?? cfg.meta[0]?.value ?? '';
  const leftText = cfg.footerMeta?.leftText ?? firstBoldMeta;
  const centerText = cfg.footerMeta?.centerText ?? `${CO.web}  |  ${CO.email}`;

  const buffer = await generateSmartPdf(content, buildFooter({ leftText, centerText }));
  return { buffer, filename: cfg.filename };
}
