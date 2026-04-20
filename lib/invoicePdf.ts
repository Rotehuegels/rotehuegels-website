// lib/invoicePdf.ts
// Thin adapter: fetch order + stages + payments → shape ReportConfig → buildReport().

import { fmtDate } from '@/lib/pdfConfig';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCompanyCO } from '@/lib/company';
import { buildReport } from '@/lib/reports/builder';
import { resolveConfig } from '@/lib/reports/defaults';
import type { GstMode, LineItem, ReportConfig, PaymentRow, AdjustmentRow } from '@/lib/reports/types';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface InvoicePdfResult {
  buffer: Buffer;
  invoiceNo: string;
  filename: string;
}

export interface InvoicePdfOpts {
  /** If set, render a partial invoice filtered to only this payment stage. */
  stage?: number;
  /** If set, render a partial invoice for all stages up to and including this one. */
  upto?: number;
}

function getFY(dateStr: string) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return m >= 4 ? `${String(y).slice(2)}-${String(y + 1).slice(2)}` : `${String(y - 1).slice(2)}-${String(y).slice(2)}`;
}

export async function generateInvoicePdfBuffer(
  orderId: string,
  opts: InvoicePdfOpts = {},
): Promise<InvoicePdfResult> {
  const uptoStage = opts.upto ?? null;
  const onlyStage = opts.stage ?? null;

  const CO = await getCompanyCO();

  const [orderRes, stagesRes, paymentsRes] = await Promise.all([
    supabaseAdmin.from('orders').select('*').eq('id', orderId).single(),
    supabaseAdmin.from('order_payment_stages').select('*').eq('order_id', orderId).order('stage_number'),
    supabaseAdmin.from('order_payments').select('*').eq('order_id', orderId).order('payment_date'),
  ]);
  if (orderRes.error || !orderRes.data) throw new Error(`Order not found: ${orderId}`);

  const order = orderRes.data as any;
  const stages = stagesRes.data ?? [];
  const payments = paymentsRes.data ?? [];
  const adjustments = (order.adjustments ?? []) as Array<{ description: string; amount: number }>;

  // Customer enrichment
  let custPhone = '', custEmail = '', custCode = '';
  if (order.customer_id) {
    const { data: cust } = await supabaseAdmin.from('customers')
      .select('customer_id, contact_person, billing_address, email, phone')
      .eq('id', order.customer_id).single();
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

  // Items
  const rawItems = order.items as Array<Record<string, any>> | null;
  const isIntra = (order.igst_amount ?? 0) === 0 && (order.cgst_amount ?? 0) > 0;
  const gstMode: GstMode = isIntra ? 'intra' : 'inter';
  const gstRate = Number(order.gst_rate ?? 18);

  const items: LineItem[] = Array.isArray(rawItems) && rawItems.length > 0
    ? rawItems.map(r => {
        const taxable = r.taxable_amount ?? r.base ?? 0;
        const gstAmt = r.gst_amount ?? 0;
        return {
          name: r.name ?? r.description ?? '',
          hsn: r.hsn_code || r.sac_code || r.hsn || null,
          quantity: r.quantity ?? null,
          unit: r.unit ?? null,
          unit_price: r.rate ?? r.unit_price ?? null,
          discount_pct: r.discount ?? r.discount_pct ?? null,
          taxable_amount: Number(taxable),
          gst_amount: Number(gstAmt),
          total: Number(r.total ?? (taxable + gstAmt)),
          gst_rate: gstRate,
        };
      })
    : [];

  // Stage filtering — adjusts totals/base/gst if a partial invoice is requested.
  const isFiltered = uptoStage !== null || onlyStage !== null;
  const filteredStages = isFiltered
    ? stages.filter((s: any) => uptoStage !== null ? s.stage_number <= uptoStage : s.stage_number === onlyStage)
    : stages;

  let base = order.base_value ?? 0;
  let cgst = order.cgst_amount ?? 0, sgst = order.sgst_amount ?? 0, igst = order.igst_amount ?? 0;
  let total = order.total_value_incl_gst;
  let tds = order.tds_applicable ? base * (order.tds_rate / 100) : 0;

  if (isFiltered && filteredStages.length > 0) {
    base = filteredStages.reduce((s: number, st: any) => s + (st.amount_due ?? 0), 0);
    const gstTotal = filteredStages.reduce((s: number, st: any) => s + (st.gst_on_stage ?? 0), 0);
    if (isIntra) { cgst = gstTotal / 2; sgst = gstTotal / 2; igst = 0; }
    else { cgst = 0; sgst = 0; igst = gstTotal; }
    total = base + gstTotal;
    tds = order.tds_applicable ? filteredStages.reduce((s: number, st: any) => s + (st.tds_amount ?? 0), 0) : 0;
  }

  // If no line-items, synthesise a single summary row using the order header.
  if (items.length === 0) {
    const sacHsn = order.hsn_sac_code ?? (order.order_type === 'service' ? '9983' : '-');
    items.push({
      name: order.description,
      hsn: sacHsn,
      quantity: null,
      unit: null,
      unit_price: null,
      discount_pct: null,
      taxable_amount: Number(base),
      gst_amount: Number(cgst + sgst + igst),
      total: Number(total),
      gst_rate: gstRate,
    });
  }

  const rawDate = (isFiltered ? (filteredStages[filteredStages.length - 1] as any)?.invoice_date : null) ?? order.invoice_date ?? null;
  const fy = getFY(rawDate ?? order.order_date);
  const isProforma = Boolean((order as any).is_proforma);
  const invoiceNo = `RH/${fy}/${order.order_no}`;
  const invoiceDate = rawDate ? fmtDate(rawDate) : fmtDate(new Date().toISOString());
  const placeOfSupply = order.place_of_supply ?? 'Tamil Nadu (33)';

  const totalPaid = payments.reduce((s: number, p: any) => s + (p.amount_received ?? 0), 0);
  const totalAdj = adjustments.reduce((s: number, a: any) => s + (a.amount ?? 0), 0);
  const balanceDue = Math.max(0, total - totalPaid - totalAdj);

  const paymentRows: PaymentRow[] = payments.map((p: any) => ({
    date: p.payment_date,
    mode: p.payment_mode ?? null,
    amount: Number(p.amount_received ?? 0),
  }));
  const adjustmentRows: AdjustmentRow[] = adjustments.map(a => ({
    description: a.description,
    amount: Number(a.amount ?? 0),
  }));

  const cfg: ReportConfig = resolveConfig({
    documentTitle: isProforma ? 'PROFORMA INVOICE' : 'TAX INVOICE',
    fromCompany: {
      name: CO.name,
      addressLine1: CO.addr1, addressLine2: CO.addr2,
      contactLine: `${CO.email}  |  ${CO.phone}  |  ${CO.web}`,
      gstin: CO.gstin, pan: CO.pan, cin: CO.cin, tan: CO.tan,
    },
    toParty: {
      label: 'Bill To / Ship To',
      name: order.client_name,
      gstin: order.client_gstin,
      pan: order.client_pan,
      address: order.client_address,
      contact: order.client_contact,
      phone: custPhone,
      email: custEmail,
      code: custCode,
    },
    meta: [
      { label: 'Invoice No.', value: invoiceNo, bold: true },
      { label: 'Invoice Date', value: invoiceDate },
      { label: 'Order Date', value: fmtDate(order.order_date) },
      ...(order.delivery_date ? [{ label: 'Delivery Date', value: fmtDate(order.delivery_date) }] : []),
      { label: 'Order Ref.', value: order.order_no },
      { label: 'Place of Supply', value: placeOfSupply },
      { label: 'Supply Type', value: isIntra ? 'Intra-State' : 'Inter-State' },
    ],
    items,
    gstMode,
    totals: {
      subtotal: Number(base),
      discount: 0,
      taxable: Number(base),
      cgst: Number(cgst),
      sgst: Number(sgst),
      igst: Number(igst),
      total: Number(total),
      tds: order.tds_applicable ? { rate: Number(order.tds_rate), amount: Number(tds) } : null,
    },
    payments: paymentRows,
    adjustments: adjustmentRows,
    notesAndTerms: { notes: null, terms: null },
    partyBlockStyle: 'bordered',
    totalsStyle: 'inline-last-row',
    itemsQtyStyle: 'combined-qty',
    sections: {
      showBankBlock: true,
      showSignature: true,
      showNotesTermsBlock: false,
      showAmountInWords: true,
      showPaymentSummary: true,
      showUpiDisclaimer: true,
      notesTermsPosition: 'before-bank',
    },
    upiQr: {
      note: `Invoice ${invoiceNo}`,
      amount: balanceDue,
    },
    footerMeta: {
      leftText: invoiceNo,
      centerText: `Computer-generated invoice  |  ${CO.web}  |  ${CO.phone}`,
    },
    filename: `Invoice-${invoiceNo.replace(/\//g, '-')}.pdf`,
  });

  const { buffer, filename } = await buildReport(cfg);
  return { buffer, invoiceNo, filename };
}
