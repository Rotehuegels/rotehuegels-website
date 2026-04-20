// lib/reports/defaults.ts
// Sensible defaults + a merge helper for ReportConfig.

import type { ReportConfig, ReportSectionsConfig, Signatory } from './types';

/** Default section flags — sane for a customer-facing tax document. */
export const DEFAULT_SECTIONS: ReportSectionsConfig = {
  showBankBlock: true,
  showSignature: true,
  showNotesTermsBlock: true,
  showAmountInWords: true,
  showPaymentSummary: false,
  showUpiDisclaimer: true,
  notesTermsPosition: 'before-bank',
};

export const DEFAULT_SIGNATORY: Signatory = {
  name: 'Sivakumar Shanmugam',
  title: 'CEO, Rotehügels',
};

export const DEFAULT_REPORT_SETTINGS = {
  sections: DEFAULT_SECTIONS,
  signatory: DEFAULT_SIGNATORY,
};

/**
 * Deep-merge overrides on top of the defaults. Only the `sections` key and
 * `signatory` key are shallow-merged; everything else is assigned as-is.
 *
 * Required overrides (documentTitle, fromCompany, toParty, items, totals,
 * filename, gstMode, meta) must be provided by the caller — this helper
 * only supplies the optional/boolean knobs.
 */
export function resolveConfig(overrides: Partial<ReportConfig> & Pick<ReportConfig,
  'documentTitle' | 'fromCompany' | 'toParty' | 'items' | 'totals' | 'filename' | 'gstMode' | 'meta'
>): ReportConfig {
  return {
    ...overrides,
    sections: { ...DEFAULT_SECTIONS, ...(overrides.sections ?? {}) },
    signatory: overrides.signatory ?? DEFAULT_SIGNATORY,
  } as ReportConfig;
}
