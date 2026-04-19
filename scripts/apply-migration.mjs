#!/usr/bin/env node
/**
 * Apply a SQL migration file to the Supabase Postgres DB.
 * Uses SUPABASE_DB_HOST + SUPABASE_DB_PASSWORD from .env.local.
 *
 * Run: node --env-file=.env.local scripts/apply-migration.mjs <migration-file>
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';

const file = process.argv[2];
if (!file) { console.error('Usage: apply-migration.mjs <path>'); process.exit(1); }

const host = process.env.SUPABASE_DB_HOST;
const password = process.env.SUPABASE_DB_PASSWORD;
if (!host || !password) { console.error('Missing SUPABASE_DB_HOST / SUPABASE_DB_PASSWORD'); process.exit(1); }

// Supabase direct connections are now IPv6-only. Use the session-mode
// pooler which serves IPv4. Host: aws-0-<region>.pooler.supabase.com:5432
// User: postgres.<project-ref>. We try a few regions in likely order.
const m = host.match(/^db\.([a-z0-9]+)\.supabase\.co$/);
if (!m) { console.error(`Unexpected SUPABASE_DB_HOST: ${host}`); process.exit(1); }
const ref = m[1];
const regions = (process.env.SUPABASE_REGION
  ? [process.env.SUPABASE_REGION]
  : ['ap-south-1', 'us-east-1', 'ap-southeast-1', 'eu-west-1', 'us-west-1', 'ap-northeast-1']);

const sql = readFileSync(resolve(file), 'utf-8');

async function tryConnect(region) {
  const cfg = {
    host: `aws-0-${region}.pooler.supabase.com`,
    port: 5432, // session mode (transactional = 6543 rejects DDL)
    database: 'postgres',
    user: `postgres.${ref}`,
    password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8_000,
    statement_timeout: 120_000,
  };
  const c = new pg.Client(cfg);
  await c.connect();
  return c;
}

let client = null;
// First try direct connection (IPv6)
try {
  process.stdout.write(`→ trying direct ${host} … `);
  const c = new pg.Client({
    host, port: 5432, database: 'postgres', user: 'postgres', password,
    ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 12_000,
  });
  await c.connect();
  client = c;
  console.log('connected');
} catch (e) {
  console.log(`${e.code || e.message}`);
}
if (!client) {
  for (const r of regions) {
    try {
      process.stdout.write(`→ trying pooler ${r} … `);
      client = await tryConnect(r);
      console.log('connected');
      break;
    } catch (e) {
      console.log(`${e.code || e.message} — ${(e.message || '').slice(0, 120)}`);
    }
  }
}
if (!client) { console.error('✗ no route to DB'); process.exit(1); }

try {
  await client.connect();
  console.log(`→ applying ${file}`);
  await client.query('BEGIN');
  await client.query(sql);
  await client.query('COMMIT');
  console.log('✓ applied successfully');
} catch (e) {
  await client.query('ROLLBACK').catch(() => {});
  console.error('✗ failed:', e.message);
  process.exit(1);
} finally {
  await client.end();
}
