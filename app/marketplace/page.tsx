import Link from 'next/link';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import MarketplaceBrowser from './MarketplaceBrowser';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Marketplace — Rotehügels',
  description: 'Buy / sell listings across India\'s circular economy — virgin metals, secondary metals, battery chain intermediates, EOL feedstock, byproducts, plastics + paper + tyres, consumables.',
};

export default async function MarketplacePage() {
  const today = new Date().toISOString().slice(0, 10);

  const [listingsRes, catsRes, statesRes] = await Promise.all([
    supabaseAdmin.from('listings')
      .select(`
        id, listing_type, item_category_id, company_name, title,
        quantity_value, quantity_unit, price_inr_per_unit,
        location_state, location_city, valid_until, created_at,
        item_categories ( id, group_code, label )
      `, { count: 'exact' })
      .eq('status', 'active')
      .eq('moderation_status', 'approved')
      .or(`valid_until.is.null,valid_until.gte.${today}`)
      .order('created_at', { ascending: false })
      .limit(200),
    supabaseAdmin.from('item_categories')
      .select('id, parent_id, group_code, label, typical_unit, sort_order')
      .eq('is_active', true)
      .order('sort_order'),
    supabaseAdmin.from('recyclers').select('state').eq('is_active', true),
  ]);

  const listings = listingsRes.data ?? [];
  const total = listingsRes.count ?? 0;
  const categories = catsRes.data ?? [];
  const states = Array.from(new Set((statesRes.data ?? []).map(r => r.state).filter(Boolean))).sort();

  const sellCount = listings.filter(l => l.listing_type === 'sell').length;
  const buyCount  = listings.filter(l => l.listing_type === 'buy').length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-[1800px] mx-auto px-6 md:px-10 py-12">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <ShoppingBag className="h-7 w-7 text-emerald-400" />
          <h1 className="text-2xl font-bold">India Circular Economy Marketplace</h1>
        </div>
        <p className="text-sm text-zinc-500 mb-4 max-w-3xl">
          Buy and sell listings across the full circular value chain — virgin metals, secondary metals, battery cells / packs / CAM,
          end-of-life feedstock, byproducts, and process consumables. Every listing is reviewed before it goes public.
        </p>

        {/* Preview-mode banner — remove when going public */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 mb-6 text-xs text-amber-300 flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-amber-400/20 font-semibold uppercase tracking-wider">Preview</span>
          <span className="text-amber-300/90">
            This marketplace is visible to logged-in team members only. Not yet open to the public. Use it to test the end-to-end flow
            before we remove the auth gate.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-8">
          <Link href="/marketplace/new"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors">
            Post a Listing <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/ecosystem" className="text-xs text-zinc-500 hover:text-zinc-300">
            ← Browse the Ecosystem Directory
          </Link>
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Tile value={total}      label="Active listings"       color="text-emerald-400" />
          <Tile value={sellCount}  label="Sell posts"            color="text-sky-400" />
          <Tile value={buyCount}   label="Buy posts"             color="text-amber-400" />
          <Tile value={categories.filter(c => !c.id.startsWith('_group_')).length} label="Item categories" color="text-purple-400" />
        </div>

        {/* Evolving disclaimer */}
        {total === 0 && (
          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-6 mb-8 text-sm text-zinc-300">
            <p className="font-semibold text-sky-300 mb-2">Marketplace just launched — no active listings yet.</p>
            <p className="text-zinc-400">
              Be the first to post. Whether you have 2 MT of brass turnings to sell or you&apos;re sourcing NMC black mass, the
              submission form covers 130+ tradeable items across 7 circular-economy tiers. Your listing goes live within 24 hours of
              review.
            </p>
          </div>
        )}

        <MarketplaceBrowser initialListings={listings} categories={categories} states={states} />

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
