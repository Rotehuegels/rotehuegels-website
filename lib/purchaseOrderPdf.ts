// lib/purchaseOrderPdf.ts
// Shared purchase-order PDF builder. Used by both the
// /api/accounts/purchase-orders/[id]/pdf HTTP route and by sendPOConfirmation
// to attach the PDF to outbound mail.

import { getLogoDataUrl, getSignatureDataUrl, fmtINR, fmtDate, generateSmartPdf } from '@/lib/pdfConfig';
import { COLORS, FONT, buildHeader, buildFooter, tableHeaderCell, TABLE_LAYOUT } from '@/lib/pdfTemplate';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCompanyCO } from '@/lib/company';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface PurchaseOrderPdfResult {
  /** Rendered PDF bytes, ready to serve or attach to an email. */
  buffer: Buffer;
  /** PO number (e.g. "PO-001"), useful for filenames. */
  poNo: string;
  /** Suggested download filename (`PO-PO-001.pdf`). */
  filename: string;
}

function numToWords(n: number): string {
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const inr = Math.round(n);
  if (inr === 0) return 'Zero';
  function words(num: number): string {
    if (num === 0) return '';
    if (num < 20) return a[num] + ' ';
    if (num < 100) return b[Math.floor(num / 10)] + (num % 10 ? ' ' + a[num % 10] : '') + ' ';
    if (num < 1000) return a[Math.floor(num / 100)] + ' Hundred ' + words(num % 100);
    if (num < 100000) return words(Math.floor(num / 1000)) + 'Thousand ' + words(num % 1000);
    if (num < 10000000) return words(Math.floor(num / 100000)) + 'Lakh ' + words(num % 100000);
    return words(Math.floor(num / 10000000)) + 'Crore ' + words(num % 10000000);
  }
  return 'Rupees ' + words(inr).trim() + ' Only';
}

export async function generatePurchaseOrderPdfBuffer(poId: string): Promise<PurchaseOrderPdfResult> {
  const CO = await getCompanyCO();
  const logoUrl = getLogoDataUrl();
  const sigUrl = getSignatureDataUrl();

  const [poRes, itemsRes, pmtsRes] = await Promise.all([
    supabaseAdmin.from('purchase_orders').select('*, suppliers(*)').eq('id', poId).single(),
    supabaseAdmin.from('po_items').select('*').eq('po_id', poId).order('sl_no'),
    supabaseAdmin.from('po_payments').select('amount').eq('po_id', poId),
  ]);
  if (poRes.error || !poRes.data) throw new Error(`PO not found: ${poId}`);

  const po = poRes.data;
  const supplier = po.suppliers as any;
  const items = itemsRes.data ?? [];
  const totalPaid = (pmtsRes.data ?? []).reduce((s: number, p: any) => s + p.amount, 0);
  const balance = po.total_amount - totalPaid;
  const isIGST = po.igst_amount > 0;
  const shipTo = po.ship_to as Record<string, string> | null;

  const content: any[] = [];

  // Header
  content.push(buildHeader({
    logoUrl,
    companyName: CO.name,
    address: `${CO.addr1} ${CO.addr2}`,
    contactLine: `${CO.procurementEmail}  |  ${CO.phone}  |  ${CO.web}`,
    gstin: CO.gstin,
    pan: CO.pan,
    cin: CO.cin,
    tan: CO.tan,
    documentTitle: 'PURCHASE ORDER',
  }));

  // Amendment info (separate line after header)
  if ((po as any).amendment_no > 0) {
    content.push({ text: `AMENDMENT ${String((po as any).amendment_no).padStart(2, '0')}`, fontSize: 8, bold: true, color: '#92400e', alignment: 'right', margin: [0, 0, 0, 2] });
  }

  // PO details line
  content.push({
    columns: [
      { width: '*', text: '' },
      { width: 'auto', alignment: 'right', stack: [
        { text: `PO No: ${po.po_no}`, fontSize: 8, margin: [0, 0, 0, 0] },
        { text: `Date: ${fmtDate(po.po_date)}`, fontSize: 8 },
        ...(po.expected_delivery ? [{ text: `Delivery By: ${fmtDate(po.expected_delivery)}`, fontSize: 8 }] : []),
        ...(po.supplier_ref ? [{ text: `Supplier Ref: ${po.supplier_ref}`, fontSize: 8 }] : []),
      ]},
    ],
    margin: [0, 0, 0, 8],
  });

  // Vendor + Deliver To
  const deliverAddr = shipTo
    ? `${shipTo.line1 ?? ''}${shipTo.line2 ? ', ' + shipTo.line2 : ''}, ${shipTo.city ?? ''}, ${shipTo.state ?? ''}${shipTo.pincode ? ' - ' + shipTo.pincode : ''}`
    : `${CO.addr1} ${CO.addr2}`;

  content.push({
    table: {
      widths: ['*', '*'],
      body: [[
        {
          stack: [
            { text: 'VENDOR (BILL FROM)', fontSize: 6.5, bold: true, color: COLORS.sectionHeader, margin: [0, 0, 0, 3] },
            { text: supplier?.legal_name ?? '', fontSize: 10, bold: true },
            ...(supplier?.gstin ? [{ text: `GSTIN: ${supplier.gstin}`, fontSize: 7, margin: [0, 2, 0, 0] }] : []),
            ...(supplier?.address ? [{ text: `${supplier.address}${supplier.state ? ', ' + supplier.state : ''}${supplier.pincode ? ' - ' + supplier.pincode : ''}`, fontSize: 7, color: '#555', margin: [0, 2, 0, 0] }] : []),
            ...(supplier?.email ? [{ text: `Email: ${supplier.email}`, fontSize: 6.5, color: '#555', margin: [0, 2, 0, 0] }] : []),
            ...(supplier?.phone ? [{ text: `Phone: ${supplier.phone}`, fontSize: 6.5, color: '#555' }] : []),
          ],
        },
        {
          stack: [
            { text: 'DELIVER TO (BILL TO)', fontSize: 6.5, bold: true, color: COLORS.sectionHeader, margin: [0, 0, 0, 3] },
            { text: CO.name, fontSize: 10, bold: true },
            { text: `GSTIN: ${CO.gstin}`, fontSize: 7, margin: [0, 2, 0, 0] },
            { text: deliverAddr, fontSize: 7, color: '#555', margin: [0, 2, 0, 0] },
            { text: `Place of Supply: Tamil Nadu (33)  |  GST: ${isIGST ? 'IGST (Inter-state)' : 'CGST+SGST (Intra-state)'}`, fontSize: 6.5, color: '#555', margin: [0, 3, 0, 0] },
          ],
        },
      ]],
    },
    layout: 'noBorders',
    margin: [0, 0, 0, 10],
  });

  // Items table
  const headerRow: any[] = [
    tableHeaderCell('#', 'center'),
    tableHeaderCell('Description', 'left'),
    tableHeaderCell('HSN', 'center'),
    tableHeaderCell('Qty', 'right'),
    tableHeaderCell('Unit', 'center'),
    tableHeaderCell('Rate', 'right'),
    tableHeaderCell('Taxable', 'right'),
    tableHeaderCell(isIGST ? 'IGST' : 'GST', 'right'),
    tableHeaderCell('Total', 'right'),
  ];
  const dataRows = items.map((item: any, i: number) => [
    { text: String(item.sl_no ?? i + 1), alignment: 'center' },
    { text: item.description, bold: true },
    { text: item.hsn_code || '-', alignment: 'center', fontSize: 7.5 },
    { text: String(item.quantity), alignment: 'right' },
    { text: item.unit, alignment: 'center' },
    { text: fmtINR(item.unit_price), alignment: 'right' },
    { text: fmtINR(item.taxable_amount), alignment: 'right' },
    { text: `${fmtINR(item.gst_amount)}\n${isIGST ? item.igst_rate + '%' : item.cgst_rate + '%+' + item.sgst_rate + '%'}`, alignment: 'right', fontSize: 7.5 },
    { text: fmtINR(item.total), alignment: 'right', bold: true },
  ]);

  content.push({
    table: { headerRows: 1, widths: [18, '*', 35, 28, 28, 55, 55, 50, 60], body: [headerRow, ...dataRows], dontBreakRows: true },
    layout: TABLE_LAYOUT,
    margin: [0, 0, 0, 8],
  });

  // Totals
  const totalsBody: any[][] = [
    [{ text: 'Net Assessable Value', alignment: 'right', color: '#666' }, { text: fmtINR(po.taxable_value), alignment: 'right' }],
  ];
  if (isIGST) {
    totalsBody.push([{ text: 'IGST @ 18%', alignment: 'right', color: '#666' }, { text: fmtINR(po.igst_amount), alignment: 'right' }]);
  } else {
    totalsBody.push([{ text: 'CGST', alignment: 'right', color: '#666' }, { text: fmtINR(po.cgst_amount), alignment: 'right' }]);
    totalsBody.push([{ text: 'SGST', alignment: 'right', color: '#666' }, { text: fmtINR(po.sgst_amount), alignment: 'right' }]);
  }
  totalsBody.push([
    { text: 'GRAND TOTAL', alignment: 'right', bold: true, fontSize: 10 },
    { text: fmtINR(po.total_amount), alignment: 'right', bold: true, fontSize: 10 },
  ]);
  if (totalPaid > 0) {
    totalsBody.push([{ text: 'Less: Advance Paid', alignment: 'right', color: '#059669' }, { text: `- ${fmtINR(totalPaid)}`, alignment: 'right', color: '#059669' }]);
    totalsBody.push([
      { text: 'BALANCE PAYABLE', alignment: 'right', bold: true, fontSize: 10 },
      { text: fmtINR(balance), alignment: 'right', bold: true, fontSize: 10, color: balance > 0 ? '#dc2626' : '#059669' },
    ]);
  }

  content.push({
    columns: [{ width: '*', text: '' }, {
      width: 'auto',
      table: { widths: [130, 90], body: totalsBody },
      layout: 'noBorders',
    }],
    margin: [0, 0, 0, 6],
  });

  // Amount in words
  content.push({
    text: `Grand Total (in words): ${numToWords(po.total_amount)} (INR)${totalPaid > 0 ? '  |  Balance Payable: ' + numToWords(balance) + ' (INR)' : ''}`,
    fontSize: 8, margin: [0, 0, 0, 6],
  });

  // Terms
  if (po.terms) {
    content.push({ text: `Terms: ${po.terms}`, fontSize: 8, color: '#555', margin: [0, 0, 0, 6] });
  }

  // Amendment notes
  if ((po as any).amendment_no > 0 && (po as any).amendment_notes) {
    content.push({ text: `Amendment ${String((po as any).amendment_no).padStart(2, '0')}: ${(po as any).amendment_notes}`, fontSize: 8, color: '#92400e', margin: [0, 0, 0, 6] });
  }

  // Footer / Signature
  content.push({
    table: {
      widths: ['*', '*'],
      body: [[
        {
          stack: [
            { text: 'DISCLAIMER', fontSize: 6.5, bold: true, color: COLORS.sectionHeader, margin: [0, 0, 0, 3] },
            { text: `Purchase Order issued by ${CO.name}`, fontSize: 6.5, color: '#666' },
            { text: `Subject to Chennai jurisdiction. GSTIN: ${CO.gstin}`, fontSize: 6.5, color: '#666' },
          ],
        },
        {
          stack: [
            { text: `For ${CO.name}`, fontSize: 7, bold: true, color: '#444', alignment: 'right' },
            ...(sigUrl ? [{ image: sigUrl, width: 55, alignment: 'right' as const, margin: [0, 4, 0, 2] as any }] : [{ text: '', margin: [0, 16, 0, 0] }]),
            { canvas: [{ type: 'line', x1: 80, y1: 0, x2: 200, y2: 0, lineWidth: 0.5, lineColor: '#bbb' }] },
            { text: 'Authorised Signatory', fontSize: 6.5, bold: true, alignment: 'right' },
          ],
        },
      ]],
    },
    layout: 'noBorders',
  });

  // Generate PDF using smart auto-scaling system
  const pdfBuffer = await generateSmartPdf(content, buildFooter({
    leftText: po.po_no,
    centerText: `${CO.web}  |  ${CO.procurementEmail}`,
  }));

  return {
    buffer: pdfBuffer,
    poNo: po.po_no,
    filename: `PO-${po.po_no}.pdf`,
  };
}
