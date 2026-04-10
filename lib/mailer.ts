// lib/mailer.ts
import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM = "Rotehügels <noreply@rotehuegels.com>",
  EMAIL_TO, // default recipient for admin notifications
} = process.env;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
  // Don't throw on import, but we will guard at send time
  console.warn(
    "[mailer] Missing SMTP env vars. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS."
  );
}

// create and cache a transporter instance
let transporter: nodemailer.Transporter | null = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: false, // STARTTLS upgrade on 587
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }
  return transporter;
}

type SupplierPayload = {
  company_name: string;
  contact_person: string;
  email: string;
  phone?: string | null;
  country?: string | null;
  website?: string | null;
  product_categories: string;
  certifications?: string | null;
  notes?: string | null;
};

export async function sendNewSupplierEmail(payload: SupplierPayload) {
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn("[mailer] Skipping email: SMTP env vars not set.");
    return;
  }
  const to = EMAIL_TO || "sivakumar@rotehuegels.com";

  const subject = `New supplier submission: ${payload.company_name}`;
  const text = [
    `New supplier submitted:`,
    `Company: ${payload.company_name}`,
    `Contact: ${payload.contact_person}`,
    `Email: ${payload.email}`,
    `Phone: ${payload.phone || "-"}`,
    `Country: ${payload.country || "-"}`,
    `Website: ${payload.website || "-"}`,
    `Products/Services: ${payload.product_categories}`,
    `Certifications: ${payload.certifications || "-"}`,
    `Notes: ${payload.notes || "-"}`,
  ].join("\n");

  const html = `
    <h2>New supplier submission</h2>
    <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
      <tr><td><strong>Company</strong></td><td>${escapeHtml(payload.company_name)}</td></tr>
      <tr><td><strong>Contact</strong></td><td>${escapeHtml(payload.contact_person)}</td></tr>
      <tr><td><strong>Email</strong></td><td>${escapeHtml(payload.email)}</td></tr>
      <tr><td><strong>Phone</strong></td><td>${escapeHtml(payload.phone || "-")}</td></tr>
      <tr><td><strong>Country</strong></td><td>${escapeHtml(payload.country || "-")}</td></tr>
      <tr><td><strong>Website</strong></td><td>${escapeHtml(payload.website || "-")}</td></tr>
      <tr><td><strong>Products/Services</strong></td><td>${escapeHtml(payload.product_categories)}</td></tr>
      <tr><td><strong>Certifications</strong></td><td>${escapeHtml(payload.certifications || "-")}</td></tr>
      <tr><td><strong>Notes</strong></td><td>${escapeHtml(payload.notes || "-")}</td></tr>
    </table>
  `;

  const transporter = getTransporter();
  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
}

type ApplicationPayload = {
  candidate_name: string;
  email: string;
  phone?: string;
  job_title: string;
  current_company?: string;
  current_role?: string;
  experience_years?: number;
  expected_ctc?: string;
  current_ctc?: string;
  notice_period?: string;
  source?: string;
};

export async function sendNewApplicationEmail(payload: ApplicationPayload) {
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn("[mailer] Skipping email: SMTP env vars not set.");
    return;
  }
  const to = "hr@rotehuegels.com";

  const subject = `New application: ${payload.candidate_name} — ${payload.job_title}`;
  const text = [
    `New job application received:`,
    `Position: ${payload.job_title}`,
    `Candidate: ${payload.candidate_name}`,
    `Email: ${payload.email}`,
    `Phone: ${payload.phone || "-"}`,
    `Current Company: ${payload.current_company || "-"}`,
    `Current Role: ${payload.current_role || "-"}`,
    `Experience: ${payload.experience_years != null ? `${payload.experience_years} years` : "-"}`,
    `Current CTC: ${payload.current_ctc || "-"}`,
    `Expected CTC: ${payload.expected_ctc || "-"}`,
    `Notice Period: ${payload.notice_period || "-"}`,
    `Source: ${payload.source || "website"}`,
  ].join("\n");

  const html = `
    <h2>New job application — ${escapeHtml(payload.job_title)}</h2>
    <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
      <tr><td><strong>Candidate</strong></td><td>${escapeHtml(payload.candidate_name)}</td></tr>
      <tr><td><strong>Email</strong></td><td>${escapeHtml(payload.email)}</td></tr>
      <tr><td><strong>Phone</strong></td><td>${escapeHtml(payload.phone || "-")}</td></tr>
      <tr><td><strong>Current Company</strong></td><td>${escapeHtml(payload.current_company || "-")}</td></tr>
      <tr><td><strong>Current Role</strong></td><td>${escapeHtml(payload.current_role || "-")}</td></tr>
      <tr><td><strong>Experience</strong></td><td>${payload.experience_years != null ? `${payload.experience_years} years` : "-"}</td></tr>
      <tr><td><strong>Current CTC</strong></td><td>${escapeHtml(payload.current_ctc || "-")}</td></tr>
      <tr><td><strong>Expected CTC</strong></td><td>${escapeHtml(payload.expected_ctc || "-")}</td></tr>
      <tr><td><strong>Notice Period</strong></td><td>${escapeHtml(payload.notice_period || "-")}</td></tr>
      <tr><td><strong>Source</strong></td><td>${escapeHtml(payload.source || "website")}</td></tr>
    </table>
    <p style="margin-top:16px">
      <a href="https://rotehuegels.com/dashboard/ats" style="color:#e11d48">View in Dashboard</a>
    </p>
  `;

  const transporter = getTransporter();
  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}