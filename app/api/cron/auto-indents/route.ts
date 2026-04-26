import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Daily cron: find stock items at or below reorder_level that aren't already
// covered by an open indent, and bundle them into a single draft indent for
// procurement to review.
//
// "Open indent" = an indent in draft / submitted / approved status that has a
// matching indent_items.stock_item_id. Once an indent is converted (PO raised),
// rejected, or cancelled, the item becomes eligible again.
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isProd     = process.env.NODE_ENV === 'production';

  // Production: CRON_SECRET must be set AND the bearer must match.
  // Non-prod: allow when CRON_SECRET is unset so a developer can curl the
  // route without env-var setup. If CRON_SECRET *is* set locally, still
  // require it (so dev can mirror prod behaviour when desired).
  const allowed = isProd
    ? (!!cronSecret && authHeader === `Bearer ${cronSecret}`)
    : (!cronSecret || authHeader === `Bearer ${cronSecret}`);

  if (!allowed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Items at or below reorder level. PostgREST has no column-to-column
  // comparison, so pull all items with a reorder_level set and filter in JS.
  const { data: stockRows, error: stockErr } = await supabaseAdmin
    .from('stock_items')
    .select('id, item_code, item_name, unit, quantity, reorder_level, reorder_qty, unit_cost')
    .not('reorder_level', 'is', null);

  if (stockErr) return NextResponse.json({ error: stockErr.message }, { status: 500 });

  const eligible = (stockRows ?? []).filter(
    (s) => Number(s.quantity ?? 0) <= Number(s.reorder_level)
  );

  if (eligible.length === 0) {
    return NextResponse.json({ ok: true, created: 0, message: 'No items below reorder level.' });
  }

  // 2. Items already covered by an open indent.
  //    We only match against indent_items that have a stock_item_id FK —
  //    free-text indent lines (no stock_item_id) are by design separate
  //    from the stock-master coverage check. A free-text request for
  //    "office stationery" never blocks an auto-indent for stock_item_id=X.
  const { data: openIndentItems } = await supabaseAdmin
    .from('indent_items')
    .select('stock_item_id, indents!inner(status)')
    .in('indents.status', ['draft', 'submitted', 'approved'])
    .not('stock_item_id', 'is', null);

  const covered = new Set((openIndentItems ?? []).map((r: { stock_item_id: string | null }) => r.stock_item_id));
  const toIndent = eligible.filter((s) => !covered.has(s.id));

  if (toIndent.length === 0) {
    return NextResponse.json({
      ok: true,
      created: 0,
      lowStockCount: eligible.length,
      coveredCount: eligible.length,
      message: 'All low-stock items already have open indents.',
    });
  }

  // 3. Generate indent number
  const { data: indentNo, error: noErr } = await supabaseAdmin.rpc('next_indent_no');
  if (noErr || !indentNo) {
    return NextResponse.json({ error: 'Could not generate indent number.' }, { status: 500 });
  }

  // 4. Create the auto indent header
  const { data: indent, error: insErr } = await supabaseAdmin
    .from('indents')
    .insert({
      indent_no:          indentNo as string,
      requested_by_email: 'system@rotehuegels.com',
      department:         'Stores',
      priority:           'normal',
      justification:      `Auto-generated from ${toIndent.length} stock item(s) at or below reorder level on ${new Date().toISOString().slice(0, 10)}.`,
      status:             'draft',
      source:             'auto_low_stock',
      notes:              'Review quantities and supplier choice, then submit for approval.',
    })
    .select('id, indent_no')
    .single();

  if (insErr || !indent) return NextResponse.json({ error: insErr?.message ?? 'Insert failed' }, { status: 500 });

  // 5. Insert items, suggesting reorder_qty (or 2× reorder_level if reorder_qty is null)
  const itemRows = toIndent.map((s) => {
    const suggestedQty = Number(s.reorder_qty ?? Math.max(1, Number(s.reorder_level) * 2 - Number(s.quantity ?? 0)));
    return {
      indent_id:           indent.id,
      stock_item_id:       s.id,
      item_code:           s.item_code,
      item_name:           s.item_name,
      uom:                 s.unit,
      qty:                 suggestedQty,
      estimated_unit_cost: s.unit_cost,
      notes:               `Current stock: ${s.quantity}${s.unit ? ' ' + s.unit : ''}; reorder level: ${s.reorder_level}.`,
    };
  });

  const { error: itemErr } = await supabaseAdmin.from('indent_items').insert(itemRows);
  if (itemErr) {
    await supabaseAdmin.from('indents').delete().eq('id', indent.id);
    return NextResponse.json({ error: itemErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok:           true,
    created:      1,
    indent_id:    indent.id,
    indent_no:    indent.indent_no,
    items:        toIndent.length,
    lowStockCount: eligible.length,
    coveredCount:  eligible.length - toIndent.length,
  });
}
