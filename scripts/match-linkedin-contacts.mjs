#!/usr/bin/env node
/**
 * Match LinkedIn export CSVs against Supabase contact tables.
 * READ-ONLY: produces JSON candidates at .buddy/linkedin-matches.json.
 *
 * Run: node --env-file=.env.local scripts/match-linkedin-contacts.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import pg from 'pg';

const ROOT = '/Users/sivakumar/Projects/rotehuegels-website';
const CONNECTIONS_CSV = '/Users/sivakumar/Downloads/Complete_LinkedInDataExport_04-20-2026.zip/Connections.csv';
const IMPORTED_CSV   = '/Users/sivakumar/Downloads/Complete_LinkedInDataExport_04-20-2026.zip/ImportedContacts.csv';
const OUT_PATH       = `${ROOT}/.buddy/linkedin-matches.json`;

// ---------- RFC4180-ish CSV parser ----------
// Supports: double-quoted fields, "" escaping, commas and newlines in quoted fields.
// Returns array of string[] rows.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQ = false;
  let i = 0;
  const n = text.length;
  // strip BOM
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
  // flush last field/row
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function rowsToObjects(rows, headerIdx = 0) {
  const header = rows[headerIdx].map(h => h.trim());
  const out = [];
  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 1 && row[0].trim() === '') continue; // blank
    const obj = {};
    for (let c = 0; c < header.length; c++) obj[header[c]] = (row[c] ?? '').trim();
    out.push(obj);
  }
  return out;
}

// ---------- Normalization ----------
const FILLER = new Set([
  'pvt','ltd','limited','private','inc','co','company','corp','corporation',
  'enterprises','enterprise','india','the','and','&','llp','plc','group','&co'
]);

function normalize(s) {
  if (!s) return '';
  let x = s.toLowerCase();
  x = x.replace(/[^a-z0-9\s]/g, ' ');   // strip punctuation
  x = x.replace(/\s+/g, ' ').trim();
  const toks = x.split(' ').filter(t => t && !FILLER.has(t));
  return toks.join(' ');
}

function tokens(normStr) {
  return normStr.split(' ').filter(t => t && t.length >= 4);
}

// ---------- Scoring ----------
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

  // direct first
  try {
    process.stdout.write(`→ trying direct ${host} … `);
    const c = new pg.Client({
      host, port: 5432, database: 'postgres', user: 'postgres', password,
      ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 12_000,
    });
    await c.connect();
    console.log('connected');
    return c;
  } catch (e) { console.log(`${e.code || e.message}`); }

  for (const r of regions) {
    try {
      process.stdout.write(`→ trying pooler ${r} … `);
      const c = new pg.Client({
        host: `aws-0-${r}.pooler.supabase.com`, port: 5432, database: 'postgres',
        user: `postgres.${ref}`, password, ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 8_000,
      });
      await c.connect(); console.log('connected'); return c;
    } catch (e) { console.log(`${e.code || e.message}`); }
  }
  throw new Error('No route to DB');
}

// ---------- Main ----------
async function main() {
  console.log('→ reading CSVs');
  const connText = readFileSync(CONNECTIONS_CSV, 'utf-8');
  const impText  = readFileSync(IMPORTED_CSV,   'utf-8');

  const connRows = parseCSV(connText);
  // preamble: "Notes:" line, quoted note, blank, header at index 3
  let connHeaderIdx = 0;
  for (let i = 0; i < Math.min(10, connRows.length); i++) {
    const row = connRows[i];
    if (row[0] === 'First Name' && row[1] === 'Last Name') { connHeaderIdx = i; break; }
  }
  const connections = rowsToObjects(connRows, connHeaderIdx);
  console.log(`  connections: ${connections.length} rows`);

  const impRows = parseCSV(impText);
  const imported = rowsToObjects(impRows, 0);
  console.log(`  imported:    ${imported.length} rows`);

  // Pre-compute LinkedIn normalized keys
  const connIdx = connections
    .map(c => {
      const company = c['Company'] || '';
      const norm = normalize(company);
      return norm ? {
        source: 'connections',
        company,
        norm,
        first_name: c['First Name'] || '',
        last_name:  c['Last Name']  || '',
        position:   c['Position']   || '',
        email:      c['Email Address'] || '',
        phone:      '',
        url:        c['URL'] || '',
        matched_name: company,
      } : null;
    })
    .filter(Boolean);

  function pickFirst(multi) {
    if (!multi) return '';
    // Split on escaped-comma `\,` or plain comma
    const parts = String(multi).split(/\\,|,/).map(s => s.trim()).filter(Boolean);
    return parts[0] || '';
  }

  const impIdx = imported
    .map(c => {
      const title = c['Title'] || '';
      const norm = normalize(title);
      if (!norm) return null;
      return {
        source: 'imported',
        company: title,
        norm,
        first_name: c['FirstName'] || '',
        last_name:  c['LastName']  || '',
        position:   title, // title field often holds the company/role in this export
        email:      pickFirst(c['Emails']),
        phone:      pickFirst(c['PhoneNumbers']),
        url:        '',
        matched_name: title,
      };
    })
    .filter(Boolean);

  console.log(`  indexed connections w/ company: ${connIdx.length}`);
  console.log(`  indexed imported w/ title:      ${impIdx.length}`);

  // Connect DB and pull records
  const client = await connectDB();
  let suppliers, customers, recyclers;
  try {
    console.log('→ querying suppliers (email IS NULL OR phone IS NULL)');
    const r1 = await client.query(`
      SELECT id, vendor_code, legal_name, trade_name, gstin, state
      FROM suppliers
      WHERE email IS NULL OR phone IS NULL
    `);
    suppliers = r1.rows;
    console.log(`  ${suppliers.length} suppliers`);

    console.log('→ querying customers');
    const r2 = await client.query(`
      SELECT id, customer_id, name, gstin, state, email, phone
      FROM customers
    `);
    customers = r2.rows;
    console.log(`  ${customers.length} customers`);

    console.log('→ querying recyclers (phone IS NULL OR email LIKE cpcb.%@recycler.in) LIMIT 200');
    const r3 = await client.query(`
      SELECT id, company_name, state, email, phone
      FROM recyclers
      WHERE phone IS NULL OR email LIKE 'cpcb.%@recycler.in'
      LIMIT 200
    `);
    recyclers = r3.rows;
    console.log(`  ${recyclers.length} recyclers`);
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
    // Drop internal `norm` and `company` fields in output
    return out.slice(0, 5).map(c => ({
      source: c.source,
      score: c.score,
      matched_name: c.matched_name,
      first_name: c.first_name,
      last_name: c.last_name,
      position: c.position,
      email: c.email,
      phone: c.phone,
      url: c.url,
    }));
  }

  console.log('→ scoring suppliers');
  const supplierOut = [];
  for (const s of suppliers) {
    const nameForKey = s.trade_name || s.legal_name;
    const cands = matchRecord(nameForKey);
    if (cands.length) supplierOut.push({
      vendor_code: s.vendor_code,
      legal_name: s.legal_name,
      trade_name: s.trade_name,
      gstin: s.gstin,
      state: s.state,
      candidates: cands,
    });
  }

  console.log('→ scoring customers');
  const customerOut = [];
  for (const c of customers) {
    const cands = matchRecord(c.name);
    if (cands.length) customerOut.push({
      customer_id: c.customer_id,
      name: c.name,
      gstin: c.gstin,
      state: c.state,
      email: c.email,
      phone: c.phone,
      candidates: cands,
    });
  }

  console.log('→ scoring recyclers');
  const recyclerOut = [];
  for (const r of recyclers) {
    const cands = matchRecord(r.company_name);
    if (cands.length) recyclerOut.push({
      company_name: r.company_name,
      state: r.state,
      email: r.email,
      phone: r.phone,
      candidates: cands,
    });
  }

  const payload = {
    generated_at: new Date().toISOString(),
    summary: {
      suppliers_matched: supplierOut.length,
      customers_matched: customerOut.length,
      recyclers_matched: recyclerOut.length,
    },
    suppliers: supplierOut,
    customers: customerOut,
    recyclers: recyclerOut,
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2));
  console.log(`✓ wrote ${OUT_PATH}`);
  console.log(`  suppliers_matched=${supplierOut.length}  customers_matched=${customerOut.length}  recyclers_matched=${recyclerOut.length}`);
}

main().catch(e => { console.error('✗', e); process.exit(1); });
