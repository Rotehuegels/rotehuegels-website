#!/usr/bin/env node
/**
 * Playwright-based scraper for WAF / JS-rendered / SPA recycler sites
 * that fail fetch-based scraping (Cloudflare challenges, anti-bot, hydration-only).
 *
 * Orthogonal to enrich-contacts-from-website.mjs (fetch-based). Only handles
 * big-brand / WAF-protected domains. Sequential, one browser, 1s delay between
 * domains, 18-minute total budget.
 *
 * Run: node --env-file=.env.local scripts/playwright-scrape-waf.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'node:fs';
// Playwright is installed via pnpm but not symlinked at the top-level
// node_modules, so we import via its pnpm path.
import { chromium } from '/Users/sivakumar/Projects/rotehuegels-website/node_modules/.pnpm/playwright@1.59.1/node_modules/playwright/index.mjs';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) { console.error('Missing Supabase env'); process.exit(1); }
const sb = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } });

const START_MS = Date.now();
const HARD_STOP_MS = 18 * 60 * 1000; // stop at 18 min, commit whatever we have
const PAGE_BUDGET_MS = 22_000;      // per page goto
const POST_WAIT_MS = 8_000;         // extra wait after dom-content-loaded
const DOMAIN_DELAY_MS = 1_000;      // delay between distinct domains

const DOMAIN_BLOCKLIST = new Set(['nicoex.com', 'www.nicoex.com']);

const BAD_EMAIL_DOMAINS = new Set([
  'sentry.io', 'wordpress.com', 'wix.com', 'godaddy.com',
  'example.com', 'domain.com', 'yourdomain.com', 'test.com',
  'ai-mmercial', 'sentry-next.wixpress.com',
]);

// Static list — known fetch failures. Plus explicit JSW subpaths per spec.
const STATIC_DOMAINS = [
  'jindalaluminium.com',
  'gcal.co.in',
  'amararaja.com',
  'okayapower.com',
  'rajeshindia.com',
  'exideenergy.in',
  'sonaalloys.com',
  'heromotocorp.com',
  'log9materials.com',
  'sungeelindia.in',
  'racenergy.in',
  'hulladek.com',
  'globalcopper.co.in',
  'panasoniccarbon.in',
  'envirohub.com.sg',
  'jsw.in',
];
const JSW_SUBPATHS = ['/energy', '/aluminium'];

function hostKey(host) { return host.toLowerCase().replace(/^www\./, ''); }

function toUrl(website) {
  let u = String(website).trim();
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  try { return new URL(u); } catch { return null; }
}

function extractEmails(text) {
  const re = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,24}/g;
  const out = new Set();
  let m;
  while ((m = re.exec(text)) !== null) {
    const a = m[0].toLowerCase();
    if (/\.(png|jpg|jpeg|gif|svg|webp|js|css|woff|woff2|ico)$/i.test(a)) continue;
    if (a.startsWith('noreply@') || a.startsWith('no-reply@') || a.startsWith('donotreply@')) continue;
    const domain = a.split('@')[1];
    if (BAD_EMAIL_DOMAINS.has(domain)) continue;
    // sentry DSNs often look like hex@oXXX.ingest.sentry.io
    if (/sentry\.io$/i.test(domain)) continue;
    // drop obvious placeholders
    if (/^example@|^your@|^name@/.test(a)) continue;
    out.add(a);
  }
  return [...out];
}

function normalisePhone(raw) {
  let d = String(raw).replace(/\D/g, '');
  if (d.startsWith('91') && d.length === 12) d = d.slice(2);
  if (d.startsWith('0') && d.length === 11) d = d.slice(1);
  if (d.length === 10 && /^[6-9]/.test(d)) return '+91' + d;
  return null;
}

function extractPhones(text) {
  const counts = new Map();
  const bump = (p) => { if (p) counts.set(p, (counts.get(p) || 0) + 1); };
  for (const m of (text.match(/(?<![\d])[6-9]\d{9}(?![\d])/g) || [])) bump(normalisePhone(m));
  for (const mm of text.matchAll(/\+?91[\s\-().]{0,3}([6-9]\d{9})/g)) if (mm[1]) bump(normalisePhone(mm[1]));
  // Must appear >= 2 times per instructions.
  const kept = [];
  for (const [p, c] of counts) if (c >= 2) kept.push(p);
  // If nothing met the >=2 threshold but we have a tel: link (handled separately by caller), we allow single occurrences there.
  return kept;
}

function pickPrimaryEmail(addrs, hostKeyStr) {
  if (!addrs.length) return null;
  const same = addrs.filter(a => {
    const d = a.split('@')[1];
    return d === hostKeyStr || d.endsWith('.' + hostKeyStr);
  });
  const preferred = ['info@', 'sales@', 'contact@', 'enquiry@', 'enquiries@', 'hello@', 'care@', 'support@', 'admin@', 'reach@', 'reachus@', 'connect@'];
  const best = (list) => {
    for (const p of preferred) { const hit = list.find(a => a.startsWith(p)); if (hit) return hit; }
    return list[0];
  };
  // Reject generic free-mail *unless* nothing else is found.
  const freemail = new Set(['gmail.com', 'yahoo.com', 'yahoo.co.in', 'hotmail.com', 'rediffmail.com', 'outlook.com']);
  const sameCorp = same.filter(a => !freemail.has(a.split('@')[1]));
  if (sameCorp.length) return best(sameCorp);
  if (same.length) return best(same);
  const anyCorp = addrs.filter(a => !freemail.has(a.split('@')[1]));
  if (anyCorp.length) return best(anyCorp);
  return best(addrs);
}

async function fetchWafCandidatesFromDb() {
  const pattern = '(tatasteel|tatamotors|tatapower|reliance|vedanta|hindalco|jsw|jindal|adani|exide|amararaja|hero|mahindra|okaya|mgmotor|bajajauto|kia|hyundai|maruti|bridgestone|apollo|waaree|greenko|reneweco|runaya|attero|lohum|batterysmart)';
  // Supabase JS client doesn't do OR with multiple regex clauses easily;
  // just pull rows with placeholder/missing email or missing phone where
  // website matches the regex.
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from('recyclers')
      .select('id, recycler_code, company_name, website, email, phone')
      .eq('is_active', true)
      .not('website', 'is', null)
      .range(from, from + 999);
    if (error) throw error;
    if (!data || !data.length) break;
    for (const r of data) {
      if (!r.website) continue;
      if (!new RegExp(pattern, 'i').test(r.website)) continue;
      const isPlaceholder = !r.email || /@(recycler|placeholder)\./i.test(r.email || '');
      if (isPlaceholder || !r.phone) out.push(r);
    }
    if (data.length < 1000) break;
  }
  return out;
}

async function fetchAllRowsForDomains(domains) {
  // Return recycler rows whose website domain matches any of the listed domains.
  const want = new Set(domains.map(d => hostKey(d)));
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from('recyclers')
      .select('id, recycler_code, company_name, website, email, phone')
      .eq('is_active', true)
      .not('website', 'is', null)
      .range(from, from + 999);
    if (error) throw error;
    if (!data || !data.length) break;
    for (const r of data) {
      const u = toUrl(r.website);
      if (!u) continue;
      if (want.has(hostKey(u.host))) out.push(r);
    }
    if (data.length < 1000) break;
  }
  return out;
}

async function scrapeOneUrl(context, url, { waitLonger = false } = {}) {
  const page = await context.newPage();
  let cfChallenge = false;
  let linkedPaths = [];
  let bodyText = '';
  let bodyHtml = '';
  let status = null;
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: PAGE_BUDGET_MS });
    status = resp?.status() ?? null;
    // Any of these selectors landing signals the page is real.
    await Promise.race([
      page.waitForSelector('[href^="mailto:"]', { timeout: waitLonger ? 15_000 : POST_WAIT_MS }).catch(() => null),
      page.waitForSelector('[href^="tel:"]', { timeout: waitLonger ? 15_000 : POST_WAIT_MS }).catch(() => null),
      page.waitForSelector('footer', { timeout: waitLonger ? 15_000 : POST_WAIT_MS }).catch(() => null),
      page.waitForTimeout(waitLonger ? 12_000 : POST_WAIT_MS),
    ]);
    bodyText = await page.evaluate(() => document.body ? document.body.innerText : '').catch(() => '');
    bodyHtml = await page.content().catch(() => '');
    // Detect Cloudflare challenge
    if (/Cloudflare|cf-browser-verification|Just a moment|Checking your browser/i.test(bodyText + bodyHtml)
        && bodyText.length < 800) {
      cfChallenge = true;
    }
    // mailto / tel extraction via DOM
    const mailtos = await page.$$eval('a[href^="mailto:"]', (as) => as.map(a => a.getAttribute('href'))).catch(() => []);
    const tels = await page.$$eval('a[href^="tel:"]', (as) => as.map(a => a.getAttribute('href'))).catch(() => []);
    for (const m of mailtos) bodyText += '\n' + (m || '').replace(/^mailto:/i, '').split('?')[0];
    for (const t of tels) bodyText += '\n' + (t || '').replace(/^tel:/i, '');
    // Find linked contact paths on this page for follow-up
    linkedPaths = await page.$$eval('a[href]', (as) => as.map(a => a.getAttribute('href')).filter(Boolean)).catch(() => []);
  } catch (e) {
    return { error: e.message, cf_challenge: cfChallenge, status };
  } finally {
    await page.close().catch(() => {});
  }
  return { bodyText, bodyHtml, linkedPaths, cf_challenge: cfChallenge, status };
}

async function scrapeDomain(context, domain, rows, opts = {}) {
  const baseUrl = toUrl(domain);
  if (!baseUrl) return { domain, error: 'bad url' };
  if (DOMAIN_BLOCKLIST.has(baseUrl.host)) return { domain, error: 'blocklisted' };
  const hostK = hostKey(baseUrl.host);

  const emails = new Set();
  const phones = [];
  const phoneCounts = new Map();
  let anyHitUrl = null;
  let cfChallenge = false;
  const pathTried = [];
  const pathsToTry = new Set(['/', ...(opts.extraPaths || []), '/contact', '/contact-us', '/about', '/about-us', '/reach-us', '/get-in-touch']);

  // Scrape homepage first, collect linked contact-ish paths.
  const homepage = await scrapeOneUrl(context, baseUrl.toString(), { waitLonger: true });
  pathTried.push({ path: '/', ...homepage });
  if (homepage.cf_challenge) cfChallenge = true;
  if (!homepage.error) {
    anyHitUrl = anyHitUrl || baseUrl.toString();
    for (const e of extractEmails(homepage.bodyText + '\n' + homepage.bodyHtml)) emails.add(e);
    const localPhones = extractPhones(homepage.bodyText + '\n' + homepage.bodyHtml);
    for (const p of localPhones) { phoneCounts.set(p, (phoneCounts.get(p) || 0) + 1); }
    // Discover more contact paths
    for (const href of (homepage.linkedPaths || [])) {
      try {
        const u = new URL(href, baseUrl);
        if (hostKey(u.host) !== hostK) continue;
        const p = u.pathname.toLowerCase();
        if (/contact|reach|about|connect|support|enquir|get-in-touch|office/i.test(p) && p.length < 60) {
          pathsToTry.add(u.pathname + (u.search || ''));
        }
      } catch {}
    }
  }

  for (const path of pathsToTry) {
    if (path === '/') continue;
    if (Date.now() - START_MS > HARD_STOP_MS) break;
    const target = new URL(path, baseUrl).toString();
    const r = await scrapeOneUrl(context, target, { waitLonger: false });
    pathTried.push({ path, ...r });
    if (r.cf_challenge) cfChallenge = true;
    if (r.error) continue;
    const pageEmails = extractEmails(r.bodyText + '\n' + r.bodyHtml);
    if (pageEmails.length) {
      for (const e of pageEmails) emails.add(e);
      anyHitUrl = anyHitUrl || target;
    }
    const pagePhones = extractPhones(r.bodyText + '\n' + r.bodyHtml);
    for (const p of pagePhones) phoneCounts.set(p, (phoneCounts.get(p) || 0) + 1);
  }

  for (const [p, c] of phoneCounts) if (c >= 1) phones.push(p); // accumulated across pages

  const allEmails = [...emails];
  const primaryEmail = pickPrimaryEmail(allEmails, hostK);
  const primaryPhone = phones[0] || null;

  return {
    domain,
    host: baseUrl.host,
    rows: rows.map(r => ({ id: r.id, recycler_code: r.recycler_code, company_name: r.company_name, existing_email: r.email, existing_phone: r.phone })),
    primary_email: primaryEmail,
    primary_phone: primaryPhone,
    all_emails: allEmails,
    all_phones: phones,
    hit_url: anyHitUrl,
    cf_challenge: cfChallenge,
    paths_tried: pathTried.map(p => ({ path: p.path, status: p.status, error: p.error || null, cf: p.cf_challenge || false, bytes: (p.bodyText || '').length })),
  };
}

async function main() {
  // 1. Collect DB candidates (WAF-like big brands) + static list, dedupe by domain.
  console.log('→ querying DB for WAF candidates ...');
  const dbRows = await fetchWafCandidatesFromDb().catch(e => { console.warn('db query failed:', e.message); return []; });
  console.log(`  got ${dbRows.length} DB rows`);

  const domainMap = new Map(); // hostKey -> { domain, rows }
  const addRow = (row) => {
    const u = toUrl(row.website);
    if (!u) return;
    const hk = hostKey(u.host);
    if (!domainMap.has(hk)) domainMap.set(hk, { domain: hk, rows: [] });
    domainMap.get(hk).rows.push(row);
  };
  for (const r of dbRows) addRow(r);

  // Pull rows for static domains too.
  const staticRows = await fetchAllRowsForDomains(STATIC_DOMAINS).catch(() => []);
  for (const r of staticRows) addRow(r);

  // Add any static domain that had no matching recycler row, just so we scrape it.
  for (const d of STATIC_DOMAINS) if (!domainMap.has(hostKey(d))) domainMap.set(hostKey(d), { domain: hostKey(d), rows: [] });

  const allDomains = [...domainMap.values()].slice(0, 60); // safety cap
  console.log(`→ ${allDomains.length} unique domains to scrape`);
  for (const d of allDomains) console.log(`   - ${d.domain}  (${d.rows.length} recycler rows)`);

  // 2. Launch browser.
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
    locale: 'en-IN',
    javaScriptEnabled: true,
    // Reduce cookie-banner noise
    extraHTTPHeaders: {
      'Accept-Language': 'en-IN,en;q=0.9',
    },
  });

  // Block heavy resources to speed up.
  await context.route('**/*', (route) => {
    const t = route.request().resourceType();
    if (t === 'image' || t === 'media' || t === 'font') return route.abort();
    return route.continue();
  });

  const results = [];
  try {
    for (let i = 0; i < allDomains.length; i++) {
      if (Date.now() - START_MS > HARD_STOP_MS) { console.log('→ hard-stop reached, exiting loop'); break; }
      const d = allDomains[i];
      const extraPaths = hostKey(d.domain) === 'jsw.in' ? JSW_SUBPATHS : [];
      const prefix = `[${i + 1}/${allDomains.length}] ${d.domain}`;
      const t0 = Date.now();
      let r;
      try {
        r = await scrapeDomain(context, d.domain, d.rows, { extraPaths });
      } catch (e) {
        r = { domain: d.domain, error: e.message };
      }
      const dt = Date.now() - t0;
      results.push(r);
      const summary = r.error
        ? `✗ ${r.error}`
        : `emails=${r.all_emails?.length || 0}(${r.primary_email || '—'})  phones=${r.all_phones?.length || 0}(${r.primary_phone || '—'})  cf=${r.cf_challenge || false}`;
      console.log(`${prefix} ${summary}  [${dt}ms]`);
      await new Promise(rr => setTimeout(rr, DOMAIN_DELAY_MS));
    }
  } finally {
    await browser.close().catch(() => {});
  }

  // 3. Write raw results.
  try { mkdirSync('/Users/sivakumar/Projects/rotehuegels-website/.buddy', { recursive: true }); } catch {}
  const resultsPath = '/Users/sivakumar/Projects/rotehuegels-website/.buddy/playwright-scrape-results.json';
  writeFileSync(resultsPath, JSON.stringify({
    generated_at: new Date().toISOString(),
    elapsed_ms: Date.now() - START_MS,
    total_domains: allDomains.length,
    scraped: results.length,
    results,
  }, null, 2));
  console.log(`\n→ wrote ${resultsPath}`);

  // 4. Build conservative SQL migration.
  const lines = [];
  lines.push('-- Playwright WAF/SPA scrape — conservative enrichment');
  lines.push(`-- Generated ${new Date().toISOString()}`);
  lines.push('-- Rules:');
  lines.push("--   * Only set email where current email is NULL or matches '@(recycler|placeholder)\\.'");
  lines.push('--   * Only set phone where current phone IS NULL');
  lines.push('--   * COALESCE to never clobber non-placeholder values.');
  lines.push('');
  lines.push('BEGIN;');
  let updateCount = 0;
  for (const r of results) {
    if (r.error) { lines.push(`-- ${r.domain}: ${r.error}`); continue; }
    if (!r.primary_email && !r.primary_phone) { lines.push(`-- ${r.domain}: no primary email or phone extracted`); continue; }
    if (!r.rows || !r.rows.length) { lines.push(`-- ${r.domain}: no recycler rows linked (external/standalone)`); continue; }
    for (const row of r.rows) {
      const parts = [];
      if (r.primary_email) {
        parts.push(`email = COALESCE(NULLIF(email, ''), '${r.primary_email.replace(/'/g, "''")}')`);
      }
      if (r.primary_phone) {
        parts.push(`phone = COALESCE(NULLIF(phone, ''), '${r.primary_phone.replace(/'/g, "''")}')`);
      }
      if (!parts.length) continue;
      const guard = r.primary_email
        ? `(email IS NULL OR email ~* '@(recycler|placeholder)\\.') OR phone IS NULL`
        : `phone IS NULL`;
      lines.push(`UPDATE recyclers SET ${parts.join(', ')} WHERE id = '${row.id}' AND (${guard});  -- ${row.recycler_code} ${r.domain}`);
      updateCount++;
    }
  }
  lines.push('');
  lines.push('COMMIT;');

  const sqlPath = '/Users/sivakumar/Projects/rotehuegels-website/supabase/migrations/20260420_recyclers_playwright_waf.sql';
  writeFileSync(sqlPath, lines.join('\n') + '\n');
  console.log(`→ wrote ${sqlPath} (${updateCount} UPDATE rows)`);

  console.log(`\ntotal_elapsed_ms=${Date.now() - START_MS}`);
}

main().catch(e => { console.error(e); process.exit(1); });
