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
      .select('state, waste_type, capacity_per_month, is_active')
      .eq('is_active', true)
      .range(from, from + pageSize - 1);
    if (!data || data.length === 0) break;
    allRecyclers = allRecyclers.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  const recyclers = allRecyclers;

  // Pass raw list to client for dynamic filtering
  const rawList = (recyclers ?? []).map(r => ({
    state: r.state ?? '',
    waste_type: r.waste_type ?? 'other',
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
