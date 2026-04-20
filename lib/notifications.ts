// lib/notifications.ts
// Centralized email notification module for accounts / ERP workflows.
// Uses the same SMTP transport pattern as /lib/mailer.ts.

import nodemailer from "nodemailer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCompanyCO } from "@/lib/company";
import { generateInvoicePdfBuffer } from "@/lib/invoicePdf";
import { generatePurchaseOrderPdfBuffer } from "@/lib/purchaseOrderPdf";

/* ── SMTP setup (mirrors lib/mailer.ts) ──────────────────────────────────── */

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM = "Rotehügels <noreply@rotehuegels.com>",
} = process.env;

let transporter: nodemailer.Transporter | null = null;
function getTransporter() {
  if (!transporter) {
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      throw new Error("[notifications] SMTP env vars not set.");
    }
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: false,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

/* ─��� Company settings (loaded from DB) ─────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CO = Awaited<ReturnType<typeof getCompanyCO>>;

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function esc(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function letterhead(CO: CO, title: string) {
  return `
    <div style="max-width:640px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
      <!-- header -->
      <div style="border-bottom:3px solid #b45309;padding-bottom:14px;margin-bottom:20px;">
        <div style="font-size:17px;font-weight:900;text-transform:uppercase;">${esc(CO.name)}</div>
        <div style="font-size:10px;color:#666;line-height:1.7;margin-top:4px;">
          ${esc(CO.addr1)}<br/>${esc(CO.addr2)}<br/>
          GSTIN: ${CO.gstin} | PAN: ${CO.pan} | CIN: ${CO.cin}<br/>
          Email: ${CO.email} | Phone: ${CO.phone} | Web: ${CO.web}
        </div>
        <div style="font-size:20px;font-weight:900;color:#b45309;text-transform:uppercase;margin-top:10px;letter-spacing:1px;">${esc(title)}</div>
      </div>`;
}

function footer(CO: CO) {
  return `
      <!-- footer -->
      <div style="border-top:1px solid #ddd;padding-top:12px;margin-top:24px;font-size:9px;color:#999;line-height:1.6;">
        <div>This is an auto-generated email from ${esc(CO.name)}, sent via <strong>Operon</strong> — an AI-enabled ERP.</div>
        <div>For queries, contact ${CO.email} or call ${CO.phone}.</div>
        <div>Subject to Chennai jurisdiction.</div>
      </div>
    </div>`;
}

function bankDetailsHtml(CO: CO) {
  return `
    <div style="margin-top:16px;padding:10px 14px;border:1px solid #ddd;border-radius:4px;background:#fafafa;">
      <div style="font-weight:700;font-size:11px;margin-bottom:6px;">Bank Details for Payment</div>
      <table style="font-size:11px;line-height:1.8;">
        <tr><td style="color:#666;padding-right:12px;">Account Name</td><td style="font-weight:600;">${esc(CO.name)}</td></tr>
        <tr><td style="color:#666;padding-right:12px;">Bank</td><td>${esc(CO.bankName)}</td></tr>
        <tr><td style="color:#666;padding-right:12px;">Account No</td><td style="font-family:monospace;">${CO.bankAccount}</td></tr>
        <tr><td style="color:#666;padding-right:12px;">IFSC</td><td style="font-family:monospace;">${CO.bankIfsc}</td></tr>
        <tr><td style="color:#666;padding-right:12px;">Branch</td><td>${esc(CO.bankBranch)}</td></tr>
      </table>
    </div>`;
}

type CcEntry = { name?: string; email: string; role?: string };

function formatCc(cc: CcEntry[] | undefined): string[] | undefined {
  if (!cc || cc.length === 0) return undefined;
  return cc
    .filter(x => x?.email)
    .map(x => (x.name ? `${x.name} <${x.email}>` : x.email));
}

type MailAttachment = { filename: string; content: Buffer; contentType?: string };

async function send(
  to: string,
  subject: string,
  html: string,
  text: string,
  from?: string,
  cc?: CcEntry[],
  attachments?: MailAttachment[]
) {
  const t = getTransporter();
  await t.sendMail({
    from: from ?? EMAIL_FROM,
    to,
    cc: formatCc(cc),
    subject,
    html,
    text,
    ...(attachments && attachments.length ? { attachments } : {}),
  });
}

// All auto-generated ERP emails go from the no-reply mailbox.
// Display name still reflects the department so recipients can tell them apart.
const PROCUREMENT_FROM = "Rotehügels Procurements <noreply@rotehuegels.com>";
const SALES_FROM = "Rotehügels Sales <noreply@rotehuegels.com>";

/* ── 1. Order Confirmation / Invoice Email ───────────────────────────────── */

export async function sendOrderConfirmation(orderId: string) {
  const CO = await getCompanyCO();
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("*, customers(email, cc_emails)")
    .eq("id", orderId)
    .single();
  if (error || !order) throw new Error(`Order not found: ${orderId}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientEmail = (order as any).customers?.email;
  if (!clientEmail) throw new Error("Order has no linked customer email address.");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ccList = ((order as any).customers?.cc_emails ?? []) as CcEntry[];

  // Generate the invoice PDF FIRST — fail-hard so we never send a half-
  // baked order-confirmation email if the PDF can't be rendered.
  const pdf = await generateInvoicePdfBuffer(orderId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawItems = (order.items ?? []) as Array<Record<string, any>>;
  const orderGstRate = Number(order.gst_rate ?? 18);
  const items = rawItems.map(r => ({
    name: r.name ?? r.description ?? '',
    quantity: r.quantity ?? 0,
    unit: r.unit ?? '',
    unit_price: r.unit_price ?? r.rate ?? 0,
    taxable_amount: r.taxable_amount ?? r.base ?? 0,
    gst_rate: r.gst_rate ?? orderGstRate,
    total: r.total ?? 0,
  }));

  // Fetch payments and adjustments
  const { data: pmts } = await supabaseAdmin
    .from("order_payments")
    .select("*")
    .eq("order_id", orderId)
    .order("payment_date");
  const payments = pmts ?? [];
  const totalPaid = payments.reduce((s: number, p: { amount_received: number }) => s + (p.amount_received ?? 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adjustments = ((order as any).adjustments ?? []) as Array<{ description: string; amount: number }>;
  const totalAdj = adjustments.reduce((s: number, a: { amount: number }) => s + (a.amount ?? 0), 0);
  const netDue = (order.total_value_incl_gst ?? 0) - totalPaid - totalAdj;

  const itemsHtml = items
    .map(
      (it, i) =>
        `<tr style="border-bottom:1px solid #eee;">
          <td style="padding:6px 8px;font-size:11px;text-align:center;">${i + 1}</td>
          <td style="padding:6px 8px;font-size:11px;">${esc(it.name)}</td>
          <td style="padding:6px 8px;font-size:11px;text-align:right;">${it.quantity} ${esc(it.unit)}</td>
          <td style="padding:6px 8px;font-size:11px;text-align:right;">${fmt(it.unit_price)}</td>
          <td style="padding:6px 8px;font-size:11px;text-align:center;">${it.gst_rate}%</td>
          <td style="padding:6px 8px;font-size:11px;text-align:right;font-weight:600;">${fmt(it.total)}</td>
        </tr>`
    )
    .join("");

  const paymentHtml = (totalPaid > 0 || totalAdj > 0) ? `
    <div style="border:1px solid #ddd;border-radius:4px;padding:10px 12px;margin:12px 0;">
      <div style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;">Payment &amp; Adjustment Summary</div>
      <table style="width:100%;font-size:11px;border-collapse:collapse;">
        <tr>
          <td style="padding:3px 0;font-weight:700;">Invoice Total</td>
          <td style="padding:3px 0;text-align:right;font-weight:700;font-family:monospace;">${fmt(order.total_value_incl_gst ?? 0)}</td>
        </tr>
        ${payments.map((p: { payment_date: string; amount_received: number; payment_mode?: string }) =>
          `<tr>
            <td style="padding:3px 0;color:#555;">Less: Payment Received (${fmtDate(p.payment_date)})${p.payment_mode ? ` — ${p.payment_mode}` : ''}</td>
            <td style="padding:3px 0;text-align:right;color:#16a34a;font-family:monospace;">−${fmt(p.amount_received)}</td>
          </tr>`
        ).join('')}
        ${adjustments.map((a: { description: string; amount: number }) =>
          `<tr>
            <td style="padding:3px 0;color:#555;">Less: ${esc(a.description)}</td>
            <td style="padding:3px 0;text-align:right;color:#16a34a;font-family:monospace;">−${fmt(a.amount)}</td>
          </tr>`
        ).join('')}
        <tr style="border-top:2px solid #111;">
          <td style="padding:5px 0 3px;font-weight:900;font-size:12px;">Balance Due</td>
          <td style="padding:5px 0 3px;text-align:right;font-weight:900;font-family:monospace;font-size:12px;color:${netDue > 0 ? '#dc2626' : '#16a34a'};">${fmt(netDue)}</td>
        </tr>
      </table>
    </div>` : '';

  const isResend = !!order.last_emailed_at;
  const resendNotice = isResend
    ? `<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:4px;padding:8px 12px;margin-bottom:12px;font-size:11px;color:#856404;">
        <strong>Note:</strong> This is a revised order confirmation. Please disregard any previous communication for this order.
      </div>`
    : '';

  const html = `${letterhead(CO, isResend ? "Revised Order Confirmation" : "Order Confirmation")}
    ${resendNotice}
    <p style="font-size:13px;">Dear <strong>${esc(order.client_name)}</strong>,</p>
    <p style="font-size:12px;color:#444;">${isResend ? 'Please find the revised details for your order below.' : 'Thank you for your order. Please find the details below.'}</p>

    <table style="font-size:12px;line-height:1.8;margin:12px 0;">
      <tr><td style="color:#666;padding-right:14px;">Order No</td><td style="font-weight:700;font-family:monospace;">${esc(order.order_no)}</td></tr>
      <tr><td style="color:#666;padding-right:14px;">Order Date</td><td>${fmtDate(order.order_date)}</td></tr>
      <tr><td style="color:#666;padding-right:14px;">Order Type</td><td style="text-transform:capitalize;">${esc(order.order_type)}</td></tr>
    </table>

    <table style="width:100%;border-collapse:collapse;margin:12px 0;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="padding:6px 8px;font-size:10px;text-align:center;border-bottom:2px solid #ddd;">#</th>
          <th style="padding:6px 8px;font-size:10px;text-align:left;border-bottom:2px solid #ddd;">Description</th>
          <th style="padding:6px 8px;font-size:10px;text-align:right;border-bottom:2px solid #ddd;">Qty</th>
          <th style="padding:6px 8px;font-size:10px;text-align:right;border-bottom:2px solid #ddd;">Rate</th>
          <th style="padding:6px 8px;font-size:10px;text-align:center;border-bottom:2px solid #ddd;">GST</th>
          <th style="padding:6px 8px;font-size:10px;text-align:right;border-bottom:2px solid #ddd;">Total</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot>
        <tr style="background:#f9f9f9;border-top:2px solid #ddd;">
          <td colspan="5" style="padding:8px;font-size:12px;text-align:right;font-weight:700;">Grand Total</td>
          <td style="padding:8px;font-size:13px;text-align:right;font-weight:900;">${fmt(order.total_value_incl_gst ?? 0)}</td>
        </tr>
      </tfoot>
    </table>

    ${paymentHtml}

    ${order.payment_terms ? `<p style="font-size:11px;color:#444;"><strong>Payment Terms:</strong> ${esc(order.payment_terms)}</p>` : ""}

    ${bankDetailsHtml(CO)}

    <p style="font-size:12px;color:#444;margin-top:16px;">The full tax invoice (with HSN/SAC codes, per-line GST breakdown, bank details and UPI QR for immediate payment) is attached as a PDF: <strong>${esc(pdf.filename)}</strong>. Please refer to it for the complete picture.</p>

    <p style="font-size:11px;color:#666;margin-top:8px;">If you have any questions regarding this order, please reply to this email or contact us at ${CO.email}.</p>
  ${footer(CO)}`;

  const itemsText = items
    .map((it, i) => `  ${i + 1}. ${it.name} — ${it.quantity} ${it.unit} x ${fmt(it.unit_price)} = ${fmt(it.total)}`)
    .join("\n");

  const text = [
    `${isResend ? 'REVISED ' : ''}ORDER CONFIRMATION — ${order.order_no}`,
    ``,
    ...(isResend ? ['NOTE: This is a revised order confirmation. Please disregard any previous communication for this order.', ''] : []),
    `Dear ${order.client_name},`,
    ``,
    `Thank you for your order. Details:`,
    `Order No: ${order.order_no}`,
    `Date: ${fmtDate(order.order_date)}`,
    ``,
    `Items:`,
    itemsText,
    ``,
    `Grand Total: ${fmt(order.total_value_incl_gst ?? 0)}`,
    order.payment_terms ? `Payment Terms: ${order.payment_terms}` : "",
    ``,
    `Full invoice attached as PDF: ${pdf.filename}`,
    ``,
    `For queries contact ${CO.email} or ${CO.phone}.`,
    `— ${CO.name}`,
  ].join("\n");

  await send(
    clientEmail,
    `${isResend ? 'Revised: ' : ''}Order Confirmation — ${order.order_no} | ${CO.name}`,
    html,
    text,
    SALES_FROM,
    ccList,
    [{ filename: pdf.filename, content: pdf.buffer, contentType: 'application/pdf' }]
  );

  // Stamp last_emailed_at so next send knows it's a resend
  await supabaseAdmin
    .from("orders")
    .update({ last_emailed_at: new Date().toISOString() })
    .eq("id", orderId);
}

/* ── 2. Payment Receipt ──────────────────────────────────────────────────── */

export async function sendPaymentReceipt(paymentId: string) {
  const CO = await getCompanyCO();
  const { data: payment, error: pErr } = await supabaseAdmin
    .from("order_payments")
    .select("*")
    .eq("id", paymentId)
    .single();
  if (pErr || !payment) throw new Error(`Payment not found: ${paymentId}`);

  const { data: order, error: oErr } = await supabaseAdmin
    .from("orders")
    .select("*, customers(email, cc_emails)")
    .eq("id", payment.order_id)
    .single();
  if (oErr || !order) throw new Error(`Order not found for payment ${paymentId}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientEmail = (order as any).customers?.email;
  if (!clientEmail) throw new Error("Order has no linked customer email address.");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ccList = ((order as any).customers?.cc_emails ?? []) as CcEntry[];

  // Generate the invoice PDF FIRST — fail-hard so we never send a
  // payment-receipt email without the corresponding invoice attached.
  const pdf = await generateInvoicePdfBuffer(order.id);

  // Compute balance
  const { data: allPayments } = await supabaseAdmin
    .from("order_payments")
    .select("amount_received")
    .eq("order_id", order.id);
  const totalReceived = (allPayments ?? []).reduce(
    (s: number, p: { amount_received: number }) => s + (p.amount_received ?? 0),
    0
  );
  const balance = (order.total_value_incl_gst ?? 0) - totalReceived;

  const html = `${letterhead(CO, "Payment Receipt")}
    <p style="font-size:13px;">Dear <strong>${esc(order.client_name)}</strong>,</p>
    <p style="font-size:12px;color:#444;">We have received your payment. Thank you!</p>

    <table style="font-size:12px;line-height:2;margin:12px 0;">
      <tr><td style="color:#666;padding-right:14px;">Order No</td><td style="font-weight:700;font-family:monospace;">${esc(order.order_no)}</td></tr>
      <tr><td style="color:#666;padding-right:14px;">Payment Date</td><td>${fmtDate(payment.payment_date)}</td></tr>
      <tr><td style="color:#666;padding-right:14px;">Amount Received</td><td style="font-weight:700;color:#16a34a;">${fmt(payment.amount_received)}</td></tr>
      ${payment.tds_deducted ? `<tr><td style="color:#666;padding-right:14px;">TDS Deducted</td><td>${fmt(payment.tds_deducted)}</td></tr>` : ""}
      ${payment.net_received ? `<tr><td style="color:#666;padding-right:14px;">Net to Bank</td><td>${fmt(payment.net_received)}</td></tr>` : ""}
      ${payment.payment_mode ? `<tr><td style="color:#666;padding-right:14px;">Mode</td><td>${esc(payment.payment_mode)}</td></tr>` : ""}
      ${payment.reference_no ? `<tr><td style="color:#666;padding-right:14px;">Reference</td><td style="font-family:monospace;">${esc(payment.reference_no)}</td></tr>` : ""}
      <tr><td style="color:#666;padding-right:14px;">Total Invoiced</td><td>${fmt(order.total_value_incl_gst ?? 0)}</td></tr>
      <tr><td style="color:#666;padding-right:14px;">Total Received (Gross)</td><td>${fmt(totalReceived)}</td></tr>
      <tr style="border-top:1px solid #ddd;"><td style="color:#666;padding-right:14px;font-weight:700;">Balance Outstanding</td><td style="font-weight:900;color:${balance > 0 ? "#dc2626" : "#16a34a"};">${fmt(balance)}</td></tr>
    </table>

    <p style="font-size:12px;color:#444;margin-top:16px;">For your records, the updated tax invoice (showing this payment applied and any remaining balance) is attached as a PDF: <strong>${esc(pdf.filename)}</strong>.</p>

    <p style="font-size:11px;color:#666;margin-top:8px;">For queries, contact ${CO.email} or ${CO.phone}.</p>
  ${footer(CO)}`;

  const text = [
    `PAYMENT RECEIPT — ${order.order_no}`,
    ``,
    `Dear ${order.client_name},`,
    ``,
    `We have received your payment of ${fmt(payment.amount_received)} on ${fmtDate(payment.payment_date)}.`,
    `Reference: ${payment.reference_no ?? "N/A"}`,
    ``,
    `Order Total: ${fmt(order.total_value_incl_gst ?? 0)}`,
    `Total Received: ${fmt(totalReceived)}`,
    `Balance: ${fmt(balance)}`,
    ``,
    `Full invoice attached as PDF: ${pdf.filename}`,
    ``,
    `— ${CO.name}`,
  ].join("\n");

  await send(
    clientEmail,
    `Payment Received — ${order.order_no} | ${CO.name}`,
    html,
    text,
    SALES_FROM,
    ccList,
    [{ filename: pdf.filename, content: pdf.buffer, contentType: 'application/pdf' }]
  );
}

/* ── 3. Payment Reminder ─────────────────────────────────────────────────── */

export async function sendPaymentReminder(orderId: string) {
  const CO = await getCompanyCO();
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("*, customers(email, cc_emails)")
    .eq("id", orderId)
    .single();
  if (error || !order) throw new Error(`Order not found: ${orderId}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientEmail = (order as any).customers?.email;
  if (!clientEmail) throw new Error("Order has no linked customer email address.");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ccList = ((order as any).customers?.cc_emails ?? []) as CcEntry[];

  const { data: payments } = await supabaseAdmin
    .from("order_payments")
    .select("amount_received")
    .eq("order_id", orderId);
  const totalReceived = (payments ?? []).reduce(
    (s: number, p: { amount_received: number }) => s + (p.amount_received ?? 0),
    0
  );
  const pending = (order.total_value_incl_gst ?? 0) - totalReceived;

  if (pending <= 0) throw new Error("No outstanding balance for this order.");

  // Generate the invoice PDF FIRST — fail-hard so we never send a
  // payment-reminder email without the original invoice attached.
  const pdf = await generateInvoicePdfBuffer(orderId);

  const html = `${letterhead(CO, "Payment Reminder")}
    <p style="font-size:13px;">Dear <strong>${esc(order.client_name)}</strong>,</p>
    <p style="font-size:12px;color:#444;">This is a friendly reminder regarding the outstanding payment for the following order:</p>

    <table style="font-size:12px;line-height:2;margin:12px 0;">
      <tr><td style="color:#666;padding-right:14px;">Order / Invoice No</td><td style="font-weight:700;font-family:monospace;">${esc(order.order_no)}</td></tr>
      <tr><td style="color:#666;padding-right:14px;">Order Date</td><td>${fmtDate(order.order_date)}</td></tr>
      <tr><td style="color:#666;padding-right:14px;">Total Invoiced</td><td>${fmt(order.total_value_incl_gst ?? 0)}</td></tr>
      <tr><td style="color:#666;padding-right:14px;">Total Received</td><td>${fmt(totalReceived)}</td></tr>
      <tr style="border-top:1px solid #ddd;">
        <td style="color:#666;padding-right:14px;font-weight:700;">Amount Due</td>
        <td style="font-weight:900;font-size:14px;color:#dc2626;">${fmt(pending)}</td>
      </tr>
    </table>

    <p style="font-size:12px;color:#444;">We request you to kindly arrange the payment at the earliest. Please use the bank details below:</p>

    ${bankDetailsHtml(CO)}

    <p style="font-size:12px;color:#444;margin-top:16px;">For your reference, the original tax invoice is attached as a PDF: <strong>${esc(pdf.filename)}</strong>.</p>

    <p style="font-size:11px;color:#666;margin-top:8px;">If you have already made the payment, please disregard this reminder. For any questions, contact us at ${CO.email} or ${CO.phone}.</p>
  ${footer(CO)}`;

  const text = [
    `PAYMENT REMINDER — ${order.order_no}`,
    ``,
    `Dear ${order.client_name},`,
    ``,
    `This is a reminder regarding the outstanding payment:`,
    `Order No: ${order.order_no}`,
    `Total Invoiced: ${fmt(order.total_value_incl_gst ?? 0)}`,
    `Total Received: ${fmt(totalReceived)}`,
    `Amount Due: ${fmt(pending)}`,
    ``,
    `Bank: ${CO.bankName} | A/C: ${CO.bankAccount} | IFSC: ${CO.bankIfsc}`,
    ``,
    `Full invoice attached as PDF: ${pdf.filename}`,
    ``,
    `If already paid, please disregard this reminder.`,
    `— ${CO.name}`,
  ].join("\n");

  await send(
    clientEmail,
    `Payment Reminder — ${order.order_no} | ${fmt(pending)} due | ${CO.name}`,
    html,
    text,
    SALES_FROM,
    ccList,
    [{ filename: pdf.filename, content: pdf.buffer, contentType: 'application/pdf' }]
  );
}

/* ── 4. Quote Email ──────────────────────────────────────────────────────── */

import { generateQuotePdfBuffer } from "@/lib/quotePdf";

export async function sendQuoteEmail(quoteId: string) {
  const CO = await getCompanyCO();
  const { data: quote, error } = await supabaseAdmin
    .from("quotes")
    .select("*, customers(*)")
    .eq("id", quoteId)
    .single();
  if (error || !quote) throw new Error(`Quote not found: ${quoteId}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customer = quote.customers as any;
  const recipientEmail = customer?.email;
  if (!recipientEmail) throw new Error("Customer has no email address.");

  // Generate the quote PDF FIRST — fail-hard so we never send a half-
  // baked quote email if the PDF can't be rendered.
  const pdf = await generateQuotePdfBuffer(quoteId);

  const items = (quote.items ?? []) as Array<{
    name: string; quantity: number; unit: string; unit_price: number;
    taxable_amount: number; gst_rate: number; total: number;
  }>;

  const itemsHtml = items
    .map(
      (it, i) =>
        `<tr style="border-bottom:1px solid #eee;">
          <td style="padding:6px 8px;font-size:11px;text-align:center;">${i + 1}</td>
          <td style="padding:6px 8px;font-size:11px;">${esc(it.name)}</td>
          <td style="padding:6px 8px;font-size:11px;text-align:right;">${it.quantity} ${esc(it.unit)}</td>
          <td style="padding:6px 8px;font-size:11px;text-align:right;">${fmt(it.unit_price)}</td>
          <td style="padding:6px 8px;font-size:11px;text-align:center;">${it.gst_rate}%</td>
          <td style="padding:6px 8px;font-size:11px;text-align:right;font-weight:600;">${fmt(it.total)}</td>
        </tr>`
    )
    .join("");

  const html = `${letterhead(CO, "Quotation")}
    <p style="font-size:13px;">Dear <strong>${esc(customer?.name ?? "Customer")}</strong>,</p>
    <p style="font-size:12px;color:#444;">Thank you for your interest. Please find our quotation below.</p>

    <table style="font-size:12px;line-height:1.8;margin:12px 0;">
      <tr><td style="color:#666;padding-right:14px;">Quote No</td><td style="font-weight:700;font-family:monospace;">${esc(quote.quote_no)}</td></tr>
      <tr><td style="color:#666;padding-right:14px;">Date</td><td>${fmtDate(quote.quote_date)}</td></tr>
      ${quote.valid_until ? `<tr><td style="color:#666;padding-right:14px;">Valid Until</td><td style="font-weight:600;color:#b45309;">${fmtDate(quote.valid_until)}</td></tr>` : ""}
    </table>

    <table style="width:100%;border-collapse:collapse;margin:12px 0;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="padding:6px 8px;font-size:10px;text-align:center;border-bottom:2px solid #ddd;">#</th>
          <th style="padding:6px 8px;font-size:10px;text-align:left;border-bottom:2px solid #ddd;">Description</th>
          <th style="padding:6px 8px;font-size:10px;text-align:right;border-bottom:2px solid #ddd;">Qty</th>
          <th style="padding:6px 8px;font-size:10px;text-align:right;border-bottom:2px solid #ddd;">Rate</th>
          <th style="padding:6px 8px;font-size:10px;text-align:center;border-bottom:2px solid #ddd;">GST</th>
          <th style="padding:6px 8px;font-size:10px;text-align:right;border-bottom:2px solid #ddd;">Total</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot>
        <tr style="background:#f9f9f9;border-top:2px solid #ddd;">
          <td colspan="5" style="padding:8px;font-size:12px;text-align:right;font-weight:700;">Grand Total (incl. GST)</td>
          <td style="padding:8px;font-size:13px;text-align:right;font-weight:900;">${fmt(quote.total_amount ?? 0)}</td>
        </tr>
      </tfoot>
    </table>

    ${quote.notes ? `<p style="font-size:11px;color:#444;"><strong>Notes:</strong> ${esc(quote.notes)}</p>` : ""}
    ${quote.terms ? `<p style="font-size:11px;color:#444;"><strong>Terms:</strong> ${esc(quote.terms)}</p>` : ""}

    <p style="font-size:12px;color:#444;margin-top:16px;">The full quotation (with line-item breakdown, HSN codes, bank details and UPI QR for immediate payment) is attached as a PDF: <strong>${esc(pdf.filename)}</strong>. Please refer to it for the complete picture.</p>

    <p style="font-size:12px;color:#444;margin-top:8px;">Feel free to reach out with any questions — reply to this email or call us at ${CO.phone}.</p>
  ${footer(CO)}`;

  const itemsText = items
    .map((it, i) => `  ${i + 1}. ${it.name} — ${it.quantity} ${it.unit} x ${fmt(it.unit_price)} = ${fmt(it.total)}`)
    .join("\n");

  const text = [
    `QUOTATION — ${quote.quote_no}`,
    ``,
    `Dear ${customer?.name ?? "Customer"},`,
    ``,
    `Please find our quotation:`,
    `Quote No: ${quote.quote_no}`,
    `Date: ${fmtDate(quote.quote_date)}`,
    quote.valid_until ? `Valid Until: ${fmtDate(quote.valid_until)}` : "",
    ``,
    `Items:`,
    itemsText,
    ``,
    `Grand Total: ${fmt(quote.total_amount ?? 0)}`,
    ``,
    `Full quotation attached as PDF: ${pdf.filename}`,
    ``,
    `For questions, contact ${CO.email} or ${CO.phone}.`,
    `— ${CO.name}`,
  ].join("\n");

  await send(
    recipientEmail,
    `Quotation ${quote.quote_no} | ${CO.name}`,
    html,
    text,
    SALES_FROM,
    (customer?.cc_emails ?? []) as CcEntry[],
    [{ filename: pdf.filename, content: pdf.buffer, contentType: 'application/pdf' }]
  );
}

/* ── 5. Purchase Order Confirmation to Supplier ──────────────────────────── */

export async function sendPOConfirmation(poId: string) {
  const CO = await getCompanyCO();
  const [{ data: po, error }, { data: poItems }] = await Promise.all([
    supabaseAdmin
      .from("purchase_orders")
      .select("*, suppliers(legal_name, trade_name, email, phone, gstin, address, state)")
      .eq("id", poId)
      .single(),
    supabaseAdmin
      .from("po_items")
      .select("*")
      .eq("po_id", poId)
      .order("sl_no"),
  ]);
  if (error || !po) throw new Error(`Purchase order not found: ${poId}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supplier = po.suppliers as any;
  const supplierEmail = supplier?.email;
  if (!supplierEmail) throw new Error("Supplier has no email address.");

  // Generate the PO PDF FIRST — fail-hard so we never send a PO email
  // without the formal PDF attached.
  const pdf = await generatePurchaseOrderPdfBuffer(poId);

  const items = (poItems ?? []) as Array<{
    sl_no: number; description: string; hsn_code?: string;
    unit: string; quantity: number; unit_price: number;
    taxable_amount: number; gst_rate: number; gst_amount: number; total: number;
  }>;

  const itemsHtml = items
    .map(
      (it) =>
        `<tr style="border-bottom:1px solid #eee;">
          <td style="padding:6px 8px;font-size:11px;text-align:center;">${it.sl_no}</td>
          <td style="padding:6px 8px;font-size:11px;">${esc(it.description)}</td>
          <td style="padding:6px 8px;font-size:11px;text-align:center;font-family:monospace;">${esc(it.hsn_code ?? "—")}</td>
          <td style="padding:6px 8px;font-size:11px;text-align:right;">${it.quantity} ${esc(it.unit)}</td>
          <td style="padding:6px 8px;font-size:11px;text-align:right;">${fmt(it.unit_price)}</td>
          <td style="padding:6px 8px;font-size:11px;text-align:right;font-weight:600;">${fmt(it.total)}</td>
        </tr>`
    )
    .join("");

  const html = `${letterhead(CO, "Purchase Order")}
    <p style="font-size:13px;">Dear <strong>${esc(supplier?.legal_name ?? "Supplier")}</strong>,</p>
    <p style="font-size:12px;color:#444;">Please find the purchase order details below. Kindly acknowledge receipt of this PO.</p>

    <table style="font-size:12px;line-height:1.8;margin:12px 0;">
      <tr><td style="color:#666;padding-right:14px;">PO No</td><td style="font-weight:700;font-family:monospace;">${esc(po.po_no)}</td></tr>
      <tr><td style="color:#666;padding-right:14px;">PO Date</td><td>${fmtDate(po.po_date)}</td></tr>
      ${po.expected_delivery ? `<tr><td style="color:#666;padding-right:14px;">Expected Delivery</td><td style="font-weight:600;">${fmtDate(po.expected_delivery)}</td></tr>` : ""}
      ${po.supplier_ref ? `<tr><td style="color:#666;padding-right:14px;">Your Ref</td><td>${esc(po.supplier_ref)}</td></tr>` : ""}
    </table>

    <table style="width:100%;border-collapse:collapse;margin:12px 0;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="padding:6px 8px;font-size:10px;text-align:center;border-bottom:2px solid #ddd;">#</th>
          <th style="padding:6px 8px;font-size:10px;text-align:left;border-bottom:2px solid #ddd;">Description</th>
          <th style="padding:6px 8px;font-size:10px;text-align:center;border-bottom:2px solid #ddd;">HSN</th>
          <th style="padding:6px 8px;font-size:10px;text-align:right;border-bottom:2px solid #ddd;">Qty</th>
          <th style="padding:6px 8px;font-size:10px;text-align:right;border-bottom:2px solid #ddd;">Rate</th>
          <th style="padding:6px 8px;font-size:10px;text-align:right;border-bottom:2px solid #ddd;">Total</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot>
        <tr style="background:#f9f9f9;border-top:2px solid #ddd;">
          <td colspan="5" style="padding:8px;font-size:12px;text-align:right;font-weight:700;">Total (incl. GST)</td>
          <td style="padding:8px;font-size:13px;text-align:right;font-weight:900;">${fmt(po.total_amount ?? 0)}</td>
        </tr>
      </tfoot>
    </table>

    ${po.notes ? `<p style="font-size:11px;color:#444;"><strong>Notes:</strong> ${esc(po.notes)}</p>` : ""}
    ${po.terms ? `<p style="font-size:11px;color:#444;"><strong>Terms:</strong> ${esc(po.terms)}</p>` : ""}

    <p style="font-size:12px;color:#444;margin-top:16px;">The full purchase order (with HSN codes, per-line GST breakdown, ship-to address and signed authorisation) is attached as a PDF: <strong>${esc(pdf.filename)}</strong>. Please treat the PDF as the formal PO document.</p>

    <p style="font-size:12px;color:#444;margin-top:8px;">Please confirm receipt and expected delivery schedule. For queries, contact ${CO.procurementEmail} or call ${CO.phone}.</p>
  ${footer(CO)}`;

  const itemsText = items
    .map((it) => `  ${it.sl_no}. ${it.description} — ${it.quantity} ${it.unit} x ${fmt(it.unit_price)} = ${fmt(it.total)}`)
    .join("\n");

  const text = [
    `PURCHASE ORDER — ${po.po_no}`,
    ``,
    `Dear ${supplier?.legal_name ?? "Supplier"},`,
    ``,
    `PO No: ${po.po_no}`,
    `Date: ${fmtDate(po.po_date)}`,
    po.expected_delivery ? `Expected Delivery: ${fmtDate(po.expected_delivery)}` : "",
    ``,
    `Items:`,
    itemsText,
    ``,
    `Total (incl. GST): ${fmt(po.total_amount ?? 0)}`,
    ``,
    `Full PO attached as PDF: ${pdf.filename}`,
    ``,
    `Please confirm receipt.`,
    `— ${CO.name}`,
  ].join("\n");

  await send(
    supplierEmail,
    `Purchase Order ${po.po_no} | ${CO.name}`,
    html,
    text,
    PROCUREMENT_FROM,
    undefined,
    [{ filename: pdf.filename, content: pdf.buffer, contentType: 'application/pdf' }]
  );
}

/* ── 6. ATS — Candidate Stage Update Email ─────────────────────────────── */

const STAGE_MESSAGES: Record<string, { subject: string; body: string }> = {
  shortlisted: {
    subject: 'Your application has been shortlisted',
    body: 'We are pleased to inform you that your application has been shortlisted for the next stage. Our team will be in touch shortly with further details.',
  },
  interview: {
    subject: 'Interview scheduled',
    body: 'Congratulations! You have been selected for an interview. Our HR team will contact you shortly with the date, time, and mode of interview.',
  },
  offer: {
    subject: 'Job offer from Rotehügels',
    body: 'We are excited to extend an offer to you! Our HR team will share the detailed offer letter and next steps with you shortly.',
  },
  hired: {
    subject: 'Welcome to Rotehügels!',
    body: 'Congratulations and welcome aboard! We are thrilled to have you join the Rotehügels team. Our HR team will reach out with your onboarding details.',
  },
  rejected: {
    subject: 'Application update',
    body: 'Thank you for your interest in Rotehügels. After careful consideration, we have decided to move forward with other candidates for this position. We appreciate your time and encourage you to apply for future openings.',
  },
};

export async function sendCandidateStageEmail(applicationId: string, newStage: string) {
  const CO = await getCompanyCO();
  const { data: app, error } = await supabaseAdmin
    .from("applications")
    .select("applicant_name, email, job_id, job_postings(title)")
    .eq("id", applicationId)
    .single();

  if (error || !app) throw new Error(`Application not found: ${applicationId}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jobTitle = (app as any).job_postings?.title ?? "the position";
  const candidateEmail = app.email;
  if (!candidateEmail) return;

  const msg = STAGE_MESSAGES[newStage];
  if (!msg) return;

  const html = `${letterhead(CO, msg.subject)}
    <p style="font-size:13px;">Dear <strong>${esc(app.applicant_name)}</strong>,</p>
    <p style="font-size:12px;color:#444;">${msg.body}</p>
    <table style="font-size:12px;line-height:1.8;margin:16px 0;">
      <tr><td style="color:#666;padding-right:14px;">Position</td><td style="font-weight:700;">${esc(jobTitle)}</td></tr>
      <tr><td style="color:#666;padding-right:14px;">Status</td><td style="font-weight:700;text-transform:capitalize;">${esc(newStage)}</td></tr>
    </table>
    <p style="font-size:12px;color:#444;">If you have any questions, please reply to this email or contact us at ${CO.phone}.</p>
  ${footer(CO)}`;

  await send(
    candidateEmail,
    `${msg.subject} — ${jobTitle} | ${CO.name}`,
    html,
    `Dear ${app.applicant_name},\n\n${msg.body}\n\nPosition: ${jobTitle}\nStatus: ${newStage}\n\nBest regards,\nRotehügels HR Team`
  );
}
