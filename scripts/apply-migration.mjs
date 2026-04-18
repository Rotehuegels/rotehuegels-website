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

const sql = readFileSync(resolve(file), 'utf-8');
const client = new pg.Client({
  host, port: 5432, database: 'postgres', user: 'postgres', password,
  ssl: { rejectUnauthorized: false },
});

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
