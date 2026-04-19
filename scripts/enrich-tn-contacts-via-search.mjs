#!/usr/bin/env node
/**
 * For every Tamil Nadu active row still missing email AND phone, run a
 * DuckDuckGo search for "<company> <city> <state> contact", parse emails
 * and Indian phones from the results page + the top 2 result URLs, and
 * merge anything we find into contacts_all.
 *
 * Re-run safe — dedupe by (email|phone|name+source).
 *
 * Run: node --env-file=.env.local scripts/enrich-tn-contacts-via-search.mjs [--dry-run] [--limit=N]
 */
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const DRY = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');
const LIMIT = (() => {
  const a = process.argv.find(s => s.startsWith('--limit='));
  return a ? parseInt(a.split('=')[1], 10) : Infinity;
})();
const vlog = (...a) => { if (VERBOSE) console.log('   ', ...a); };

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const FETCH_TIMEOUT_MS = 15_000;
const SEARCH_THROTTLE_MS = 3500;
const PAGE_THROTTLE_MS = 800;

const SOURCE = 'web-search';
const TODAY = new Date().toISOString().slice(0, 10);

const BAD_EMAIL_DOMAINS = new Set([
  'sentry.io','wordpress.com','wix.com','godaddy.com','cloudflare.com',
  'example.com','domain.com','yourdomain.com','test.com',
  'duckduckgo.com','google.com','bing.com','yahoo.com',
  'youtube.com','facebook.com','twitter.com','instagram.com','linkedin.com',
  'justdial.com','indiamart.com','tradeindia.com','tofler.in','zaubacorp.com',
  'mca.gov.in','gstincheck.co.in','rotehuegels.com',
  'companydetails.in','mycorporateinfo.com','indialei.in','wintro.in','infoqik.com',
  'imimg.com','googleapis.com','gstatic.com',
]);

// IndiaMart's virtual call-masking numbers — not the company's real phone.
const PHONE_BLOCK_PREFIXES = ['8044566', '9152111', '9686002', '8061000', '8048967'];

// Crude code-fragment filter — e.g. "@Context.Request.Path".
function looksLikeCode(email) {
  const local = email.split('@')[0];
  const domain = email.split('@')[1];
  if (/^[A-Z]/.test(domain) || /\.Request|\.Response|\.Path|\.Context/i.test(domain)) return true;
  if (/[{}]/.test(local) || /[{}]/.test(domain)) return true;
  return false;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function httpGet(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctl.signal, redirect: 'follow',
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-IN,en;q=0.9',
      },
    });
    if (!res.ok) return { error: `HTTP ${res.status}`, finalUrl: res.url };
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html') && !ct.includes('xml')) return { error: `ct=${ct}`, finalUrl: res.url };
    return { html: await res.text(), finalUrl: res.url };
  } catch (e) { return { error: e.message, finalUrl: url }; } finally { clearTimeout(t); }
}

// Allow business aggregators (indiamart, justdial, tofler, zaubacorp) — those
// are the primary source of small Indian recycler contacts. The hasNameMention
// check below still keeps us honest: we'll only extract from pages that
// actually mention the company we're searching for.
const SKIP_HOSTS = [
  'facebook.com','twitter.com','x.com','linkedin.com','youtube.com','instagram.com',
  'google.com','bing.com','microsoft.com','wikipedia.org','pinterest.com',
  'scribd.com','slideshare.net','issuu.com','imimg.com',
  'zaubacorp.com',  // 403s always
];

// Decode Bing's ck/a redirect URLs. Format: `?u=a1<base64url-encoded target>`
function decodeBingUrl(url) {
  try {
    const u = new URL(url);
    if (u.host !== 'www.bing.com' && u.host !== 'bing.com') return url;
    if (!u.pathname.startsWith('/ck/')) return url;
    const param = u.searchParams.get('u');
    if (!param) return url;
    // Bing encodes the URL as "a1" + base64url of the URL
    const b64 = param.startsWith('a1') ? param.slice(2) : param;
    const padded = b64 + '==='.slice((b64.length + 3) % 4);
    const decoded = Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    return /^https?:\/\//.test(decoded) ? decoded : url;
  } catch { return url; }
}
function isSkippedHost(urlStr) {
  try {
    const host = new URL(urlStr).host.replace(/^www\./, '');
    return SKIP_HOSTS.some(d => host === d || host.endsWith('.' + d));
  } catch { return true; }
}

function extractEmails(text) {
  const re = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,24}/g;
  const out = new Set();
  let m;
  while ((m = re.exec(text)) !== null) {
    const raw = m[0];
    if (looksLikeCode(raw)) continue;
    const a = raw.toLowerCase();
    if (/\.(png|jpg|jpeg|gif|svg|webp|js|css|woff|ico|pdf|zip)$/i.test(a)) continue;
    if (a.startsWith('noreply@') || a.startsWith('no-reply@') || a.startsWith('donotreply@')) continue;
    if (a.startsWith('wordpress@') || a.startsWith('webmaster@')) continue;
    const domain = a.split('@')[1];
    if (BAD_EMAIL_DOMAINS.has(domain)) continue;
    out.add(a);
  }
  return [...out];
}

function normPhone(raw) {
  let d = String(raw).replace(/\D/g, '');
  if (d.startsWith('91') && d.length === 12) d = d.slice(2);
  if (d.startsWith('0') && d.length === 11) d = d.slice(1);
  if (d.length === 10 && /^[6-9]/.test(d)) return '+91' + d;
  return null;
}

function extractPhones(text) {
  const out = new Set();
  for (const m of text.matchAll(/href=["']tel:([+\d\s\-().]+)["']/gi)) {
    const n = normPhone(m[1]);
    if (n) out.add(n);
  }
  for (const m of text.matchAll(/\+?91[\s\-().]{0,3}([6-9]\d{9})/g)) {
    const n = normPhone(m[1]);
    if (n) out.add(n);
  }
  for (const m of text.matchAll(/(?<![\d+])[6-9]\d{9}(?![\d])/g)) {
    const n = normPhone(m[0]);
    if (n) out.add(n);
  }
  // Filter IndiaMart / aggregator virtual numbers
  return [...out].filter(p => !PHONE_BLOCK_PREFIXES.some(pfx => p.replace(/^\+91/, '').startsWith(pfx)));
}

// Return windows of text around each name-token occurrence that ALSO contain
// a Tamil Nadu geographic anchor (state name, city, or common TN-specific
// term) — filters out unrelated brand hits like Delta Electronics (China)
// or Bridge Green (Tuscany tourism).
const TN_ANCHORS = ['tamil nadu', 'tamilnadu', 'chennai', 'coimbatore', 'trichy', 'tiruchirappalli', 'madurai', 'salem', 'erode', 'hosur', 'vellore', 'kanchipuram', 'tiruvallur', 'gummidipoondi', 'ranipet', 'oragadam', 'sriperumbudur', 'ambattur', 'tambaram', 'krishnagiri', 'dharmapuri', 'sipcot', 'ennore', 'namakkal', 'musiri'];

function windowsAroundName(html, nameTokens, city, radius = 800) {
  if (nameTokens.length < 1) return [];
  const lc = html.toLowerCase();
  const anchors = [...TN_ANCHORS];
  if (city) anchors.push(String(city).toLowerCase());

  const hits = new Set();
  for (const tok of nameTokens) {
    let idx = 0;
    while ((idx = lc.indexOf(tok, idx)) !== -1) {
      hits.add(idx);
      idx += tok.length;
      if (hits.size > 20) break;
    }
  }
  const out = [];
  for (const h of hits) {
    const win = html.slice(Math.max(0, h - radius), h + radius);
    const winLc = win.toLowerCase();
    // Must also mention a TN geographic anchor within the same window.
    if (!anchors.some(a => winLc.includes(a))) continue;
    out.push(win);
  }
  return out;
}

// Parse Bing HTML result page → top N result URLs (may be bing.com/ck/a redirects).
function parseBingResults(html) {
  const urls = [];
  const liRe = /<li class="b_algo"[\s\S]*?<\/li>/g;
  const hrefRe = /<h2[^>]*>\s*<a[^>]+href="([^"]+)"/;
  let li;
  while ((li = liRe.exec(html)) !== null) {
    const h = li[0].match(hrefRe);
    if (!h) continue;
    const href = h[1].replace(/&amp;/g, '&');
    try {
      const parsed = new URL(href);
      if (!/^https?:$/.test(parsed.protocol)) continue;
      urls.push(href);
    } catch {}
    if (urls.length >= 5) break;  // fetch 5 to compensate for skipped/dead ones
  }
  return urls;
}

async function searchBing(query) {
  const url = 'https://www.bing.com/search?q=' + encodeURIComponent(query) + '&setmkt=en-IN';
  const r = await httpGet(url);
  if (r.error) return { error: r.error, urls: [], html: '' };
  return { urls: parseBingResults(r.html), html: r.html };
}

const normEmailKey = (e) => e?.toLowerCase().trim();
const normPhoneKey = (p) => p?.replace(/\D/g, '').replace(/^91/, '');

function mergeContacts(existing, rows) {
  const out = [...(existing ?? [])];
  const keys = new Set(out.map(c => [normEmailKey(c.email), normPhoneKey(c.phone), `${c.name}|${c.source}`].filter(Boolean).join('::')));
  let added = 0;
  for (const c of rows) {
    const k = [normEmailKey(c.email), normPhoneKey(c.phone), c.name && `${c.name}|${c.source}`].filter(Boolean).join('::');
    if (!k || keys.has(k)) continue;
    keys.add(k); out.push(c); added++;
  }
  return { merged: out, added };
}

const isPlaceholder = (e) => !e || /placeholder|^cpcb\.|^mrai\.|^bm\.|@placeholder/i.test(String(e));
const realStr = (v) => v && String(v).trim() !== '' && !isPlaceholder(v);
const contactsArr = (c) => Array.isArray(c) ? c : [];

// Strip corporate suffixes so the quoted search term isn't over-specific.
function cleanCompanyForQuery(name) {
  return String(name)
    .replace(/\b(pvt|private|ltd|limited|llp|inc|corp|corporation|co)\b\.?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[.,]+$/, '')
    .trim();
}

// Load TN rows that lack email OR phone.
const targets = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await sb.from('recyclers')
    .select('id, recycler_code, company_name, state, city, email, phone, contacts_all')
    .eq('is_active', true).eq('state', 'Tamil Nadu')
    .order('recycler_code')
    .range(from, from + 999);
  if (error) { console.error(error.message); process.exit(1); }
  if (!data?.length) break;
  targets.push(...data);
  if (data.length < 1000) break;
}

const missing = targets.filter(t => {
  const ca = contactsArr(t.contacts_all);
  const hasEmail = realStr(t.email) || ca.some(c => realStr(c.email));
  const hasPhone = realStr(t.phone) || ca.some(c => realStr(c.phone));
  return !hasEmail || !hasPhone;
});

console.log(`TN active rows: ${targets.length}`);
console.log(`TN rows missing email OR phone: ${missing.length}`);
if (LIMIT < Infinity) console.log(`Processing first ${Math.min(LIMIT, missing.length)} (--limit)`);

let filled = 0, partial = 0, empty = 0, failed = 0;
const processed = missing.slice(0, LIMIT);

for (let i = 0; i < processed.length; i++) {
  const r = processed[i];
  const label = `[${String(i + 1).padStart(2)}/${processed.length}] ${r.recycler_code}`;
  const cleanName = cleanCompanyForQuery(r.company_name);
  const city = r.city ? r.city + ' ' : '';
  const query = `"${cleanName}" ${city}Tamil Nadu contact`;

  vlog(`query: ${query}`);
  const search = await searchBing(query);
  if (search.error) { failed++; console.log(`${label} ✗ search: ${search.error}`); await sleep(SEARCH_THROTTLE_MS); continue; }
  vlog(`bing returned ${search.urls.length} URLs`);

  // DON'T extract from SERP itself — Bing injects unrelated map cards.
  // Only mine pages whose content actually mentions the company name.
  const emails = new Set();
  const phones = new Set();
  const sourcesChecked = [];

  // Build a distinctive-token check from the company name (drop generic words).
  const NAME_NOISE = new Set(['the','and','of','pvt','private','ltd','limited','llp','inc','corp','company','co','group','india','metals','metal','industries','industry','enterprises','enterprise','recyclers','recycler','recycling','scrap','traders','trader']);
  const nameTokens = String(r.company_name).toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(w => w.length >= 4 && !NAME_NOISE.has(w));
  const hasNameMention = (html) => {
    if (!nameTokens.length) return false;
    const lc = html.toLowerCase();
    // Require at least the first distinctive token to appear on the page.
    return nameTokens.slice(0, 2).some(tok => lc.includes(tok));
  };

  let fetched = 0;
  for (const rawUrl of search.urls) {
    if (fetched >= 3) break;
    const target = decodeBingUrl(rawUrl);
    if (isSkippedHost(target)) { vlog(`skip host: ${target.slice(0, 60)}`); continue; }
    await sleep(PAGE_THROTTLE_MS);
    const page = await httpGet(target);
    if (page.error) { vlog(`fetch err: ${page.error}  ${target.slice(0, 60)}`); continue; }
    fetched++;
    const windows = windowsAroundName(page.html, nameTokens, r.city);
    vlog(`page ${target.slice(0,60)} len=${page.html.length} windows=${windows.length} tokens=${nameTokens.join(',')}`);
    if (!windows.length) continue;
    const combined = windows.join('\n');
    const e = extractEmails(combined);
    const p = extractPhones(combined);
    vlog(`  emails: ${e.length}  phones: ${p.length}`);
    for (const x of e) emails.add(x);
    for (const x of p) phones.add(x);
    sourcesChecked.push(page.finalUrl ?? target);
  }

  // Filter out domain-mismatched emails that look like third-party aggregators.
  const goodEmails = [...emails].filter(e => {
    const d = e.split('@')[1];
    return !BAD_EMAIL_DOMAINS.has(d);
  });
  const goodPhones = [...phones];

  if (!goodEmails.length && !goodPhones.length) {
    empty++;
    console.log(`${label} — no contacts found`);
    await sleep(SEARCH_THROTTLE_MS);
    continue;
  }

  // Build rows for contacts_all (name=null — aggregated mailboxes/numbers).
  const rows = [];
  for (const e of goodEmails) rows.push({ name: null, title: null, department: null, email: e, phone: null, source: SOURCE, first_seen: TODAY });
  for (const p of goodPhones) rows.push({ name: null, title: null, department: null, email: null, phone: p, source: SOURCE, first_seen: TODAY });

  const { merged, added } = mergeContacts(r.contacts_all, rows);

  const update = {};
  if (added) update.contacts_all = merged;
  if (!realStr(r.email) && goodEmails.length) {
    const corp = goodEmails.find(e => !/@(gmail|yahoo|hotmail|outlook|live|rediffmail)\./i.test(e));
    update.email = (corp ?? goodEmails[0]);
  }
  if (!realStr(r.phone) && goodPhones.length) {
    update.phone = goodPhones[0];
  }

  if (!Object.keys(update).length) {
    empty++;
    console.log(`${label} — all dup`);
    await sleep(SEARCH_THROTTLE_MS);
    continue;
  }

  const parts = [];
  if (update.email) parts.push(`email=${update.email}`);
  if (update.phone) parts.push(`phone=${update.phone}`);
  if (added) parts.push(`+${added} contacts`);

  if (DRY) {
    console.log(`${label} ~ ${parts.join(' ')}`);
    partial++;
  } else {
    const { error } = await sb.from('recyclers').update(update).eq('id', r.id);
    if (error) { failed++; console.log(`${label} ✗ db: ${error.message}`); }
    else {
      if (update.email && update.phone) filled++; else partial++;
      console.log(`${label} ✓ ${parts.join(' ')}`);
    }
  }

  await sleep(SEARCH_THROTTLE_MS);
}

console.log(`\n${DRY ? 'DRY RUN — ' : ''}fully filled ${filled}, partial ${partial}, empty ${empty}, failed ${failed}`);
