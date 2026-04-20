#!/usr/bin/env node
import pg from 'pg';

const host = process.env.SUPABASE_DB_HOST;
const password = process.env.SUPABASE_DB_PASSWORD;
const m = host.match(/^db\.([a-z0-9]+)\.supabase\.co$/);
const ref = m[1];

const regions = ['ap-south-1','us-east-1','ap-southeast-1','eu-west-1','us-west-1','ap-northeast-1'];

async function tryConnect(region) {
  const cfg = {
    host: `aws-0-${region}.pooler.supabase.com`,
    port: 5432,
    database: 'postgres',
    user: `postgres.${ref}`,
    password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8_000,
  };
  const c = new pg.Client(cfg);
  await c.connect();
  return c;
}

let c = null;
// direct first
try {
  const d = new pg.Client({ host, port: 5432, database: 'postgres', user: 'postgres', password, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
  await d.connect();
  c = d;
  console.error('connected direct');
} catch (e) {
  console.error('direct failed:', e.code || e.message);
}
if (!c) {
  for (const r of regions) {
    try { c = await tryConnect(r); console.error('connected pooler', r); break; }
    catch (e) { console.error('pooler', r, 'failed:', e.code || e.message); }
  }
}
if (!c) { console.error('no route'); process.exit(1); }

const r = await c.query(`
  SELECT recycler_code, company_name, city, state, website, waste_type, facility_type,
         gstin, cin, pincode, address, latitude, longitude,
         capabilities, capacity_per_month, license_valid_until, black_mass_mta, unit_name,
         cpcb_registration
  FROM recyclers
  WHERE recycler_code LIKE 'LKDN-%'
  ORDER BY recycler_code;
`);

for (const row of r.rows) {
  console.log(JSON.stringify(row));
}

await c.end();
