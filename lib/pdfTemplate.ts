// lib/pdfTemplate.ts
// ═══════════════════════════════════════════════════════════════════════════════
// MASTER REPORT TEMPLATE — All ERP reports inherit from this template.
// Change styling here once → every report updates globally.
// Only the document title and body content differ between reports.
// ═══════════════════════════════════════════════════════════════════════════════

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── DESIGN TOKENS (change these to restyle ALL reports) ──────────────────────

export const COLORS = {
  black: '#111',
  darkGray: '#333',
  gray: '#555',
  medGray: '#888',
  lightGray: '#bbb',
  border: '#ccc',        // all section borders (thin, subtle)
  headerBg: '#f0f0f0',   // items table header background
  headerText: '#111',     // items table header text
  bodyText: '#333',
  labelText: '#888',      // field labels (Invoice No., Name, etc.)
  sectionHeader: '#888',  // section headers (AMOUNT IN WORDS, BANK DETAILS, etc.)
  positive: '#16a34a',    // green for payments received
  negative: '#dc2626',    // red for balance due
  white: '#ffffff',
};

export const FONT = {
  title: 10,        // document title (TAX INVOICE, QUOTATION, etc.)
  companyName: 10,   // company name in header
  heading: 9,        // customer name, amount in words
  body: 6.5,         // standard body text
  small: 6,          // labels, disclaimers, footers
  table: 7,          // items table cells
  tableHeader: 7,    // items table header
  total: 9,          // grand total, balance due
  sectionLabel: 6,   // section headers (uppercase labels)
};

// Standard border layout for section boxes
export const BOX_LAYOUT = {
  hLineWidth: () => 0.3,
  vLineWidth: () => 0.3,
  hLineColor: () => COLORS.border,
  vLineColor: () => COLORS.border,
  paddingLeft: () => 8,
  paddingRight: () => 8,
  paddingTop: () => 6,
  paddingBottom: () => 6,
};

// Standard border layout for items/data table
export const TABLE_LAYOUT = {
  hLineWidth: () => 0.3,
  vLineWidth: () => 0.3,
  hLineColor: () => COLORS.border,
  vLineColor: () => COLORS.border,
  paddingLeft: () => 4,
  paddingRight: () => 4,
  paddingTop: () => 3,
  paddingBottom: () => 3,
};

// ── HEADER ───────────────────────────────────────────────────────────────────
// Builds the standard report header with logo, company details, and document title.
// The bottom border of the header table acts as the separator line (auto full width).

export function buildHeader(opts: {
  logoUrl: string | null;
  companyName: string;
  address: string;
  contactLine: string;   // "email | phone | website"
  gstin: string;
  pan: string;
  cin: string;
  tan: string;
  documentTitle: string; // "TAX INVOICE", "QUOTATION", "PURCHASE ORDER", etc.
}): any {
  return {
    table: {
      widths: ['*', 'auto'],
      body: [[
        {
          stack: [
            ...(opts.logoUrl ? [{ image: opts.logoUrl, width: 110, margin: [0, 0, 0, 4] }] : []),
            { text: opts.companyName.toUpperCase(), fontSize: FONT.companyName, bold: true, color: COLORS.black },
            { text: opts.address, fontSize: FONT.body, color: '#666', margin: [0, 2, 0, 0] },
            { text: opts.contactLine, fontSize: FONT.body, color: COLORS.medGray, margin: [0, 2, 0, 0] },
          ],
        },
        {
          alignment: 'right',
          stack: [
            // Document title in bordered box
            {
              table: { body: [[{ text: opts.documentTitle, fontSize: FONT.title, bold: true, alignment: 'center' }]] },
              layout: { hLineWidth: () => 1, vLineWidth: () => 1, hLineColor: () => COLORS.darkGray, vLineColor: () => COLORS.darkGray, paddingLeft: () => 10, paddingRight: () => 10, paddingTop: () => 3, paddingBottom: () => 3 },
              margin: [0, 0, 0, 4],
            },
            { text: `GSTIN: ${opts.gstin}`, fontSize: FONT.body, color: COLORS.gray, alignment: 'right' },
            { text: `PAN: ${opts.pan}`, fontSize: FONT.body, color: COLORS.gray, alignment: 'right' },
            { text: `CIN: ${opts.cin}`, fontSize: FONT.body, color: COLORS.gray, alignment: 'right' },
            { text: `TAN: ${opts.tan}`, fontSize: FONT.body, color: COLORS.gray, alignment: 'right' },
          ],
        },
      ]],
    },
    layout: {
      hLineWidth: (i: number) => i === 1 ? 1 : 0,
      vLineWidth: () => 0,
      hLineColor: () => COLORS.lightGray,
      paddingLeft: () => 0, paddingRight: () => 0,
      paddingTop: () => 0, paddingBottom: () => 4,
    },
    margin: [0, 0, 0, 6],
  };
}

// ── SECTION HEADER LABEL ─────────────────────────────────────────────────────
// Standard uppercase gray label (AMOUNT IN WORDS, BANK DETAILS, etc.)

export function sectionLabel(text: string): any {
  return { text: text.toUpperCase(), fontSize: FONT.sectionLabel, bold: true, color: COLORS.sectionHeader, characterSpacing: 0.5, margin: [0, 0, 0, 2] };
}

// ── TWO-COLUMN SECTION BOX ───────────────────────────────────────────────────
// Standard bordered box with two columns (Bill To / Invoice Details, Bank / Declaration)

export function twoColumnBox(left: any, right: any, margin = [0, 0, 0, 4]): any {
  return {
    table: { widths: ['*', '*'], body: [[left, right]] },
    layout: BOX_LAYOUT,
    margin,
  };
}

// ── SINGLE SECTION BOX ───────────────────────────────────────────────────────
// Standard bordered box with single content (Amount in Words, etc.)

export function sectionBox(content: any, margin = [0, 0, 0, 4]): any {
  return {
    table: { widths: ['*'], body: [[content]] },
    layout: BOX_LAYOUT,
    margin,
  };
}

// ── ITEMS TABLE HEADER CELL ──────────────────────────────────────────────────
// Standard light gray header cell for items table

export function tableHeaderCell(text: string, alignment: string = 'center'): any {
  return { text, bold: true, fillColor: COLORS.headerBg, color: COLORS.headerText, alignment, fontSize: FONT.tableHeader };
}

// ── ITEMS TABLE DATA CELL ────────────────────────────────────────────────────

export function tableCell(text: string, alignment: string = 'left', bold = false): any {
  return { text, alignment, bold, fontSize: FONT.table };
}

export function tableCurrencyCell(text: string, bold = false): any {
  return { text, alignment: 'right', bold, fontSize: FONT.table, noWrap: true };
}

// ── BANK DETAILS + DECLARATION BOX ───────────────────────────────────────────
// Standard two-column bordered box with bank details (left + QR) and declaration + signature (right)

export function buildBankDeclarationBox(opts: {
  companyName: string;
  bankName: string;
  accountNo: string;
  ifsc: string;
  branch: string;
  upi: string;
  qrDataUrl: string;
  signatureDataUrl: string | null;
  signatoryName: string;
  signatoryTitle: string;
}): any {
  return {
    table: {
      widths: ['*', '*'],
      body: [[
        // Left: Bank Details + QR
        {
          stack: [
            sectionLabel('Bank Details'),
            {
              table: {
                widths: ['*', 55],
                body: [[
                  {
                    table: {
                      widths: [30, '*'],
                      body: [
                        [{ text: 'Name', fontSize: FONT.body, color: COLORS.labelText }, { text: opts.companyName, fontSize: FONT.body }],
                        [{ text: 'A/c No.', fontSize: FONT.body, color: COLORS.labelText }, { text: opts.accountNo, fontSize: FONT.body, bold: true }],
                        [{ text: 'IFSC', fontSize: FONT.body, color: COLORS.labelText }, { text: opts.ifsc, fontSize: FONT.body }],
                        [{ text: 'Bank', fontSize: FONT.body, color: COLORS.labelText }, { text: `${opts.bankName}, ${opts.branch}`, fontSize: FONT.body }],
                        [{ text: 'UPI', fontSize: FONT.body, color: COLORS.labelText }, { text: opts.upi, fontSize: FONT.body }],
                      ],
                    },
                    layout: 'noBorders',
                  },
                  {
                    stack: [
                      { image: opts.qrDataUrl, fit: [50, 50] },
                      { text: 'Scan to Pay (UPI)', fontSize: 5, color: COLORS.medGray, alignment: 'center', margin: [0, 1, 0, 0] },
                    ],
                    alignment: 'center',
                  },
                ]],
              },
              layout: 'noBorders',
            },
          ],
        },
        // Right: Declaration + Signature
        {
          stack: [
            sectionLabel('Declaration'),
            { text: 'We declare that this invoice shows the actual price of the goods / services described and that all particulars are true and correct to the best of our knowledge.', fontSize: FONT.small, color: COLORS.gray, lineHeight: 1.3 },
            { text: '', margin: [0, 4, 0, 0] },
            { text: `FOR ${opts.companyName.toUpperCase()}`, fontSize: FONT.body, bold: true, alignment: 'right' },
            ...(opts.signatureDataUrl ? [{ image: opts.signatureDataUrl, width: 50, alignment: 'right' as const, margin: [0, 3, 0, 1] as any }] : [{ text: '', margin: [0, 14, 0, 0] }]),
            { text: opts.signatoryName, fontSize: FONT.table, bold: true, alignment: 'right' },
            { text: opts.signatoryTitle, fontSize: FONT.small, color: COLORS.gray, alignment: 'right' },
            { text: 'Authorised Signatory', fontSize: FONT.small, color: COLORS.medGray, alignment: 'right' },
          ],
        },
      ]],
    },
    layout: BOX_LAYOUT,
    margin: [0, 0, 0, 4],
  };
}

// ── STANDARD FOOTER ──────────────────────────────────────────────────────────

export function buildFooter(opts: {
  leftText: string;
  centerText: string;
}): (currentPage: number, pageCount: number) => any {
  return (currentPage: number, pageCount: number) => ({
    columns: [
      { text: opts.leftText, fontSize: 5.5, color: '#aaa', margin: [32, 0, 0, 0] },
      { text: opts.centerText, fontSize: 5.5, color: '#aaa', alignment: 'center' },
      { text: `Page ${currentPage} of ${pageCount}`, fontSize: 5.5, color: '#aaa', alignment: 'right', margin: [0, 0, 32, 0] },
    ],
  });
}

// ── PAYMENT SUMMARY BOX ──────────────────────────────────────────────────────

export function buildPaymentSummary(rows: Array<{ label: string; amount: string; color?: string; bold?: boolean; fontSize?: number }>): any {
  const body: any[][] = [
    [{ text: 'PAYMENT & ADJUSTMENT SUMMARY', colSpan: 2, fontSize: FONT.sectionLabel, bold: true, color: COLORS.sectionHeader, characterSpacing: 0.5 }, {}],
  ];

  for (const row of rows) {
    body.push([
      { text: row.label, fontSize: row.fontSize ?? FONT.body, bold: row.bold ?? false, color: row.color ?? COLORS.bodyText },
      { text: row.amount, alignment: 'right', fontSize: row.fontSize ?? FONT.body, bold: row.bold ?? false, color: row.color ?? COLORS.bodyText },
    ]);
  }

  return {
    table: { widths: ['*', 100], body },
    layout: BOX_LAYOUT,
    margin: [0, 0, 0, 4],
  };
}
