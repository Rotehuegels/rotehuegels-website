#!/usr/bin/env node
/**
 * Unit-level enrichment for the Jain Metal Group.
 *
 * Sources consolidated today:
 *  - jainmetalgroup.com (/about, /contact, /ipo)
 *  - BSE DRHP (JAINREC, Mar 2025)
 *  - NSE transcript (18 Feb 2026)
 *  - ZaubaCorp / Tofler / IndiaFilings (CIN / directors)
 *  - RocketReach / ZoomInfo (roles + emails partially masked)
 *  - businessindia.co corporate report
 *
 * What this does:
 *  - Splits METAL-TN-001 (was "Copper + Lead") into two real units:
 *      · METAL-TN-001: Facility 1 – Copper  @ D-12, SIPCOT Gummidipoondi
 *      · METAL-TN-004 (new): Facility 2 – Lead @ Plot R1-R3 Pappankuppam
 *  - Moves METAL-TN-003 (Aluminium / Jain Green) to the real plant
 *    address at Survey 156/2A1B, Pappankuppam Village, Gummidipoondi.
 *  - Adds a UAE subsidiary: Jain Ikon Global Ventures (FZC) under the
 *    group holding, for gold + silver refining at SAIF-Zone Sharjah.
 *  - Expands the JRRL contacts_all roster with 4 more directors and 4
 *    senior managers (COO, Head of Sales, GM Finance, UAE Director).
 *  - Upgrades Mayank Pareek's title from "Director" to "Joint MD".
 *  - Stores listed-company info (BSE/NSE JAINREC) in JRRL description.
 */
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const TODAY = new Date().toISOString().slice(0, 10);
const S_MCA = 'MCA / ZaubaCorp 2026-04-19';
const S_SITE = 'jainmetalgroup.com';
const S_BSE = 'BSE DRHP Mar 2025';
const S_RR = 'RocketReach team page';

const normEmail = (e) => e?.toLowerCase().trim();
const normPhone = (p) => p?.replace(/\D/g, '').replace(/^91/, '');

function mergeContacts(existing, rows) {
  const out = [...(existing ?? [])];
  const keys = new Set(out.map(c => [normEmail(c.email), normPhone(c.phone), c.name && `${c.name.toLowerCase()}|${c.source}`].filter(Boolean).join('::')));
  let added = 0;
  for (const c of rows) {
    const k = [normEmail(c.email), normPhone(c.phone), c.name && `${c.name.toLowerCase()}|${c.source}`].filter(Boolean).join('::');
    if (!k || keys.has(k)) continue;
    keys.add(k); out.push(c); added++;
  }
  return { merged: out, added };
}

// ── 1. Split METAL-TN-001 into Facility 1 (Copper) vs new Facility 2 (Lead) ──
// First update METAL-TN-001 to be explicitly Facility 1 — Copper.
{
  const address = 'D-12, SIPCOT Industrial Complex, Gummidipoondi, Thiruvallur – 601 201, Tamil Nadu, India';
  const { error } = await sb.from('recyclers').update({
    unit_name: 'Facility 1 — Copper',
    address,
    city: 'Gummidipoondi',
    pincode: '601201',
    notes: 'Cable recycling → copper billets, copper alloys (copper granules/ingots). SIPCOT Gummidipoondi unit, Thiruvallur district. Jain Resource Recycling Ltd is listed on BSE/NSE as JAINREC (IPO Sep 2025).',
  }).eq('recycler_code', 'METAL-TN-001');
  if (error) throw error;
  console.log('✓ METAL-TN-001 updated → Facility 1 Copper @ D-12 SIPCOT Gummidipoondi');
}

// New METAL-TN-004 — Facility 2 (Lead), same legal entity (JRRL)
{
  const { data: jrrl } = await sb.from('companies').select('id').eq('slug', 'jain-resource-recycling-ltd').single();
  const address = 'Plot No. R1 – R3, Pappankuppam Village, SIPCOT Industrial Complex, Gummidipoondi, Thiruvallur – 601 201, Tamil Nadu, India';
  const { data: existing } = await sb.from('recyclers').select('id').eq('recycler_code', 'METAL-TN-004').maybeSingle();
  const payload = {
    recycler_code: 'METAL-TN-004',
    company_name: 'Jain Resource Recycling Limited',
    contact_person: 'Kamlesh Jain (Chairman & MD)',
    email: 'info@jainmetalgroup.com',
    phone: '+91 44 43409494',
    website: 'https://www.jainmetalgroup.com',
    address,
    city: 'Gummidipoondi',
    state: 'Tamil Nadu',
    pincode: '601201',
    waste_type: 'hazardous',
    service_radius_km: 100,
    is_active: true,
    is_verified: true,
    verified_at: new Date().toISOString(),
    notes: 'Flagship unit — refined lead + lead ingots + lead alloys (Facility 2). Pappankuppam Village, SIPCOT Gummidipoondi. Part of Jain Resource Recycling Ltd (JAINREC on BSE/NSE).',
    company_id: jrrl.id,
    unit_name: 'Facility 2 — Lead',
  };
  if (existing) {
    await sb.from('recyclers').update(payload).eq('id', existing.id);
    console.log('✓ METAL-TN-004 updated → Facility 2 Lead @ Pappankuppam SIPCOT');
  } else {
    await sb.from('recyclers').insert(payload);
    console.log('✓ METAL-TN-004 inserted → Facility 2 Lead @ Pappankuppam SIPCOT');
  }
}

// ── 2. Move METAL-TN-003 (Aluminium) to real plant address ────────────
{
  const address = 'Survey Nos. 156/2A1B, 156/2A1A, 156/2C, 156/2B2, 156/2B1, Pappankuppam Village, Gummidipoondi Taluk, Thiruvallur – 601 201, Tamil Nadu, India';
  const { error } = await sb.from('recyclers').update({
    address,
    city: 'Gummidipoondi',
    pincode: '601201',
    notes: 'Aluminium division — primary aluminium alloys + diecasting alloys (Facility 3). Pappankuppam Village, SIPCOT Gummidipoondi. Subsidiary of Jain Metal Group.',
  }).eq('recycler_code', 'METAL-TN-003');
  if (error) throw error;
  console.log('✓ METAL-TN-003 address updated → Pappankuppam Village, Gummidipoondi');
}

// Update JGT company CIN (U28999TN2022PTC149361 from ZaubaCorp) and address
{
  const { error } = await sb.from('companies').update({
    cin: 'U28999TN2022PTC149361',
    registered_address: 'Survey Nos. 156/2A1B, 156/2A1A, 156/2C, 156/2B2, 156/2B1, Pappankuppam Village, Gummidipoondi Taluk, Thiruvallur – 601 201, Tamil Nadu, India',
    description: 'Aluminium recycling subsidiary of Jain Metal Group — primary alloys and diecasting alloys for automotive + electrical.',
  }).eq('slug', 'jain-green-technologies-pvt-ltd');
  if (error) throw error;
  console.log('✓ Jain Green Technologies — CIN + address set');
}

// ── 3. Expand JRRL contacts_all with full leadership roster ────────────
{
  const { data: jrrl } = await sb.from('recyclers').select('id, contacts_all').eq('recycler_code', 'METAL-TN-001').single();
  const newRows = [
    // Board of directors (full)
    { name: 'Kamlesh Jain',            title: 'Chairman & Managing Director',        department: null, email: null, phone: null, source: S_BSE, first_seen: TODAY },
    { name: 'Mayank Pareek',           title: 'Joint Managing Director',             department: null, email: null, phone: null, source: S_BSE, first_seen: TODAY },
    { name: 'Hemant Shantilal Jain',   title: 'Executive Director & CFO',            department: 'Finance', email: null, phone: null, source: S_BSE, first_seen: TODAY },
    { name: 'Sanchit Jain',            title: 'Executive Director & Head of Operations', department: 'Operations', email: null, phone: null, source: S_BSE, first_seen: TODAY },
    { name: 'Hrithik Jain',            title: 'Managing Director (group)',           department: null, email: null, phone: null, source: S_RR, first_seen: TODAY },
    { name: 'Shreyansh Jain',          title: 'Director',                            department: null, email: null, phone: null, source: S_MCA, first_seen: TODAY },
    { name: 'Dr. Kandaswamy Paramasivan', title: 'Independent Director',             department: null, email: null, phone: null, source: S_BSE, first_seen: TODAY },
    { name: 'Jayaramakrishnan Kannan', title: 'Independent Director',                department: null, email: null, phone: null, source: S_RR, first_seen: TODAY },
    { name: 'Rajendra Kumar Prasan',   title: 'Independent Director',                department: null, email: null, phone: null, source: S_RR, first_seen: TODAY },
    { name: 'Revathi Raghunanthan',    title: 'Independent Director',                department: null, email: null, phone: null, source: S_RR, first_seen: TODAY },
    { name: 'Bibhu Kalyan Rauta',      title: 'Company Secretary & Compliance Officer', department: 'Compliance', email: null, phone: null, source: S_RR, first_seen: TODAY },
    // Senior management — operational reach-out points
    { name: 'Vijay Kumar',             title: 'Chief Operating Officer',             department: 'Operations', email: null, phone: null, source: S_RR, first_seen: TODAY },
    { name: 'Amit Parakh',             title: 'Head of Sales',                       department: 'Sales', email: null, phone: null, source: S_RR, first_seen: TODAY },
    { name: 'Abhi Jain',               title: 'General Manager — Finance',           department: 'Finance', email: null, phone: null, source: S_RR, first_seen: TODAY },
    { name: 'Atul Pareek',             title: 'Director of Gold Refinery',           department: 'UAE / Precious Metals', email: null, phone: null, source: S_RR, first_seen: TODAY },
    // Group mailboxes / phones already-known duplicates will be deduped by merge
    { name: null, title: 'General', department: null, email: 'info@jainmetalgroup.com', phone: '+91 44 43409494', source: S_SITE, first_seen: TODAY },
    { name: null, title: 'General', department: null, email: null,                       phone: '+91 44 42130100', source: S_SITE, first_seen: TODAY },
  ];
  const { merged, added } = mergeContacts(jrrl.contacts_all, newRows);
  const { error } = await sb.from('recyclers').update({ contacts_all: merged }).eq('id', jrrl.id);
  if (error) throw error;
  console.log(`✓ METAL-TN-001 contacts_all: +${added} → ${merged.length} total`);

  // Copy these to the new METAL-TN-004 (Lead Facility) and METAL-TN-003 (Aluminium)
  for (const code of ['METAL-TN-004', 'METAL-TN-003', 'METAL-TN-002']) {
    const { data: row } = await sb.from('recyclers').select('id, contacts_all').eq('recycler_code', code).single();
    const { merged: m2, added: a2 } = mergeContacts(row.contacts_all, newRows);
    await sb.from('recyclers').update({ contacts_all: m2 }).eq('id', row.id);
    console.log(`✓ ${code} contacts_all: +${a2} → ${m2.length} total`);
  }
}

// ── 4. Add Jain Ikon Global Ventures (FZC) as UAE subsidiary ──────────
{
  const { data: jmg } = await sb.from('companies').select('id').eq('slug', 'jain-metal-group').single();
  const { data: existing } = await sb.from('companies').select('id').eq('slug', 'jain-ikon-global-ventures-fzc').maybeSingle();
  const payload = {
    slug: 'jain-ikon-global-ventures-fzc',
    legal_name: 'Jain Ikon Global Ventures (FZC)',
    trade_name: 'JIGV',
    parent_company_id: jmg.id,
    is_group_holding: false,
    website: 'https://www.jainmetalgroup.com',
    registered_address: 'SAIF-Zone (Sharjah Airport International Free Zone), Sharjah, UAE',
    registered_state: null,
    description: 'UAE subsidiary of Jain Metal Group — gold and silver refining; directed by Atul Pareek.',
  };
  if (existing) {
    await sb.from('companies').update(payload).eq('id', existing.id);
    console.log('✓ Jain Ikon Global Ventures (FZC) — updated');
  } else {
    await sb.from('companies').insert(payload);
    console.log('✓ Jain Ikon Global Ventures (FZC) — inserted under Jain Metal Group');
  }
}

// ── 5. Record JRRL listing status on the company row ──────────────────
{
  const { error } = await sb.from('companies').update({
    description: 'Copper + lead recycling arm of Jain Metal Group. Listed on BSE/NSE as JAINREC (IPO Sep 2025; 3.26 lakh MTPA capacity across 3 facilities at SIPCOT Gummidipoondi). Facility 1 — Copper (METAL-TN-001), Facility 2 — Lead (METAL-TN-004).',
  }).eq('slug', 'jain-resource-recycling-ltd');
  if (error) throw error;
  console.log('✓ JRRL description updated with listing info');
}

console.log('\nDone.');
