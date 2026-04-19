import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// GET /api/listings/[id] — public detail (approved listings only)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabaseAdmin.from('listings')
    .select(`
      id, listing_type, item_category_id, company_name, title, description,
      quantity_value, quantity_unit, price_inr_per_unit,
      location_state, location_city, contact_email, contact_phone,
      valid_until, created_at, status, moderation_status,
      item_categories ( id, group_code, label, description, typical_unit, isri_grade, hsn_code )
    `)
    .eq('id', id)
    .eq('status', 'active')
    .eq('moderation_status', 'approved')
    .or(`valid_until.is.null,valid_until.gte.${today}`)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data)  return NextResponse.json({ error: 'Listing not found or no longer available.' }, { status: 404 });
  return NextResponse.json({ listing: data });
}
