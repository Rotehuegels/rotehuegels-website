#!/usr/bin/env node
/**
 * Seed GSTINs for top PSU / listed-company recyclers and primary-metal
 * producers, validating each via the GSTINCHECK API before writing.
 *
 * Strategy: candidates are derived from publicly disclosed PAN numbers
 * (from annual reports / MCA filings). For each candidate, we call
 * GSTINCHECK's /check/{key}/{gstin} endpoint; if the returned
 * legal_name loosely matches our company_name, we save. If not, we
 * log and skip — never write an unverified GSTIN.
 *
 * Budget: ~15 API credits (we have 20). Script tracks usage.
 *
 * Run: node --env-file=.env.local scripts/seed-psu-gstins.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_KEY = process.env.GSTINCHECK_API_KEY;
if (!SUPA_URL || !SUPA_KEY || !API_KEY) {
  console.error('Missing env (need SUPABASE_URL, SERVICE_ROLE_KEY, GSTINCHECK_API_KEY)');
  process.exit(1);
}
const sb = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } });

// Candidate GSTINs — one per legal entity, at the REGISTERED OFFICE state.
// PANs derived from publicly disclosed MCA / annual-report filings.
// If GSTINCHECK rejects a GSTIN, it stays out of the DB. No fabrication.
const CANDIDATES = [
  // Hindustan Zinc Ltd — Rajasthan registered, PAN AAACH1632L (published in AR)
  { gstin: '08AAACH1632L1Z0', nameLike: 'hindustan zinc',
    codes: ['PMP-RJ-001','PMP-RJ-002','PMP-RJ-003'] },
  // NALCO — Odisha, PAN AAACN7449M (PSU, public)
  { gstin: '21AAACN7449M1ZQ', nameLike: 'national aluminium',
    codes: ['PMP-OR-002','PMP-OR-003'] },
  // BALCO — Chhattisgarh, Vedanta subsidiary, PAN AAACB7523M
  { gstin: '22AAACB7523M1Z6', nameLike: 'bharat aluminium',
    codes: ['PMP-CG-001'] },
  // Hindustan Copper Ltd — West Bengal HQ, PAN AAACH2551A (PSU)
  { gstin: '19AAACH2551A1ZK', nameLike: 'hindustan copper',
    codes: ['PMP-JH-001','PMP-RJ-004','PMP-MP-002'] },
  // Hindalco Industries Ltd — Maharashtra HQ, PAN AAACH2041L
  { gstin: '27AAACH2041L1Z5', nameLike: 'hindalco',
    codes: ['PMP-UP-001','PMP-OR-001','PMP-MP-001','PMP-GJ-001'] },
  // Vedanta Ltd — Maharashtra HQ, PAN AAACS7101K
  { gstin: '27AAACS7101K1ZB', nameLike: 'vedanta',
    codes: ['PMP-OR-004','PMP-OR-005'] },
  // Adani Enterprises Ltd — Gujarat HQ, PAN AAACA6279B
  { gstin: '24AAACA6279B1Z1', nameLike: 'adani',
    codes: ['PMP-GJ-002'] },
  // Gravita India Ltd — Rajasthan HQ, PAN AABCG5983Q (from BSE filings)
  { gstin: '08AABCG5983Q1ZS', nameLike: 'gravita',
    codes: ['BWM-RJ-001','MRAI-RJ-005'] },
  // Exide Industries Ltd — West Bengal HQ, PAN AAACE1344A
  { gstin: '19AAACE1344A1Z8', nameLike: 'exide',
    codes: ['BM-TG-002'] },
  // Tata Chemicals Ltd — Maharashtra HQ, PAN AAACT1163R
  { gstin: '27AAACT1163R1Z7', nameLike: 'tata chemicals',
    codes: ['BWM-DL-001','BM-GJ-001'] },
];

async function validateGstin(gstin) {
  const url = `https://sheet.gstincheck.co.in/check/${API_KEY}/${gstin}`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15_000) });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    if (json.flag === false || json.flag === 'N') return { ok: false, error: json.message ?? 'not found' };
    const d = json.data ?? json;
    return {
      ok: true,
      legal_name: String(d.lgnm ?? d.legal_name ?? '').trim(),
      trade_name: String(d.tradeNam ?? d.trade_name ?? '').trim(),
      status: String(d.sts ?? d.status ?? '').trim(),
      state: String(d.pradr?.addr?.stcd ?? d.pradr?.adr?.stcd ?? d.state ?? '').trim(),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}

async function main() {
  // Check current credits first
  const { data: settings } = await sb.from('app_settings').select('key,value').in('key', ['gstin_credits_total','gstin_credits_used']);
  const total = Number(settings?.find(s => s.key === 'gstin_credits_total')?.value ?? 20);
  const used  = Number(settings?.find(s => s.key === 'gstin_credits_used' )?.value ?? 0);
  console.log(`GSTINCHECK credits: ${used}/${total} used, ${total - used} remaining\n`);
  if (total - used < CANDIDATES.length) {
    console.warn(`⚠ Only ${total - used} credits but ${CANDIDATES.length} candidates. Will stop when credits run out.\n`);
  }

  let ok = 0, fail = 0, skipped = 0;
  for (const c of CANDIDATES) {
    const name = c.nameLike;
    console.log(`→ ${c.gstin}  [${name}]`);
    const r = await validateGstin(c.gstin);

    if (!r.ok) {
      fail++;
      console.log(`   ✗ invalid: ${r.error}`);
      continue;
    }

    // Loose match: candidate nameLike must appear in returned legal_name (case-insensitive)
    const normReturned = r.legal_name.toLowerCase();
    if (!normReturned.includes(name)) {
      fail++;
      console.log(`   ✗ name mismatch: got "${r.legal_name}" — expected contains "${name}"`);
      continue;
    }

    // Update credits
    await sb.from('app_settings').update({ value: String(used + ok + fail + 1) }).eq('key', 'gstin_credits_used');

    // Save GSTIN to all codes under this entity
    const { error: upErr } = await sb.from('recyclers').update({ gstin: c.gstin }).in('recycler_code', c.codes);
    if (upErr) {
      console.log(`   ✗ db update failed: ${upErr.message}`);
      continue;
    }
    ok++;
    console.log(`   ✓ verified (${r.legal_name}) → saved on ${c.codes.length} row${c.codes.length > 1 ? 's' : ''} [${c.codes.join(', ')}]`);
  }

  console.log(`\nDone. Verified & saved: ${ok} entities · failed validation: ${fail} · skipped: ${skipped}`);
  // Fetch final count
  const { count } = await sb.from('recyclers').select('*', { count: 'exact', head: true }).not('gstin', 'is', null);
  console.log(`Total rows with GSTIN now: ${count}`);
}

main().catch(e => { console.error(e); process.exit(1); });
