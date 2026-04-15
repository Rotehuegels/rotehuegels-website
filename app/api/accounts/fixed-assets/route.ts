import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const AssetSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['furniture', 'equipment', 'vehicle', 'computer', 'building', 'land', 'other']).default('equipment'),
  location: z.string().optional(),
  department: z.string().optional(),
  purchase_date: z.string().optional(),
  purchase_value: z.number().min(0),
  supplier_id: z.string().uuid().optional().nullable(),
  invoice_ref: z.string().optional(),
  useful_life_years: z.number().min(1).default(5),
  depreciation_method: z.enum(['straight_line', 'wdv']).default('straight_line'),
  depreciation_rate: z.number().min(0).max(100).default(20),
  salvage_value: z.number().min(0).default(0),
  warranty_expiry: z.string().optional().nullable(),
  amc_expiry: z.string().optional().nullable(),
  serial_number: z.string().optional(),
  notes: z.string().optional(),
});

// GET — list all assets
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('fixed_assets')
    .select('*, suppliers(legal_name)')
    .order('purchase_date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Calculate current book value and accumulated depreciation
  const enriched = (data ?? []).map(a => {
    const purchaseDate = a.purchase_date ? new Date(a.purchase_date) : new Date();
    const yearsHeld = (Date.now() - purchaseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    let accDep = 0;
    let bookValue = a.purchase_value;

    if (a.depreciation_method === 'straight_line') {
      const annualDep = (a.purchase_value - (a.salvage_value ?? 0)) / (a.useful_life_years ?? 5);
      accDep = Math.min(annualDep * yearsHeld, a.purchase_value - (a.salvage_value ?? 0));
      bookValue = Math.max(a.purchase_value - accDep, a.salvage_value ?? 0);
    } else {
      // WDV method
      let val = a.purchase_value;
      const rate = (a.depreciation_rate ?? 20) / 100;
      for (let y = 0; y < Math.floor(yearsHeld); y++) {
        const dep = val * rate;
        accDep += dep;
        val -= dep;
      }
      // Pro-rata for partial year
      const partialYear = yearsHeld - Math.floor(yearsHeld);
      accDep += val * rate * partialYear;
      bookValue = Math.max(a.purchase_value - accDep, a.salvage_value ?? 0);
    }

    return {
      ...a,
      accumulated_depreciation: Math.round(accDep * 100) / 100,
      current_book_value: Math.round(bookValue * 100) / 100,
      years_held: Math.round(yearsHeld * 10) / 10,
    };
  });

  return NextResponse.json({ data: enriched });
}

// POST — create new asset
export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = AssetSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  // Generate asset code
  const { count } = await supabaseAdmin.from('fixed_assets').select('*', { count: 'exact', head: true });
  const seq = String((count ?? 0) + 1).padStart(4, '0');
  const assetCode = `FA-${parsed.data.category.substring(0, 3).toUpperCase()}-${seq}`;

  const { data, error } = await supabaseAdmin
    .from('fixed_assets')
    .insert({
      ...parsed.data,
      asset_code: assetCode,
      current_book_value: parsed.data.purchase_value,
    })
    .select('id, asset_code')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logAudit({
    userId: user.id, userEmail: user.email ?? undefined,
    action: 'create', entityType: 'fixed_asset', entityId: data.id,
    entityLabel: `${data.asset_code} - ${parsed.data.name}`,
    metadata: { purchase_value: parsed.data.purchase_value, category: parsed.data.category },
  });

  return NextResponse.json({ success: true, id: data.id, asset_code: assetCode }, { status: 201 });
}
