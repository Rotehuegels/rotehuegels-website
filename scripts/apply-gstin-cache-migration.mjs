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
  new URL('../supabase/migrations/20260424200000_gstin_cache.sql', import.meta.url),
  'utf8',
);
await c.query(sql);
console.log('Migration applied.\n');

// Post-migration checks
const cache = await c.query('select count(*) as n, count(*) filter (where raw_response is not null) as with_raw from gstin_lookup_cache');
console.log(`gstin_lookup_cache: ${cache.rows[0].n} rows (${cache.rows[0].with_raw} with raw_response)`);

const fns = await c.query(`select proname from pg_proc where proname in ('persist_gstin_lookup','bump_gstin_cache_hit') order by proname`);
console.log('Functions installed:', fns.rows.map(r => r.proname).join(', '));

const credits = await c.query("select key, value from app_settings where key like 'gstin_credits%' order by key");
console.log('\napp_settings (post-migration):');
credits.rows.forEach(r => console.log('  ' + r.key.padEnd(30) + ' = ' + r.value));

await c.end();
