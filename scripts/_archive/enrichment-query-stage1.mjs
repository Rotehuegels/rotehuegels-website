#!/usr/bin/env node
/**
 * Query Stage-1 candidates: top 300 recyclers needing websites.
 */
import pg from 'pg';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const OUT = '/Users/sivakumar/Projects/rotehuegels-website/.buddy/stage1-candidates.json';

async function connectDB() {
  const host = process.env.SUPABASE_DB_HOST;
  const password = process.env.SUPABASE_DB_PASSWORD;
  const m = host.match(/^db\.([a-z0-9]+)\.supabase\.co$/);
  const ref = m[1];
  const regions = ['ap-south-1','us-east-1','ap-southeast-1','eu-west-1'];
  try {
    const c = new pg.Client({ host, port: 5432, database: 'postgres', user: 'postgres', password, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
    await c.connect(); return c;
  } catch {}
  for (const r of regions) {
    try {
      const c = new pg.Client({ host: `aws-0-${r}.pooler.supabase.com`, port: 5432, database: 'postgres', user: `postgres.${ref}`, password, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
      await c.connect(); return c;
    } catch {}
  }
  throw new Error('No route to DB');
}

const client = await connectDB();
try {
  const q = `
    SELECT id, recycler_code, company_name, city, state, waste_type, facility_type, capacity_per_month, is_verified
    FROM recyclers
    WHERE (website IS NULL OR TRIM(website) = '')
    ORDER BY
      CASE WHEN is_verified THEN 0 ELSE 1 END,
      CASE waste_type
        WHEN 'primary-metal' THEN 0
        WHEN 'battery' THEN 1
        WHEN 'black-mass' THEN 1
        WHEN 'e-waste' THEN 2
        WHEN 'zinc-dross' THEN 2
        ELSE 3
      END,
      CASE WHEN capacity_per_month IS NOT NULL THEN 0 ELSE 1 END,
      company_name
    LIMIT 300
  `;
  const r = await client.query(q);
  console.log(`rows=${r.rows.length}`);

  // counts before
  const preCounts = await client.query(`
    SELECT
      COUNT(*) FILTER (WHERE website IS NOT NULL AND TRIM(website) <> '') AS with_website,
      COUNT(*) FILTER (WHERE email IS NOT NULL AND NOT (email ~* '@(recycler|placeholder)\\.')) AS with_real_email,
      COUNT(*) FILTER (WHERE phone IS NOT NULL AND TRIM(phone) <> '') AS with_phone,
      COUNT(*) AS total
    FROM recyclers
  `);
  console.log('pre counts', preCounts.rows[0]);

  // for pass-1 failures list, fetch website + existing email/phone
  const pass1FailCodes = [
    'jindalaluminium.com', 'gcal.co.in', 'amararaja.com', 'okayapower.com',
    'rajeshindia.com', 'exideenergy.in', 'sonaalloys.com', 'heromotocorp.com',
    'log9materials.com', 'sungeelindia.in', 'racenergy.in', 'hulladek.com',
    'globalcopper.co.in',
  ];
  const pass1 = await client.query(`
    SELECT id, recycler_code, company_name, website, email, phone
    FROM recyclers
    WHERE regexp_replace(COALESCE(website,''), '^https?://(www\\.)?', '') ILIKE ANY($1::text[])
       OR website ILIKE ANY($2::text[])
  `, [
    pass1FailCodes.map(d => `${d}%`),
    pass1FailCodes.map(d => `%${d}%`),
  ]);
  console.log(`pass1 failures found in DB: ${pass1.rows.length}`);

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify({
    stage1: r.rows,
    preCounts: preCounts.rows[0],
    pass1Failures: pass1.rows,
  }, null, 2));
  console.log(`wrote ${OUT}`);
} finally {
  await client.end();
}
