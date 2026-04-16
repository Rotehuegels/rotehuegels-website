import { supabaseAdmin } from '@/lib/supabaseAdmin';
import RecyclerDirectory from './RecyclerDirectory';

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
    // Parse capacity: "500 MTA", "12000 MTA", "300 MTA", etc.
    const cap = r.capacity_per_month;
    if (cap) {
      const num = parseFloat(cap.replace(/[^0-9.]/g, ''));
      if (!isNaN(num)) existing.capacity += num;
    }
    stateMap.set(r.state, existing);
  }

  const states = Array.from(stateMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.recyclers - a.recyclers);

  const totalRecyclers = list.length;
  const totalCapacity = states.reduce((s, st) => s + st.capacity, 0);
  const statesWithRecyclers = states.length;

  return (
    <RecyclerDirectory
      states={states}
      totalRecyclers={totalRecyclers}
      totalCapacity={totalCapacity}
      statesCount={statesWithRecyclers}
    />
  );
}
