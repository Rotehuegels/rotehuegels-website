// Enrich CIN for Limited-suffix recyclers by matching against the
// indialei.in company sitemap (210K LEI-registered Indian companies),
// then fetching detail pages for matches and extracting CIN.
//
// Pipeline:
//   1. Read sitemap shards from .buddy/lei-cache/s1.xml … s9.xml
//      (pre-downloaded — see header of this script for curl commands).
//   2. Build slug → {lei, url} index in memory.
//   3. Query DB for recyclers with "Limited/Ltd/Pvt" suffix and cin IS NULL.
//   4. Slugify each DB name with 3 variants; exact-match against index.
//   5. Fetch detail page for each match (1.5s delay) → regex CIN.
//   6. UPDATE recyclers.cin + .raw_lei_data in one transaction.
//   7. Write .buddy/lei-enrichment-results.json report.
//
// READ the sitemap .xml files if missing:
//   mkdir -p .buddy/lei-cache
//   for i in 1 2 3 4 5 6 7 8 9; do
//     curl -s "https://indialei.in/sitemap-cacher/current-cache/company/company-sitemap-${i}.xml" \
//       -o ".buddy/lei-cache/s${i}.xml"
//   done

import pg from 'pg';
import fs from 'fs';
import { readFile } from 'fs/promises';

const { SUPABASE_DB_HOST, SUPABASE_DB_PASSWORD } = process.env;
if (!SUPABASE_DB_HOST || !SUPABASE_DB_PASSWORD) {
  console.error('Missing SUPABASE_DB_HOST or SUPABASE_DB_PASSWORD in env.');
  process.exit(1);
}

const DELAY_MS = 1500;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const CIN_REGEX = /[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}/;

// ── 1. Build slug index from sitemap shards ─────────────────────────────────
console.log('[1/5] Building slug index from LEI sitemaps…');
const slugIndex = new Map();
for (let i = 1; i <= 9; i++) {
  const xml = await readFile(`.buddy/lei-cache/s${i}.xml`, 'utf8');
  const re = /<loc>(https:\/\/indialei\.in\/detailed-information\/(\d+)\/([A-Z0-9]+)\/([^/]+)\/)<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const [, url, , lei, slug] = m;
    slugIndex.set(slug, { lei, url });
  }
}
console.log(`      indexed ${slugIndex.size.toLocaleString()} LEI-registered companies\n`);

// ── 2. Slugify — match indialei.in's slug convention ────────────────────────
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\./g, '')                       // drop all periods
    .replace(/\(p\)\s*ltd/g, 'private ltd')    // (P) Ltd → private ltd
    .replace(/p\s*ltd/g, 'private ltd')        // P Ltd → private ltd
    .replace(/pvt\s*ltd/g, 'private ltd')      // Pvt Ltd → private ltd
    .replace(/\bltd\b/g, 'limited')           // Ltd → limited
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')             // strip punctuation
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function variants(name) {
  const base = slugify(name);
  const v = new Set([base]);
  v.add(base.replace(/-private-limited$/, '-limited'));
  v.add(base.replace(/-limited$/, '-private-limited'));
  // Also try with "-unit-N" stripped
  v.add(base.replace(/-unit-\d+$/, ''));
  return [...v].filter(Boolean);
}

// ── 3. Pull candidates from DB ──────────────────────────────────────────────
console.log('[2/5] Querying DB for Limited-suffix rows without CIN…');
const c = new pg.Client({
  host: SUPABASE_DB_HOST, port: 5432, user: 'postgres',
  password: SUPABASE_DB_PASSWORD, database: 'postgres',
  ssl: { rejectUnauthorized: false },
});
await c.connect();

const { rows: candidates } = await c.query(`
  select recycler_code, company_name
  from recyclers
  where cin is null
    and (
      company_name ilike '% limited'
      or company_name ilike '%limited,%'
      or company_name ilike '% ltd'
      or company_name ilike '% ltd.'
      or company_name ilike '%pvt. ltd.%'
      or company_name ilike '%pvt ltd%'
      or company_name ilike '%private limited%'
      or company_name ilike '%(p) ltd%'
      or company_name ilike '% p. ltd%'
    )
  order by company_name
`);
console.log(`      ${candidates.length} candidates\n`);

// ── 4. Match slugs ──────────────────────────────────────────────────────────
console.log('[3/5] Matching candidate slugs against sitemap index…');
const matches = [];
const misses = [];
for (const r of candidates) {
  let hit = null;
  let matchedSlug = null;
  for (const s of variants(r.company_name)) {
    if (slugIndex.has(s)) { hit = slugIndex.get(s); matchedSlug = s; break; }
  }
  if (hit) matches.push({ ...r, slug: matchedSlug, ...hit });
  else misses.push(r);
}
console.log(`      matched: ${matches.length}`);
console.log(`      missed : ${misses.length}  (not LEI-registered or name mismatch)\n`);

// ── 5. Fetch detail pages for matches ───────────────────────────────────────
console.log(`[4/5] Fetching ${matches.length} detail pages (delay ${DELAY_MS} ms)…`);
const enriched = [];
const errors = [];
for (let i = 0; i < matches.length; i++) {
  const m = matches[i];
  process.stdout.write(`\r      [${i + 1}/${matches.length}] ${m.company_name.slice(0, 55).padEnd(55)}`);
  try {
    const res = await fetch(m.url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    if (!res.ok) { errors.push({ ...m, status: res.status }); continue; }
    const html = await res.text();
    const cin = html.match(CIN_REGEX)?.[0] ?? null;
    const legalName = html.match(/<(?:h1|td)[^>]*>([^<]*(?:LIMITED|LLP)[^<]*)<\/(?:h1|td)>/i)?.[1]?.trim() ?? null;
    enriched.push({ ...m, cin, legal_name_from_lei: legalName });
  } catch (e) {
    errors.push({ ...m, error: e.message });
  }
  if (i < matches.length - 1) await new Promise((r) => setTimeout(r, DELAY_MS));
}
process.stdout.write('\n');

const withCin = enriched.filter((e) => e.cin);
console.log(`      detail pages fetched: ${enriched.length}`);
console.log(`      CIN extracted       : ${withCin.length}`);
console.log(`      errors              : ${errors.length}\n`);

// ── 6. Apply updates in one transaction ─────────────────────────────────────
console.log('[5/5] Writing CIN updates to DB…');
await c.query('BEGIN');
let updated = 0;
for (const e of withCin) {
  const res = await c.query(
    `update recyclers set cin = $1, updated_at = now() where recycler_code = $2 and cin is null`,
    [e.cin, e.recycler_code],
  );
  updated += res.rowCount;
}
await c.query('COMMIT');
console.log(`      rows updated: ${updated}\n`);

// ── 7. Persist report for auditing ──────────────────────────────────────────
fs.writeFileSync('.buddy/lei-enrichment-results.json', JSON.stringify({
  ran_at: new Date().toISOString(),
  candidates: candidates.length,
  matched: matches.length,
  detail_fetched: enriched.length,
  cin_extracted: withCin.length,
  rows_updated: updated,
  enriched,
  misses: misses.map((m) => ({ recycler_code: m.recycler_code, company_name: m.company_name })),
  errors,
}, null, 2));
console.log('Report saved to .buddy/lei-enrichment-results.json');

await c.end();
