export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

const PatchSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve') }),                                       // moves to unpaid (or partial if payments exist)
  z.object({ action: z.literal('override'), match_notes: z.string().min(1).max(1000) }),  // accept the variance
  z.object({ action: z.literal('hold'),     match_notes: z.string().optional() }),  // park payment
  z.object({ action: z.literal('mark_paid') }),                                     // payment_status = paid
  z.object({ action: z.literal('mark_partial') }),
]);

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const [{ data: inv, error }, { data: items }] = await Promise.all([
    supabaseAdmin
      .from('purchase_invoices')
      .select('*, suppliers(legal_name, vendor_code, gstin), purchase_orders(po_no, po_date, total_amount)')
      .eq('id', id)
      .single(),
    supabaseAdmin
      .from('purchase_invoice_items')
      .select('*, po_items(sl_no, description, quantity, unit_price)')
      .eq('invoice_id', id)
      .order('created_at'),
  ]);

  if (error || !inv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: { ...inv, items: items ?? [] } });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { data: existing } = await supabaseAdmin
    .from('purchase_invoices')
    .select('match_status, payment_status')
    .eq('id', id)
    .single();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let patch: Record<string, unknown> = {};
  switch (parsed.data.action) {
    case 'approve':
      // Block approval when match is hard-blocked unless first overridden
      if (['unmatched','over_billed','price_variance','qty_variance','pending'].includes(existing.match_status)) {
        return NextResponse.json({
          error: `Cannot approve while match_status is "${existing.match_status}". Use Override (with reason) or fix the source documents first.`,
        }, { status: 409 });
      }
      patch = {
        approved_by_email: user.email ?? null,
        approved_at:       new Date().toISOString(),
        payment_status:    'unpaid',
      };
      break;
    case 'override':
      patch = {
        match_status:      'overridden',
        match_notes:       parsed.data.match_notes,
        approved_by_email: user.email ?? null,
        approved_at:       new Date().toISOString(),
        payment_status:    existing.payment_status === 'on_hold' ? 'unpaid' : existing.payment_status,
      };
      break;
    case 'hold':
      patch = { payment_status: 'on_hold', match_notes: parsed.data.match_notes ?? null };
      break;
    case 'mark_paid':
      patch = { payment_status: 'paid' };
      break;
    case 'mark_partial':
      patch = { payment_status: 'partial' };
      break;
  }

  const { error: updErr } = await supabaseAdmin.from('purchase_invoices').update(patch).eq('id', id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { data: existing } = await supabaseAdmin
    .from('purchase_invoices')
    .select('payment_status')
    .eq('id', id)
    .single();

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.payment_status === 'paid' || existing.payment_status === 'partial') {
    return NextResponse.json({ error: 'Cannot delete an invoice with payments recorded.' }, { status: 409 });
  }

  const { error } = await supabaseAdmin.from('purchase_invoices').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
