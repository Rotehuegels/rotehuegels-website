#!/usr/bin/env node
// Audit email + phone coverage for every Tamil Nadu recycler / directory row.
// Counts a row as "has email" / "has phone" if either the primary column OR
// the contacts_all jsonb array holds a real value (not placeholder).
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const isPlaceholder = (e) => !e || /placeholder|^cpcb\.|^mrai\.|^bm\.|@placeholder/i.test(String(e));
const realStr = (v) => v && String(v).trim() !== '' && !isPlaceholder(v);

function contactsArr(c) { return Array.isArray(c) ? c : []; }

const rows = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await sb.from('recyclers')
    .select('recycler_code, company_name, state, city, waste_type, email, phone, contacts_all')
    .eq('is_active', true)
    .eq('state', 'Tamil Nadu')
    .range(from, from + 999);
  if (error) { console.error(error.message); process.exit(1); }
  if (!data?.length) break;
  rows.push(...data);
  if (data.length < 1000) break;
}

console.log(`Tamil Nadu active rows: ${rows.length}`);

let bothOk = 0, emailOk = 0, phoneOk = 0, neither = 0;
const missing = [];

for (const r of rows) {
  const ca = contactsArr(r.contacts_all);
  const hasEmail = realStr(r.email) || ca.some(c => realStr(c.email));
  const hasPhone = realStr(r.phone) || ca.some(c => realStr(c.phone));
  if (hasEmail && hasPhone) bothOk++;
  else if (hasEmail) emailOk++;
  else if (hasPhone) phoneOk++;
  else neither++;
  if (!hasEmail || !hasPhone) {
    missing.push({ ...r, has_email: hasEmail, has_phone: hasPhone });
  }
}

const pct = (n) => ((n / rows.length) * 100).toFixed(1);
console.log(`\nCoverage:`);
console.log(`  both email + phone:   ${bothOk}  (${pct(bothOk)}%)`);
console.log(`  email only:           ${emailOk}  (${pct(emailOk)}%)`);
console.log(`  phone only:           ${phoneOk}  (${pct(phoneOk)}%)`);
console.log(`  neither:              ${neither}  (${pct(neither)}%)`);
console.log(`  ---`);
console.log(`  any email present:    ${bothOk + emailOk}  (${pct(bothOk + emailOk)}%)`);
console.log(`  any phone present:    ${bothOk + phoneOk}  (${pct(bothOk + phoneOk)}%)`);

// By waste_type
console.log(`\nMissing at least one (email or phone) by waste_type:`);
const byType = {};
for (const m of missing) {
  const k = m.waste_type ?? 'null';
  byType[k] = byType[k] ?? { total: 0, noEmail: 0, noPhone: 0 };
  byType[k].total++;
  if (!m.has_email) byType[k].noEmail++;
  if (!m.has_phone) byType[k].noPhone++;
}
for (const [k, v] of Object.entries(byType).sort((a, b) => b[1].total - a[1].total)) {
  console.log(`  ${k.padEnd(16)} total=${v.total}  noEmail=${v.noEmail}  noPhone=${v.noPhone}`);
}

// By code cohort
console.log(`\nMissing by code prefix:`);
const byPfx = {};
for (const m of missing) {
  const pfx = String(m.recycler_code).split('-')[0];
  byPfx[pfx] = (byPfx[pfx] ?? 0) + 1;
}
for (const [k, v] of Object.entries(byPfx).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(12)} ${v}`);
}

// Sample of rows with neither
const neitherRows = missing.filter(m => !m.has_email && !m.has_phone);
if (neitherRows.length) {
  console.log(`\nRows with NEITHER email nor phone (first 25):`);
  for (const r of neitherRows.slice(0, 25)) {
    console.log(`  ${r.recycler_code.padEnd(16)} ${String(r.waste_type ?? '?').padEnd(14)} ${String(r.city ?? '?').padEnd(22)} ${r.company_name}`);
  }
  if (neitherRows.length > 25) console.log(`  … and ${neitherRows.length - 25} more`);
}
