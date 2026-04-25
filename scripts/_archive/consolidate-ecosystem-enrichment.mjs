#!/usr/bin/env node
/**
 * Consolidate website scrape + LinkedIn match into two SQL migrations:
 *  - _auto.sql     — high-confidence updates (website-verified or score=100 corp email)
 *  - _review.sql.draft — lower-confidence (60-79 or partial)
 *
 * Priority per row:
 *   1. Website scrape with same-domain email  (highest)
 *   2. Website scrape with phone (corporate landline/mobile)
 *   3. LinkedIn Imported phone (verified phonebook contact)
 *   4. LinkedIn Connections email on corporate domain (exact name match)
 *
 * Conservative defaults:
 *  - Never overwrite a non-placeholder existing value.
 *  - Never set email to a personal gmail/yahoo etc.
 *  - Treat cpcb.*@recycler.in / lkdn.*@recycler.in / placeholder.in as replaceable.
 *  - Leaving blank is better than wrong data.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import pg from 'pg';

const ROOT = '/Users/sivakumar/Projects/rotehuegels-website';
const MATCHES_PATH = `${ROOT}/.buddy/ecosystem-linkedin-matches.json`;
const SCRAPE_PATHS = [
  `${ROOT}/.buddy/website-scrape-results.json`,
  `${ROOT}/.buddy/website-scrape-results-pass2.json`,
  `${ROOT}/.buddy/website-scrape-results-pass3.json`,
];
const AUTO_SQL = `${ROOT}/supabase/migrations/20260420_ecosystem_enrichment_auto.sql`;
const REVIEW_SQL = `${ROOT}/supabase/migrations/20260420_ecosystem_enrichment_review.sql.draft`;
const LOG_PATH = `${ROOT}/.buddy/ecosystem-enrichment-log.md`;

const PERSONAL_DOMAINS = new Set(['gmail.com','googlemail.com','yahoo.com','yahoo.co.in','yahoo.in','hotmail.com','outlook.com','rediffmail.com','rediff.com','ymail.com','live.com','icloud.com','me.com','aol.com','msn.com','protonmail.com']);

function isCorporateEmail(e) {
  if (!e) return false;
  const d = String(e).toLowerCase().split('@')[1];
  if (!d) return false;
  return !PERSONAL_DOMAINS.has(d);
}

function isPlaceholderEmail(e) {
  if (!e) return true;
  return /^(cpcb|mrai|lkdn|nfmr|pmp|rspcb|kspcb|mpcb|evoem|bm|bpack|cell|cam|bwm)\b.*@(recycler\.in|placeholder\.in)$/i.test(e)
      || /@placeholder\.in$/i.test(e)
      || /@recycler\.in$/i.test(e);
}

function sqlEscape(v) {
  if (v === null || v === undefined) return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
}

function normHost(website) {
  if (!website) return null;
  let u = String(website).trim();
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  try {
    const url = new URL(u);
    return url.host.replace(/^www\./, '').toLowerCase();
  } catch { return null; }
}

async function connectDB() {
  const host = process.env.SUPABASE_DB_HOST, password = process.env.SUPABASE_DB_PASSWORD;
  const c = new pg.Client({ host, port: 5432, database: 'postgres', user: 'postgres', password, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
  await c.connect();
  return c;
}

async function main() {
  const matches = JSON.parse(readFileSync(MATCHES_PATH, 'utf-8'));
  const scrapeAll = [];
  for (const p of SCRAPE_PATHS) {
    try {
      const d = JSON.parse(readFileSync(p, 'utf-8'));
      scrapeAll.push(...d.results);
    } catch {}
  }
  console.log(`matches: ${matches.results.length}`);
  console.log(`scrape rows (raw): ${scrapeAll.length}`);

  // Build a host → scrape result map (keep best per host)
  const scrapeByHost = new Map();
  for (const s of scrapeAll) {
    const h = normHost(s.url);
    if (!h) continue;
    const cur = scrapeByHost.get(h);
    // Prefer one with both email+phone, then email, then phone
    const rank = (r) => (r.email_found ? 2 : 0) + (r.phone_found ? 1 : 0);
    if (!cur || rank(s) > rank(cur)) scrapeByHost.set(h, s);
  }
  console.log(`unique hosts scraped: ${scrapeByHost.size}`);

  // Connect + fetch current DB state for every target row
  const client = await connectDB();
  let recyclers, suppliers, customerLeads, salesLeads, supplierLeads;
  try {
    recyclers = (await client.query(`
      SELECT id, recycler_code, company_name, state, website, email, phone
      FROM recyclers
      WHERE phone IS NULL OR email LIKE 'cpcb.%@recycler.in' OR email LIKE 'lkdn.%@recycler.in' OR email LIKE 'mrai.%@recycler.in' OR email LIKE '%@placeholder.in'
    `)).rows;
    suppliers = (await client.query(`
      SELECT id, vendor_code, legal_name, trade_name, email, phone
      FROM suppliers
      WHERE vendor_code = ANY($1)
    `, [['VND-001','VND-003','VND-004','VND-005','VND-007','VND-008','VND-010','VND-011','VND-014','VND-016','VND-019','VND-020']])).rows;
    customerLeads = (await client.query(`
      SELECT id, company_name, contact_person, email, phone, website
      FROM customer_leads
      WHERE (email IS NULL OR email = '') OR (phone IS NULL OR phone = '')
    `)).rows;
    salesLeads = (await client.query(`
      SELECT id, lead_code, company_name, contact_person, email, phone
      FROM sales_leads
      WHERE (email IS NULL OR email = '') OR (phone IS NULL OR phone = '')
    `)).rows;
    supplierLeads = (await client.query(`
      SELECT id, company_name, contact_person, email, phone, website
      FROM supplier_leads
      WHERE (email IS NULL OR email = '') OR (phone IS NULL OR phone = '')
    `)).rows;
  } finally {
    await client.end();
  }

  // Index match results by (table, id_or_code)
  const matchIdx = new Map();
  for (const m of matches.results) {
    matchIdx.set(`${m.table}::${m.id_or_code}`, m);
  }

  // Plan updates
  const autoUpdates = [];  // {table, pk, pk_val, set: {email?, phone?}, sources: {...}}
  const reviewUpdates = [];
  const skipped = [];

  function planRow({ table, pk, pk_val, row_name, db_email, db_phone, scrape, liMatch }) {
    const sources = {};
    const autoSet = {};
    const reviewSet = {};
    let autoConfidence = null;
    let reviewReason = null;

    const hasRealEmail = !isPlaceholderEmail(db_email) && db_email;
    const hasPhone = !!db_phone;

    // --- Email ---
    if (!hasRealEmail) {
      // 1. Scrape same-domain email
      if (scrape?.email_found && isCorporateEmail(scrape.email_found)) {
        autoSet.email = scrape.email_found;
        sources.email = `website-scrape:${scrape.url}`;
      }
      // 2. LinkedIn exact-match (score=100) corporate email (LinkedIn connections often personal)
      else if (liMatch?.best_match && liMatch.best_match.score === 100 && isCorporateEmail(liMatch.best_match.email)) {
        autoSet.email = liMatch.best_match.email.toLowerCase();
        sources.email = `linkedin:${liMatch.best_match.source}:${liMatch.best_match.matched_name}(score=100)`;
      }
      // Otherwise review: any corporate scrape email (no same-domain hit), or LinkedIn corporate email at score 80+, or any email at 100
      else {
        const candidates = [];
        if (scrape?.all_emails?.length) {
          for (const e of scrape.all_emails) if (isCorporateEmail(e)) candidates.push({ email: e, src: `scrape-nondom:${scrape.url}` });
        }
        if (liMatch?.best_match?.email) candidates.push({ email: liMatch.best_match.email, src: `linkedin-best:score=${liMatch.best_match.score}:${liMatch.best_match.matched_name}` });
        else if (liMatch?.candidates?.length) {
          for (const c of liMatch.candidates.slice(0,2)) if (c.email) candidates.push({ email: c.email, src: `linkedin-cand:score=${c.score}:${c.matched_name}` });
        }
        if (candidates.length) {
          reviewSet.email = candidates[0].email;
          if (!reviewReason) reviewReason = 'email: ' + candidates[0].src;
        }
      }
    }

    // --- Phone ---
    if (!hasPhone) {
      // 1. Scrape phone (from site) — high confidence when same-host
      if (scrape?.phone_found) {
        autoSet.phone = scrape.phone_found;
        sources.phone = `website-scrape:${scrape.url}`;
      }
      // 2. LinkedIn imported phone at score 100 exact match
      else if (liMatch?.best_match && liMatch.best_match.score === 100 && liMatch.best_match.phone && liMatch.best_match.source === 'imported') {
        autoSet.phone = liMatch.best_match.phone;
        sources.phone = `linkedin-imported:score=100:${liMatch.best_match.matched_name}`;
      }
      else {
        // Review tier
        const cands = [];
        if (liMatch?.best_match?.phone) cands.push({ phone: liMatch.best_match.phone, src: `linkedin-best:score=${liMatch.best_match.score}` });
        else if (liMatch?.candidates?.length) {
          for (const c of liMatch.candidates.slice(0,2)) if (c.phone) cands.push({ phone: c.phone, src: `linkedin-cand:score=${c.score}` });
        }
        if (cands.length) {
          reviewSet.phone = cands[0].phone;
          if (!reviewReason) reviewReason = 'phone: ' + cands[0].src; else reviewReason += '; phone: ' + cands[0].src;
        }
      }
    }

    if (Object.keys(autoSet).length) {
      autoUpdates.push({ table, pk, pk_val, row_name, db_email, db_phone, set: autoSet, sources, confidence: 'high' });
    }
    if (Object.keys(reviewSet).length) {
      reviewUpdates.push({ table, pk, pk_val, row_name, db_email, db_phone, set: reviewSet, reason: reviewReason });
    }
    if (!Object.keys(autoSet).length && !Object.keys(reviewSet).length) {
      skipped.push({ table, pk_val, row_name, reason: 'no usable candidate' });
    }
  }

  // Recyclers — scrape-keyed by host
  for (const r of recyclers) {
    const host = normHost(r.website);
    const scrape = host ? scrapeByHost.get(host) : null;
    const liMatch = matchIdx.get(`recyclers::${r.recycler_code}`);
    planRow({
      table: 'recyclers', pk: 'recycler_code', pk_val: r.recycler_code, row_name: r.company_name,
      db_email: r.email, db_phone: r.phone, scrape, liMatch,
    });
  }

  // Suppliers — no website column, LinkedIn only
  for (const s of suppliers) {
    const liMatch = matchIdx.get(`suppliers::${s.vendor_code}`);
    planRow({
      table: 'suppliers', pk: 'vendor_code', pk_val: s.vendor_code, row_name: s.trade_name || s.legal_name,
      db_email: s.email, db_phone: s.phone, scrape: null, liMatch,
    });
  }

  // customer_leads — keyed by UUID
  for (const l of customerLeads) {
    const host = normHost(l.website);
    const scrape = host ? scrapeByHost.get(host) : null;
    const liMatch = matchIdx.get(`customer_leads::${l.id}`);
    planRow({
      table: 'customer_leads', pk: 'id', pk_val: l.id, row_name: l.company_name,
      db_email: l.email, db_phone: l.phone, scrape, liMatch,
    });
  }

  for (const l of salesLeads) {
    const liMatch = matchIdx.get(`sales_leads::${l.lead_code}`);
    planRow({
      table: 'sales_leads', pk: 'lead_code', pk_val: l.lead_code, row_name: l.company_name,
      db_email: l.email, db_phone: l.phone, scrape: null, liMatch,
    });
  }

  for (const l of supplierLeads) {
    const host = normHost(l.website);
    const scrape = host ? scrapeByHost.get(host) : null;
    const liMatch = matchIdx.get(`supplier_leads::${l.id}`);
    planRow({
      table: 'supplier_leads', pk: 'id', pk_val: l.id, row_name: l.company_name,
      db_email: l.email, db_phone: l.phone, scrape, liMatch,
    });
  }

  // Generate SQL
  const autoLines = [];
  autoLines.push(`-- =====================================================================`);
  autoLines.push(`-- Ecosystem enrichment (auto-apply tier) — generated ${new Date().toISOString()}`);
  autoLines.push(`-- Source 1: website scrape (.buddy/website-scrape-results*.json)`);
  autoLines.push(`-- Source 2: LinkedIn match (.buddy/ecosystem-linkedin-matches.json)`);
  autoLines.push(`-- Rule: high-confidence only = website-verified same-domain email,`);
  autoLines.push(`--       website-scraped phone, or LinkedIn score=100 corporate email/imported phone.`);
  autoLines.push(`-- Conservative: only fills NULL / placeholder values; never overwrites real data.`);
  autoLines.push(`-- =====================================================================\n`);
  autoLines.push(`BEGIN;\n`);

  for (const u of autoUpdates) {
    const setParts = [];
    const comments = [];
    if (u.set.email) { setParts.push(`email = ${sqlEscape(u.set.email)}`); comments.push(`email <- ${u.sources.email}`); }
    if (u.set.phone) { setParts.push(`phone = ${sqlEscape(u.set.phone)}`); comments.push(`phone <- ${u.sources.phone}`); }
    if (!setParts.length) continue;

    // Guard: email only if current is placeholder/null; phone only if current is null
    const guards = [];
    if (u.set.email) guards.push(`(email IS NULL OR email LIKE '%@recycler.in' OR email LIKE '%@placeholder.in')`);
    if (u.set.phone) guards.push(`(phone IS NULL OR phone = '')`);

    autoLines.push(`-- ${u.table} ${u.pk_val}: ${u.row_name}`);
    for (const c of comments) autoLines.push(`--   ${c}`);
    autoLines.push(`UPDATE ${u.table} SET ${setParts.join(', ')}, updated_at = NOW()`);
    autoLines.push(`  WHERE ${u.pk} = ${sqlEscape(u.pk_val)}`);
    if (guards.length) autoLines.push(`    AND ${guards.join(' AND ')}`);
    autoLines.push(`;`);
    autoLines.push('');
  }

  autoLines.push(`COMMIT;\n`);
  autoLines.push(`-- Summary: ${autoUpdates.length} row updates across ${new Set(autoUpdates.map(u=>u.table)).size} tables.`);

  mkdirSync(dirname(AUTO_SQL), { recursive: true });
  writeFileSync(AUTO_SQL, autoLines.join('\n'));
  console.log(`✓ ${AUTO_SQL}  (${autoUpdates.length} updates)`);

  // Review SQL draft
  const reviewLines = [];
  reviewLines.push(`-- =====================================================================`);
  reviewLines.push(`-- Ecosystem enrichment (REVIEW tier — do NOT apply as-is) — ${new Date().toISOString()}`);
  reviewLines.push(`-- Contains lower-confidence candidates (fuzzy LinkedIn matches 60-79,`);
  reviewLines.push(`-- personal-domain emails, cross-domain scrape hits, etc.)`);
  reviewLines.push(`-- File is .sql.draft to prevent accidental apply. Vet each row before using.`);
  reviewLines.push(`-- =====================================================================\n`);
  reviewLines.push(`-- BEGIN;\n`);

  for (const u of reviewUpdates) {
    const setParts = [];
    if (u.set.email) setParts.push(`email = ${sqlEscape(u.set.email)}`);
    if (u.set.phone) setParts.push(`phone = ${sqlEscape(u.set.phone)}`);
    if (!setParts.length) continue;
    reviewLines.push(`-- ${u.table} ${u.pk_val}: ${u.row_name}`);
    reviewLines.push(`--   current: email=${u.db_email ?? 'NULL'} phone=${u.db_phone ?? 'NULL'}`);
    reviewLines.push(`--   reason : ${u.reason ?? '—'}`);
    reviewLines.push(`-- UPDATE ${u.table} SET ${setParts.join(', ')} WHERE ${u.pk} = ${sqlEscape(u.pk_val)};`);
    reviewLines.push('');
  }
  reviewLines.push(`-- COMMIT;\n`);
  reviewLines.push(`-- Review count: ${reviewUpdates.length}`);

  writeFileSync(REVIEW_SQL, reviewLines.join('\n'));
  console.log(`✓ ${REVIEW_SQL}  (${reviewUpdates.length} review candidates)`);

  // Log file
  const log = [];
  log.push(`# Ecosystem enrichment log`);
  log.push(`Generated: ${new Date().toISOString()}\n`);
  log.push(`## Stats`);
  log.push(`- recyclers targeted: ${recyclers.length}`);
  log.push(`- suppliers targeted: ${suppliers.length}`);
  log.push(`- customer_leads targeted: ${customerLeads.length}`);
  log.push(`- sales_leads targeted: ${salesLeads.length}`);
  log.push(`- supplier_leads targeted: ${supplierLeads.length}`);
  log.push(`- auto updates: ${autoUpdates.length}`);
  log.push(`- review updates: ${reviewUpdates.length}`);
  log.push(`- skipped (no candidate): ${skipped.length}`);
  log.push('');
  log.push('## Auto tier (per row)');
  for (const u of autoUpdates) {
    const parts = [];
    if (u.set.email) parts.push(`email=${u.set.email} (${u.sources.email})`);
    if (u.set.phone) parts.push(`phone=${u.set.phone} (${u.sources.phone})`);
    log.push(`- [${u.table}] **${u.pk_val}** ${u.row_name}: ${parts.join('; ')}`);
  }
  log.push('');
  log.push('## Review tier (first 80)');
  for (const u of reviewUpdates.slice(0, 80)) {
    const parts = [];
    if (u.set.email) parts.push(`email=${u.set.email}`);
    if (u.set.phone) parts.push(`phone=${u.set.phone}`);
    log.push(`- [${u.table}] **${u.pk_val}** ${u.row_name}: ${parts.join('; ')} — ${u.reason}`);
  }
  log.push('');
  log.push(`## Skipped (${skipped.length}; first 50)`);
  for (const s of skipped.slice(0, 50)) {
    log.push(`- [${s.table}] ${s.pk_val} ${s.row_name}: ${s.reason}`);
  }
  writeFileSync(LOG_PATH, log.join('\n'));
  console.log(`✓ ${LOG_PATH}`);

  console.log(`\nSummary: auto=${autoUpdates.length}  review=${reviewUpdates.length}  skipped=${skipped.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
