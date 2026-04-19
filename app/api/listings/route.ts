import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// ── GET /api/listings — public browse with filters ─────────────────────
// Only returns approved + active + unexpired listings.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('mode');                // 'sell' | 'buy' | null (all)
  const categoryId = url.searchParams.get('category');      // item_category.id
  const groupCode = url.searchParams.get('group');          // group_code filter (tier)
  const state = url.searchParams.get('state');
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 200);
  const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

  const today = new Date().toISOString().slice(0, 10);

  let query = supabaseAdmin.from('listings')
    .select(`
      id, listing_type, item_category_id, company_name, title, description,
      quantity_value, quantity_unit, price_inr_per_unit,
      location_state, location_city, valid_until, created_at,
      item_categories ( id, group_code, label, typical_unit )
    `, { count: 'exact' })
    .eq('status', 'active')
    .eq('moderation_status', 'approved')
    .or(`valid_until.is.null,valid_until.gte.${today}`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (mode === 'sell' || mode === 'buy') query = query.eq('listing_type', mode);
  if (categoryId) query = query.eq('item_category_id', categoryId);
  if (state) query = query.eq('location_state', state);
  if (groupCode) {
    // Filter by group_code via inner-joined category. Supabase can't filter
    // on a joined column directly in the select, so do it via a subquery.
    const { data: catIds } = await supabaseAdmin.from('item_categories').select('id').eq('group_code', groupCode);
    if (catIds?.length) query = query.in('item_category_id', catIds.map(c => c.id));
    else return NextResponse.json({ listings: [], total: 0 });
  }

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ listings: data ?? [], total: count ?? 0 });
}

// ── POST /api/listings — create a new listing (goes to moderation queue) ─
// Public endpoint; rate-limited by IP.
const RATE_LIMIT = new Map<string, { count: number; windowStart: number }>();
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 min
const RATE_MAX = 5;                    // 5 listings per IP per 15 min

function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim()
      ?? req.headers.get('x-real-ip')
      ?? 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const row = RATE_LIMIT.get(ip);
  if (!row || now - row.windowStart > RATE_WINDOW_MS) {
    RATE_LIMIT.set(ip, { count: 1, windowStart: now });
    return false;
  }
  row.count++;
  return row.count > RATE_MAX;
}

const ListingSchema = z.object({
  listing_type: z.enum(['sell', 'buy']),
  item_category_id: z.string().min(1).max(80),
  title: z.string().min(10).max(140),
  description: z.string().max(2000).optional().nullable(),
  quantity_value: z.coerce.number().positive().optional().nullable(),
  quantity_unit: z.string().max(20).optional().nullable(),
  price_inr_per_unit: z.coerce.number().nonnegative().optional().nullable(),
  location_state: z.string().min(2).max(80),
  location_city: z.string().max(80).optional().nullable(),
  submitter_name: z.string().min(2).max(120),
  contact_email: z.string().email(),
  contact_phone: z.string().max(30).optional().nullable(),
  company_name: z.string().max(200).optional().nullable(),
  valid_until: z.string().optional().nullable(),          // ISO date string
  recycler_id: z.string().uuid().optional().nullable(),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many submissions from this IP. Please try again later.' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });

  const parsed = ListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const d = parsed.data;

  // Confirm the category exists
  const { data: cat } = await supabaseAdmin.from('item_categories').select('id').eq('id', d.item_category_id).maybeSingle();
  if (!cat) return NextResponse.json({ error: 'Unknown item category.' }, { status: 400 });

  const { data, error } = await supabaseAdmin.from('listings').insert({
    listing_type: d.listing_type,
    item_category_id: d.item_category_id,
    recycler_id: d.recycler_id ?? null,
    company_name: d.company_name ?? null,
    title: d.title,
    description: d.description ?? null,
    quantity_value: d.quantity_value ?? null,
    quantity_unit: d.quantity_unit ?? null,
    price_inr_per_unit: d.price_inr_per_unit ?? null,
    location_state: d.location_state,
    location_city: d.location_city ?? null,
    contact_email: d.contact_email,
    contact_phone: d.contact_phone ?? null,
    valid_until: d.valid_until ?? null,
    submitter_name: d.submitter_name,
    submitter_ip: ip,
    status: 'active',
    moderation_status: 'pending',
    created_by_email: d.contact_email,
  }).select('id').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    success: true,
    id: data.id,
    message: 'Listing received. It will be reviewed within 24 hours and published after approval.',
  }, { status: 201 });
}
