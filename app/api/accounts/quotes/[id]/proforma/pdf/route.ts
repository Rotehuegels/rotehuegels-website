import { NextResponse } from 'next/server';
import { getLogoDataUrl, getSignatureDataUrl, fmtINR, fmtDate, generateSmartPdf } from '@/lib/pdfConfig';
import { COLORS, FONT, buildHeader, buildFooter, tableHeaderCell, TABLE_LAYOUT, sectionLabel } from '@/lib/pdfTemplate';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCompanyCO } from '@/lib/company';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = 'force-dynamic';

function amountInWords(amount: number): string {
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const twoD = (n: number) => n < 20 ? ones[n] : tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '');
  const threeD = (n: number) => n < 100 ? twoD(n) : ones[Math.floor(n/100)]+' Hundred'+(n%100 ? ' '+twoD(n%100) : '');
  const r = Math.floor(amount); const parts: string[] = []; let rem = r;
  if (rem >= 10000000) { parts.push(twoD(Math.floor(rem/10000000))+' Crore'); rem %= 10000000; }
  if (rem >= 100000) { parts.push(twoD(Math.floor(rem/100000))+' Lakh'); rem %= 100000; }
  if (rem >= 1000) { parts.push(twoD(Math.floor(rem/1000))+' Thousand'); rem %= 1000; }
  if (rem > 0) { parts.push(threeD(rem)); }
  return `Rupees ${r===0?'Zero':parts.join(' ')} Only`;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(_req.url);
  const download = url.searchParams.get('download') === '1';

  try {
    const CO = await getCompanyCO();
    const logoUrl = getLogoDataUrl();
    const sigUrl = getSignatureDataUrl();

    const { data: pi, error } = await supabaseAdmin.from('proforma_invoices').select('*, customers(*)').eq('quote_id', id).single();
    if (error || !pi) return NextResponse.json({ error: 'Proforma not found' }, { status: 404 });

    const customer = pi.customers as any;
    const billing = customer?.billing_address as Record<string, string> | null;
    const items = (pi.items ?? []) as any[];
    const isIntra = customer?.state_code === '33' || customer?.state?.toLowerCase().includes('tamil');

    const content: any[] = [];

    // Header
    content.push(buildHeader({
      logoUrl,
      companyName: CO.name,
      address: `${CO.addr1} ${CO.addr2}`,
      contactLine: `GSTIN: ${CO.gstin}  |  PAN: ${CO.pan}  |  CIN: ${CO.cin}`,
      gstin: CO.gstin, pan: CO.pan, cin: CO.cin, tan: CO.tan,
      documentTitle: 'PROFORMA INVOICE',
    }));

    // Subtitle — "This is not a tax invoice"
    content.push({ text: 'This is not a tax invoice', fontSize: FONT.body, italics: true, color: COLORS.medGray, alignment: 'right', margin: [0, -2, 0, 2] });

    // PI No / Date / Valid Until line
    content.push({
      columns: [
        { width: '*', text: '' },
        { width: 'auto', alignment: 'right', stack: [
          { text: `PI No: ${pi.pi_no}`, fontSize: FONT.body },
          { text: `Date: ${fmtDate(pi.pi_date)}`, fontSize: FONT.body },
          ...(pi.valid_until ? [{ text: `Valid Until: ${fmtDate(pi.valid_until)}`, fontSize: FONT.body }] : []),
        ]},
      ],
      margin: [0, 0, 0, 6],
    });

    // Bill To + PI Details
    content.push({
      table: {
        widths: ['*', '*'],
        body: [[
          {
            stack: [
              sectionLabel('Bill To'),
              { text: customer?.name ?? '', fontSize: FONT.heading, bold: true },
              ...(customer?.gstin ? [{ text: `GSTIN: ${customer.gstin}`, fontSize: FONT.body, margin: [0, 2, 0, 0] }] : []),
              ...(billing ? [{ text: `${billing.line1 ?? ''}${billing.line2 ? ', ' + billing.line2 : ''}, ${billing.city ?? ''}, ${billing.state ?? ''}`, fontSize: FONT.body, color: COLORS.gray, margin: [0, 2, 0, 0] }] : []),
            ],
          },
          {
            stack: [
              sectionLabel('Proforma Details'),
              { text: `PI No: ${pi.pi_no}`, fontSize: FONT.body },
              { text: `Quote Ref: ${pi.quote_no ?? '-'}`, fontSize: FONT.body },
              { text: `Place of Supply: ${isIntra ? 'Tamil Nadu (33)' : (customer?.state ?? '-')}`, fontSize: FONT.body },
              { text: `GST Type: ${isIntra ? 'CGST + SGST' : 'IGST'}`, fontSize: FONT.body },
            ],
          },
        ]],
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 10],
    });

    // Items table
    const halfRate = (items[0]?.gst_rate ?? 18) / 2;
    const headerRow: any[] = [
      tableHeaderCell('#', 'center'),
      tableHeaderCell('Description', 'left'),
      tableHeaderCell('HSN/SAC', 'center'),
      tableHeaderCell('Qty', 'right'),
      tableHeaderCell('Rate', 'right'),
      tableHeaderCell('Taxable', 'right'),
    ];
    if (isIntra) {
      headerRow.push(tableHeaderCell(`CGST ${halfRate}%`, 'right'));
      headerRow.push(tableHeaderCell(`SGST ${halfRate}%`, 'right'));
    } else {
      headerRow.push(tableHeaderCell('IGST', 'right'));
    }
    headerRow.push(tableHeaderCell('Total', 'right'));

    const dataRows = items.map((item: any, i: number) => {
      const halfGst = parseFloat((item.gst_amount / 2).toFixed(2));
      const row: any[] = [
        { text: String(i + 1), alignment: 'center', fontSize: FONT.table },
        { text: item.name, bold: true, fontSize: FONT.table },
        { text: item.hsn_code || item.sac_code || '-', alignment: 'center', fontSize: FONT.table },
        { text: `${item.quantity} ${item.unit}`, alignment: 'right', fontSize: FONT.table },
        { text: fmtINR(item.unit_price), alignment: 'right', fontSize: FONT.table },
        { text: fmtINR(item.taxable_amount), alignment: 'right', fontSize: FONT.table },
      ];
      if (isIntra) {
        row.push({ text: fmtINR(halfGst), alignment: 'right', fontSize: FONT.table });
        row.push({ text: fmtINR(halfGst), alignment: 'right', fontSize: FONT.table });
      } else {
        row.push({ text: fmtINR(item.gst_amount), alignment: 'right', fontSize: FONT.table });
      }
      row.push({ text: fmtINR(item.total), alignment: 'right', bold: true, fontSize: FONT.table });
      return row;
    });

    const widths: any[] = [18, '*', 40, 40, 55, 55];
    if (isIntra) { widths.push(45, 45); } else { widths.push(50); }
    widths.push(60);

    content.push({
      table: { headerRows: 1, widths, body: [headerRow, ...dataRows], dontBreakRows: true },
      layout: TABLE_LAYOUT,
      margin: [0, 0, 0, 8],
    });

    // Totals
    const totalsBody: any[][] = [
      [{ text: 'Taxable Value', alignment: 'right' }, { text: fmtINR(pi.taxable_value), alignment: 'right' }],
    ];
    if (isIntra) {
      totalsBody.push([{ text: 'CGST', alignment: 'right', color: COLORS.gray }, { text: fmtINR(pi.cgst_amount), alignment: 'right' }]);
      totalsBody.push([{ text: 'SGST', alignment: 'right', color: COLORS.gray }, { text: fmtINR(pi.sgst_amount), alignment: 'right' }]);
    } else {
      totalsBody.push([{ text: 'IGST', alignment: 'right', color: COLORS.gray }, { text: fmtINR(pi.igst_amount), alignment: 'right' }]);
    }
    totalsBody.push([
      { text: 'GRAND TOTAL', alignment: 'right', bold: true, fontSize: FONT.total },
      { text: fmtINR(pi.total_amount), alignment: 'right', bold: true, fontSize: FONT.total },
    ]);

    content.push({
      columns: [{ width: '*', text: '' }, {
        width: 'auto',
        table: { widths: [120, 90], body: totalsBody },
        layout: 'noBorders',
      }],
      margin: [0, 0, 0, 6],
    });

    // Amount in words
    content.push({ text: `Amount in words: ${amountInWords(pi.total_amount)}`, fontSize: FONT.heading, bold: true, margin: [0, 0, 0, 8] });

    // Payment terms
    if (pi.payment_terms) {
      content.push({ text: `Payment Terms: ${pi.payment_terms}`, fontSize: FONT.body, color: COLORS.gray, margin: [0, 0, 0, 6] });
    }

    // Bank details + Signature
    content.push({
      table: {
        widths: ['*', '*'],
        body: [[
          {
            stack: [
              sectionLabel('Bank Details'),
              { table: { body: [
                [{ text: 'Name', fontSize: FONT.body, color: COLORS.labelText }, { text: CO.name, fontSize: FONT.body }],
                [{ text: 'A/c No.', fontSize: FONT.body, color: COLORS.labelText }, { text: CO.acc, fontSize: FONT.body, bold: true }],
                [{ text: 'IFSC', fontSize: FONT.body, color: COLORS.labelText }, { text: CO.ifsc, fontSize: FONT.body }],
                [{ text: 'Bank', fontSize: FONT.body, color: COLORS.labelText }, { text: CO.bank, fontSize: FONT.body }],
              ]}, layout: 'noBorders' },
            ],
          },
          {
            stack: [
              { text: `For ${CO.name}`, fontSize: FONT.body, bold: true, color: COLORS.darkGray, alignment: 'right' },
              ...(sigUrl ? [{ image: sigUrl, width: 55, alignment: 'right' as const, margin: [0, 4, 0, 2] as any }] : [{ text: '', margin: [0, 16, 0, 0] }]),
              { canvas: [{ type: 'line', x1: 80, y1: 0, x2: 200, y2: 0, lineWidth: 0.5, lineColor: COLORS.lightGray }] },
              { text: 'Authorised Signatory', fontSize: FONT.small, bold: true, alignment: 'right' },
            ],
          },
        ]],
      },
      layout: 'noBorders',
    });

    // Generate PDF using smart auto-scaling system
    const pdfBuffer = await generateSmartPdf(
      content,
      buildFooter({ leftText: pi.pi_no, centerText: 'Proforma Invoice — Not a Tax Invoice' }),
    );

    const headers: Record<string, string> = { 'Content-Type': 'application/pdf', 'Cache-Control': 'public, max-age=60' };
    if (download) headers['Content-Disposition'] = `attachment; filename="Proforma-${pi.pi_no}.pdf"`;
    else headers['Content-Disposition'] = 'inline';
    return new Response(pdfBuffer, { status: 200, headers });
  } catch (err: unknown) {
    console.error('[GET /api/accounts/quotes/proforma/pdf]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'PDF generation failed' }, { status: 500 });
  }
}
