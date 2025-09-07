// app/api/suppliers/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

// Small helper: pick the first defined value
const pick = <T>(...vals: (T | undefined | null)[]) =>
  vals.find(v => v !== undefined && v !== null);

export async function GET() {
  // Simple health check so we can debug env on Vercel quickly
  return NextResponse.json({
    ok: true,
    api: "suppliers",
    env: {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // Normalize incoming keys from different clients
    const company_name = body.company_name?.toString().trim();
    const contact_person = pick<string>(
      body.contact_person?.toString().trim(),
      body.contact_name?.toString().trim(), // accept either
    );
    const email = body.email?.toString().trim();
    const phone = body.phone?.toString().trim();
    const country = body.country?.toString().trim();
    const website = body.website?.toString().trim();
    const certifications = body.certifications?.toString().trim();
    const notes = body.notes?.toString().trim();

    // Accept either "product_categories" (our table) or the earlier "product_service"
    const product_categories = pick<string>(
      body.product_categories?.toString().trim(),
      body.product_service?.toString().trim(),
    );

    // Minimal validation
    if (!company_name) {
      return NextResponse.json({ ok: false, error: "company_name is required" }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ ok: false, error: "email is required" }, { status: 400 });
    }
    if (!product_categories) {
      return NextResponse.json(
        { ok: false, error: "product_categories (or product_service) is required" },
        { status: 400 }
      );
    }

    // Build insert payload matching your Supabase table columns
    const payload = {
      company_name,
      contact_person: contact_person ?? null,
      email,
      phone: phone ?? null,
      country: country ?? null,
      website: website ?? null,
      product_categories, // <- the actual column in your table
      certifications: certifications ?? null,
      notes: notes ?? null,
    };

    const { data, error } = await supabaseAdmin
      .from("suppliers")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data?.id ?? null });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unexpected server error" },
      { status: 500 }
    );
  }
}