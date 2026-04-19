#!/usr/bin/env node
/**
 * Auto-seed the companies table from the 62+ multi-unit clusters in the
 * recyclers table. For each cluster of rows that share a normalised
 * legal name, create ONE company row and link every member facility
 * via recyclers.company_id + an inferred unit_name.
 *
 * Does not touch rows that already have a company_id (so the Jain
 * Metal Group hierarchy seeded manually earlier is preserved).
 *
 * Safe to re-run — upserts companies by slug, updates facility links
 * only if company_id is null.
 *
 * Run: node --env-file=.env.local scripts/seed-company-clusters.mjs [--dry-run]
 */
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const DRY = process.argv.includes('--dry-run');

function norm(n) {
  return String(n).toLowerCase()
    .replace(/\b(pvt|private|ltd|limited|p\.?\s*ltd|\(p\)|llp|co)\b/g, '')
    .replace(/\bunit\s*[ivx\d-]+/g, '')
    .replace(/\bunt[-\s]*[ivx\d]+\b/g, '')
    .replace(/\bplant\s*[ivx\d-]+/g, '')
    .replace(/\bfacility\s*\d+/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[.,&'"]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function slugify(name) {
  return name.toLowerCase()
    .replace(/\b(pvt|private|ltd|limited|p\.?\s*ltd|\(p\)|llp|co)\b/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function canonicalName(rows) {
  // Prefer the longest form that looks most "official" — i.e. contains
  // Pvt Ltd / Limited / Pvt. Ltd..
  const ranked = [...rows].sort((a, b) => {
    const score = (n) => {
      const s = n.company_name ?? '';
      let v = s.length;
      if (/Private Limited/i.test(s)) v += 30;
      else if (/Pvt\.?\s*Ltd/i.test(s)) v += 20;
      else if (/Limited/i.test(s)) v += 15;
      if (/\(.*?\)/.test(s)) v -= 5; // parens = annotation, less canonical
      if (/unit|plant|facility|dismantl|refurbish/i.test(s)) v -= 10;
      return v;
    };
    return score(b) - score(a);
  });
  // Normalise capitalisation — Title Case except all-caps words
  let name = ranked[0].company_name.trim();
  // Keep consistent punctuation
  name = name.replace(/\s+/g, ' ');
  // Strip trailing annotations like "(Dismantler)" / "(Unit-II)" etc. for the parent legal name
  name = name.replace(/\s*\([^)]*\)\s*/g, '').trim();
  return name;
}

function unitNameFor(row) {
  // Extract any explicit Unit / Plant / Facility marker from the name
  const m = row.company_name.match(/\((unit[^)]+|plant[^)]+|facility[^)]+|dismantl[^)]+|refurbish[^)]+|[^)]*unit[-\s]*[ivx\d]+[^)]*)\)/i);
  if (m) return m[1].trim();
  const m2 = row.company_name.match(/\bunit[-\s]*([IVXivx\d]+)/i);
  if (m2) return `Unit ${m2[1].toUpperCase()}`;
  const m3 = row.company_name.match(/\bunt[-\s]*([IVXivx\d]+)/i);
  if (m3) return `Unit ${m3[1].toUpperCase()}`;
  // Fallback: use city, state
  const parts = [row.city, row.state].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

// ── Load data ───────────────────────────────────────────────────────────
const recyclers = [];
for (let from = 0; ; from += 1000) {
  const { data } = await sb.from('recyclers')
    .select('id, recycler_code, company_name, state, city, waste_type, company_id, unit_name')
    .eq('is_active', true)
    .range(from, from + 999);
  if (!data || !data.length) break;
  recyclers.push(...data);
  if (data.length < 1000) break;
}
console.log(`Loaded ${recyclers.length} active recyclers`);

const groups = new Map();
for (const r of recyclers) {
  const k = norm(r.company_name);
  if (!k) continue;
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(r);
}
const multi = [...groups.entries()].filter(([, v]) => v.length >= 2);
console.log(`${multi.length} multi-unit clusters to seed\n`);

let createdCompanies = 0, updatedCompanies = 0, linkedFacilities = 0, skippedAlreadyLinked = 0;

for (const [, rows] of multi) {
  const name = canonicalName(rows);
  const slug = slugify(name);
  if (!slug || slug.length < 3) continue;

  const payload = {
    slug,
    legal_name: name,
    is_group_holding: false,
    registered_state: rows[0].state ?? null,
  };

  if (DRY) {
    console.log(`[${rows.length}] ${slug.padEnd(42)}  →  "${name}"`);
    for (const r of rows) console.log(`         ${r.recycler_code.padEnd(14)} ${r.company_name.slice(0, 45).padEnd(45)} ${unitNameFor(r) ?? ''}`);
    continue;
  }

  // Upsert company by slug
  const { data: existing } = await sb.from('companies').select('id').eq('slug', slug).maybeSingle();
  let companyId;
  if (existing) {
    companyId = existing.id;
    updatedCompanies++;
  } else {
    const { data: inserted, error } = await sb.from('companies').insert(payload).select('id').single();
    if (error) { console.log(`✗ company ${slug}: ${error.message}`); continue; }
    companyId = inserted.id;
    createdCompanies++;
  }

  // Link facilities that don't already have a company_id
  for (const r of rows) {
    if (r.company_id) { skippedAlreadyLinked++; continue; }
    const unitName = unitNameFor(r);
    const { error } = await sb.from('recyclers').update({ company_id: companyId, unit_name: unitName }).eq('id', r.id);
    if (error) { console.log(`   ✗ ${r.recycler_code}: ${error.message}`); continue; }
    linkedFacilities++;
  }
  console.log(`✓ [${rows.length}] ${name} → linked ${rows.filter(x => !x.company_id).length}`);
}

console.log(`\n=== DONE ===`);
console.log(`companies created:   ${createdCompanies}`);
console.log(`companies existing:  ${updatedCompanies}`);
console.log(`facilities linked:   ${linkedFacilities}`);
console.log(`already linked:      ${skippedAlreadyLinked}`);
