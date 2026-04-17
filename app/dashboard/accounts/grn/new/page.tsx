import { supabaseAdmin } from '@/lib/supabaseAdmin';
import NewGRNForm from './NewGRNForm';

export const dynamic = 'force-dynamic';

export default async function NewGRNPage() {
  // Pull POs not yet fully received + their items + supplier details
  const { data: pos } = await supabaseAdmin
    .from('purchase_orders')
    .select(`
      id, po_no, po_date, supplier_ref, total_amount, status, notes,
      supplier:suppliers(id, legal_name, trade_name, gstin, state, address),
      items:po_items(id, description, hsn_code, quantity, unit, unit_price)
    `)
    .in('status', ['pending', 'partial', 'received', 'sent'])
    .order('po_date', { ascending: false });

  // Existing GRN po_ids so the form can indicate which already have one
  const { data: existingGrns } = await supabaseAdmin
    .from('goods_receipt_notes')
    .select('po_id, grn_no');

  const grnByPo = new Map<string, string>();
  for (const g of existingGrns ?? []) {
    if (g.po_id) grnByPo.set(g.po_id, g.grn_no);
  }

  const poList = (pos ?? []).map(p => ({
    id: p.id,
    po_no: p.po_no,
    po_date: p.po_date,
    supplier_ref: p.supplier_ref,
    total_amount: Number(p.total_amount ?? 0),
    status: p.status,
    notes: p.notes,
    // Supabase returns one-to-many joins as arrays — flatten to single record
    supplier: Array.isArray(p.supplier) ? (p.supplier[0] ?? null) : (p.supplier ?? null),
    items: (p.items ?? []).map(it => ({
      id: it.id,
      description: it.description,
      hsn_code: it.hsn_code,
      quantity: Number(it.quantity ?? 0),
      unit: it.unit,
      unit_price: Number(it.unit_price ?? 0),
    })),
    existing_grn_no: p.id ? grnByPo.get(p.id) ?? null : null,
  }));

  return <NewGRNForm poList={poList} />;
}
