import { supabaseAdmin } from '@/lib/supabaseAdmin';
import RecyclerDirectory from './RecyclerDirectory';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RecyclersPage() {
  const { data: recyclers } = await supabaseAdmin
    .from('ewaste_recyclers')
    .select('state, waste_type, capacity_per_month, is_active')
    .eq('is_active', true);

  const list = recyclers ?? [];

  // Aggregate state-wise stats from live DB
  const stateMap = new Map<string, { recyclers: number; capacity: number }>();
  for (const r of list) {
    if (!r.state) continue;
    const existing = stateMap.get(r.state) ?? { recyclers: 0, capacity: 0 };
    existing.recyclers += 1;
    // Parse capacity: extract first number before "MTA" or "MT"
    // e.g. "500 MTA", "12000 MTA", "3000 MTA (Gummidipundi...)"
    const cap = r.capacity_per_month;
    if (cap) {
      const match = cap.match(/^[\d,.]+/);
      if (match) {
        const num = parseFloat(match[0].replace(/,/g, ''));
        if (!isNaN(num) && num < 500000) existing.capacity += num;
      }
    }
    stateMap.set(r.state, existing);
  }

  const states = Array.from(stateMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.recyclers - a.recyclers);

  const totalRecyclers = list.length;
  const totalCapacity = states.reduce((s, st) => s + st.capacity, 0);
  const statesWithRecyclers = states.length;

  // Industry category breakdown
  const categoryMap = new Map<string, number>();
  for (const r of list) {
    const cat = r.waste_type ?? 'other';
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1);
  }
  const categories = Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <RecyclerDirectory
      states={states}
      totalRecyclers={totalRecyclers}
      totalCapacity={totalCapacity}
      statesCount={statesWithRecyclers}
      categories={categories}
    />
  );
}
