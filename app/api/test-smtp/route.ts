import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function GET() {
  try {
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_USER,
      SMTP_PASS,
      EMAIL_FROM,
      EMAIL_TO,
    } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM || !EMAIL_TO) {
      return NextResponse.json(
        { ok: false, error: "Missing SMTP/EMAIL env vars", env: {
          SMTP_HOST: !!SMTP_HOST,
          SMTP_PORT: !!SMTP_PORT,
          SMTP_USER: !!SMTP_USER,
          SMTP_PASS: !!SMTP_PASS,
          EMAIL_FROM: !!EMAIL_FROM,
          EMAIL_TO: !!EMAIL_TO,
        }},
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: false,              // Office365 uses STARTTLS on 587
      requireTLS: true,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      tls: { minVersion: "TLSv1.2" },
    });

    // IMPORTANT: From should be the authenticated mailbox for O365
    const info = await transporter.sendMail({
      from: EMAIL_FROM.includes("@") ? EMAIL_FROM : `"Rotehügels" <${SMTP_USER}>`,
      to: EMAIL_TO,
      subject: "SMTP Test — Rotehügels",
      text: "This is a test email from /api/test-smtp.",
    });

    return NextResponse.json({ ok: true, messageId: info.messageId });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
