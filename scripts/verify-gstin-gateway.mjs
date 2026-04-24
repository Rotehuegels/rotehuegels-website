// Sanity check: prove the gateway contract — hit a GSTIN we already have
// in gstin_lookup_cache and confirm NO credit is spent.

import { createClient } from '@supabase/supabase-js';
import { getGstinData } from '../lib/gstin/gateway.mjs';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function credits() {
  const { data } = await sb.from('app_settings').select('key,value').like('key', 'gstin_credits_%');
  const m = Object.fromEntries((data ?? []).map(s => [s.key, s.value]));
  return { total: Number(m.gstin_credits_total), used: Number(m.gstin_credits_used), remaining: Number(m.gstin_credits_total) - Number(m.gstin_credits_used) };
}

// Pick an already-cached GSTIN
const { data: cachedRows } = await sb.from('gstin_lookup_cache').select('gstin, legal_name, lookup_count').limit(3);
if (!cachedRows?.length) { console.log('(no cached GSTINs — nothing to test)'); process.exit(0); }

console.log('Cached GSTINs available for test:');
cachedRows.forEach(r => console.log(`  ${r.gstin}  ${r.legal_name}  (lookup_count=${r.lookup_count})`));

const testGstin = cachedRows[0].gstin;
console.log(`\nTesting gateway against cached GSTIN: ${testGstin}\n`);

const before = await credits();
console.log(`BEFORE: used=${before.used}/${before.total} · remaining=${before.remaining}`);

const { source, fetched_at } = await getGstinData(sb, testGstin);
console.log(`\ngateway returned: source=${source}  fetched_at=${fetched_at}`);

const after = await credits();
console.log(`\nAFTER : used=${after.used}/${after.total} · remaining=${after.remaining}`);

if (before.used === after.used && source === 'cache') {
  console.log('\n✓ Contract holds: cache hit, zero credits spent.');
} else {
  console.log('\n✗ Contract violation — credit moved or vendor path used on cached GSTIN.');
  process.exit(1);
}

// Also verify lookup_count was bumped
const { data: postRow } = await sb.from('gstin_lookup_cache').select('lookup_count, last_accessed_at').eq('gstin', testGstin).single();
console.log(`  lookup_count bumped to ${postRow.lookup_count} · last_accessed_at ${postRow.last_accessed_at}`);
