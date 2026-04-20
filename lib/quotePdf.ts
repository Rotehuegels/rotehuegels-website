// lib/quotePdf.ts
// Thin adapter: fetch quote row → shape ReportConfig → buildReport().
// All layout lives in lib/reports/*.

import { fmtDate } from '@/lib/pdfConfig';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCompanyCO } from '@/lib/company';
import { buildReport } from '@/lib/reports/builder';
import { resolveConfig } from '@/lib/reports/defaults';
import type { GstMode, LineItem, ReportConfig } from '@/lib/reports/types';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface QuotePdfResult {
  buffer: Buffer;
  quoteNo: string;
  filename: string;
}

export async function generateQuotePdfBuffer(quoteId: string): Promise<QuotePdfResult> {
  const CO = await getCompanyCO();

  const { data: quote, error } = await supabaseAdmin
    .from('quotes').select('*, customers(*)').eq('id', quoteId).single();
  if (error || !quote) throw new Error(`Quote not found: ${quoteId}`);

  const customer = quote.customers as any;
  const billing = customer?.billing_address as Record<string, string> | null;
  const rawItems = (quote.items ?? []) as any[];
  const isIntra = customer?.state_code === '33' || customer?.state?.toLowerCase().includes('tamil');
  const gstMode: GstMode = isIntra ? 'intra' : 'inter';

  const addr = billing ? [billing.line1, billing.line2, billing.city, billing.state, billing.pincode].filter(Boolean).join(', ') : '';

  const items: LineItem[] = rawItems.map(i => ({
    name: i.name,
    hsn: i.hsn_code || i.sac_code || null,
    quantity: i.quantity,
    unit: i.unit,
    unit_price: i.unit_price,
    discount_pct: i.discount_pct,
    taxable_amount: i.taxable_amount,
    gst_amount: i.gst_amount,
    total: i.total,
    gst_rate: i.gst_rate,
  }));

  const cfg: ReportConfig = resolveConfig({
    documentTitle: 'QUOTATION',
    subtitle: 'Not a tax invoice',
    fromCompany: {
      name: CO.name,
      addressLine1: CO.addr1,
      addressLine2: CO.addr2,
      contactLine: `${CO.email}  |  ${CO.phone}  |  ${CO.web}`,
      gstin: CO.gstin, pan: CO.pan, cin: CO.cin, tan: CO.tan,
    },
    toParty: {
      label: 'Quoted To',
      name: customer?.name ?? '',
      gstin: customer?.gstin,
      pan: customer?.pan,
      address: addr,
      phone: customer?.phone,
      email: customer?.email,
    },
    meta: [
      { label: 'Quote No', value: quote.quote_no, bold: true },
      { label: 'Date', value: fmtDate(quote.quote_date) },
      ...(quote.valid_until ? [{ label: 'Valid Until', value: fmtDate(quote.valid_until) }] : []),
      { label: 'Place of Supply', value: isIntra ? 'Tamil Nadu (33)' : (customer?.state ?? '-') },
      { label: 'GST Type', value: isIntra ? 'CGST + SGST' : 'IGST' },
    ],
    items,
    gstMode,
    totals: {
      subtotal: Number(quote.subtotal ?? 0),
      discount: Number(quote.discount_amount ?? 0),
      taxable: Number(quote.taxable_value ?? 0),
      cgst: Number(quote.cgst_amount ?? 0),
      sgst: Number(quote.sgst_amount ?? 0),
      igst: Number(quote.igst_amount ?? 0),
      total: Number(quote.total_amount ?? 0),
    },
    notesAndTerms: { notes: quote.notes, terms: quote.terms },
    partyBlockStyle: 'plain',
    totalsStyle: 'bordered',
    sections: {
      showBankBlock: true,
      showSignature: true,
      showNotesTermsBlock: true,
      showAmountInWords: false,
      showPaymentSummary: false,
      showUpiDisclaimer: true,
      notesTermsPosition: 'after-bank',
    },
    upiQr: { note: `Quote ${quote.quote_no}` },
    paymentTermsLabel: 'Payment Terms',
    paymentTermsText: `100% advance before dispatch. Kindly reference Quote No. ${quote.quote_no} in the transaction remarks. Scan the UPI QR or transfer via NEFT/RTGS/IMPS using the account details on the left.`,
    disclaimerText: 'This is a quotation and not a tax invoice. Prices subject to change after validity date. Subject to Chennai jurisdiction.',
    footerMeta: {
      leftText: quote.quote_no,
      centerText: `${CO.web}  |  ${CO.email}`,
    },
    filename: `Quote-${quote.quote_no}.pdf`,
  });

  const { buffer, filename } = await buildReport(cfg);
  return { buffer, quoteNo: quote.quote_no, filename };
}
