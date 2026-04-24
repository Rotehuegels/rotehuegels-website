#!/usr/bin/env node
/**
 * Phase 2: validate staged GSTIN candidates via gstincheck.co.in.
 *
 * For each row in recycler_gstin_candidates where validated=false:
 *  1. Call gstincheck API, decrement app_settings credit counter.
 *  2. Persist the FULL raw JSON response on recyclers.raw_gst_data per
 *     policy — every paid call stores the entire response, not a subset.
 *  3. Set gstin_fetched_at, gstin_validation_status, extracted scalar
 *     fields where present.
 *  4. If legal_name plausibly matches recyclers.company_name AND the
 *     state prefix matches, promote candidate_gstin → recyclers.gstin.
 *  5. Mark candidate row as validated with result tag.
 *
 * CLI:
 *   --limit N      process only first N pending candidates (default: all)
 *   --dry-run      don't call API or write to DB
 *
 * Run: node --env-file=.env.local scripts/validate-gstin-candidates.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { getGstinData } from '../lib/gstin/gateway.mjs';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_KEY  = process.env.GSTINCHECK_API_KEY;
if (!SUPA_URL || !SUPA_KEY || !API_KEY) {
  console.error('Missing env (SUPABASE_URL / SERVICE_ROLE_KEY / GSTINCHECK_API_KEY)');
  process.exit(1);
}
const sb = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } });

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const LIMIT = parseInt(flag('--limit', '0'), 10);
const DRY = args.includes('--dry-run');

const STATE_CODE_FROM_STATE = {
  'Jammu & Kashmir':'01','Himachal Pradesh':'02','Punjab':'03','Chandigarh':'04',
  'Uttarakhand':'05','Haryana':'06','Delhi':'07','Rajasthan':'08',
  'Uttar Pradesh':'09','Bihar':'10','Sikkim':'11','Arunachal Pradesh':'12',
  'Nagaland':'13','Manipur':'14','Mizoram':'15','Tripura':'16',
  'Meghalaya':'17','Assam':'18','West Bengal':'19','Jharkhand':'20',
  'Odisha':'21','Chhattisgarh':'22','Madhya Pradesh':'23','Gujarat':'24',
  'Dadra & Nagar Haveli':'26','Daman & Diu':'26','Maharashtra':'27',
  'Karnataka':'29','Goa':'30','Lakshadweep':'31','Kerala':'32',
  'Tamil Nadu':'33','Puducherry':'34','Andaman & Nicobar Islands':'35',
  'Telangana':'36','Andhra Pradesh':'37','Ladakh':'38',
};

// All vendor traffic goes through lib/gstin/gateway.mjs, which enforces
// cache-first reads and atomic persist+credit-increment on misses. We never
// call gstincheck.co.in directly from this script.

function nameMatches(legalName, companyName) {
  const norm = (s) => String(s ?? '').toLowerCase()
    .replace(/\b(pvt|private|ltd|limited|p\.?\s*ltd|\(p\)|llp|inc|corp|company|co)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ').filter(w => w.length >= 3);
  const a = new Set(norm(legalName));
  const b = new Set(norm(companyName));
  if (!a.size || !b.size) return false;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const score = inter / Math.min(a.size, b.size);
  return score >= 0.5;
}

async function getCredits() {
  const { data } = await sb.from('app_settings').select('key, value').like('key', 'gstin_credits_%');
  const m = Object.fromEntries((data ?? []).map(s => [s.key, s.value]));
  return {
    total:  Number(m.gstin_credits_total  ?? 0),
    used:   Number(m.gstin_credits_used   ?? 0),
    expiry: m.gstin_credits_expiry ?? null,
  };
}
// Credit counter is owned by persist_gstin_lookup RPC (called inside the
// gateway). No manual bumping here.

async function main() {
  const c0 = await getCredits();
  console.log(`Credits: ${c0.used}/${c0.total} used · expires ${c0.expiry} · ${c0.total - c0.used} remaining`);

  // Fetch pending candidates with their recycler, top state-prefix-match first
  const { data: pending, error } = await sb.from('recycler_gstin_candidates')
    .select('id, recycler_id, candidate_gstin, source, source_url, source_context, state_prefix_match, recyclers ( id, recycler_code, company_name, state, gstin )')
    .eq('validated', false)
    .order('state_prefix_match', { ascending: false });
  if (error) { console.error(error.message); process.exit(1); }

  let todo = pending ?? [];
  if (LIMIT) todo = todo.slice(0, LIMIT);
  console.log(`Pending candidates: ${todo.length}${DRY ? ' (DRY RUN)' : ''}\n`);

  const budget = c0.total - c0.used;
  if (!DRY && todo.length > budget) {
    console.warn(`⚠ Only ${budget} credits remain — will stop early.`);
    todo = todo.slice(0, budget);
  }

  let promoted = 0, mismatched = 0, invalid = 0, failed = 0;
  for (let i = 0; i < todo.length; i++) {
    const c = todo[i];
    const r = c.recyclers;
    const prefix = `[${i + 1}/${todo.length}] ${r.recycler_code.padEnd(14)} ${c.candidate_gstin}`;
    if (r.gstin && r.gstin === c.candidate_gstin) {
      console.log(`${prefix} · already-set — skipping`);
      if (!DRY) await sb.from('recycler_gstin_candidates').update({ validated: true, validation_result: 'already_set', validated_at: new Date().toISOString() }).eq('id', c.id);
      continue;
    }

    if (DRY) { console.log(`${prefix} · would-call-gateway`); continue; }

    let gateResult;
    try { gateResult = await getGstinData(sb, c.candidate_gstin); }
    catch (e) {
      // Vendor said flag=false (GSTIN invalid) OR network/persist error. The
      // gateway throws with err.vendorInvalid=true when the vendor rejected
      // the GSTIN itself — record that outcome on both the recycler and the
      // candidate. Network/persist errors are transient; skip without marking.
      if (e.vendorInvalid) {
        console.log(`${prefix} · ✗ invalid: ${e.message}`);
        invalid++;
        const nowIso = new Date().toISOString();
        await sb.from('recycler_gstin_candidates').update({
          validated: true, validation_result: 'invalid', validated_at: nowIso,
        }).eq('id', c.id);
      } else {
        console.log(`${prefix} · ✗ gateway error (will retry later): ${e.message}`);
        failed++;
      }
      continue;
    }

    const { source, raw: json, fetched_at } = gateResult;
    const nowIso = fetched_at || new Date().toISOString();
    const cacheTag = source === 'cache' ? ' [cache]' : '';

    const d = json.data;
    const legal_name = String(d.lgnm ?? d.legal_name ?? '').trim();
    const trade_name = String(d.tradeNam ?? d.trade_name ?? '').trim();
    const stateFromResponse = String(d.pradr?.addr?.stcd ?? d.pradr?.adr?.stcd ?? d.state ?? '').trim();
    const regDate   = String(d.rgdt ?? d.reg_date ?? '').trim();
    const statusStr = String(d.sts ?? d.status ?? '').trim();

    const expectedPrefix = STATE_CODE_FROM_STATE[r.state];
    const stateMatch = !expectedPrefix || c.candidate_gstin.startsWith(expectedPrefix);
    const nameMatch = nameMatches(legal_name, r.company_name) || nameMatches(trade_name, r.company_name);

    // Raw response lives in gstin_lookup_cache (written by the gateway).
    // On the recyclers row we only record the pointer + validation outcome.
    let result = 'name_mismatch';
    const updRecycler = { gstin_fetched_at: nowIso };

    if (nameMatch && stateMatch) {
      result = 'verified';
      updRecycler.gstin = c.candidate_gstin;
      updRecycler.gstin_validation_status = 'verified';
      promoted++;
      console.log(`${prefix} · ✓ verified${cacheTag} → ${r.company_name.slice(0, 40)} (${legal_name})`);
    } else {
      updRecycler.gstin_validation_status = nameMatch ? 'state_mismatch' : 'name_mismatch';
      result = nameMatch ? 'state_mismatch' : 'name_mismatch';
      mismatched++;
      console.log(`${prefix} · ⚠ ${result}${cacheTag}: got "${legal_name}" vs "${r.company_name.slice(0, 40)}"`);
    }

    await sb.from('recyclers').update(updRecycler).eq('id', r.id);
    await sb.from('recycler_gstin_candidates').update({
      validated: true, validation_result: result, validated_at: nowIso,
    }).eq('id', c.id);
  }

  const c1 = await getCredits();
  console.log(`\n=== DONE ===`);
  console.log(`promoted to gstin:  ${promoted}`);
  console.log(`name_mismatch:      ${mismatched}`);
  console.log(`invalid gstin:      ${invalid}`);
  console.log(`network failures:   ${failed}`);
  console.log(`credits: ${c1.used}/${c1.total} used · ${c1.total - c1.used} remaining`);
}

main().catch(e => { console.error(e); process.exit(1); });
