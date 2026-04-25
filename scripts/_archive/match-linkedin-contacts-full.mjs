#!/usr/bin/env node
/**
 * Full-ecosystem LinkedIn matcher.
 * READ-ONLY: writes .buddy/ecosystem-linkedin-matches.json.
 *
 * Run: node --env-file=.env.local scripts/match-linkedin-contacts-full.mjs
 *
 * Covers:
 *  - all recyclers with phone IS NULL OR placeholder emails
 *  - the 12 flagged suppliers (vendor_code allow-list)
 *  - customer_leads / sales_leads / supplier_leads with missing email OR phone
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import pg from 'pg';

const ROOT = '/Users/sivakumar/Projects/rotehuegels-website';
const CONNECTIONS_CSV = '/Users/sivakumar/Downloads/Complete_LinkedInDataExport_04-20-2026.zip/Connections.csv';
const IMPORTED_CSV   = '/Users/sivakumar/Downloads/Complete_LinkedInDataExport_04-20-2026.zip/ImportedContacts.csv';
const OUT_PATH       = `${ROOT}/.buddy/ecosystem-linkedin-matches.json`;

const SUPPLIER_VENDOR_CODES = [
  'VND-001','VND-003','VND-004','VND-005','VND-007','VND-008',
  'VND-010','VND-011','VND-014','VND-016','VND-019','VND-020',
];

// ---------- CSV parser ----------
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQ = false, i = 0, n = text.length;
  if (n > 0 && text.charCodeAt(0) === 0xFEFF) i = 1;
  while (i < n) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (i + 1 < n && text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQ = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQ = true; i++; continue; }
    if (c === ',') { row.push(field); field = ''; i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
    field += c; i++;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function rowsToObjects(rows, headerIdx = 0) {
  const header = rows[headerIdx].map(h => h.trim());
  const out = [];
  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 1 && row[0].trim() === '') continue;
    const obj = {};
    for (let c = 0; c < header.length; c++) obj[header[c]] = (row[c] ?? '').trim();
    out.push(obj);
  }
  return out;
}

// ---------- Normalization ----------
const FILLER = new Set([
  'pvt','ltd','limited','private','inc','co','company','corp','corporation',
  'enterprises','enterprise','india','the','and','&','llp','plc','group','&co',
  'industries','industry','services','solutions','tech','technologies','technology',
  'international','global','holdings','holding','ventures','venture','works'
]);

function normalize(s) {
  if (!s) return '';
  let x = s.toLowerCase();
  x = x.replace(/[^a-z0-9\s]/g, ' ');
  x = x.replace(/\s+/g, ' ').trim();
  const toks = x.split(' ').filter(t => t && !FILLER.has(t));
  return toks.join(' ');
}

function tokens(normStr) {
  return normStr.split(' ').filter(t => t && t.length >= 4);
}

function scoreMatch(dbNorm, liNorm) {
  if (!dbNorm || !liNorm) return 0;
  if (dbNorm === liNorm) return 100;
  if (dbNorm.length >= 6 && liNorm.length >= 6) {
    if (dbNorm.includes(liNorm) || liNorm.includes(dbNorm)) return 80;
  }
  const dbT = new Set(tokens(dbNorm));
  const liT = tokens(liNorm);
  let shared = 0;
  for (const t of liT) if (dbT.has(t)) shared++;
  if (shared >= 2) return 60;
  return 0;
}

function pickFirst(multi) {
  if (!multi) return '';
  const parts = String(multi).split(/\\,|,/).map(s => s.trim()).filter(Boolean);
  return parts[0] || '';
}

// ---------- DB ----------
async function connectDB() {
  const host = process.env.SUPABASE_DB_HOST;
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!host || !password) throw new Error('Missing SUPABASE_DB_HOST / SUPABASE_DB_PASSWORD');
  const m = host.match(/^db\.([a-z0-9]+)\.supabase\.co$/);
  if (!m) throw new Error(`Unexpected SUPABASE_DB_HOST: ${host}`);
  const ref = m[1];
  const regions = process.env.SUPABASE_REGION
    ? [process.env.SUPABASE_REGION]
    : ['ap-south-1','us-east-1','ap-southeast-1','eu-west-1','us-west-1','ap-northeast-1'];

  try {
    process.stdout.write(`→ trying direct ${host} … `);
    const c = new pg.Client({ host, port: 5432, database: 'postgres', user: 'postgres', password, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 12_000 });
    await c.connect(); console.log('connected'); return c;
  } catch (e) { console.log(`${e.code || e.message}`); }

  for (const r of regions) {
    try {
      process.stdout.write(`→ trying pooler ${r} … `);
      const c = new pg.Client({ host: `aws-0-${r}.pooler.supabase.com`, port: 5432, database: 'postgres', user: `postgres.${ref}`, password, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8_000 });
      await c.connect(); console.log('connected'); return c;
    } catch (e) { console.log(`${e.code || e.message}`); }
  }
  throw new Error('No route to DB');
}

async function main() {
  const t0 = Date.now();
  console.log('→ reading CSVs');
  const connText = readFileSync(CONNECTIONS_CSV, 'utf-8');
  const impText  = readFileSync(IMPORTED_CSV,   'utf-8');

  const connRows = parseCSV(connText);
  let connHeaderIdx = 0;
  for (let i = 0; i < Math.min(10, connRows.length); i++) {
    const row = connRows[i];
    if (row[0] === 'First Name' && row[1] === 'Last Name') { connHeaderIdx = i; break; }
  }
  const connections = rowsToObjects(connRows, connHeaderIdx);
  console.log(`  connections: ${connections.length}`);

  const impRows = parseCSV(impText);
  const imported = rowsToObjects(impRows, 0);
  console.log(`  imported:    ${imported.length}`);

  const connIdx = connections.map(c => {
    const company = c['Company'] || '';
    const norm = normalize(company);
    return norm ? {
      source: 'connections',
      matched_name: company,
      norm,
      first_name: c['First Name'] || '',
      last_name:  c['Last Name']  || '',
      position:   c['Position']   || '',
      email:      c['Email Address'] || '',
      phone:      '',
      url:        c['URL'] || '',
    } : null;
  }).filter(Boolean);

  const impIdx = imported.map(c => {
    const title = c['Title'] || '';
    const norm = normalize(title);
    if (!norm) return null;
    return {
      source: 'imported',
      matched_name: title,
      norm,
      first_name: c['FirstName'] || '',
      last_name:  c['LastName']  || '',
      position:   title,
      email:      pickFirst(c['Emails']),
      phone:      pickFirst(c['PhoneNumbers']),
      url:        '',
    };
  }).filter(Boolean);

  console.log(`  indexed connections: ${connIdx.length}`);
  console.log(`  indexed imported:    ${impIdx.length}`);

  const client = await connectDB();
  let recyclers, suppliers, customerLeads, salesLeads, supplierLeads;
  try {
    console.log('→ querying recyclers gap');
    recyclers = (await client.query(`
      SELECT id, recycler_code, company_name, state, website, email, phone
      FROM recyclers
      WHERE phone IS NULL OR email LIKE 'cpcb.%@recycler.in' OR email LIKE 'lkdn.%@recycler.in' OR email LIKE 'mrai.%@recycler.in'
    `)).rows;
    console.log(`  ${recyclers.length}`);

    console.log('→ querying suppliers (gap allow-list)');
    suppliers = (await client.query(`
      SELECT id, vendor_code, legal_name, trade_name, gstin, state, email, phone
      FROM suppliers
      WHERE vendor_code = ANY($1)
    `, [SUPPLIER_VENDOR_CODES])).rows;
    console.log(`  ${suppliers.length}`);

    console.log('→ querying customer_leads gap');
    customerLeads = (await client.query(`
      SELECT id, company_name, contact_person, email, phone, website
      FROM customer_leads
      WHERE (email IS NULL OR email = '') OR (phone IS NULL OR phone = '')
    `)).rows;
    console.log(`  ${customerLeads.length}`);

    console.log('→ querying sales_leads gap');
    salesLeads = (await client.query(`
      SELECT id, lead_code, company_name, contact_person, email, phone
      FROM sales_leads
      WHERE (email IS NULL OR email = '') OR (phone IS NULL OR phone = '')
    `)).rows;
    console.log(`  ${salesLeads.length}`);

    console.log('→ querying supplier_leads gap');
    supplierLeads = (await client.query(`
      SELECT id, company_name, contact_person, email, phone, website
      FROM supplier_leads
      WHERE (email IS NULL OR email = '') OR (phone IS NULL OR phone = '')
    `)).rows;
    console.log(`  ${supplierLeads.length}`);
  } finally {
    await client.end();
  }

  function matchRecord(nameForKey) {
    const dbNorm = normalize(nameForKey);
    if (!dbNorm) return [];
    const out = [];
    for (const li of connIdx) {
      const s = scoreMatch(dbNorm, li.norm);
      if (s >= 60) out.push({ ...li, score: s });
    }
    for (const li of impIdx) {
      const s = scoreMatch(dbNorm, li.norm);
      if (s >= 60) out.push({ ...li, score: s });
    }
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, 5).map(c => ({
      source: c.source,
      score: c.score,
      matched_name: c.matched_name,
      first_name: c.first_name,
      last_name: c.last_name,
      position: c.position,
      email: c.email || '',
      phone: c.phone || '',
      url: c.url || '',
    }));
  }

  function pickBest(cands) {
    // best-match = score >= 80 AND at least one of email/phone.
    for (const c of cands) {
      if (c.score >= 80 && (c.email || c.phone)) return c;
    }
    return null;
  }

  function entry(table, id_or_code, db_name) {
    const cands = matchRecord(db_name);
    const best = pickBest(cands);
    const top = cands[0]?.score || 0;
    return {
      table, id_or_code, db_name,
      candidates: cands,
      best_match: best,
      status: best ? 'auto' : (top >= 60 ? 'needs_review' : 'no_match'),
    };
  }

  console.log('→ matching all rows');
  const results = [];
  for (const r of recyclers)      results.push(entry('recyclers',      r.recycler_code, r.company_name));
  for (const s of suppliers)      results.push(entry('suppliers',      s.vendor_code,   s.trade_name || s.legal_name));
  for (const l of customerLeads)  results.push(entry('customer_leads', l.id,            l.company_name));
  for (const l of salesLeads)     results.push(entry('sales_leads',    l.lead_code,     l.company_name));
  for (const l of supplierLeads)  results.push(entry('supplier_leads', l.id,            l.company_name));

  const summary = {
    total: results.length,
    auto_match: results.filter(r => r.status === 'auto').length,
    needs_review: results.filter(r => r.status === 'needs_review').length,
    no_match: results.filter(r => r.status === 'no_match').length,
    by_table: {},
  };
  for (const t of ['recyclers','suppliers','customer_leads','sales_leads','supplier_leads']) {
    const rows = results.filter(r => r.table === t);
    summary.by_table[t] = {
      total: rows.length,
      auto: rows.filter(r => r.status === 'auto').length,
      needs_review: rows.filter(r => r.status === 'needs_review').length,
      no_match: rows.filter(r => r.status === 'no_match').length,
    };
  }

  const payload = { generated_at: new Date().toISOString(), elapsed_ms: Date.now() - t0, summary, results };
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2));
  console.log(`✓ ${OUT_PATH}`);
  console.log(`  elapsed: ${Math.round((Date.now()-t0)/1000)}s`);
  console.log(`  summary:`, summary);
}

main().catch(e => { console.error('✗', e); process.exit(1); });
