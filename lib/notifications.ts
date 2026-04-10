// lib/notifications.ts
// Centralized email notification module for accounts / ERP workflows.
// Uses the same SMTP transport pattern as /lib/mailer.ts.

import nodemailer from "nodemailer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

/* ── Company constants ───────────────────────────────────────────────────── */

const CO = {
  name: "Rotehuegel Research Business Consultancy Private Limited",
  addr1: "No. 1/584, 7th Street, Jothi Nagar, Padianallur,",
  addr2: "Near Gangaiamman Kovil, Redhills, Chennai – 600052, Tamil Nadu, India",
  gstin: "33AAPCR0554G1ZE",
  pan: "AAPCR0554G",
  cin: "U70200TN2025PTC184573",
  email: "sales@rotehuegels.com",
  phone: "+91-90044 91275",
  web: "www.rotehuegels.com",
  bankName: "HDFC Bank",
  bankAccount: "50200095372553",
  bankIfsc: "HDFC0000123",
  bankBranch: "Redhills, Chennai",
};

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

function letterhead(title: string) {
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

function footer() {
  return `
      <!-- footer -->
      <div style="border-top:1px solid #ddd;padding-top:12px;margin-top:24px;font-size:9px;color:#999;line-height:1.6;">
        <div>This is an auto-generated email from ${esc(CO.name)}.</div>
        <div>For queries, contact ${CO.email} or call ${CO.phone}.</div>
        <div>Subject to Chennai jurisdiction.</div>
      </div>
    </div>`;
}

function bankDetailsHtml() {
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

async function send(to: string, subject: string, html: string, text: string) {
  const t = getTransporter();
  await t.sendMail({ from: EMAIL_FROM, to, subject, html, text });
}

/* ── 1. Order Confirmation / Invoice Email ───────────────────────────────── */

export async function sendOrderConfirmation(orderId: string) {
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();
  if (error || !order) throw new Error(`Order not found: ${orderId}`);

  const clientEmail = order.client_email;
  if (!clientEmail) throw new Error("Order has no client email address.");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (order.items ?? []) as Array<{
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

  const html = `${letterhead("Order Confirmation")}
    <p style="font-size:13px;">Dear <strong>${esc(order.client_name)}</strong>,</p>
    <p style="font-size:12px;color:#444;">Thank you for your order. Please find the details below.</p>

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

    ${order.payment_terms ? `<p style="font-size:11px;color:#444;"><strong>Payment Terms:</strong> ${esc(order.payment_terms)}</p>` : ""}

    ${bankDetailsHtml()}

    <p style="font-size:11px;color:#666;margin-top:16px;">If you have any questions regarding this order, please reply to this email or contact us at ${CO.email}.</p>
  ${footer()}`;

  const itemsText = items
    .map((it, i) => `  ${i + 1}. ${it.name} — ${it.quantity} ${it.unit} x ${fmt(it.unit_price)} = ${fmt(it.total)}`)
    .join("\n");

  const text = [
    `ORDER CONFIRMATION — ${order.order_no}`,
    ``,
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
    `For queries contact ${CO.email} or ${CO.phone}.`,
    `— ${CO.name}`,
  ].join("\n");

  await send(
    clientEmail,
    `Order Confirmation — ${order.order_no} | ${CO.name}`,
    html,
    text
  );
}

/* ── 2. Payment Receipt ──────────────────────────────────────────────────── */

export async function sendPaymentReceipt(paymentId: string) {
  const { data: payment, error: pErr } = await supabaseAdmin
    .from("order_payments")
    .select("*")
    .eq("id", paymentId)
    .single();
  if (pErr || !payment) throw new Error(`Payment not found: ${paymentId}`);

  const { data: order, error: oErr } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", payment.order_id)
    .single();
  if (oErr || !order) throw new Error(`Order not found for payment ${paymentId}`);

  const clientEmail = order.client_email;
  if (!clientEmail) throw new Error("Order has no client email address.");

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

  const html = `${letterhead("Payment Receipt")}
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

    <p style="font-size:11px;color:#666;">For queries, contact ${CO.email} or ${CO.phone}.</p>
  ${footer()}`;

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
    `— ${CO.name}`,
  ].join("\n");

  await send(
    clientEmail,
    `Payment Received — ${order.order_no} | ${CO.name}`,
    html,
    text
  );
}

/* ── 3. Payment Reminder ─────────────────────────────────────────────────── */

export async function sendPaymentReminder(orderId: string) {
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();
  if (error || !order) throw new Error(`Order not found: ${orderId}`);

  const clientEmail = order.client_email;
  if (!clientEmail) throw new Error("Order has no client email address.");

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

  const html = `${letterhead("Payment Reminder")}
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

    ${bankDetailsHtml()}

    <p style="font-size:11px;color:#666;margin-top:16px;">If you have already made the payment, please disregard this reminder. For any questions, contact us at ${CO.email} or ${CO.phone}.</p>
  ${footer()}`;

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
    `If already paid, please disregard this reminder.`,
    `— ${CO.name}`,
  ].join("\n");

  await send(
    clientEmail,
    `Payment Reminder — ${order.order_no} | ${fmt(pending)} due | ${CO.name}`,
    html,
    text
  );
}

/* ── 4. Quote Email ──────────────────────────────────────────────────────── */

export async function sendQuoteEmail(quoteId: string) {
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

  const html = `${letterhead("Quotation")}
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

    <p style="font-size:12px;color:#444;margin-top:16px;">Please feel free to reach out if you have any questions or would like to discuss this quotation further. You can reply to this email or call us at ${CO.phone}.</p>
  ${footer()}`;

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
    `For questions, contact ${CO.email} or ${CO.phone}.`,
    `— ${CO.name}`,
  ].join("\n");

  await send(
    recipientEmail,
    `Quotation ${quote.quote_no} | ${CO.name}`,
    html,
    text
  );
}

/* ── 5. Purchase Order Confirmation to Supplier ──────────────────────────── */

export async function sendPOConfirmation(poId: string) {
  const { data: po, error } = await supabaseAdmin
    .from("purchase_orders")
    .select("*, suppliers(legal_name, trade_name, email, phone, gstin, address, state)")
    .eq("id", poId)
    .single();
  if (error || !po) throw new Error(`Purchase order not found: ${poId}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supplier = po.suppliers as any;
  const supplierEmail = supplier?.email;
  if (!supplierEmail) throw new Error("Supplier has no email address.");

  const items = (po.items ?? []) as Array<{
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

  const html = `${letterhead("Purchase Order")}
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

    <p style="font-size:12px;color:#444;margin-top:16px;">Please confirm receipt and expected delivery schedule. For queries, contact ${CO.email} or call ${CO.phone}.</p>
  ${footer()}`;

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
    `Please confirm receipt.`,
    `— ${CO.name}`,
  ].join("\n");

  await send(
    supplierEmail,
    `Purchase Order ${po.po_no} | ${CO.name}`,
    html,
    text
  );
}
