// lib/reports/sections.ts
// ═══════════════════════════════════════════════════════════════════════════════
// Section builders used by lib/reports/builder.ts.
// Each function takes the resolved ReportConfig and returns one or more
// pdfmake content nodes. They purposely don't know about domain objects
// (quotes / orders / POs) — all shaping happens upstream in the report
// builder's fetch step.
// ═══════════════════════════════════════════════════════════════════════════════

/* eslint-disable @typescript-eslint/no-explicit-any */

import QRCode from 'qrcode';
import {
  COLORS, FONT, BOX_LAYOUT, TABLE_LAYOUT,
  buildHeader, buildBankDeclarationBox, buildPaymentSummary,
  sectionLabel, sectionBox, tableHeaderCell,
} from '@/lib/pdfTemplate';
import { fmtINR, fmtDate, sanitizePdfText, getSignatureDataUrl } from '@/lib/pdfConfig';
import type { ReportConfig, LineItem, PartyAddressBlock, MetaRow } from './types';

// ── numToWords (shared) ──────────────────────────────────────────────────────
// Historically each report re-implemented this. Single source of truth now.
export function numToWords(amount: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const twoD = (n: number) => n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  const threeD = (n: number) => n < 100 ? twoD(n) : ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + twoD(n % 100) : '');
  const r = Math.floor(amount);
  const p = Math.round((amount - r) * 100);
  const parts: string[] = [];
  let rem = r;
  if (rem >= 10000000) { parts.push(twoD(Math.floor(rem / 10000000)) + ' Crore'); rem %= 10000000; }
  if (rem >= 100000) { parts.push(twoD(Math.floor(rem / 100000)) + ' Lakh'); rem %= 100000; }
  if (rem >= 1000) { parts.push(twoD(Math.floor(rem / 1000)) + ' Thousand'); rem %= 1000; }
  if (rem > 0) { parts.push(threeD(rem)); }
  const words = r === 0 ? 'Zero' : parts.join(' ');
  const paiseStr = p > 0 ? ` and ${twoD(p)} Paise` : '';
  return `Rupees ${words}${paiseStr} Only`;
}

// ── Document header (letterhead + title box + identifiers) ───────────────────

export function buildDocHeader(cfg: ReportConfig, logoUrl: string | null): any {
  return buildHeader({
    logoUrl,
    companyName: cfg.fromCompany.name,
    address: `${cfg.fromCompany.addressLine1} ${cfg.fromCompany.addressLine2}`,
    contactLine: cfg.fromCompany.contactLine,
    gstin: cfg.fromCompany.gstin,
    pan: cfg.fromCompany.pan,
    cin: cfg.fromCompany.cin,
    tan: cfg.fromCompany.tan,
    documentTitle: cfg.documentTitle,
  });
}

// ── Optional subtitle ("Not a tax invoice") ──────────────────────────────────

export function buildSubtitle(cfg: ReportConfig): any | null {
  if (!cfg.subtitle) return null;
  return {
    text: cfg.subtitle,
    fontSize: FONT.body, italics: true, color: COLORS.medGray, alignment: 'right',
    margin: [0, -4, 0, 8],
  };
}

// ── Party address stack (used as a cell inside buildPartyBlock) ──────────────

function partyStack(p: PartyAddressBlock, labelDefault: string, style: 'plain' | 'bordered', contactLabels: 'abbrev' | 'full' = 'abbrev'): any {
  const label = p.label ?? labelDefault;
  const stack: any[] = [
    sectionLabel(label),
    { text: p.name ?? '', fontSize: style === 'bordered' ? FONT.heading : 10, bold: true, color: COLORS.black },
  ];
  if (style === 'bordered') {
    // Invoice style — contact → address → GSTIN/PAN (bold, below address) →
    // Phone: / Email: (full-word labels) → Customer ID.
    if (p.contact) stack.push({ text: p.contact, fontSize: FONT.small, color: COLORS.gray });
    if (p.address) stack.push({ text: p.address, fontSize: FONT.small, color: COLORS.gray, lineHeight: 1.2, margin: [0, 1, 0, 0] });
    if (p.gstin)   stack.push({ text: `GSTIN:  ${p.gstin}`, fontSize: FONT.small, bold: true, margin: [0, 2, 0, 0] });
    if (p.pan)     stack.push({ text: `PAN:  ${p.pan}`, fontSize: FONT.small, bold: true });
    if (p.phone)   stack.push({ text: `Phone: ${p.phone}`, fontSize: 5.5, color: COLORS.gray, margin: [0, 1, 0, 0] });
    if (p.email)   stack.push({ text: `Email: ${p.email}`, fontSize: 5.5, color: COLORS.gray });
    if (p.code)    stack.push({ text: `Customer ID: ${p.code}`, fontSize: 5.5, color: COLORS.medGray, margin: [0, 1, 0, 0] });
  } else {
    // Plain style (quote / PO) — GSTIN (non-bold) under name, PAN, address.
    if (p.gstin)   stack.push({ text: `GSTIN: ${p.gstin}`, fontSize: 7, margin: [0, 2, 0, 0] });
    if (p.pan)     stack.push({ text: `PAN: ${p.pan}`, fontSize: 7 });
    if (p.address) stack.push({ text: p.address, fontSize: 7, color: '#555', lineHeight: 1.2, margin: [0, 2, 0, 0] });
    if (p.contact) stack.push({ text: p.contact, fontSize: 6.5, color: '#555', margin: [0, 2, 0, 0] });
    if (contactLabels === 'full') {
      if (p.email) stack.push({ text: `Email: ${p.email}`, fontSize: 6.5, color: '#555', margin: [0, 2, 0, 0] });
      if (p.phone) stack.push({ text: `Phone: ${p.phone}`, fontSize: 6.5, color: '#555' });
    } else {
      if (p.phone) stack.push({ text: `Ph: ${p.phone}`, fontSize: 6.5, color: '#555', margin: [0, 2, 0, 0] });
      if (p.email) stack.push({ text: p.email, fontSize: 6.5, color: '#555' });
    }
  }
  return { stack };
}

function metaStack(meta: MetaRow[], style: 'stack' | 'table'): any {
  if (style === 'table') {
    return {
      table: {
        widths: [65, '*'],
        body: meta.map(r => [
          { text: r.label, fontSize: FONT.body, color: COLORS.labelText },
          { text: r.value, fontSize: FONT.body, bold: !!r.bold },
        ]),
      },
      layout: 'noBorders',
    };
  }
  // stack
  const first = meta[0];
  const children: any[] = [sectionLabel('Details')];
  for (const r of meta) {
    children.push({
      text: `${r.label}: ${r.value}`,
      fontSize: r === first ? 7.5 : 7,
      bold: !!r.bold,
    });
  }
  return { stack: children };
}

// ── Party block (two or three columns; bordered or plain) ────────────────────

export function buildPartyBlock(cfg: ReportConfig): any {
  const style = cfg.partyBlockStyle ?? 'plain';
  const metaPlacement = cfg.metaPlacement ?? 'inline';
  const labelLeft = style === 'bordered' ? 'Bill To / Ship To' : 'Quoted To';

  // PO-style: right-aligned meta sits ABOVE the party block, party block
  // renders as 2 cols (vendor + shipTo/deliverTo) without the meta.
  if (metaPlacement === 'above-party') {
    const metaStackOnly = {
      columns: [
        { width: '*', text: '' },
        {
          width: 'auto', alignment: 'right',
          stack: cfg.meta.map((r, i) => ({
            text: `${r.label}: ${r.value}`,
            fontSize: 8, bold: !!r.bold,
            margin: i === 0 ? [0, 0, 0, 0] : [0, 0, 0, 0],
          })),
        },
      ],
      margin: [0, 0, 0, 8],
    };
    const contactLabels = cfg.partyContactLabels ?? 'abbrev';
    const leftCell = partyStack(cfg.toParty, 'Vendor (Bill From)', 'plain', contactLabels);
    const rightCell = cfg.shipToParty
      ? partyStack(cfg.shipToParty, 'Deliver To (Bill To)', 'plain', contactLabels)
      : { text: '' };
    const body = {
      table: { widths: ['*', '*'], body: [[leftCell, rightCell]] },
      layout: 'noBorders',
      margin: [0, 0, 0, 10],
    };
    return [metaStackOnly, body];
  }

  // Standard 2-col: [party | meta]
  const leftCell = partyStack(cfg.toParty, labelLeft, style, cfg.partyContactLabels ?? 'abbrev');
  const rightCell: any = {
    stack: [
      sectionLabel(cfg.documentTitle.toLowerCase().includes('invoice') ? 'Invoice Details' :
                   cfg.documentTitle.toLowerCase().includes('quot')     ? 'Quote Details'  :
                   cfg.documentTitle.toLowerCase().includes('purchase') ? 'PO Details'     :
                   'Details'),
      ...cfg.meta.map((r, i) => ({
        text: `${r.label}: ${r.value}`,
        fontSize: i === 0 ? 7.5 : 7,
        bold: !!r.bold,
      })),
    ],
  };

  // Bordered style uses BOX_LAYOUT + label/value meta table; plain uses stack.
  if (style === 'bordered') {
    return {
      table: {
        widths: ['*', '*'],
        body: [[leftCell, metaStack(cfg.meta, 'table')]],
      },
      layout: BOX_LAYOUT,
      margin: [0, 0, 0, 6],
    };
  }
  return {
    table: { widths: ['*', '*'], body: [[leftCell, rightCell]] },
    layout: 'noBorders',
    margin: [0, 0, 0, 8],
  };
}

// ── Items table ──────────────────────────────────────────────────────────────

export function buildItemsTable(cfg: ReportConfig): any {
  const isIntra = cfg.gstMode === 'intra';
  const isInter = cfg.gstMode === 'inter';
  const items = cfg.items;
  const firstGstRate = Number(items[0]?.gst_rate ?? cfg.totals.total > 0 ? 18 : 0);
  const halfRate = firstGstRate / 2;

  // Determine whether to show Rate + Disc% columns (hidden when no item
  // has a rate; matches the existing invoice behaviour).
  const hasRate = items.some(i => i.unit_price != null);
  const hasDiscount = items.some(i => (i.discount_pct ?? 0) > 0);
  const hasQty = items.some(i => i.quantity != null && i.quantity !== 0 && i.quantity !== '');
  const qtyStyle = cfg.itemsQtyStyle ?? 'split-qty-unit';
  const hsnHeader = cfg.itemsHsnHeader ?? 'HSN/SAC';

  // Header row
  const headerRow: any[] = [tableHeaderCell('#', 'center'), tableHeaderCell('Description', 'left')];
  if (qtyStyle === 'combined-qty') {
    // Invoice order: # / Description / Qty / HSN/SAC / ...
    // When no item has a quantity (pure-service row), omit the Qty column
    // entirely (matches old invoice behaviour).
    if (hasQty) headerRow.push(tableHeaderCell('Qty', 'center'));
    headerRow.push(tableHeaderCell(hsnHeader, 'center'));
  } else {
    // Quote/PO order: # / Description / HSN/SAC / Qty / Unit / ...
    headerRow.push(tableHeaderCell(hsnHeader, 'center'));
    headerRow.push(tableHeaderCell('Qty', 'center'));
    headerRow.push(tableHeaderCell('Unit', 'center'));
  }
  if (hasRate) headerRow.push(tableHeaderCell('Rate', 'right'));
  if (hasDiscount) headerRow.push(tableHeaderCell('Disc%', 'center'));
  headerRow.push(tableHeaderCell('Taxable', 'right'));
  // 'rate-in-cell' uses one combined GST column with rate% per-cell (PO).
  // 'rate-in-header' (default) splits intra into CGST + SGST columns, each
  // with the rate% in the header — used by invoice / quote.
  const gstStyle = cfg.itemsGstStyle ?? 'rate-in-header';
  const combinedGst = gstStyle === 'rate-in-cell';
  if (combinedGst) {
    headerRow.push(tableHeaderCell(isInter ? 'IGST' : 'GST', 'right'));
  } else if (isIntra) {
    headerRow.push(tableHeaderCell(`CGST ${halfRate}%`, 'right'));
    headerRow.push(tableHeaderCell(`SGST ${halfRate}%`, 'right'));
  } else if (isInter) {
    headerRow.push(tableHeaderCell(`IGST ${firstGstRate}%`, 'right'));
  }
  headerRow.push(tableHeaderCell('Total', 'right'));

  // Data rows
  const dataRows = items.map((item, idx) => {
    const halfGst = parseFloat(((item.gst_amount ?? 0) / 2).toFixed(2));
    const row: any[] = [
      { text: String(idx + 1), alignment: 'center', fontSize: FONT.table },
      { text: sanitizePdfText(item.name), fontSize: FONT.table, bold: true },
    ];
    if (qtyStyle === 'combined-qty') {
      if (hasQty) {
        const qtyText = item.quantity != null && item.quantity !== 0
          ? `${item.quantity} ${item.unit ?? ''}`.trim() : '-';
        row.push({ text: qtyText, alignment: 'center', fontSize: FONT.table });
      }
      row.push({ text: item.hsn || '-', alignment: 'center', fontSize: FONT.table });
    } else {
      row.push({ text: item.hsn || '-', alignment: 'center', fontSize: FONT.table });
      row.push({ text: item.quantity != null ? String(item.quantity) : '-', alignment: 'center', fontSize: FONT.table });
      row.push({ text: item.unit ?? '-', alignment: 'center', fontSize: FONT.table });
    }
    if (hasRate) {
      row.push({ text: item.unit_price != null ? fmtINR(item.unit_price) : '-', alignment: 'right', fontSize: FONT.table });
    }
    if (hasDiscount) {
      row.push({ text: (item.discount_pct ?? 0) > 0 ? `${item.discount_pct}%` : '-', alignment: 'center', fontSize: FONT.table });
    }
    row.push({ text: fmtINR(item.taxable_amount), alignment: 'right', fontSize: FONT.table });
    if (combinedGst) {
      // PO-style combined cell: "{amount}\n{rate}%".
      const rate = Number(item.gst_rate ?? firstGstRate);
      const rateLabel = isIntra ? `${(rate / 2).toFixed(0)}%+${(rate / 2).toFixed(0)}%` : `${rate}%`;
      row.push({ text: `${fmtINR(item.gst_amount ?? 0)}\n${rateLabel}`, alignment: 'right', fontSize: 7.5 });
    } else if (isIntra) {
      row.push({ text: fmtINR(halfGst), alignment: 'right', fontSize: FONT.table });
      row.push({ text: fmtINR(halfGst), alignment: 'right', fontSize: FONT.table });
    } else if (isInter) {
      row.push({ text: fmtINR(item.gst_amount ?? 0), alignment: 'right', fontSize: FONT.table });
    }
    row.push({ text: fmtINR(item.total), alignment: 'right', bold: true, fontSize: FONT.table });
    return row;
  });

  // Widths — recompute based on which columns are present.
  const widths: any[] = [14, '*'];
  if (qtyStyle === 'combined-qty') {
    if (hasQty) widths.push(35); // Qty (combined)
    widths.push(45); // HSN/SAC
  } else {
    widths.push(40); // HSN/SAC
    widths.push(22); // Qty
    widths.push(24); // Unit
  }
  if (hasRate) widths.push(50);
  if (hasDiscount) widths.push(22);
  widths.push(55);
  if (combinedGst) {
    widths.push(50);
  } else if (isIntra) {
    widths.push(48); widths.push(48);
  } else if (isInter) {
    widths.push(52);
  }
  widths.push(60);

  const body: any[][] = [headerRow, ...dataRows];

  // Inline-last-row totals mode: append the TOTAL row to the items table
  // so it visually "joins" the items instead of being a separate table.
  if ((cfg.totalsStyle ?? 'inline-last-row') === 'inline-last-row') {
    // cols: # + Desc + (Qty? + HSN) / (HSN + Qty + Unit) + [Rate] + [Disc]
    const qtyCols = qtyStyle === 'combined-qty' ? (hasQty ? 2 : 1) : 3;
    const colsBefore = 2 + qtyCols + (hasRate ? 1 : 0) + (hasDiscount ? 1 : 0);
    const totalRow: any[] = [];
    totalRow.push({ text: 'TOTAL', colSpan: colsBefore, alignment: 'right', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.table });
    for (let i = 1; i < colsBefore; i++) totalRow.push({});
    totalRow.push({ text: fmtINR(cfg.totals.taxable), alignment: 'right', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.table });
    if (combinedGst) {
      totalRow.push({ text: fmtINR(cfg.totals.cgst + cfg.totals.sgst + cfg.totals.igst), alignment: 'right', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.table });
    } else if (isIntra) {
      totalRow.push({ text: fmtINR(cfg.totals.cgst), alignment: 'right', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.table });
      totalRow.push({ text: fmtINR(cfg.totals.sgst), alignment: 'right', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.table });
    } else if (isInter) {
      totalRow.push({ text: fmtINR(cfg.totals.igst), alignment: 'right', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.table });
    }
    totalRow.push({ text: fmtINR(cfg.totals.total), alignment: 'right', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.total });
    body.push(totalRow);
  }

  return {
    table: { headerRows: 1, widths, body, dontBreakRows: true },
    layout: TABLE_LAYOUT,
    margin: [0, 0, 0, 8],
  };
}

// ── Separate totals table (quote / PO style) ─────────────────────────────────

export function buildTotalsTable(cfg: ReportConfig): any | null {
  const style = cfg.totalsStyle ?? 'inline-last-row';
  if (style === 'inline-last-row') return null;

  const t = cfg.totals;
  const isIntra = cfg.gstMode === 'intra';
  const isInter = cfg.gstMode === 'inter';

  const rows: any[][] = [];
  // PO-style omits the "Subtotal" row when it equals taxable (original PO
  // behaviour — it goes straight to Net Assessable Value). Quote-style
  // always includes it.
  const includeSubtotal = style !== 'plain' || (t.subtotal !== t.taxable);
  if (includeSubtotal) {
    rows.push([{ text: 'Subtotal', alignment: 'right', color: '#666' }, { text: fmtINR(t.subtotal), alignment: 'right' }]);
  }
  if (t.discount > 0) {
    rows.push([
      { text: 'Discount', alignment: 'right', color: '#c00' },
      { text: `- ${fmtINR(t.discount)}`, alignment: 'right', color: '#c00' },
    ]);
  }
  rows.push([
    { text: style === 'plain' ? 'Net Assessable Value' : 'Taxable Value', alignment: 'right', color: '#666' },
    { text: fmtINR(t.taxable), alignment: 'right' },
  ]);
  if (isIntra) {
    rows.push([{ text: 'CGST', alignment: 'right', color: '#666' }, { text: fmtINR(t.cgst), alignment: 'right' }]);
    rows.push([{ text: 'SGST', alignment: 'right', color: '#666' }, { text: fmtINR(t.sgst), alignment: 'right' }]);
  } else if (isInter) {
    // PO shows "IGST @ 18%" with the rate embedded; invoice/quote show just "IGST".
    const igstLabel = style === 'plain' && cfg.items[0]?.gst_rate ? `IGST @ ${cfg.items[0].gst_rate}%` : 'IGST';
    rows.push([{ text: igstLabel, alignment: 'right', color: '#666' }, { text: fmtINR(t.igst), alignment: 'right' }]);
  }
  rows.push([
    { text: 'GRAND TOTAL', alignment: 'right', bold: true, fontSize: 10,
      ...(style === 'bordered' ? { fillColor: COLORS.headerBg } : {}) },
    { text: fmtINR(t.total), alignment: 'right', bold: true, fontSize: 10,
      ...(style === 'bordered' ? { fillColor: COLORS.headerBg } : {}) },
  ]);
  // PO-style advance-paid + balance-payable rows (derived from cfg.payments).
  if (style === 'plain' && cfg.payments && cfg.payments.length > 0) {
    const totalPaid = cfg.payments.reduce((s, p) => s + p.amount, 0);
    const balance = t.total - totalPaid;
    rows.push([
      { text: 'Less: Advance Paid', alignment: 'right', color: '#059669' },
      { text: `- ${fmtINR(totalPaid)}`, alignment: 'right', color: '#059669' },
    ]);
    rows.push([
      { text: 'BALANCE PAYABLE', alignment: 'right', bold: true, fontSize: 10 },
      { text: fmtINR(balance), alignment: 'right', bold: true, fontSize: 10, color: balance > 0 ? '#dc2626' : '#059669' },
    ]);
  }

  if (style === 'bordered') {
    // Right-justified 3-column bordered totals (quote style).
    return {
      table: {
        widths: ['*', 90, 80],
        body: rows.map(([label, value]) => [
          { text: '', border: [false, false, false, false] },
          { ...label, border: [true, true, false, true] },
          { ...value, border: [false, true, true, true] },
        ]),
      },
      layout: TABLE_LAYOUT,
      margin: [0, 0, 0, 10],
    };
  }
  // 'plain' — right-aligned no-border 2-col (PO style).
  return {
    columns: [{ width: '*', text: '' }, {
      width: 'auto',
      table: { widths: [130, 90], body: rows },
      layout: 'noBorders',
    }],
    margin: [0, 0, 0, 6],
  };
}

// ── Amount in Words ──────────────────────────────────────────────────────────

export function buildAmountInWords(cfg: ReportConfig): any | null {
  if (!cfg.sections.showAmountInWords) return null;
  const words = cfg.totals.amountInWords ?? numToWords(cfg.totals.total);
  const tds = cfg.totals.tds;
  const style = cfg.amountInWordsStyle ?? 'box';
  if (style === 'inline') {
    // Plain one-liner used by the PO. The caller typically formats a more
    // elaborate string (e.g. adding "Balance Payable: …") and passes it via
    // totals.amountInWords — we render it verbatim when provided.
    const text = cfg.totals.amountInWords ?? `Grand Total (in words): ${words} (INR)`;
    return { text, fontSize: 8, margin: [0, 0, 0, 6] };
  }
  return sectionBox({
    stack: [
      sectionLabel('Amount in Words'),
      { text: words, fontSize: FONT.heading, bold: true, color: COLORS.black },
      ...(tds ? [{
        text: `* Subject to TDS @ ${tds.rate}%. Net receivable: ${fmtINR(cfg.totals.total - tds.amount)}`,
        fontSize: FONT.body, color: COLORS.gray, margin: [0, 2, 0, 0],
      }] : []),
    ],
  });
}

// ── Payment summary ──────────────────────────────────────────────────────────

export function buildPaymentSummaryBlock(cfg: ReportConfig): any | null {
  if (!cfg.sections.showPaymentSummary) return null;
  const payments = cfg.payments ?? [];
  const adjustments = cfg.adjustments ?? [];
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const totalAdj = adjustments.reduce((s, a) => s + a.amount, 0);
  if (totalPaid === 0 && totalAdj === 0) return null;

  const rows: Array<{ label: string; amount: string; color?: string; bold?: boolean; fontSize?: number }> = [
    { label: 'Invoice Total', amount: fmtINR(cfg.totals.total), bold: true, fontSize: FONT.table },
  ];
  for (const p of payments) {
    rows.push({
      label: `Less: Payment Received (${fmtDate(p.date)})${p.mode ? ' — ' + p.mode : ''}`,
      amount: `\u2013${fmtINR(p.amount)}`,
      color: COLORS.positive,
    });
  }
  for (const a of adjustments) {
    rows.push({
      label: `Less: ${a.description}`,
      amount: `\u2013${fmtINR(a.amount)}`,
      color: COLORS.positive,
    });
  }
  const netDue = cfg.totals.total - totalPaid - totalAdj;
  rows.push({
    label: 'Balance Due',
    amount: fmtINR(netDue),
    bold: true,
    fontSize: FONT.heading,
    color: netDue > 0 ? COLORS.negative : COLORS.black,
  });
  return buildPaymentSummary(rows);
}

// ── Bank Details + Declaration block ─────────────────────────────────────────

export async function buildBankBlock(cfg: ReportConfig, CO: any): Promise<any | null> {
  if (!cfg.sections.showBankBlock) return null;

  const bank = cfg.bank ?? {
    bankName: CO.bankName ?? CO.bank ?? '',
    accountNo: CO.bankAccount ?? CO.acc ?? '',
    ifsc: CO.bankIfsc ?? CO.ifsc ?? '',
    branch: CO.bankBranch ?? '',
    upi: CO.upi ?? '',
  };
  const sigUrl = cfg.sections.showSignature ? getSignatureDataUrl() : null;
  const signatory = cfg.signatory!;

  // QR — default `true` means no-amount QR; an object lets the caller customise.
  let qrDataUrl = '';
  if (cfg.upiQr) {
    const opts = typeof cfg.upiQr === 'object' ? cfg.upiQr : {};
    const payee = opts.payee ?? bank.upi;
    const note = opts.note ?? cfg.documentTitle;
    const amountParam = opts.amount != null && opts.amount > 0 && opts.amount <= 100000
      ? `&am=${opts.amount.toFixed(2)}` : '';
    const upiString = `upi://pay?pa=${payee}&pn=${encodeURIComponent(cfg.fromCompany.name)}${amountParam}&cu=INR&tn=${encodeURIComponent(note)}`;
    qrDataUrl = await QRCode.toDataURL(upiString, {
      width: 90, margin: 1, color: { dark: '#111111', light: '#ffffff' },
    });
  }

  return buildBankDeclarationBox({
    companyName: cfg.fromCompany.name,
    bankName: bank.bankName,
    accountNo: bank.accountNo,
    ifsc: bank.ifsc,
    branch: bank.branch,
    upi: bank.upi,
    qrDataUrl,
    signatureDataUrl: sigUrl,
    signatoryName: signatory.name,
    signatoryTitle: signatory.title,
    declarationLabel: cfg.paymentTermsLabel,
    declarationText: cfg.paymentTermsText,
  });
}

// ── Notes & Terms ────────────────────────────────────────────────────────────

function renderNotesOrTerms(raw: string): any[] {
  const out: any[] = [];
  const paragraphs = raw.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  const flushRuns = (textRun: string[], bulletRun: string[]) => {
    if (textRun.length) {
      out.push({
        text: sanitizePdfText(textRun.join(' ')),
        fontSize: 7, color: '#444', lineHeight: 1.5, alignment: 'justify', margin: [0, 0, 0, 4],
      });
    }
    if (bulletRun.length) {
      out.push({
        ul: bulletRun.map(l => ({ text: sanitizePdfText(l.replace(/^[-•]\s+/, '')), fontSize: 7, color: '#444', lineHeight: 1.4 })),
        margin: [0, 0, 0, 4],
      });
    }
  };
  for (const para of paragraphs) {
    const lines = para.split(/\n/).map(l => l.trim()).filter(Boolean);
    let textRun: string[] = [];
    let bulletRun: string[] = [];
    for (const line of lines) {
      if (/^[-•]\s+/.test(line)) {
        if (textRun.length) { flushRuns(textRun, []); textRun = []; }
        bulletRun.push(line);
      } else {
        if (bulletRun.length) { flushRuns([], bulletRun); bulletRun = []; }
        textRun.push(line);
      }
    }
    flushRuns(textRun, bulletRun);
  }
  return out;
}

export function buildNotesTerms(cfg: ReportConfig): any | null {
  if (!cfg.sections.showNotesTermsBlock) return null;
  const nt = cfg.notesAndTerms;
  if (!nt || (!nt.notes && !nt.terms)) return null;

  const ntBody: any[][] = [[
    ...(nt.notes ? [{ stack: [sectionLabel('Notes'), ...renderNotesOrTerms(nt.notes)] }] : []),
    ...(nt.terms ? [{ stack: [sectionLabel('Terms & Conditions'), ...renderNotesOrTerms(nt.terms)] }] : []),
  ]];
  const ntWidths = nt.notes && nt.terms ? ['*', '*'] : ['*'];
  return { table: { widths: ntWidths, body: ntBody }, layout: 'noBorders', margin: [0, 8, 0, 8] };
}

// ── UPI disclaimer strip ─────────────────────────────────────────────────────

export function buildUpiDisclaimer(cfg: ReportConfig): any | null {
  if (!cfg.sections.showUpiDisclaimer) return null;
  return {
    text: '* UPI payments are subject to per-transaction limits (typically \u20B91 lakh). For amounts exceeding the limit, you may split into multiple UPI transfers or use NEFT / RTGS for the full amount in a single transfer.',
    fontSize: 5, color: COLORS.medGray, italics: true, lineHeight: 1.3, margin: [0, 0, 0, 4],
  };
}

// ── Footer italic disclaimer ─────────────────────────────────────────────────

export function buildFooterDisclaimer(cfg: ReportConfig): any | null {
  if (!cfg.disclaimerText) return null;
  return {
    text: cfg.disclaimerText,
    fontSize: 6, color: '#888', italics: true, alignment: 'center', margin: [0, 2, 0, 0],
  };
}

// ── PO-style signature block (when no bank block is shown) ───────────────────

export function buildSignatureOnly(cfg: ReportConfig): any | null {
  if (cfg.sections.showBankBlock || !cfg.sections.showSignature) return null;
  const sigUrl = getSignatureDataUrl();
  // Title-case the document title for the disclaimer sentence — the section
  // header box shows it uppercased, but the footer disclaimer uses a
  // natural-language phrasing ("Purchase Order issued by …"), so we
  // lower-then-capitalise each word.
  const prettyTitle = cfg.documentTitle.toLowerCase().replace(/(^|\s)(\w)/g, (_, s, c) => s + c.toUpperCase());
  const disclaimerLeftStack: any[] = [
    { text: 'DISCLAIMER', fontSize: 6.5, bold: true, color: COLORS.sectionHeader, margin: [0, 0, 0, 3] },
    { text: `${prettyTitle} issued by ${cfg.fromCompany.name}`, fontSize: 6.5, color: '#666' },
    { text: `Subject to Chennai jurisdiction. GSTIN: ${cfg.fromCompany.gstin}`, fontSize: 6.5, color: '#666' },
  ];
  return {
    table: {
      widths: ['*', '*'],
      body: [[
        { stack: disclaimerLeftStack },
        {
          stack: [
            { text: `For ${cfg.fromCompany.name}`, fontSize: 7, bold: true, color: '#444', alignment: 'right' },
            ...(sigUrl
              ? [{ image: sigUrl, width: 55, alignment: 'right' as const, margin: [0, 4, 0, 2] as any }]
              : [{ text: '', margin: [0, 16, 0, 0] }]),
            { canvas: [{ type: 'line', x1: 80, y1: 0, x2: 200, y2: 0, lineWidth: 0.5, lineColor: '#bbb' }] },
            { text: 'Authorised Signatory', fontSize: 6.5, bold: true, alignment: 'right' },
          ],
        },
      ]],
    },
    layout: 'noBorders',
  };
}

// ── Re-export LineItem for convenience ───────────────────────────────────────
export type { LineItem };
