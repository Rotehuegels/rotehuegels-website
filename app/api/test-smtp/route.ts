// app/api/test-smtp/route.ts
export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function GET() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, EMAIL_TO } = process.env;

  // sanity check
  const env = {
    SMTP_HOST: !!SMTP_HOST,
    SMTP_PORT: !!SMTP_PORT,
    SMTP_USER: !!SMTP_USER,
    SMTP_PASS: !!SMTP_PASS,
    EMAIL_FROM: !!EMAIL_FROM,
    EMAIL_TO: !!EMAIL_TO,
  };

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM || !EMAIL_TO) {
    return NextResponse.json({ ok: false, env, error: "Missing one or more SMTP env vars" }, { status: 400 });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465, // true for 465, false for 587/25
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      subject: "SMTP Test — Rotehügels",
      text: "Hello! This is a test email from /api/test-smtp.",
    });

    return NextResponse.json({ ok: true, env, messageId: info.messageId });
  } catch (e: any) {
    return NextResponse.json({ ok: false, env, error: e?.message || String(e) }, { status: 500 });
  }
}