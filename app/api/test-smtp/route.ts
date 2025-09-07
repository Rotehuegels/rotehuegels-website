// app/api/test-smtp/route.ts
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function GET() {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    EMAIL_FROM,
    EMAIL_TO,
  } = process.env as Record<string, string | undefined>;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM || !EMAIL_TO) {
    return NextResponse.json(
      { ok: false, error: "Missing SMTP/EMAIL env vars" },
      { status: 400 }
    );
  }

  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: false,
    requireTLS: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    const info = await transport.sendMail({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      subject: "SMTP test from Rotehügels",
      text: "This is a test email from /api/test-smtp",
    });
    return NextResponse.json({ ok: true, messageId: info.messageId });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}