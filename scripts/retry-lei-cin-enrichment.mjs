// Retry the LEI detail-page fetches that hit HTTP 403 in the first pass.
// Reads .buddy/lei-enrichment-results.json from the earlier run, targets
// only rows still without a CIN, and uses conservative pacing so indialei.in
// doesn't block us again.
//
// Pacing:
//   - base delay 5 s, plus 0–2 s random jitter
//   - 30 s pause every 25 requests
//   - bail out after 8 consecutive 403s (block still active — try later)

import fs from 'fs';
import pg from 'pg';

const { SUPABASE_DB_HOST, SUPABASE_DB_PASSWORD } = process.env;
if (!SUPABASE_DB_HOST || !SUPABASE_DB_PASSWORD) {
  console.error('Missing SUPABASE_DB_HOST or SUPABASE_DB_PASSWORD in env.');
  process.exit(1);
}

const REPORT_PATH = '.buddy/lei-enrichment-results.json';
const OUT_PATH    = '.buddy/lei-enrichment-retry.json';
const CIN_REGEX   = /[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}/;

const BASE_DELAY_MS   = 5_000;
const JITTER_MS       = 2_000;
const BATCH_SIZE      = 25;
const BATCH_PAUSE_MS  = 30_000;
const BAIL_ON_403_RUN = 8;

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
];
const pickUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
const jitter = () => BASE_DELAY_MS + Math.floor(Math.random() * JITTER_MS);

// ── Load targets from previous run ──────────────────────────────────────────
if (!fs.existsSync(REPORT_PATH)) {
  console.error(`Missing ${REPORT_PATH}. Run scripts/enrich-cin-via-lei-sitemap.mjs first.`);
  process.exit(1);
}
const prev = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
const targets = (prev.errors ?? []).filter((e) => e.status === 403 || !e.status);
console.log(`Loaded ${targets.length} retry targets from ${REPORT_PATH}\n`);

if (targets.length === 0) {
  console.log('(nothing to retry — prior run left no 403 errors)');
  process.exit(0);
}

// ── Filter out any that have since gained a CIN (belt + braces) ─────────────
const c = new pg.Client({
  host: SUPABASE_DB_HOST, port: 5432, user: 'postgres',
  password: SUPABASE_DB_PASSWORD, database: 'postgres',
  ssl: { rejectUnauthorized: false },
});
await c.connect();

const codes = targets.map((t) => t.recycler_code);
const { rows: stillNeed } = await c.query(
  `select recycler_code from recyclers where recycler_code = any($1) and cin is null`,
  [codes],
);
const needSet = new Set(stillNeed.map((r) => r.recycler_code));
const toFetch = targets.filter((t) => needSet.has(t.recycler_code));
console.log(`After skipping already-enriched: ${toFetch.length} to fetch\n`);

// ── Fetch loop with batch pauses ────────────────────────────────────────────
const enriched = [];
const errors = [];
let consecutive403 = 0;
let bailedEarly = false;

for (let i = 0; i < toFetch.length; i++) {
  const m = toFetch[i];
  const tag = `[${String(i + 1).padStart(3)}/${toFetch.length}]`;
  process.stdout.write(`${tag} ${m.company_name.slice(0, 45).padEnd(45)} …`);

  try {
    const res = await fetch(m.url, {
      headers: {
        'User-Agent': pickUA(),
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });
    if (res.status === 403) {
      consecutive403++;
      errors.push({ ...m, status: 403 });
      process.stdout.write(` 403${consecutive403 >= 3 ? ` (run ${consecutive403})` : ''}\n`);
      if (consecutive403 >= BAIL_ON_403_RUN) {
        console.log(`\n⚠ Hit ${BAIL_ON_403_RUN} consecutive 403s — bailing. Retry this script later.`);
        bailedEarly = true;
        break;
      }
    } else if (!res.ok) {
      consecutive403 = 0;
      errors.push({ ...m, status: res.status });
      process.stdout.write(` HTTP ${res.status}\n`);
    } else {
      consecutive403 = 0;
      const html = await res.text();
      const cin = html.match(CIN_REGEX)?.[0] ?? null;
      enriched.push({ ...m, cin });
      process.stdout.write(` ${cin ?? '(no CIN in page)'}\n`);
    }
  } catch (e) {
    errors.push({ ...m, error: e.message });
    process.stdout.write(` ${e.message}\n`);
  }

  // Pacing
  if (i < toFetch.length - 1) {
    if ((i + 1) % BATCH_SIZE === 0) {
      console.log(`  … batch pause ${BATCH_PAUSE_MS / 1000}s …`);
      await new Promise((r) => setTimeout(r, BATCH_PAUSE_MS));
    } else {
      await new Promise((r) => setTimeout(r, jitter()));
    }
  }
}

// ── Persist CIN updates ─────────────────────────────────────────────────────
const withCin = enriched.filter((e) => e.cin);
console.log(`\nFetched: ${enriched.length}  ·  CIN extracted: ${withCin.length}  ·  Errors: ${errors.length}`);

if (withCin.length) {
  await c.query('BEGIN');
  let updated = 0;
  for (const e of withCin) {
    const r = await c.query(
      `update recyclers set cin = $1, updated_at = now() where recycler_code = $2 and cin is null`,
      [e.cin, e.recycler_code],
    );
    updated += r.rowCount;
  }
  await c.query('COMMIT');
  console.log(`DB rows updated: ${updated}`);
}

fs.writeFileSync(OUT_PATH, JSON.stringify({
  ran_at: new Date().toISOString(),
  targets: toFetch.length,
  enriched: enriched.length,
  cin_extracted: withCin.length,
  bailed_early: bailedEarly,
  cin_rows: withCin,
  errors,
}, null, 2));
console.log(`Report: ${OUT_PATH}`);

await c.end();
