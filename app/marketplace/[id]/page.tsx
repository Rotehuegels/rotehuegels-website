import Link from 'next/link';
import { ArrowLeft, MapPin, Clock, Package, Mail, Phone, Building2, Tag } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await supabaseAdmin.from('listings').select('title, listing_type').eq('id', id).maybeSingle();
  if (!data) return { title: 'Listing — Rotehügels Marketplace' };
  return {
    title: `${data.listing_type === 'sell' ? 'Selling' : 'Wanting'}: ${data.title} — Rotehügels`,
  };
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const today = new Date().toISOString().slice(0, 10);

  const { data: l } = await supabaseAdmin.from('listings')
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

  if (!l) notFound();

  const cat = Array.isArray(l.item_categories) ? l.item_categories[0] : l.item_categories;
  const isSell = l.listing_type === 'sell';
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Related listings — same category, not this one
  const { data: related } = await supabaseAdmin.from('listings')
    .select('id, listing_type, title, location_state, location_city, quantity_value, quantity_unit, valid_until')
    .eq('item_category_id', l.item_category_id)
    .eq('status', 'active')
    .eq('moderation_status', 'approved')
    .neq('id', l.id)
    .or(`valid_until.is.null,valid_until.gte.${today}`)
    .limit(6);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-6">
          <ArrowLeft className="h-3 w-3" /> Back to Marketplace
        </Link>

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            isSell ? 'bg-sky-500/10 text-sky-400' : 'bg-amber-500/10 text-amber-400'
          }`}>
            {isSell ? 'Selling' : 'Wanting'}
          </span>
          {cat && <span className="text-xs text-zinc-500">{cat.label}</span>}
        </div>
        <h1 className="text-2xl font-bold mb-2">{l.title}</h1>
        {l.company_name && (
          <p className="text-sm text-zinc-400 flex items-center gap-1.5 mb-4">
            <Building2 className="h-3.5 w-3.5 text-zinc-500" /> {l.company_name}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {l.quantity_value != null && (
            <MetaTile icon={Package} label="Quantity" value={`${l.quantity_value} ${l.quantity_unit ?? ''}`.trim()} />
          )}
          {l.price_inr_per_unit != null && (
            <MetaTile icon={Tag} label="Price per unit"
              value={`₹${new Intl.NumberFormat('en-IN').format(l.price_inr_per_unit)}`} />
          )}
          {(l.location_city || l.location_state) && (
            <MetaTile icon={MapPin} label="Location" value={[l.location_city, l.location_state].filter(Boolean).join(', ')} />
          )}
          {l.valid_until && (
            <MetaTile icon={Clock} label="Valid until" value={fmtDate(l.valid_until)} />
          )}
        </div>

        {l.description && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 mb-8">
            <h2 className="text-sm font-semibold text-zinc-300 mb-3">Description</h2>
            <p className="text-sm text-zinc-400 whitespace-pre-line leading-relaxed">{l.description}</p>
          </div>
        )}

        {/* Item spec */}
        {cat && (cat.hsn_code || cat.isri_grade || cat.description) && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 mb-8">
            <h2 className="text-sm font-semibold text-zinc-300 mb-3">Item Reference</h2>
            {cat.description && <p className="text-xs text-zinc-500 mb-3">{cat.description}</p>}
            <div className="flex flex-wrap gap-4 text-xs">
              {cat.hsn_code && <span><span className="text-zinc-500">HSN</span>{' '}<code className="text-zinc-300">{cat.hsn_code}</code></span>}
              {cat.isri_grade && <span><span className="text-zinc-500">ISRI grade</span>{' '}<code className="text-zinc-300">{cat.isri_grade}</code></span>}
              {cat.typical_unit && <span><span className="text-zinc-500">Typical unit</span>{' '}<code className="text-zinc-300">{cat.typical_unit}</code></span>}
            </div>
          </div>
        )}

        {/* Contact */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 mb-8">
          <h2 className="text-sm font-semibold text-emerald-300 mb-3">
            Contact {isSell ? 'seller' : 'buyer'}
          </h2>
          <div className="space-y-2 text-sm">
            {l.contact_email && (
              <a href={`mailto:${l.contact_email}?subject=${encodeURIComponent('Rotehügels Marketplace — ' + l.title)}`}
                 className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300">
                <Mail className="h-4 w-4" /> {l.contact_email}
              </a>
            )}
            {l.contact_phone && (
              <a href={`tel:${l.contact_phone}`} className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300">
                <Phone className="h-4 w-4" /> {l.contact_phone}
              </a>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 mt-4">
            Rotehügels is a facilitator and is not party to this transaction. Verify credentials independently before engaging.
          </p>
        </div>

        {/* Related */}
        {related && related.length > 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
            <h2 className="text-sm font-semibold text-zinc-300 mb-4">Related listings — same category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {related.map(r => (
                <Link key={r.id} href={`/marketplace/${r.id}`}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 hover:bg-zinc-800/50 transition-colors block">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className={`text-[9px] font-semibold uppercase ${
                      r.listing_type === 'sell' ? 'text-sky-400' : 'text-amber-400'
                    }`}>{r.listing_type === 'sell' ? 'Selling' : 'Wanting'}</span>
                    {r.valid_until && <span className="text-[9px] text-zinc-600">Until {fmtDate(r.valid_until)}</span>}
                  </div>
                  <p className="text-sm text-zinc-200 line-clamp-1">{r.title}</p>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    {r.quantity_value != null && `${r.quantity_value} ${r.quantity_unit ?? 'MT'} · `}
                    {[r.location_city, r.location_state].filter(Boolean).join(', ')}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        <p className="text-[11px] text-zinc-600 text-center mt-8">
          Listing posted on {fmtDate(l.created_at)}. Something wrong? <a href="mailto:grievance@rotehuegels.com"
            className="text-zinc-500 hover:text-zinc-300 underline">Report</a>.
        </p>
      </div>
    </div>
  );
}

function MetaTile({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wider mb-1">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="text-sm text-white font-medium">{value}</p>
    </div>
  );
}
