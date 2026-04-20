import { NextResponse } from 'next/server';
import { getLogoDataUrl, getSignatureDataUrl, fmtINR, fmtDate, generateSmartPdf, sanitizePdfText } from '@/lib/pdfConfig';
import { COLORS, FONT, buildHeader, buildFooter, tableHeaderCell, TABLE_LAYOUT, sectionLabel, buildBankDeclarationBox } from '@/lib/pdfTemplate';
import QRCode from 'qrcode';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCompanyCO } from '@/lib/company';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(_req.url);
  const download = url.searchParams.get('download') === '1';

  try {
    const CO = await getCompanyCO();
    const logoUrl = getLogoDataUrl();
    const sigUrl = getSignatureDataUrl();

    const { data: quote, error } = await supabaseAdmin.from('quotes').select('*, customers(*)').eq('id', id).single();
    if (error || !quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });

    const customer = quote.customers as any;
    const billing = customer?.billing_address as Record<string, string> | null;
    const items = (quote.items ?? []) as any[];
    const isIntra = customer?.state_code === '33' || customer?.state?.toLowerCase().includes('tamil');
    const halfRate = (items[0]?.gst_rate ?? 18) / 2;

    const content: any[] = [];

    // Header — using shared buildHeader
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

    // "Not a tax invoice" subtitle (identifiers already live in the top-right
    // header block — no need to repeat them as a strip below).
    content.push({ text: 'Not a tax invoice', fontSize: FONT.body, italics: true, color: COLORS.medGray, alignment: 'right', margin: [0, -4, 0, 8] });

    // Quoted To + Quote Details — full-width two-column table
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

    // Items table — Description gets all remaining space (*)
    // Monetary columns sized to fit ₹XX,XXX.XX format
    // Overall table spans full page width
    const FM = 6.5; // monetary column font (slightly smaller for compact numbers)
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
        { text: sanitizePdfText(item.name), fontSize: FONT.table },  // Description wraps naturally
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

    // # and Disc are tiny, HSN/Qty/Unit are compact, monetary cols fit ₹XX,XXX.XX
    // Description (*) gets all remaining space — typically ~160-200pt
    const widths: any[] = [14, '*', 40, 18, 20, 50, 20, 52];
    if (isIntra) { widths.push(42, 42); } else { widths.push(46); }
    widths.push(55);

    content.push({
      table: { headerRows: 1, widths, body: [headerRow, ...dataRows], dontBreakRows: true },
      layout: TABLE_LAYOUT,
      margin: [0, 0, 0, 8],
    });

    // Totals (right-aligned)
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

    // Totals table — full width, right-aligned labels + values
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

    // Notes & Terms — two-column layout. Each section is split into
    // paragraphs (double-newline separated). A paragraph whose lines all
    // start with `- ` is rendered as a bullet list; otherwise it's
    // justified prose. This lets the stored text stay as plain text while
    // the render adapts to its shape.
    const renderNotesOrTerms = (raw: string): any[] => {
      const out: any[] = [];
      const paragraphs = raw.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
      for (const para of paragraphs) {
        const lines = para.split(/\n/).map(l => l.trim()).filter(Boolean);
        const bulletLines = lines.filter(l => /^[-•]\s+/.test(l));
        if (bulletLines.length >= 2 && bulletLines.length === lines.length) {
          // Entire paragraph is a bullet list
          out.push({
            ul: lines.map(l => ({ text: sanitizePdfText(l.replace(/^[-•]\s+/, '')), fontSize: 7, color: '#444', lineHeight: 1.4 })),
            margin: [0, 0, 0, 4],
          });
        } else {
          out.push({
            text: sanitizePdfText(para),
            fontSize: 7, color: '#444', lineHeight: 1.5,
            alignment: 'justify',
            margin: [0, 0, 0, 4],
          });
        }
      }
      return out;
    };

    if (quote.notes || quote.terms) {
      const ntBody: any[][] = [[
        ...(quote.notes ? [{
          stack: [
            sectionLabel('Notes'),
            ...renderNotesOrTerms(quote.notes),
          ],
        }] : []),
        ...(quote.terms ? [{
          stack: [
            sectionLabel('Terms & Conditions'),
            ...renderNotesOrTerms(quote.terms),
          ],
        }] : []),
      ]];
      const ntWidths = quote.notes && quote.terms ? ['*', '*'] : ['*'];
      content.push({
        table: { widths: ntWidths, body: ntBody },
        layout: 'noBorders',
        margin: [0, 0, 0, 8],
      });
    }

    // Bank Details + QR + Payment Terms + Signature — reuse the shared
    // invoice block so quote and invoice look identical at the bottom.
    // The declaration paragraph carries payment instructions for the quote
    // (quote has no formal legal declaration, so we use the slot for the
    // payment-terms note).
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

    // UPI / NEFT / RTGS disclaimer — same copy as the invoice template.
    content.push({
      text: '* UPI payments are subject to per-transaction limits (typically \u20B91 lakh). For amounts exceeding the limit, you may split into multiple UPI transfers or use NEFT / RTGS for the full amount in a single transfer.',
      fontSize: 5, color: COLORS.medGray, italics: true, lineHeight: 1.3,
      margin: [0, 0, 0, 4],
    });

    // Footer disclaimer strip
    content.push({
      text: 'This is a quotation and not a tax invoice. Prices subject to change after validity date. Subject to Chennai jurisdiction.',
      fontSize: 6, color: '#888', italics: true, alignment: 'center', margin: [0, 2, 0, 0],
    });

    // Generate PDF using smart auto-scaling system
    const pdfBuffer = await generateSmartPdf(
      content,
      buildFooter({
        leftText: quote.quote_no,
        centerText: `${CO.web}  |  ${CO.email}`,
      }),
    );

    const headers: Record<string, string> = { 'Content-Type': 'application/pdf', 'Cache-Control': 'public, max-age=60' };
    if (download) headers['Content-Disposition'] = `attachment; filename="Quote-${quote.quote_no}.pdf"`;
    else headers['Content-Disposition'] = 'inline';

    return new Response(pdfBuffer, { status: 200, headers });
  } catch (err: unknown) {
    console.error('[GET /api/accounts/quotes/pdf]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'PDF generation failed' }, { status: 500 });
  }
}
