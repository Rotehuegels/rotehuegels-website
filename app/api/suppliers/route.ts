// app/api/suppliers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { sendNewSupplierEmail } from "@/lib/mailer";

// Ensure this API runs on Node (required for SMTP)
export const runtime = "nodejs";
// Avoid caching on edge/CDN
export const dynamic = "force-dynamic";

type InBody = {
  company_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string | null;
  country?: string | null;
  website?: string | null;
  product_categories?: string;
  product_service?: string; // alternate name we also accept
  certifications?: string | null;
  notes?: string | null;
};

// Simple healthcheck + env presence check
export async function GET() {
  return NextResponse.json({
    ok: true,
    api: "suppliers",
    env: {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      SMTP_HOST: !!process.env.SMTP_HOST,
      EMAIL_TO: !!process.env.EMAIL_TO,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as InBody;

    // Normalize the product categories field
    const product_categories =
      (body.product_categories && body.product_categories.trim()) ||
      (body.product_service && body.product_service.trim()) ||
      "";

    // Normalize/trim payload to match your Supabase table columns
    const payload = {
      company_name: (body.company_name || "").trim(),
      contact_person: (body.contact_person || "").trim(),
      email: (body.email || "").trim(),
      phone: (body.phone ?? "").toString().trim() || null,
      country: (body.country ?? "").toString().trim() || null,
      website: (body.website ?? "").toString().trim() || null,
      product_categories,
      certifications: (body.certifications ?? "").toString().trim() || null,
      notes: (body.notes ?? "").toString().trim() || null,
    };

    // Validate required fields
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

    // Insert into Supabase
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

    // Fire-and-forget email notification (do not block success on email failure)
    sendNewSupplierEmail({
      company_name: payload.company_name,
      contact_person: payload.contact_person,
      email: payload.email,
      phone: payload.phone,
      country: payload.country,
      website: payload.website,
      product_categories: payload.product_categories,
      certifications: payload.certifications,
      notes: payload.notes,
    }).catch((e) => console.error("sendNewSupplierEmail failed:", e));

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}