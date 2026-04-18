#!/usr/bin/env node
/**
 * Diagnostics for recycler GSTIN enrichment progress.
 * Run: node --env-file=.env.local scripts/count-recyclers.mjs
 */
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const head = { count: 'exact', head: true };
const queries = [
  ['Total recyclers',         sb.from('recyclers').select('*', head)],
  ['Active',                  sb.from('recyclers').select('*', head).eq('is_active', true)],
  ['With GSTIN',              sb.from('recyclers').select('*', head).not('gstin', 'is', null)],
  ['With website',            sb.from('recyclers').select('*', head).not('website', 'is', null)],
  ['With CIN',                sb.from('recyclers').select('*', head).not('cin', 'is', null)],
  ['Missing GSTIN +website',  sb.from('recyclers').select('*', head).is('gstin', null).not('website', 'is', null)],
  ['Missing GSTIN, no site',  sb.from('recyclers').select('*', head).is('gstin', null).is('website', null)],
  ['Candidates (total)',      sb.from('recycler_gstin_candidates').select('*', head)],
  ['Candidates (validated)',  sb.from('recycler_gstin_candidates').select('*', head).eq('validated', true)],
  ['Candidates (pending)',    sb.from('recycler_gstin_candidates').select('*', head).eq('validated', false)],
];

const results = await Promise.all(queries.map(([, q]) => q));
queries.forEach(([label], i) => console.log(`${label.padEnd(24)}: ${results[i].count}`));

const { data: settings } = await sb.from('app_settings').select('key, value').like('key', 'gstin_credits_%');
console.log('\nCredit tracker:');
(settings ?? []).forEach(s => console.log(`  ${s.key.padEnd(30)} = ${s.value}`));
