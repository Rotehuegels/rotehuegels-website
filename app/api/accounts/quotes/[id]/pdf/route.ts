import { NextResponse } from 'next/server';
import { getLogoDataUrl, getSignatureDataUrl, fmtINR, fmtDate, generateSmartPdf, sanitizePdfText } from '@/lib/pdfConfig';
import { COLORS, FONT, buildHeader, buildFooter, tableHeaderCell, TABLE_LAYOUT, sectionLabel } from '@/lib/pdfTemplate';
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

    // Notes & Terms — professional two-column table
    if (quote.notes || quote.terms) {
      const ntBody: any[][] = [[
        ...(quote.notes ? [{

          stack: [
            sectionLabel('Notes'),
            { text: sanitizePdfText(quote.notes), fontSize: 7, color: '#444', lineHeight: 1.5 },
          ],
        }] : []),
        ...(quote.terms ? [{

          stack: [
            sectionLabel('Terms & Conditions'),
            { text: sanitizePdfText(quote.terms), fontSize: 7, color: '#444', lineHeight: 1.5 },
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

    // Bank Details + Signature — two-column bordered box.
    // Left: bank details for immediate payment (customer can transfer at
    //   quote approval without a separate ask).
    // Right: "For {company}" + signature image + (tight rule under it) +
    //   Authorised Signatory. The rule is rendered as a 110-wide right-
    //   aligned row so it sits under the signature instead of mid-column.
    const signatureBlock: any[] = [
      { text: `For ${sanitizePdfText(CO.name)}`, fontSize: 7, bold: true, color: '#444', alignment: 'right' },
      ...(sigUrl
        ? [{ image: sigUrl, width: 55, alignment: 'right' as const, margin: [0, 4, 0, 2] as any }]
        : [{ text: '', margin: [0, 16, 0, 0] as any }]),
      {
        // Right-aligned 110pt rule under the signature (not a canvas with
        // hard-coded x coords — a right-aligned table with a bottom border).
        table: { widths: [110], body: [[{ text: '', border: [false, false, false, true], borderColor: ['#bbb','#bbb','#bbb','#bbb'] as any }]] },
        layout: { hLineColor: () => '#bbb', hLineWidth: () => 0.5, vLineWidth: () => 0, paddingTop: () => 0, paddingBottom: () => 0, paddingLeft: () => 0, paddingRight: () => 0 } as any,
        alignment: 'right' as const,
        margin: [0, 0, 0, 2] as any,
      },
      { text: 'Authorised Signatory', fontSize: 7, bold: true, alignment: 'right' },
    ];

    const bankBlock: any = {
      stack: [
        sectionLabel('Bank Details for Immediate Payment'),
        {
          table: {
            widths: [42, '*'],
            body: [
              [{ text: 'A/c Name', fontSize: FONT.body, color: COLORS.medGray }, { text: sanitizePdfText(CO.name), fontSize: FONT.body }],
              [{ text: 'Bank', fontSize: FONT.body, color: COLORS.medGray }, { text: (CO as any).bankName ?? '-', fontSize: FONT.body }],
              [{ text: 'A/c No.', fontSize: FONT.body, color: COLORS.medGray }, { text: (CO as any).bankAccount ?? '-', fontSize: FONT.body, bold: true }],
              [{ text: 'IFSC', fontSize: FONT.body, color: COLORS.medGray }, { text: (CO as any).bankIfsc ?? '-', fontSize: FONT.body, bold: true }],
              [{ text: 'Branch', fontSize: FONT.body, color: COLORS.medGray }, { text: (CO as any).bankBranch ?? '-', fontSize: FONT.body }],
              [{ text: 'UPI', fontSize: FONT.body, color: COLORS.medGray }, { text: (CO as any).upi ?? '-', fontSize: FONT.body, bold: true }],
            ],
          },
          layout: 'noBorders',
        },
        { text: 'Payment: 100% advance before dispatch. Please reference the Quote No. in the transaction remarks.', fontSize: 6.5, color: COLORS.medGray, italics: true, margin: [0, 4, 0, 0] },
      ],
    };

    content.push({
      table: {
        widths: ['*', '*'],
        body: [[bankBlock, { stack: signatureBlock }]],
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => COLORS.border,
        vLineColor: () => COLORS.border,
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 6,
        paddingBottom: () => 6,
      },
      margin: [0, 0, 0, 4],
    });

    // Disclaimer strip below the box
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
