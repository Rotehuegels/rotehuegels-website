#!/usr/bin/env node
// Dump the missing-contacts rows for a given state (passed as arg).
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const state = process.argv[2];
if (!state) { console.error('Usage: list-state-blanks.mjs "<state>"'); process.exit(1); }
const isPlaceholder = (e) => !e || /placeholder|^cpcb\.|^mrai\.|^bm\.|@placeholder/i.test(String(e));
const realStr = (v) => v && String(v).trim() !== '' && !isPlaceholder(v);
const { data } = await sb.from('recyclers')
  .select('recycler_code, company_name, city, email, phone, contacts_all, website, address, unit_name')
  .eq('is_active', true).eq('state', state).order('recycler_code');
for (const r of data ?? []) {
  const ca = Array.isArray(r.contacts_all) ? r.contacts_all : [];
  const hasE = realStr(r.email) || ca.some(c => realStr(c.email));
  const hasP = realStr(r.phone) || ca.some(c => realStr(c.phone));
  if (!hasE && !hasP) {
    const unit = r.unit_name ? ` · ${r.unit_name}` : '';
    console.log(`${r.recycler_code}\t${r.company_name}${unit}\t${r.city ?? ''}\t${r.website ?? ''}`);
  }
}
