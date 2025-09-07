// app/api/suppliers/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

type SupplierPayload = {
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  country?: string;
  product_service: string;
  certifications?: string;
  website?: string;
  notes?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<SupplierPayload>;

    // Validate required fields
    const required = ["company_name", "contact_name", "email", "product_service"] as const;
    for (const k of required) {
      if (!body[k] || String(body[k]).trim() === "") {
        return NextResponse.json({ error: `Missing required field: ${k}` }, { status: 400 });
      }
    }

    const { error } = await supabaseAdmin.from("suppliers").insert({
      company_name: body.company_name!.trim(),
      contact_name: body.contact_name!.trim(),
      email: body.email!.trim(),
      phone: body.phone?.trim() || null,
      country: body.country?.trim() || null,
      product_service: body.product_service!.trim(),
      certifications: body.certifications?.trim() || null,
      website: body.website?.trim() || null,
      notes: body.notes?.trim() || null,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err: any) {
    console.error("API /suppliers error:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
