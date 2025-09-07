import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "edge"; // fast cold starts; remove if you prefer node

type Payload = {
  company_name: string;
  contact_name?: string;
  email: string;
  phone?: string;
  country?: string;
  product_service: string;
  certifications?: string;
  website?: string;
  notes?: string;
};

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<Payload>;

    // Basic validation (ensure NOT NULL columns are present)
    if (!body.company_name?.trim()) return bad("company_name is required");
    if (!body.email?.trim()) return bad("email is required");
    if (!body.product_service?.trim()) return bad("product_service is required");

    // Insert
    const { data, error } = await supabaseAdmin
      .from("suppliers")
      .insert([
        {
          company_name: body.company_name.trim(),
          contact_name: body.contact_name?.trim() || null,
          email: body.email.trim(),
          phone: body.phone?.trim() || null,
          country: body.country?.trim() || null,
          product_service: body.product_service.trim(),
          certifications: body.certifications?.trim() || null,
          website: body.website?.trim() || null,
          notes: body.notes?.trim() || null,
        },
      ])
      .select()
      .single();

    if (error) {
      // This shows up in Vercel → Deployment → Functions logs
      console.error("Supabase insert error:", error);
      return bad(`Supabase error: ${error.message}`, 500);
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (e: any) {
    console.error("API /suppliers error:", e);
    return bad("Invalid JSON or server error", 500);
  }
}

// (Optional) Handle CORS preflight if you ever post from external origins
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}