import { supabaseAdmin } from '@/lib/supabaseAdmin';
import RecyclerDirectory from './RecyclerDirectory';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Public page: only aggregate counts are exposed. Company-level identifiers
// (name, code, contact, address, GPS coordinates) stay internal — see
// /dashboard/recycling/recyclers for the authenticated full view.
export default async function RecyclersPage() {
  let allRecyclers: { state: string | null; waste_type: string | null; capacity_per_month: string | null; black_mass_mta: number | string | null }[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data } = await supabaseAdmin
      .from('recyclers')
      .select('state, waste_type, capacity_per_month, black_mass_mta')
      .eq('is_active', true)
      .range(from, from + pageSize - 1);
    if (!data || data.length === 0) break;
    allRecyclers = allRecyclers.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  const rawList = allRecyclers.map(r => ({
    state: r.state ?? '',
    waste_type: r.waste_type ?? 'other',
    black_mass_mta: r.black_mass_mta ? Number(r.black_mass_mta) : null,
    capacity: (() => {
      const cap = r.capacity_per_month;
      if (!cap) return 0;
      const match = cap.match(/^[\d,.]+/);
      if (!match) return 0;
      const num = parseFloat(match[0].replace(/,/g, ''));
      return (!isNaN(num) && num < 500000) ? num : 0;
    })(),
  }));

  return <RecyclerDirectory rawList={rawList} />;
}
