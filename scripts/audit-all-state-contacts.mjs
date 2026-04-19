#!/usr/bin/env node
// Contact coverage by state across the full active directory.
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const isPlaceholder = (e) => !e || /placeholder|^cpcb\.|^mrai\.|^bm\.|@placeholder/i.test(String(e));
const realStr = (v) => v && String(v).trim() !== '' && !isPlaceholder(v);

const rows = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await sb.from('recyclers')
    .select('state, email, phone, contacts_all')
    .eq('is_active', true)
    .range(from, from + 999);
  if (error) { console.error(error.message); process.exit(1); }
  if (!data?.length) break;
  rows.push(...data);
  if (data.length < 1000) break;
}

const byState = {};
for (const r of rows) {
  const state = r.state ?? 'Unknown';
  byState[state] = byState[state] ?? { total: 0, bothOk: 0, emailOk: 0, phoneOk: 0, neither: 0 };
  byState[state].total++;
  const ca = Array.isArray(r.contacts_all) ? r.contacts_all : [];
  const hasE = realStr(r.email) || ca.some(c => realStr(c.email));
  const hasP = realStr(r.phone) || ca.some(c => realStr(c.phone));
  if (hasE && hasP) byState[state].bothOk++;
  else if (hasE) byState[state].emailOk++;
  else if (hasP) byState[state].phoneOk++;
  else byState[state].neither++;
}

console.log(`Total active rows: ${rows.length}`);
console.log(`\nContact coverage by state (sorted by gap size):\n`);
console.log(`  ${'State'.padEnd(22)} ${'Total'.padStart(6)} ${'Both%'.padStart(7)} ${'Neither'.padStart(8)} ${'Gap%'.padStart(6)}`);
console.log(`  ${'-'.repeat(22)} ${'-'.repeat(6)} ${'-'.repeat(7)} ${'-'.repeat(8)} ${'-'.repeat(6)}`);
const sorted = Object.entries(byState)
  .sort((a, b) => b[1].neither - a[1].neither);
let totalNeither = 0, totalBoth = 0;
for (const [state, s] of sorted) {
  totalNeither += s.neither;
  totalBoth += s.bothOk;
  if (s.neither === 0 && s.total < 20) continue; // skip tiny fully-complete states
  const bothPct = ((s.bothOk / s.total) * 100).toFixed(0) + '%';
  const gapPct = ((s.neither / s.total) * 100).toFixed(0) + '%';
  console.log(`  ${state.padEnd(22)} ${String(s.total).padStart(6)} ${bothPct.padStart(7)} ${String(s.neither).padStart(8)} ${gapPct.padStart(6)}`);
}

console.log(`\nDirectory-wide:`);
console.log(`  both email + phone: ${totalBoth} / ${rows.length} (${((totalBoth / rows.length) * 100).toFixed(1)}%)`);
console.log(`  neither:            ${totalNeither} / ${rows.length} (${((totalNeither / rows.length) * 100).toFixed(1)}%)`);
