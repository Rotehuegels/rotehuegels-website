import fs from 'fs';
import pg from 'pg';

const { SUPABASE_DB_HOST, SUPABASE_DB_PASSWORD } = process.env;
if (!SUPABASE_DB_HOST || !SUPABASE_DB_PASSWORD) {
  console.error('Missing SUPABASE_DB_HOST or SUPABASE_DB_PASSWORD in env.');
  process.exit(1);
}

const c = new pg.Client({
  host: SUPABASE_DB_HOST, port: 5432, user: 'postgres',
  password: SUPABASE_DB_PASSWORD, database: 'postgres',
  ssl: { rejectUnauthorized: false },
});
await c.connect();

const sql = fs.readFileSync(
  new URL('../supabase/migrations/20260424300000_facility_code_phase1.sql', import.meta.url),
  'utf8',
);
await c.query(sql);
console.log('Migration applied.\n');

// ── Verification ────────────────────────────────────────────────────────────
const totals = await c.query(`
  select
    count(*)                                               as total,
    count(*) filter (where primary_category is not null)   as with_category,
    count(*) filter (where facility_code is not null)      as with_facility_code,
    count(*) filter (where facility_code is null and state_code_2(state) is null) as missing_state_code,
    count(distinct facility_code) filter (where facility_code is not null) as distinct_facility_codes
  from recyclers
`);
const t = totals.rows[0];
console.log('Totals:');
console.log('  total rows              :', t.total);
console.log('  with primary_category   :', t.with_category);
console.log('  with facility_code      :', t.with_facility_code);
console.log('  distinct facility_codes :', t.distinct_facility_codes);
console.log('  missing (no state match):', t.missing_state_code);

const byCat = await c.query(`
  select primary_category, count(*) as rows,
         count(*) filter (where facility_code is not null) as coded,
         count(distinct state_code_2(state)) filter (where facility_code is not null) as states_covered
  from recyclers
  group by 1 order by 2 desc
`);
console.log('\nBy primary_category:');
console.log('  category'.padEnd(12) + 'rows'.padEnd(8) + 'coded'.padEnd(8) + 'states');
byCat.rows.forEach(r =>
  console.log(
    '  ' + (r.primary_category ?? '(null)').padEnd(10) +
    String(r.rows).padEnd(8) + String(r.coded).padEnd(8) + r.states_covered,
  ),
);

console.log('\nSample rows:');
const sample = await c.query(`
  select recycler_code, facility_code, primary_category, state, company_name
  from recyclers
  where facility_code is not null
  order by random() limit 6
`);
sample.rows.forEach(r =>
  console.log('  ' + r.facility_code.padEnd(18) + ' (was ' + r.recycler_code.padEnd(16) + ')  ' + r.company_name.slice(0, 45)),
);

// Sanity: check our known rebranded row shows up with expected code
const ksm = await c.query(
  `select facility_code, primary_category, state, company_name from recyclers where recycler_code = 'MRAI-TN-007'`,
);
console.log('\nKSM Greenmet spot-check:');
console.log('  ' + JSON.stringify(ksm.rows[0]));

await c.end();
