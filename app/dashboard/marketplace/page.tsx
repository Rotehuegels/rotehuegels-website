import { ShoppingBag } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import ModerationQueue from './ModerationQueue';

export const dynamic = 'force-dynamic';

export default async function AdminMarketplacePage() {
  const [pending, approved, rejected] = await Promise.all([
    supabaseAdmin.from('listings').select(`
      id, listing_type, item_category_id, company_name, title, description,
      quantity_value, quantity_unit, price_inr_per_unit,
      location_state, location_city, contact_email, contact_phone,
      submitter_name, submitter_ip, valid_until, created_at,
      item_categories ( id, group_code, label )
    `, { count: 'exact' })
      .eq('moderation_status', 'pending').order('created_at', { ascending: false }),
    supabaseAdmin.from('listings').select('id', { count: 'exact', head: true }).eq('moderation_status', 'approved'),
    supabaseAdmin.from('listings').select('id', { count: 'exact', head: true }).eq('moderation_status', 'rejected'),
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-[1400px] mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingBag className="h-7 w-7 text-emerald-400" />
          <h1 className="text-xl font-bold">Marketplace — Moderation Queue</h1>
        </div>
        <p className="text-sm text-zinc-500 mb-8">
          Review submitted listings before they go public. Approve legitimate posts, reject spam or listings that violate the Terms of Use.
        </p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <Tile value={pending.count ?? 0}  label="Pending"  color="text-amber-400" />
          <Tile value={approved.count ?? 0} label="Approved" color="text-emerald-400" />
          <Tile value={rejected.count ?? 0} label="Rejected" color="text-red-400" />
        </div>

        <ModerationQueue listings={pending.data ?? []} />
      </div>
    </div>
  );
}

function Tile({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 text-center">
      <p className={`text-3xl font-black ${color}`}>{new Intl.NumberFormat('en-IN').format(value)}</p>
      <p className="text-xs text-zinc-500 mt-1">{label}</p>
    </div>
  );
}
