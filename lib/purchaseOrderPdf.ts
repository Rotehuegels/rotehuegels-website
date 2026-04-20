// lib/purchaseOrderPdf.ts
// Thin adapter: fetch PO + items + payments → shape ReportConfig → buildReport().

import { fmtDate } from '@/lib/pdfConfig';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCompanyCO } from '@/lib/company';
import { buildReport } from '@/lib/reports/builder';
import { resolveConfig } from '@/lib/reports/defaults';
import { numToWords } from '@/lib/reports/sections';
import type { GstMode, LineItem, ReportConfig } from '@/lib/reports/types';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface PurchaseOrderPdfResult {
  buffer: Buffer;
  poNo: string;
  filename: string;
}

export async function generatePurchaseOrderPdfBuffer(poId: string): Promise<PurchaseOrderPdfResult> {
  const CO = await getCompanyCO();

  const [poRes, itemsRes, pmtsRes] = await Promise.all([
    supabaseAdmin.from('purchase_orders').select('*, suppliers(*)').eq('id', poId).single(),
    supabaseAdmin.from('po_items').select('*').eq('po_id', poId).order('sl_no'),
    supabaseAdmin.from('po_payments').select('amount').eq('po_id', poId),
  ]);
  if (poRes.error || !poRes.data) throw new Error(`PO not found: ${poId}`);

  const po = poRes.data as any;
  const supplier = po.suppliers as any;
  const rawItems = itemsRes.data ?? [];
  const totalPaid = (pmtsRes.data ?? []).reduce((s: number, p: any) => s + p.amount, 0);
  const balance = po.total_amount - totalPaid;
  const isIGST = po.igst_amount > 0;
  const gstMode: GstMode = isIGST ? 'inter' : 'intra';
  const shipTo = po.ship_to as Record<string, string> | null;

  const items: LineItem[] = rawItems.map((i: any) => ({
    name: i.description,
    hsn: i.hsn_code,
    quantity: i.quantity,
    unit: i.unit,
    unit_price: i.unit_price,
    discount_pct: null,
    taxable_amount: Number(i.taxable_amount),
    gst_amount: Number(i.gst_amount),
    total: Number(i.total),
    gst_rate: i.igst_rate ?? ((i.cgst_rate ?? 0) + (i.sgst_rate ?? 0)),
  }));

  // Supplier address for the party block
  const supplierAddress = supplier?.address
    ? `${supplier.address}${supplier.state ? ', ' + supplier.state : ''}${supplier.pincode ? ' - ' + supplier.pincode : ''}`
    : '';
  const deliverAddr = shipTo
    ? `${shipTo.line1 ?? ''}${shipTo.line2 ? ', ' + shipTo.line2 : ''}, ${shipTo.city ?? ''}, ${shipTo.state ?? ''}${shipTo.pincode ? ' - ' + shipTo.pincode : ''}`
    : `${CO.addr1} ${CO.addr2}`;

  // Amount in words (adds balance payable clause when partial paid)
  const aiw = `Grand Total (in words): ${numToWords(po.total_amount)} (INR)${totalPaid > 0 ? '  |  Balance Payable: ' + numToWords(balance) + ' (INR)' : ''}`;

  const postTotalsExtras: Array<{ text: string; color?: string; bold?: boolean }> = [];
  if (po.terms) postTotalsExtras.push({ text: `Terms: ${po.terms}`, color: '#555' });
  if (po.amendment_no > 0 && po.amendment_notes) {
    postTotalsExtras.push({
      text: `Amendment ${String(po.amendment_no).padStart(2, '0')}: ${po.amendment_notes}`,
      color: '#92400e',
    });
  }

  const headerExtras = po.amendment_no > 0
    ? [{ text: `AMENDMENT ${String(po.amendment_no).padStart(2, '0')}`, color: '#92400e', bold: true, alignment: 'right' as const }]
    : undefined;

  const cfg: ReportConfig = resolveConfig({
    documentTitle: 'PURCHASE ORDER',
    fromCompany: {
      name: CO.name,
      addressLine1: CO.addr1, addressLine2: CO.addr2,
      contactLine: `${CO.procurementEmail}  |  ${CO.phone}  |  ${CO.web}`,
      gstin: CO.gstin, pan: CO.pan, cin: CO.cin, tan: CO.tan,
    },
    toParty: {
      label: 'Vendor (Bill From)',
      name: supplier?.legal_name ?? '',
      gstin: supplier?.gstin,
      address: supplierAddress,
      email: supplier?.email,
      phone: supplier?.phone,
    },
    shipToParty: {
      label: 'Deliver To (Bill To)',
      name: CO.name,
      gstin: CO.gstin,
      address: `${deliverAddr}\nPlace of Supply: Tamil Nadu (33)  |  GST: ${isIGST ? 'IGST (Inter-state)' : 'CGST+SGST (Intra-state)'}`,
    },
    meta: [
      { label: 'PO No', value: po.po_no, bold: true },
      { label: 'Date', value: fmtDate(po.po_date) },
      ...(po.expected_delivery ? [{ label: 'Delivery By', value: fmtDate(po.expected_delivery) }] : []),
      ...(po.supplier_ref ? [{ label: 'Supplier Ref', value: po.supplier_ref }] : []),
    ],
    items,
    gstMode,
    totals: {
      subtotal: Number(po.taxable_value),
      discount: 0,
      taxable: Number(po.taxable_value),
      cgst: Number(po.cgst_amount ?? 0),
      sgst: Number(po.sgst_amount ?? 0),
      igst: Number(po.igst_amount ?? 0),
      total: Number(po.total_amount),
      amountInWords: aiw,
    },
    // Supply payments so the plain totals table can add the Advance Paid /
    // Balance Payable rows. We don't enable showPaymentSummary (that's the
    // invoice-style box); sections.buildTotalsTable consumes cfg.payments
    // directly when style='plain'.
    payments: totalPaid > 0 ? [{ date: po.po_date, mode: 'Advance', amount: totalPaid }] : [],
    notesAndTerms: { notes: null, terms: null },
    partyBlockStyle: 'plain',
    partyContactLabels: 'full',
    totalsStyle: 'plain',
    itemsHsnHeader: 'HSN',
    itemsGstStyle: 'rate-in-cell',
    amountInWordsStyle: 'inline',
    metaPlacement: 'above-party',
    headerExtras,
    postTotalsExtras,
    sections: {
      showBankBlock: false,
      showSignature: true,
      showNotesTermsBlock: false,
      showAmountInWords: true,
      showPaymentSummary: false,
      showUpiDisclaimer: false,
      notesTermsPosition: 'after-items',
    },
    upiQr: false,
    footerMeta: {
      leftText: po.po_no,
      centerText: `${CO.web}  |  ${CO.procurementEmail}`,
    },
    filename: `PO-${po.po_no}.pdf`,
  });

  const { buffer, filename } = await buildReport(cfg);
  return { buffer, poNo: po.po_no, filename };
}
