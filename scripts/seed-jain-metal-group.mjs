#!/usr/bin/env node
/**
 * Seed the Jain Metal Group org tree and link the existing TN recycler
 * rows (METAL-TN-001, METAL-TN-002) into it.
 *
 * Requires the companies-table migration (20260421700000) to be applied.
 *
 * Run: node --env-file=.env.local scripts/seed-jain-metal-group.mjs
 */
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function upsertCompany(row) {
  const { data: existing } = await sb.from('companies').select('id').eq('slug', row.slug).maybeSingle();
  if (existing) {
    const { error } = await sb.from('companies').update(row).eq('id', existing.id);
    if (error) throw new Error(error.message);
    return existing.id;
  }
  const { data, error } = await sb.from('companies').insert(row).select('id').single();
  if (error) throw new Error(error.message);
  return data.id;
}

async function linkRecycler(code, companyId, unitName) {
  const { data: r } = await sb.from('recyclers').select('id, recycler_code, company_name').eq('recycler_code', code).maybeSingle();
  if (!r) { console.log(`  ! ${code} — not found, skipping`); return; }
  const { error } = await sb.from('recyclers').update({ company_id: companyId, unit_name: unitName }).eq('id', r.id);
  if (error) { console.log(`  ✗ ${code} — ${error.message}`); return; }
  console.log(`  ✓ ${code} → company_id set, unit_name="${unitName}"`);
}

const KILPAUK = 'The Lattice, 4th Floor, Old No. 7/1, New No. 20, Bishop Ezra Sarugunam Road, Kilpauk, Chennai – 600010, Tamil Nadu, India';

// 1. Group holding (parent)
const jmgId = await upsertCompany({
  slug: 'jain-metal-group',
  legal_name: 'Jain Metal Group',
  trade_name: 'Jain Metal Group',
  parent_company_id: null,
  is_group_holding: true,
  website: 'https://www.jainmetalgroup.com',
  registered_address: KILPAUK,
  registered_state: 'Tamil Nadu',
  description: 'Non-ferrous metals and plastics recycling group — copper, lead, aluminium, plastics. Authorised recycling capacity 3,08,306 MTPA across three facilities.',
});
console.log(`Group holding: ${jmgId} (Jain Metal Group)`);

// 2. Subsidiaries
const jrrlId = await upsertCompany({
  slug: 'jain-resource-recycling-ltd',
  legal_name: 'Jain Resource Recycling Limited',
  trade_name: null,
  parent_company_id: jmgId,
  is_group_holding: false,
  cin: 'U27320TN2022PLC150206',
  gstin: '33AAFCJ5145B1Z1',
  website: 'https://www.jainmetalgroup.com',
  registered_address: KILPAUK,
  registered_state: 'Tamil Nadu',
  description: 'Copper + lead recycling arm — Facility 1 (copper cable) and Facility 2 (refined lead ingots).',
});
console.log(`Subsidiary:    ${jrrlId} (Jain Resource Recycling Ltd)`);

const jrplId = await upsertCompany({
  slug: 'jain-recycling-pvt-ltd',
  legal_name: 'Jain Recycling Private Limited',
  trade_name: null,
  parent_company_id: jmgId,
  is_group_holding: false,
  cin: 'U27200TN2020PTC133771',
  website: 'https://www.jainmetalgroup.com',
  registered_address: KILPAUK,
  registered_state: 'Tamil Nadu',
  description: 'Plastics arm of Jain Metal Group — PP granules and plastic recycling.',
});
console.log(`Subsidiary:    ${jrplId} (Jain Recycling Pvt Ltd)`);

const jgtId = await upsertCompany({
  slug: 'jain-green-technologies-pvt-ltd',
  legal_name: 'Jain Green Technologies Pvt Ltd',
  trade_name: null,
  parent_company_id: jmgId,
  is_group_holding: false,
  website: 'https://www.jainmetalgroup.com',
  registered_address: KILPAUK,
  registered_state: 'Tamil Nadu',
  description: 'Aluminium division — aluminium alloys for die-casters and primary alloys (Facility 3).',
});
console.log(`Subsidiary:    ${jgtId} (Jain Green Technologies)`);

// 3. Link recycler rows to their companies
console.log('\nLinking facilities:');
await linkRecycler('METAL-TN-001', jrrlId, 'Facility 1 — Copper + Lead');
await linkRecycler('METAL-TN-002', jrplId, 'Plastics Unit');

console.log('\nDone. The profile pages for linked facilities will now render the group structure.');
