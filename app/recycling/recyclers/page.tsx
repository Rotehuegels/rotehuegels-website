import { supabaseAdmin } from '@/lib/supabaseAdmin';
import RecyclerDirectory from './RecyclerDirectory';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RecyclersPage() {
  // Fetch all rows (Supabase default limit is 1000, so paginate)
  let allRecyclers: any[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data } = await supabaseAdmin
      .from('recyclers')
      .select('id, recycler_code, company_name, city, state, waste_type, capacity_per_month, black_mass_mta, latitude, longitude, is_active')
      .eq('is_active', true)
      .range(from, from + pageSize - 1);
    if (!data || data.length === 0) break;
    allRecyclers = allRecyclers.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  const recyclers = allRecyclers;

  const rawList = (recyclers ?? []).map(r => ({
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

  // Facility-level pins for the calibrated GPS overlay
  const pins = (recyclers ?? [])
    .filter(r => r.latitude != null && r.longitude != null)
    .map(r => ({
      id: r.id,
      code: r.recycler_code ?? undefined,
      lat: Number(r.latitude),
      lng: Number(r.longitude),
      label: r.company_name ?? 'Facility',
      sub: [r.city, r.state].filter(Boolean).join(', ')
        + (r.black_mass_mta ? ` · ${Number(r.black_mass_mta).toLocaleString('en-IN')} MTA black mass` : ''),
      waste_type: r.waste_type ?? undefined,
      state: r.state ?? undefined,
      black_mass_mta: r.black_mass_mta ? Number(r.black_mass_mta) : undefined,
    }));

  return <RecyclerDirectory rawList={rawList} pins={pins} />;
}
