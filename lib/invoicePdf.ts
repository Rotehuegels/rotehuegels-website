// lib/invoicePdf.ts
// Shared invoice-PDF builder. Used by both the /api/accounts/orders/[id]/invoice/pdf
// HTTP route and by sendOrderConfirmation / sendPaymentReceipt / sendPaymentReminder
// to attach the PDF to outbound mail.
// Keeping the layout logic in one place means the PDF a customer sees
// attached to an email is byte-identical to the PDF they'd download from
// the dashboard.

import QRCode from 'qrcode';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCompanyCO } from '@/lib/company';
import { getLogoDataUrl, getSignatureDataUrl, fmtINR, fmtDate, generateSmartPdf } from '@/lib/pdfConfig';
import {
  COLORS, FONT, BOX_LAYOUT, TABLE_LAYOUT,
  buildHeader, buildFooter, buildBankDeclarationBox, buildPaymentSummary,
  sectionLabel, sectionBox, tableHeaderCell,
} from '@/lib/pdfTemplate';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface InvoicePdfResult {
  /** Rendered PDF bytes, ready to serve or attach to an email. */
  buffer: Buffer;
  /** Invoice number (e.g. "RH/25-26/ORD-001"). */
  invoiceNo: string;
  /** Suggested download filename (`Invoice-RH-25-26-ORD-001.pdf`). */
  filename: string;
}

export interface InvoicePdfOpts {
  /** If set, render a partial invoice filtered to only this payment stage. */
  stage?: number;
  /** If set, render a partial invoice for all stages up to and including this one. */
  upto?: number;
}

// ── Helpers (unique to invoice) ────────────────────────────────────────────

function getFY(dateStr: string) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return m >= 4 ? `${String(y).slice(2)}-${String(y + 1).slice(2)}` : `${String(y - 1).slice(2)}-${String(y).slice(2)}`;
}

function amountInWords(amount: number): string {
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

export async function generateInvoicePdfBuffer(
  orderId: string,
  opts: InvoicePdfOpts = {},
): Promise<InvoicePdfResult> {
  const uptoStage = opts.upto ?? null;
  const onlyStage = opts.stage ?? null;

  const CO = await getCompanyCO();
  const logoUrl = getLogoDataUrl();
  const sigUrl = getSignatureDataUrl();

  const [orderRes, stagesRes, paymentsRes] = await Promise.all([
    supabaseAdmin.from('orders').select('*').eq('id', orderId).single(),
    supabaseAdmin.from('order_payment_stages').select('*').eq('order_id', orderId).order('stage_number'),
    supabaseAdmin.from('order_payments').select('*').eq('order_id', orderId).order('payment_date'),
  ]);

  if (orderRes.error || !orderRes.data) {
    throw new Error(`Order not found: ${orderId}`);
  }

  const order = orderRes.data;
  const stages = stagesRes.data ?? [];
  const payments = paymentsRes.data ?? [];
  const adjustments = ((order as any).adjustments ?? []) as Array<{ description: string; amount: number }>;
  const totalPaid = payments.reduce((s: number, p: any) => s + (p.amount_received ?? 0), 0);

  // Fetch customer details
  let custPhone = '';
  let custEmail = '';
  let custCode = '';
  if (order.customer_id) {
    const { data: cust } = await supabaseAdmin.from('customers').select('customer_id, contact_person, billing_address, email, phone').eq('id', order.customer_id).single();
    if (cust) {
      custPhone = cust.phone ?? '';
      custEmail = cust.email ?? '';
      custCode = cust.customer_id ?? '';
      if (!order.client_contact && cust.contact_person) order.client_contact = cust.contact_person;
      if (!order.client_address && cust.billing_address) {
        const ba = cust.billing_address as Record<string, string>;
        order.client_address = [ba.line1, ba.line2, ba.city, ba.state, ba.pincode].filter(Boolean).join(', ');
      }
    }
  }
  const totalAdj = adjustments.reduce((s, a) => s + (a.amount ?? 0), 0);

  // Items
  const rawItems = (order as any).items as Array<Record<string, any>> | null;
  const isIntra = (order.igst_amount ?? 0) === 0 && (order.cgst_amount ?? 0) > 0;
  const gstRate = Number(order.gst_rate ?? 18);
  const halfRate = gstRate / 2;

  const items = Array.isArray(rawItems)
    ? rawItems.map(r => {
        const taxable = r.taxable_amount ?? r.base ?? 0;
        const gstAmt = r.gst_amount ?? 0;
        const halfGst = parseFloat((gstAmt / 2).toFixed(2));
        return {
          desc: r.name ?? r.description ?? '',
          qty: r.quantity != null && r.quantity !== 0 ? `${r.quantity} ${r.unit ?? ''}`.trim() : (r.qty ?? '-'),
          hsn: r.hsn_code || r.sac_code || r.hsn || '-',
          rate: r.rate ?? r.unit_price ?? null,
          discount: r.discount ?? r.discount_pct ?? null,
          base: taxable, cgst: isIntra ? halfGst : 0, sgst: isIntra ? halfGst : 0,
          igst: isIntra ? 0 : gstAmt, total: r.total ?? (taxable + gstAmt),
        };
      })
    : [];

  // Stage filtering
  const isFiltered = uptoStage !== null || onlyStage !== null;
  const filteredStages = isFiltered
    ? stages.filter(s => uptoStage !== null ? s.stage_number <= uptoStage : s.stage_number === onlyStage)
    : stages;

  let base = order.base_value ?? 0, cgst = order.cgst_amount ?? 0, sgst = order.sgst_amount ?? 0, igst = order.igst_amount ?? 0, total = order.total_value_incl_gst;
  let tds = order.tds_applicable ? base * (order.tds_rate / 100) : 0;

  if (isFiltered && filteredStages.length > 0) {
    base = filteredStages.reduce((s, st) => s + (st.amount_due ?? 0), 0);
    const gstTotal = filteredStages.reduce((s, st) => s + (st.gst_on_stage ?? 0), 0);
    if (isIntra) { cgst = gstTotal / 2; sgst = gstTotal / 2; igst = 0; }
    else { cgst = 0; sgst = 0; igst = gstTotal; }
    total = base + gstTotal;
    tds = order.tds_applicable ? filteredStages.reduce((s, st) => s + (st.tds_amount ?? 0), 0) : 0;
  }

  const rawDate = (isFiltered ? (filteredStages[filteredStages.length - 1] as any)?.invoice_date : null) ?? order.invoice_date ?? null;
  const fy = getFY(rawDate ?? order.order_date);
  const invoiceNo = `RH/${fy}/${order.order_no}`;
  const invoiceDate = rawDate ? fmtDate(rawDate) : fmtDate(new Date().toISOString());
  const sacHsn = order.hsn_sac_code ?? (order.order_type === 'service' ? '9983' : '-');
  const placeOfSupply = order.place_of_supply ?? 'Tamil Nadu (33)';

  const balanceDue = Math.max(0, total - totalPaid - totalAdj);
  const upiAmountParam = balanceDue > 0 && balanceDue <= 100000 ? `&am=${balanceDue.toFixed(2)}` : '';
  const upiString = `upi://pay?pa=${CO.upi}&pn=${encodeURIComponent(CO.name)}${upiAmountParam}&cu=INR&tn=${encodeURIComponent('Invoice ' + invoiceNo)}`;
  const upiQr = await QRCode.toDataURL(upiString, { width: 90, margin: 1, color: { dark: '#111111', light: '#ffffff' } });

  // ── Build pdfmake doc ───────────────────────────────────────────────
  const content: any[] = [];

  // Header — shared template
  content.push(buildHeader({
    logoUrl,
    companyName: CO.name,
    address: `${CO.addr1} ${CO.addr2}`,
    contactLine: `${CO.email}  |  ${CO.phone}  |  ${CO.web}`,
    gstin: CO.gstin,
    pan: CO.pan,
    cin: CO.cin,
    tan: CO.tan,
    documentTitle: 'TAX INVOICE',
  }));

  // Bill To + Invoice Details — bordered box
  const invDetailRows: [string, string][] = [
    ['Invoice No.', invoiceNo],
    ['Invoice Date', invoiceDate],
    ['Order Date', fmtDate(order.order_date)],
    ...(order.delivery_date ? [['Delivery Date', fmtDate(order.delivery_date)] as [string, string]] : []),
    ['Order Ref.', order.order_no],
    ['Place of Supply', placeOfSupply],
    ['Supply Type', isIntra ? 'Intra-State' : 'Inter-State'],
  ];

  content.push({
    table: {
      widths: ['*', '*'],
      body: [[
        {
          stack: [
            sectionLabel('Bill To / Ship To'),
            { text: order.client_name, fontSize: FONT.heading, bold: true, color: COLORS.black },
            ...(order.client_contact ? [{ text: order.client_contact, fontSize: FONT.small, color: COLORS.gray }] : []),
            ...(order.client_address ? [{ text: order.client_address, fontSize: FONT.small, color: COLORS.gray, lineHeight: 1.2, margin: [0, 1, 0, 0] }] : []),
            ...(order.client_gstin ? [{ text: `GSTIN:  ${order.client_gstin}`, fontSize: FONT.small, bold: true, margin: [0, 2, 0, 0] }] : []),
            ...(order.client_pan ? [{ text: `PAN:  ${order.client_pan}`, fontSize: FONT.small, bold: true }] : []),
            ...(custPhone ? [{ text: `Phone: ${custPhone}`, fontSize: 5.5, color: COLORS.gray, margin: [0, 1, 0, 0] }] : []),
            ...(custEmail ? [{ text: `Email: ${custEmail}`, fontSize: 5.5, color: COLORS.gray }] : []),
            ...(custCode ? [{ text: `Customer ID: ${custCode}`, fontSize: 5.5, color: COLORS.medGray, margin: [0, 1, 0, 0] }] : []),
          ],
        },
        {
          table: {
            widths: [65, '*'],
            body: invDetailRows.map(([l, v]) => [
              { text: l, fontSize: FONT.body, color: COLORS.labelText },
              { text: v, fontSize: FONT.body, bold: l === 'Invoice No.' },
            ]),
          },
          layout: 'noBorders',
        },
      ]],
    },
    layout: BOX_LAYOUT,
    margin: [0, 0, 0, 6],
  });

  // Items table
  const hasRate = items.some(i => i.rate != null);
  const headerRow: any[] = [
    tableHeaderCell('#', 'center'),
    tableHeaderCell('Description', 'left'),
  ];
  if (items.length > 0) headerRow.push(tableHeaderCell('Qty', 'center'));
  headerRow.push(tableHeaderCell('HSN/SAC', 'center'));
  if (hasRate) {
    headerRow.push(tableHeaderCell('Rate', 'right'));
    headerRow.push(tableHeaderCell('Disc.', 'center'));
  }
  headerRow.push(tableHeaderCell('Taxable', 'right'));
  if (isIntra) {
    headerRow.push(tableHeaderCell(`CGST ${halfRate}%`, 'right'));
    headerRow.push(tableHeaderCell(`SGST ${halfRate}%`, 'right'));
  } else {
    headerRow.push(tableHeaderCell(`IGST ${gstRate}%`, 'right'));
  }
  headerRow.push(tableHeaderCell('Total', 'right'));

  const dataRows: any[][] = items.length > 0
    ? items.map((item, idx) => {
        const row: any[] = [
          { text: String(idx + 1), alignment: 'center', fontSize: FONT.table },
          { text: item.desc, bold: true, fontSize: FONT.table },
          { text: item.qty || '-', alignment: 'center', fontSize: FONT.table },
          { text: item.hsn, alignment: 'center', fontSize: FONT.table },
        ];
        if (hasRate) {
          row.push({ text: item.rate != null ? fmtINR(item.rate) : '-', alignment: 'right', fontSize: FONT.table });
          row.push({ text: item.discount ?? '-', alignment: 'center', fontSize: FONT.table });
        }
        row.push({ text: fmtINR(item.base), alignment: 'right', fontSize: FONT.table });
        if (isIntra) {
          row.push({ text: fmtINR(item.cgst), alignment: 'right', fontSize: FONT.table });
          row.push({ text: fmtINR(item.sgst), alignment: 'right', fontSize: FONT.table });
        } else {
          row.push({ text: fmtINR(item.igst), alignment: 'right', fontSize: FONT.table });
        }
        row.push({ text: fmtINR(item.total), alignment: 'right', bold: true, fontSize: FONT.table });
        return row;
      })
    : [(() => {
        const row: any[] = [
          { text: '1', alignment: 'center', fontSize: FONT.table },
          { text: order.description, bold: true, fontSize: FONT.table },
          { text: sacHsn, alignment: 'center', fontSize: FONT.table },
        ];
        row.push({ text: fmtINR(base), alignment: 'right', fontSize: FONT.table });
        if (isIntra) {
          row.push({ text: fmtINR(cgst), alignment: 'right', fontSize: FONT.table });
          row.push({ text: fmtINR(sgst), alignment: 'right', fontSize: FONT.table });
        } else {
          row.push({ text: fmtINR(igst), alignment: 'right', fontSize: FONT.table });
        }
        row.push({ text: fmtINR(total), alignment: 'right', bold: true, fontSize: FONT.table });
        return row;
      })()];

  // Total row
  const totalRow: any[] = [];
  const colsBefore = (items.length > 0 ? 4 : 3) + (hasRate ? 2 : 0);
  totalRow.push({ text: 'TOTAL', colSpan: colsBefore, alignment: 'right', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.table });
  for (let i = 1; i < colsBefore; i++) totalRow.push({});
  totalRow.push({ text: fmtINR(base), alignment: 'right', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.table });
  if (isIntra) {
    totalRow.push({ text: fmtINR(cgst), alignment: 'right', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.table });
    totalRow.push({ text: fmtINR(sgst), alignment: 'right', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.table });
  } else {
    totalRow.push({ text: fmtINR(igst), alignment: 'right', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.table });
  }
  totalRow.push({ text: fmtINR(total), alignment: 'right', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.total });

  // Column widths
  const widths: any[] = [18, '*'];
  if (items.length > 0) widths.push(35);
  widths.push(45);
  if (hasRate) { widths.push(55); widths.push(30); }
  widths.push(65);
  if (isIntra) { widths.push(55); widths.push(55); } else { widths.push(60); }
  widths.push(65);

  content.push({
    table: { headerRows: 1, widths, body: [headerRow, ...dataRows, totalRow], dontBreakRows: true },
    layout: TABLE_LAYOUT,
    margin: [0, 0, 0, 6],
  });

  // Amount in Words — bordered box
  content.push(sectionBox({
    stack: [
      sectionLabel('Amount in Words'),
      { text: amountInWords(total), fontSize: FONT.heading, bold: true, color: COLORS.black },
      ...(order.tds_applicable ? [{ text: `* Subject to TDS @ ${order.tds_rate}%. Net receivable: ${fmtINR(total - tds)}`, fontSize: FONT.body, color: COLORS.gray, margin: [0, 2, 0, 0] }] : []),
    ],
  }));

  // Payment & Adjustment Summary
  if (totalPaid > 0 || totalAdj > 0) {
    const netDue = total - totalPaid - totalAdj;
    const pmtRows: Array<{ label: string; amount: string; color?: string; bold?: boolean; fontSize?: number }> = [
      { label: 'Invoice Total', amount: fmtINR(total), bold: true, fontSize: FONT.table },
    ];
    for (const p of payments) {
      pmtRows.push({
        label: `Less: Payment Received (${fmtDate(p.payment_date)}) \u2014 ${p.payment_mode ?? ''}`,
        amount: `\u2013${fmtINR(p.amount_received)}`,
        color: COLORS.positive,
      });
    }
    for (const a of adjustments) {
      pmtRows.push({
        label: `Less: ${a.description}`,
        amount: `\u2013${fmtINR(a.amount)}`,
        color: COLORS.positive,
      });
    }
    pmtRows.push({
      label: 'Balance Due',
      amount: fmtINR(netDue),
      bold: true,
      fontSize: FONT.heading,
      color: netDue > 0 ? COLORS.negative : COLORS.black,
    });
    content.push(buildPaymentSummary(pmtRows));
  }

  // Bank Details + Declaration — shared template
  content.push(buildBankDeclarationBox({
    companyName: CO.name,
    bankName: CO.bank,
    accountNo: CO.acc,
    ifsc: CO.ifsc,
    branch: CO.bankBranch,
    upi: CO.upi,
    qrDataUrl: upiQr,
    signatureDataUrl: sigUrl,
    signatoryName: 'Sivakumar Shanmugam',
    signatoryTitle: 'CEO, Roteh\u00fcgels',
  }));

  // UPI disclaimer
  content.push({
    text: '* UPI payments are subject to per-transaction limits (typically \u20B91 lakh). For amounts exceeding the limit, you may split into multiple UPI transfers or use NEFT / RTGS for the full amount in a single transfer.',
    fontSize: 5, color: COLORS.medGray, italics: true, lineHeight: 1.3,
    margin: [0, 0, 0, 4],
  });

  // Generate PDF — shared smart system + footer
  const pdfBuffer = await generateSmartPdf(
    content,
    buildFooter({
      leftText: invoiceNo,
      centerText: `Computer-generated invoice  |  ${CO.web}  |  ${CO.phone}`,
    }),
  );

  return {
    buffer: pdfBuffer,
    invoiceNo,
    filename: `Invoice-${invoiceNo.replace(/\//g, '-')}.pdf`,
  };
}
