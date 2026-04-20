#!/usr/bin/env node
import pg from 'pg';

const host = process.env.SUPABASE_DB_HOST;
const password = process.env.SUPABASE_DB_PASSWORD;

const m = host.match(/^db\.([a-z0-9]+)\.supabase\.co$/);
const ref = m[1];

const regions = ['ap-south-1','us-east-1','ap-southeast-1','eu-west-1'];
let c = null;

try {
  const d = new pg.Client({ host, port: 5432, database: 'postgres', user: 'postgres', password, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
  await d.connect();
  c = d;
  console.log('# connected direct');
} catch (e) {
  console.log('# direct fail:', e.code || e.message);
}

if (!c) {
  for (const r of regions) {
    try {
      const p = new pg.Client({ host: `aws-0-${r}.pooler.supabase.com`, port: 5432, database: 'postgres', user: `postgres.${ref}`, password, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
      await p.connect();
      c = p;
      console.log('# connected pooler', r);
      break;
    } catch (e) {
      console.log('# pooler', r, 'fail:', e.code || e.message);
    }
  }
}
if (!c) { console.log('# no route'); process.exit(1); }

const r = await c.query(`
  SELECT recycler_code, company_name,
         gstin IS NOT NULL AS f_gstin,
         cin IS NOT NULL AS f_cin,
         pincode IS NOT NULL AS f_pincode,
         latitude IS NOT NULL AS f_gps,
         capacity_per_month IS NOT NULL AS f_cap,
         capabilities IS NOT NULL AS f_capab,
         license_valid_until IS NOT NULL AS f_lic,
         unit_name IS NOT NULL AS f_unit
  FROM recyclers
  WHERE recycler_code LIKE 'LKDN-%'
  ORDER BY recycler_code;
`);

for (const row of r.rows) {
  const mark = (b) => b ? '✓' : '–';
  const flags = `${mark(row.f_gstin)}${mark(row.f_cin)}${mark(row.f_pincode)}${mark(row.f_gps)}${mark(row.f_cap)}${mark(row.f_capab)}${mark(row.f_lic)}${mark(row.f_unit)}`;
  const name = String(row.company_name).slice(0, 50).padEnd(50);
  console.log(`${row.recycler_code} | ${flags} | ${name}`);
}

await c.end();
