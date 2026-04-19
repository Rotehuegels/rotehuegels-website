import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: row } = await sb.from('recyclers').select('id, notes, capacity_per_month').eq('recycler_code', 'MRAI-UP-008').single();
const newCap = '196,440 TPA total — rPET fibre 109,200 + rPET granules 42,000 + B2F chips/filament 12,240 + PPSF 10,800 + washed flakes 12,000 + rPET spun yarn 7,200 + dyed texturised yarn 3,000';
const note = `[capacity Phase 2 2026-04-19] ${newCap} · source: Ganesha Ecosphere AR FY24 (BSE 514167 / NSE GANECOS)`;
await sb.from('recyclers').update({
  capacity_per_month: newCap,
  notes: row.notes ? `${row.notes}\n${note}` : note,
}).eq('id', row.id);
console.log('✓ MRAI-UP-008 Ganesha refreshed with full 7-segment breakup');
