// lib/quotePdf.ts
// Shared quote-PDF builder. Used by both the /api/accounts/quotes/[id]/pdf
// HTTP route and by sendQuoteEmail() to attach the PDF to outbound mail.
// Keeping the layout logic in one place means the PDF a customer sees
// attached to an email is byte-identical to the PDF they'd download from
// the dashboard.

import QRCode from 'qrcode';
import { getLogoDataUrl, getSignatureDataUrl, fmtINR, fmtDate, generateSmartPdf, sanitizePdfText } from '@/lib/pdfConfig';
import { COLORS, FONT, buildHeader, buildFooter, tableHeaderCell, TABLE_LAYOUT, sectionLabel, buildBankDeclarationBox } from '@/lib/pdfTemplate';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCompanyCO } from '@/lib/company';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface QuotePdfResult {
  /** Rendered PDF bytes, ready to serve or attach to an email. */
  buffer: Buffer;
  /** Quote number (e.g. "QT-2026-003"), useful for filenames. */
  quoteNo: string;
  /** Suggested download filename (`Quote-QT-2026-003.pdf`). */
  filename: string;
}

export async function generateQuotePdfBuffer(quoteId: string): Promise<QuotePdfResult> {
  const CO = await getCompanyCO();
  const logoUrl = getLogoDataUrl();
  const sigUrl = getSignatureDataUrl();

  const { data: quote, error } = await supabaseAdmin.from('quotes').select('*, customers(*)').eq('id', quoteId).single();
  if (error || !quote) throw new Error(`Quote not found: ${quoteId}`);

  const customer = quote.customers as any;
  const billing = customer?.billing_address as Record<string, string> | null;
  const items = (quote.items ?? []) as any[];
  const isIntra = customer?.state_code === '33' || customer?.state?.toLowerCase().includes('tamil');
  const halfRate = (items[0]?.gst_rate ?? 18) / 2;

  const content: any[] = [];

  // Header
  content.push(buildHeader({
    logoUrl,
    companyName: CO.name,
    address: `${CO.addr1} ${CO.addr2}`,
    contactLine: `${CO.email}  |  ${CO.phone}  |  ${CO.web}`,
    gstin: CO.gstin,
    pan: CO.pan,
    cin: CO.cin,
    tan: CO.tan,
    documentTitle: 'QUOTATION',
  }));

  content.push({ text: 'Not a tax invoice', fontSize: FONT.body, italics: true, color: COLORS.medGray, alignment: 'right', margin: [0, -4, 0, 8] });

  const addr = billing ? [billing.line1, billing.line2, billing.city, billing.state, billing.pincode].filter(Boolean).join(', ') : '';
  content.push({
    table: {
      widths: ['*', '*'],
      body: [[
        {
          stack: [
            sectionLabel('Quoted To'),
            { text: customer?.name ?? '', fontSize: 10, bold: true },
            ...(customer?.gstin ? [{ text: `GSTIN: ${customer.gstin}`, fontSize: 7, margin: [0, 2, 0, 0] }] : []),
            ...(customer?.pan ? [{ text: `PAN: ${customer.pan}`, fontSize: 7 }] : []),
            ...(addr ? [{ text: addr, fontSize: 7, color: '#555', margin: [0, 2, 0, 0] }] : []),
            ...(customer?.phone ? [{ text: `Ph: ${customer.phone}`, fontSize: 6.5, color: '#555', margin: [0, 2, 0, 0] }] : []),
            ...(customer?.email ? [{ text: customer.email, fontSize: 6.5, color: '#555' }] : []),
          ],
        },
        {
          stack: [
            sectionLabel('Quote Details'),
            { text: `Quote No: ${quote.quote_no}`, fontSize: 7.5, bold: true },
            { text: `Date: ${fmtDate(quote.quote_date)}`, fontSize: 7 },
            ...(quote.valid_until ? [{ text: `Valid Until: ${fmtDate(quote.valid_until)}`, fontSize: 7 }] : []),
            { text: `Place of Supply: ${isIntra ? 'Tamil Nadu (33)' : (customer?.state ?? '-')}`, fontSize: 7 },
            { text: `GST Type: ${isIntra ? 'CGST + SGST' : 'IGST'}`, fontSize: 7 },
          ],
        },
      ]],
    },
    layout: 'noBorders',
    margin: [0, 0, 0, 8],
  });

  const FM = 6.5;
  const cell = (text: string, align = 'right', bold = false) => ({ text, alignment: align, fontSize: FM, bold, noWrap: true });

  const headerRow: any[] = [
    tableHeaderCell('#', 'center'), tableHeaderCell('Description', 'left'), tableHeaderCell('HSN/SAC', 'center'),
    tableHeaderCell('Qty', 'center'), tableHeaderCell('Unit', 'center'), tableHeaderCell('Rate', 'right'),
    tableHeaderCell('Disc%', 'center'), tableHeaderCell('Taxable', 'right'),
  ];
  if (isIntra) {
    headerRow.push(tableHeaderCell(`CGST ${halfRate}%`, 'right'), tableHeaderCell(`SGST ${halfRate}%`, 'right'));
  } else {
    headerRow.push(tableHeaderCell('IGST', 'right'));
  }
  headerRow.push(tableHeaderCell('Total', 'right'));

  const dataRows = items.map((item: any, i: number) => {
    const halfGst = parseFloat((item.gst_amount / 2).toFixed(2));
    const row: any[] = [
      { text: String(i + 1), alignment: 'center', fontSize: FONT.table },
      { text: sanitizePdfText(item.name), fontSize: FONT.table },
      cell(item.hsn_code || item.sac_code || '-', 'center'),
      cell(String(item.quantity), 'center'),
      cell(item.unit, 'center'),
      cell(fmtINR(item.unit_price)),
      cell(item.discount_pct > 0 ? `${item.discount_pct}%` : '-', 'center'),
      cell(fmtINR(item.taxable_amount)),
    ];
    if (isIntra) {
      row.push(cell(fmtINR(halfGst)), cell(fmtINR(halfGst)));
    } else {
      row.push(cell(fmtINR(item.gst_amount)));
    }
    row.push(cell(fmtINR(item.total), 'right', true));
    return row;
  });

  const widths: any[] = [14, '*', 40, 18, 20, 50, 20, 52];
  if (isIntra) { widths.push(42, 42); } else { widths.push(46); }
  widths.push(55);

  content.push({
    table: { headerRows: 1, widths, body: [headerRow, ...dataRows], dontBreakRows: true },
    layout: TABLE_LAYOUT,
    margin: [0, 0, 0, 8],
  });

  const totalsBody: any[][] = [
    [{ text: 'Subtotal', alignment: 'right', color: '#666' }, { text: fmtINR(quote.subtotal), alignment: 'right' }],
  ];
  if (Number(quote.discount_amount) > 0) {
    totalsBody.push([{ text: 'Discount', alignment: 'right', color: '#c00' }, { text: `- ${fmtINR(quote.discount_amount)}`, alignment: 'right', color: '#c00' }]);
  }
  totalsBody.push([{ text: 'Taxable Value', alignment: 'right' }, { text: fmtINR(quote.taxable_value), alignment: 'right' }]);
  if (isIntra) {
    totalsBody.push([{ text: 'CGST', alignment: 'right', color: '#666' }, { text: fmtINR(quote.cgst_amount), alignment: 'right' }]);
    totalsBody.push([{ text: 'SGST', alignment: 'right', color: '#666' }, { text: fmtINR(quote.sgst_amount), alignment: 'right' }]);
  } else {
    totalsBody.push([{ text: 'IGST', alignment: 'right', color: '#666' }, { text: fmtINR(quote.igst_amount), alignment: 'right' }]);
  }
  totalsBody.push([
    { text: 'GRAND TOTAL', alignment: 'right', bold: true, fontSize: 10, fillColor: COLORS.headerBg },
    { text: fmtINR(quote.total_amount), alignment: 'right', bold: true, fontSize: 10, fillColor: COLORS.headerBg },
  ]);

  content.push({
    table: {
      widths: ['*', 90, 80],
      body: totalsBody.map(([label, value]) => [
        { text: '', border: [false, false, false, false] },
        { ...label, border: [true, true, false, true] },
        { ...value, border: [false, true, true, true] },
      ]),
    },
    layout: TABLE_LAYOUT,
    margin: [0, 0, 0, 10],
  });

  // Notes & Terms (rendered block, pushed after bank + signature below)
  const renderNotesOrTerms = (raw: string): any[] => {
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
  };

  const notesTermsBlock: any | null = (quote.notes || quote.terms)
    ? (() => {
        const ntBody: any[][] = [[
          ...(quote.notes ? [{ stack: [sectionLabel('Notes'), ...renderNotesOrTerms(quote.notes)] }] : []),
          ...(quote.terms ? [{ stack: [sectionLabel('Terms & Conditions'), ...renderNotesOrTerms(quote.terms)] }] : []),
        ]];
        const ntWidths = quote.notes && quote.terms ? ['*', '*'] : ['*'];
        return { table: { widths: ntWidths, body: ntBody }, layout: 'noBorders', margin: [0, 8, 0, 8] };
      })()
    : null;

  const upiString = `upi://pay?pa=${CO.upi}&pn=${encodeURIComponent(CO.name)}&cu=INR&tn=${encodeURIComponent('Quote ' + quote.quote_no)}`;
  const upiQr = await QRCode.toDataURL(upiString, { width: 90, margin: 1, color: { dark: '#111111', light: '#ffffff' } });

  content.push(buildBankDeclarationBox({
    companyName: CO.name,
    bankName: (CO as any).bankName ?? '',
    accountNo: (CO as any).bankAccount ?? '',
    ifsc: (CO as any).bankIfsc ?? '',
    branch: (CO as any).bankBranch ?? '',
    upi: (CO as any).upi ?? '',
    qrDataUrl: upiQr,
    signatureDataUrl: sigUrl,
    signatoryName: 'Sivakumar Shanmugam',
    signatoryTitle: 'CEO, Rotehügels',
    declarationLabel: 'Payment Terms',
    declarationText: `100% advance before dispatch. Kindly reference Quote No. ${quote.quote_no} in the transaction remarks. Scan the UPI QR or transfer via NEFT/RTGS/IMPS using the account details on the left.`,
  }));

  content.push({
    text: '* UPI payments are subject to per-transaction limits (typically \u20B91 lakh). For amounts exceeding the limit, you may split into multiple UPI transfers or use NEFT / RTGS for the full amount in a single transfer.',
    fontSize: 5, color: COLORS.medGray, italics: true, lineHeight: 1.3, margin: [0, 0, 0, 4],
  });

  if (notesTermsBlock) content.push(notesTermsBlock);

  content.push({
    text: 'This is a quotation and not a tax invoice. Prices subject to change after validity date. Subject to Chennai jurisdiction.',
    fontSize: 6, color: '#888', italics: true, alignment: 'center', margin: [0, 2, 0, 0],
  });

  const buffer = await generateSmartPdf(
    content,
    buildFooter({
      leftText: quote.quote_no,
      centerText: `${CO.web}  |  ${CO.email}`,
    }),
  );

  return {
    buffer,
    quoteNo: quote.quote_no,
    filename: `Quote-${quote.quote_no}.pdf`,
  };
}
