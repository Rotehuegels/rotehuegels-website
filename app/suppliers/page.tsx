// app/api/suppliers/route.ts
export const runtime = "nodejs";          // ✅ force Node runtime (required for nodemailer/supabase)
export const dynamic = "force-dynamic";   // avoid caching the route

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { sendNewSupplierEmail } from "@/lib/mailer";

type InBody = {
  company_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  country?: string;
  website?: string;
  product_categories?: string;
  product_service?: string;
  certifications?: string | null;
  notes?: string | null;
};

export async function GET() {
  return NextResponse.json({
    ok: true,
    api: "suppliers",
    env: {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as InBody;

    const product_categories =
      (body.product_categories && body.product_categories.trim()) ||
      (body.product_service && body.product_service.trim()) ||
      "";

    const payload = {
      company_name: (body.company_name || "").trim(),
      contact_person: (body.contact_person || "").trim(),
      email: (body.email || "").trim(),
      phone: (body.phone || "").trim(),
      country: (body.country || "").trim(),
      website: (body.website || "").trim(),
      product_categories,
      certifications: (body.certifications ?? "").toString().trim() || null,
      notes: (body.notes ?? "").toString().trim() || null,
    };

    const missing: string[] = [];
    if (!payload.company_name) missing.push("company_name");
    if (!payload.contact_person) missing.push("contact_person");
    if (!payload.email) missing.push("email");
    if (!payload.product_categories) missing.push("product_categories");
    if (missing.length) {
      return NextResponse.json(
        { ok: false, error: `Missing: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("suppliers")
      .insert([payload])
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    // Don’t block success on email failure
    sendNewSupplierEmail(payload).catch((e) =>
      console.error("sendNewSupplierEmail failed:", e)
    );

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}