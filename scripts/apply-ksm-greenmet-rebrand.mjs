import fs from 'fs';
import pg from 'pg';

const { SUPABASE_DB_HOST, SUPABASE_DB_PASSWORD } = process.env;
if (!SUPABASE_DB_HOST || !SUPABASE_DB_PASSWORD) {
  console.error('Missing SUPABASE_DB_HOST or SUPABASE_DB_PASSWORD in env.');
  process.exit(1);
}

const client = new pg.Client({
  host: SUPABASE_DB_HOST,
  port: 5432,
  user: 'postgres',
  password: SUPABASE_DB_PASSWORD,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const before = await client.query(
  'select recycler_code, company_name, cin, phone, city, state, website from recyclers where recycler_code = $1',
  ['MRAI-TN-007'],
);
console.log('BEFORE:', before.rows[0] ?? '(no row)');

if (before.rows.length === 0) {
  console.error('Row MRAI-TN-007 not found. Aborting.');
  process.exit(2);
}

const sql = fs.readFileSync(
  new URL('../supabase/migrations/20260424100000_ksm_greenmet_rebrand.sql', import.meta.url),
  'utf8',
);
await client.query(sql);

const after = await client.query(
  'select recycler_code, company_name, cin, phone, city, state, website, substring(notes for 180) as notes_preview from recyclers where recycler_code = $1',
  ['MRAI-TN-007'],
);
console.log('AFTER :', after.rows[0]);

await client.end();
