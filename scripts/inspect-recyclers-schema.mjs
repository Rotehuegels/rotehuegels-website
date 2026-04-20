#!/usr/bin/env node
// Inspect the recyclers table schema and dump all company_name values.
// Run: node --env-file=.env.local scripts/inspect-recyclers-schema.mjs
import pg from 'pg';
import { writeFileSync } from 'node:fs';

const host = process.env.SUPABASE_DB_HOST;
const password = process.env.SUPABASE_DB_PASSWORD;
if (!host || !password) { console.error('Missing env'); process.exit(1); }

const m = host.match(/^db\.([a-z0-9]+)\.supabase\.co$/);
const ref = m[1];
const regions = (process.env.SUPABASE_REGION ? [process.env.SUPABASE_REGION] : ['ap-south-1', 'us-east-1', 'ap-southeast-1', 'eu-west-1']);

async function tryConnect(region) {
  const c = new pg.Client({
    host: `aws-0-${region}.pooler.supabase.com`, port: 5432, database: 'postgres',
    user: `postgres.${ref}`, password, ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8_000, statement_timeout: 120_000,
  });
  await c.connect();
  return c;
}

let client = null;
try {
  process.stdout.write(`→ trying direct ${host} … `);
  const c = new pg.Client({ host, port: 5432, database: 'postgres', user: 'postgres', password, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8_000 });
  await c.connect(); client = c; console.log('connected');
} catch (e) { console.log(e.code || e.message); }
if (!client) {
  for (const r of regions) {
    try { process.stdout.write(`→ pooler ${r} … `); client = await tryConnect(r); console.log('connected'); break; }
    catch (e) { console.log(e.code || e.message); }
  }
}
if (!client) { console.error('no DB'); process.exit(1); }

const cols = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='recyclers' ORDER BY ordinal_position`);
console.log('\n=== recyclers columns ===');
for (const c of cols.rows) console.log(`  ${c.column_name}: ${c.data_type}`);

const rows = await client.query(`SELECT id, company_name, state, city, waste_type, facility_type, cpcb_registration, spcb_registration, unit_name FROM recyclers`);
console.log(`\n=== ${rows.rows.length} rows ===`);
writeFileSync('/Users/sivakumar/Projects/rotehuegels-website/.buddy/recyclers-dump.json', JSON.stringify(rows.rows, null, 2));
console.log('→ wrote .buddy/recyclers-dump.json');

await client.end();
