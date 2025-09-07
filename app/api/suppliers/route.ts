import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "edge";

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

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function bad(msg: string, status = 400) {
  return json({ ok: false, error: msg }, status);
}

export async function GET() {
  // Minimal health check (does NOT expose secrets)
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasService = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  return json({
    ok: true,
    api: "suppliers",
    env: { NEXT_PUBLIC_SUPABASE_URL: hasUrl, SUPABASE_SERVICE_ROLE_KEY: hasService },
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<Payload>;

    if (!body.company_name?.trim()) return bad("company_name is required");
    if (!body.email?.trim()) return bad("email is required");
    if (!body.product_service?.trim()) return bad("product_service is required");

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
      console.error("Supabase insert error:", error);
      return bad(`Supabase error: ${error.message}`, 500);
    }

    return json({ ok: true, id: data.id });
  } catch (e: any) {
    console.error("API /suppliers error:", e);
    return bad("Invalid JSON or server error", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}