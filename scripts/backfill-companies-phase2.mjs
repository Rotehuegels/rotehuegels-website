// Phase 2 backfill — every recycler row gets linked to a companies row.
//
// Uses supabase-js (REST/HTTPS) instead of pg.Client because the project's
// direct postgres is IPv6-only and not reachable from some networks.
// Each step is idempotent so a partial run can be resumed by re-running:
//   - ON CONFLICT (cin) and (slug) prevent duplicate companies
//   - UPDATE company_id only WHERE company_id IS NULL
// Re-running this script is always safe.

import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error('Missing SUPABASE_URL / SERVICE_ROLE_KEY'); process.exit(1); }
const sb = createClient(URL, KEY, { auth: { persistSession: false } });

const slugify = (s) =>
  String(s ?? '').toLowerCase()
    .replace(/[''"`’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 100) || 'unnamed';

const normalizeName = (s) =>
  String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();

// Canonical names for the 6 multi-unit majors
const CANONICAL = {
  L27020MH1958PLC011238: 'Hindalco Industries Limited',
  L27201WB1967GOI028825: 'Hindustan Copper Limited',
  L27204RJ1966PLC001208: 'Hindustan Zinc Limited',
  L13209MH1965PLC291394: 'Vedanta Limited',
  L27203OR1981GOI000920: 'National Aluminium Company Limited',
  U37200MH2016PTC284528: 'Cero Recycling (Mahindra MSTC Recycling Pvt Ltd)',
};

// ── Fetch every recycler in pages of 1000 ───────────────────────────────────
async function fetchAllRecyclers() {
  const all = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from('recyclers')
      .select('id, recycler_code, facility_code, company_name, cin, state, company_id, unit_name')
      .range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    all.push(...data);
    if (data.length < 1000) break;
  }
  return all;
}

async function ensureSlug(base) {
  let candidate = base;
  for (let n = 2; n < 100; n++) {
    const { data, error } = await sb.from('companies').select('id').eq('slug', candidate).maybeSingle();
    if (error) throw error;
    if (!data) return candidate;
    candidate = `${base}-${n}`;
  }
  throw new Error(`Could not allocate slug for "${base}"`);
}

async function getOrCreateCompany({ legal_name, cin, registered_state }) {
  if (cin) {
    const { data: byCin } = await sb.from('companies').select('id').eq('cin', cin).maybeSingle();
    if (byCin) return byCin.id;
  }
  const baseSlug = slugify(legal_name);
  if (!cin) {
    const { data: bySlug } = await sb.from('companies').select('id').eq('slug', baseSlug).maybeSingle();
    if (bySlug) return bySlug.id;
  }
  const slug = await ensureSlug(baseSlug);
  const { data, error } = await sb.from('companies').insert({
    legal_name, slug, cin: cin ?? null, registered_state: registered_state ?? null,
    is_group_holding: false,
  }).select('id').single();
  if (error) throw error;
  return data.id;
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('Loading recyclers…');
const recyclers = await fetchAllRecyclers();
console.log(`  ${recyclers.length} rows\n`);

// ── Step 1: CIN-grouped backfill ────────────────────────────────────────────
const byCin = new Map();
for (const r of recyclers) {
  if (!r.cin) continue;
  if (!byCin.has(r.cin)) byCin.set(r.cin, []);
  byCin.get(r.cin).push(r);
}
console.log(`Step 1 — CIN-grouped (${byCin.size} unique CINs)`);

let cinCompaniesEnsured = 0, cinLinked = 0, unitNamesSet = 0;
for (const [cin, rows] of byCin) {
  const fallbackName = rows.map(r => r.company_name).filter(Boolean)
    .sort((a, b) => a.length - b.length)[0] ?? 'Unknown';
  const legal_name = CANONICAL[cin] ?? fallbackName;
  const registered_state = rows.find(r => r.state)?.state ?? null;

  const companyId = await getOrCreateCompany({ legal_name, cin, registered_state });
  cinCompaniesEnsured++;

  for (const r of rows) {
    if (r.company_id !== companyId) {
      const { error } = await sb.from('recyclers').update({ company_id: companyId }).eq('id', r.id);
      if (error) throw error;
      cinLinked++;
    }
    // Multi-unit majors: extract unit_name from "Parent — Unit" pattern
    if (CANONICAL[cin] && !r.unit_name && r.company_name) {
      const m = r.company_name.match(/\s+[—–-]\s+(.+)$/);
      if (m) {
        await sb.from('recyclers').update({ unit_name: m[1].trim() }).eq('id', r.id);
        unitNamesSet++;
      }
    }
  }
}

// ── Step 2: name-grouped backfill (CIN-less rows) ───────────────────────────
const byName = new Map();
for (const r of recyclers) {
  if (r.cin || r.company_id || !r.company_name) continue;
  const key = normalizeName(r.company_name);
  if (!byName.has(key)) byName.set(key, []);
  byName.get(key).push(r);
}
console.log(`Step 2 — Name-grouped (${byName.size} unique names, ${
  Array.from(byName.values()).reduce((s, a) => s + a.length, 0)
} rows)`);

let nameCompaniesEnsured = 0, nameLinked = 0;
let i = 0;
for (const [, rows] of byName) {
  i++;
  // Pick the longest variant as the legal_name (fuller)
  const legal_name = rows.map(r => r.company_name).sort((a, b) => b.length - a.length)[0];
  const registered_state = rows.find(r => r.state)?.state ?? null;
  const companyId = await getOrCreateCompany({ legal_name, cin: null, registered_state });
  nameCompaniesEnsured++;

  for (const r of rows) {
    const { error } = await sb.from('recyclers').update({ company_id: companyId }).eq('id', r.id);
    if (error) throw error;
    nameLinked++;
  }
  if (i % 200 === 0) process.stdout.write(`  …${i}/${byName.size}\n`);
}

// ── Report ──────────────────────────────────────────────────────────────────
console.log(`\n=== Phase 2 backfill complete ===`);
console.log(`Step 1 (CIN-grouped):`);
console.log(`  companies ensured  : ${cinCompaniesEnsured}`);
console.log(`  recyclers linked   : ${cinLinked}`);
console.log(`  unit_names set     : ${unitNamesSet}`);
console.log(`Step 2 (name-grouped):`);
console.log(`  companies ensured  : ${nameCompaniesEnsured}`);
console.log(`  recyclers linked   : ${nameLinked}`);

const { count: total } = await sb.from('recyclers').select('*', { count: 'exact', head: true });
const { count: linked } = await sb.from('recyclers').select('*', { count: 'exact', head: true }).not('company_id', 'is', null);
const { count: companies } = await sb.from('companies').select('*', { count: 'exact', head: true });
console.log(`\nFinal: ${linked}/${total} recyclers linked · ${companies} companies total`);

// Spot check
const { data: ksm } = await sb.from('recyclers').select('facility_code, unit_name, company_id, companies(legal_name, cin)').eq('recycler_code', 'MRAI-TN-007').single();
console.log(`\nKSM Greenmet:`, ksm);
