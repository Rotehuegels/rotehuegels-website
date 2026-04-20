// lib/reports/types.ts
// ═══════════════════════════════════════════════════════════════════════════════
// Typed `ReportConfig` — the one contract every ERP PDF report speaks.
//
// A report builder (quotePdf, invoicePdf, purchaseOrderPdf, …) is responsible
// for:
//   1. Fetching the domain row (quote / order / PO / …)
//   2. Shaping that row into a ReportConfig
//   3. Calling buildReport(cfg) and returning { buffer, filename }
//
// Everything visual (colours, fonts, section order, footer, bank block, QR,
// signature, notes/terms renderer) lives inside the report engine and is
// controlled via `sections.*` flags on the config — no per-report pdfmake
// assembly. Phase 2 will migrate the remaining 8 PDFs to this contract.
// ═══════════════════════════════════════════════════════════════════════════════

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Party blocks ─────────────────────────────────────────────────────────────

export interface PartyFromCompany {
  /** Legal or brand name printed in the letterhead. */
  name: string;
  /** First address line ("No. 1/584, 7th Street, Jothi Nagar…"). */
  addressLine1: string;
  /** Second address line ("Near …, Chennai – 600052, Tamil Nadu, India"). */
  addressLine2: string;
  /** "email  |  phone  |  website" string shown under the name. */
  contactLine: string;
  gstin: string;
  pan: string;
  cin: string;
  tan: string;
}

export interface PartyAddressBlock {
  /** Party legal name. */
  name: string;
  /** Optional GSTIN shown under the name. */
  gstin?: string | null;
  /** Optional PAN. */
  pan?: string | null;
  /** Full address (already joined into one string). */
  address?: string | null;
  /** Contact person. */
  contact?: string | null;
  /** Phone. */
  phone?: string | null;
  /** Email. */
  email?: string | null;
  /** Optional customer/supplier code displayed under contact details. */
  code?: string | null;
  /**
   * Label shown above the block — e.g. "Quoted To", "Bill To / Ship To",
   * "Vendor (Bill From)". Defaults are provided per report in the builder.
   */
  label?: string;
}

// ── Meta (right-hand details block) ──────────────────────────────────────────

export interface MetaRow {
  label: string;
  value: string;
  /** If true, render the value in bold (typically the document number). */
  bold?: boolean;
}

// ── Line items ───────────────────────────────────────────────────────────────

export interface LineItem {
  /** Description / name of the product or service. */
  name: string;
  /** HSN (goods) or SAC (services) code. Falls back to "-" when absent. */
  hsn?: string | null;
  /** Quantity number. Pass null for service rows without explicit qty. */
  quantity?: number | string | null;
  /** Unit of measure ("Nos", "kg", …). */
  unit?: string | null;
  /** Per-unit rate (pre-discount, pre-tax). Pass null when not applicable. */
  unit_price?: number | null;
  /** Discount percentage (0-100). 0 means no discount. */
  discount_pct?: number | null;
  /** Taxable amount (post-discount, pre-tax). Required. */
  taxable_amount: number;
  /** GST amount (total — cgst + sgst for intra; igst for inter). */
  gst_amount: number;
  /** Line total (taxable + gst). */
  total: number;
  /** Effective GST rate (percentage, e.g. 18). */
  gst_rate?: number | null;
}

// ── GST ──────────────────────────────────────────────────────────────────────

export type GstMode = 'intra' | 'inter' | 'exempt';

// ── Totals ───────────────────────────────────────────────────────────────────

export interface Totals {
  subtotal: number;
  discount: number;
  taxable: number;
  /** CGST (intra-state only; 0 otherwise). */
  cgst: number;
  /** SGST (intra-state only; 0 otherwise). */
  sgst: number;
  /** IGST (inter-state only; 0 otherwise). */
  igst: number;
  total: number;
  /** Optional override — builder falls back to numToWords(total). */
  amountInWords?: string;
  /**
   * Optional TDS info — if provided, rendered under the amount-in-words box.
   */
  tds?: { rate: number; amount: number } | null;
}

// ── Payments (optional — invoices with receipts) ─────────────────────────────

export interface PaymentRow {
  date: string;       // ISO date string — formatted by the section builder
  mode?: string | null;
  amount: number;
}

export interface AdjustmentRow {
  description: string;
  amount: number;
}

// ── Sections config ──────────────────────────────────────────────────────────

export interface ReportSectionsConfig {
  /** Bank + declaration + signature block (customer-facing documents). */
  showBankBlock: boolean;
  /** Dedicated signature column inside a non-bank block (e.g. PO). */
  showSignature: boolean;
  /** Notes / Terms box. */
  showNotesTermsBlock: boolean;
  /** "Amount in Words" box between items and payment summary. */
  showAmountInWords: boolean;
  /** Payment & Adjustment Summary box (invoice-only). */
  showPaymentSummary: boolean;
  /** UPI/NEFT/RTGS disclaimer strip under the bank block. */
  showUpiDisclaimer: boolean;
  /**
   * Where the notes/terms block sits relative to the bank block.
   * - 'before-bank' — between totals/amount-in-words and the bank block
   * - 'after-bank'  — between the UPI disclaimer and the footer disclaimer
   * - 'after-items' — immediately after the totals (used when no bank block)
   */
  notesTermsPosition: 'before-bank' | 'after-bank' | 'after-items';
}

// ── Bank / signatory / QR overrides ──────────────────────────────────────────

export interface BankDetails {
  bankName: string;
  accountNo: string;
  ifsc: string;
  branch: string;
  upi: string;
}

export interface Signatory {
  name: string;
  title: string;
}

export interface UpiQrConfig {
  /** UPI ID (e.g. "rotehuegels@sbi"). If omitted, CO.upi is used. */
  payee?: string;
  /** Transaction note ("Invoice RH/25-26/ORD-001"). */
  note?: string;
  /**
   * Optional explicit amount. If omitted, the QR is a "bring-your-own" one
   * (no amount). Callers should only set this for balance-due scenarios.
   * Values above ₹1,00,000 are ignored (per-txn UPI limit).
   */
  amount?: number;
}

export interface FooterMeta {
  /** Left-hand footer text (doc number). Defaults to cfg.meta bold row. */
  leftText?: string;
  /** Centre-hand footer text. Defaults to "web  |  email". */
  centerText?: string;
}

// ── Notes & Terms ────────────────────────────────────────────────────────────

export interface NotesAndTerms {
  /** Freeform notes — bullet lines (starting with "- " or "• ") auto-detect. */
  notes?: string | null;
  /** Freeform terms. */
  terms?: string | null;
}

// ── Master config ────────────────────────────────────────────────────────────

export interface ReportConfig {
  /** Document title shown inside the bordered box (e.g. 'QUOTATION'). */
  documentTitle: string;
  /** Optional italic subtitle shown under the header (e.g. 'Not a tax invoice'). */
  subtitle?: string;

  fromCompany: PartyFromCompany;
  toParty: PartyAddressBlock;
  /** Optional third "ship to" column for PO-style documents. */
  shipToParty?: PartyAddressBlock | null;

  /** Right-hand document detail rows. First bold row is also the footer leftText. */
  meta: MetaRow[];

  items: LineItem[];
  gstMode: GstMode;
  totals: Totals;

  /** Optional payment/adjustment rows (invoice only). */
  payments?: PaymentRow[];
  adjustments?: AdjustmentRow[];

  notesAndTerms?: NotesAndTerms;

  sections: ReportSectionsConfig;

  /** Bank override (falls back to CO.bank* when absent). */
  bank?: BankDetails;
  /** Signatory override (defaults to "Sivakumar Shanmugam / CEO, Rotehügels"). */
  signatory?: Signatory;

  /**
   * If truthy, the bank block renders a UPI QR on the left. Pass `true` for
   * a no-amount QR, or an object to customise the note / optionally prefill
   * the amount (small balances only).
   */
  upiQr?: boolean | UpiQrConfig;

  /** Declaration/payment-terms paragraph shown inside the bank block. */
  paymentTermsText?: string | null;
  /** Custom label above the declaration (default "Declaration"). */
  paymentTermsLabel?: string;

  /** Italic footer disclaimer strip (small, centred). */
  disclaimerText?: string;

  footerMeta?: FooterMeta;

  /** Suggested download filename. Required — builder returns it verbatim. */
  filename: string;

  // ── Escape hatches for report-specific oddities ──────────────────────────
  // Phase 1 needs these for the PO's "AMENDMENT" banner + right-aligned
  // meta stack, which don't fit the generic meta-table layout used by
  // quote/invoice. Prefer standard fields; use these only when the knob
  // doesn't exist yet.
  /**
   * Party-block style. 'bordered' wraps the block in BOX_LAYOUT (used by
   * invoices); 'plain' renders without borders (used by quotes + POs).
   */
  partyBlockStyle?: 'bordered' | 'plain';
  /**
   * Label format for phone/email in a 'plain' party block:
   * - 'abbrev' — "Ph: …" + bare email value (quote-style, default)
   * - 'full'   — "Phone: …" / "Email: …" (PO-style)
   */
  partyContactLabels?: 'abbrev' | 'full';
  /**
   * Totals table style. 'bordered' keeps the right-aligned 3-column
   * layout used by quotes (label + value in a bordered box). 'plain'
   * uses a no-border right-aligned 2-column layout used by POs.
   * 'inline-last-row' attaches the totals row to the items-table footer
   * (used by invoices). Default: 'inline-last-row'.
   */
  totalsStyle?: 'bordered' | 'plain' | 'inline-last-row';
  /**
   * How the PO renders its right-aligned meta ("PO No / Date / Delivery By")
   * in a separate row above the vendor block instead of in a 2-column box.
   * Default: 'inline' (side-by-side with the party block).
   */
  metaPlacement?: 'inline' | 'above-party';
  /**
   * Extra content to insert immediately after the header, before the
   * party block. Used for the PO's AMENDMENT banner. Stringly-typed to
   * keep the config serialisable-ish.
   */
  /**
   * Column style for the items table.
   * - 'split-qty-unit' — separate Qty and Unit columns (quote / PO)
   * - 'combined-qty'   — single "Qty" column with "{qty} {unit}" text (invoice)
   * Default: 'split-qty-unit'.
   */
  itemsQtyStyle?: 'split-qty-unit' | 'combined-qty';
  /** Items-table HSN column header — default 'HSN/SAC'. PO uses 'HSN'. */
  itemsHsnHeader?: string;
  /**
   * GST-column label style.
   * - 'rate-in-header' — header shows "IGST 18%" / "CGST 9%" / "SGST 9%";
   *   each cell shows only the amount. (default — invoice, quote)
   * - 'rate-in-cell'   — header shows just "IGST" / "GST"; each cell shows
   *   "{amount}\n{rate}%". (PO)
   */
  itemsGstStyle?: 'rate-in-header' | 'rate-in-cell';
  /**
   * Amount-in-words presentation.
   * - 'box'    — bordered box with "AMOUNT IN WORDS" label (default; invoice)
   * - 'inline' — plain 1-liner ("Grand Total (in words): Rupees …") (PO)
   */
  amountInWordsStyle?: 'box' | 'inline';
  headerExtras?: Array<{ text: string; color?: string; bold?: boolean; alignment?: 'left' | 'right' | 'center' }>;
  /**
   * Extra content to insert after the totals table, before the bank block
   * (or after the items+totals if showBankBlock=false). Used for the PO's
   * amendment-notes blurb.
   */
  postTotalsExtras?: Array<{ text: string; color?: string; bold?: boolean }>;
}

// ── Builder output ───────────────────────────────────────────────────────────

export interface ReportResult {
  buffer: Buffer;
  filename: string;
}
