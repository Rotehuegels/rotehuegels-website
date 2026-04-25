#!/usr/bin/env node
/**
 * Stage 1 — Find official websites for top 300 recyclers.
 *
 * Reads .buddy/stage1-candidates.json → for each row, web-searches
 * (Brave + DDG-lite fallback) and writes results to
 * .buddy/stage1-websites.json and a skipped log at
 * .buddy/website-backfill-skipped.log.
 *
 * Safer + shorter delay than find-websites-bulk.mjs (which is 9 s/row).
 * We target < 15 min for 300 rows → ~3 s/row.
 *
 * CLI:
 *   --limit N       stop after N rows
 *   --min-delay ms  base delay between searches (default 2500)
 *   --timeout-sec N stop when wall-clock hits this (default 900)
 */
import { readFileSync, writeFileSync, appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const ROOT = '/Users/sivakumar/Projects/rotehuegels-website';
const IN   = `${ROOT}/.buddy/stage1-candidates.json`;
const OUT  = `${ROOT}/.buddy/stage1-websites.json`;
const LOG  = `${ROOT}/.buddy/website-backfill-skipped.log`;

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const LIMIT       = parseInt(flag('--limit', '0'), 10);
const MIN_DELAY   = parseInt(flag('--min-delay', '2500'), 10);
const TIMEOUT_SEC = parseInt(flag('--timeout-sec', '900'), 10);

const UAS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
];
const pickUA = () => UAS[Math.floor(Math.random() * UAS.length)];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const TIMEOUT = 18_000;

const BLOCKLIST = new Set([
  'justdial.com','www.justdial.com','indiamart.com','www.indiamart.com',
  'dir.indiamart.com','m.indiamart.com','tradeindia.com','www.tradeindia.com',
  'exportersindia.com','aajjo.com','zaubacorp.com','www.zaubacorp.com',
  'tofler.in','www.tofler.in','cleartax.in','www.cleartax.in',
  'indiafilings.com','www.indiafilings.com','wikipedia.org','en.wikipedia.org',
  'linkedin.com','www.linkedin.com','in.linkedin.com','facebook.com',
  'www.facebook.com','twitter.com','x.com','instagram.com','www.instagram.com',
  'youtube.com','www.youtube.com','bing.com','www.bing.com','google.com',
  'www.google.com','yahoo.com','www.yahoo.com','duckduckgo.com','search.brave.com',
  'brave.com','piceapp.com','knowyourgst.com','mastersindia.co','mastergst.com',
  'screener.in','groww.in','moneycontrol.com','nseindia.com','bseindia.com',
  'cnbc.com','dnb.com','about.me','github.com','medium.com','quora.com',
  'glassdoor.com','glassdoor.co.in','ambitionbox.com','naukri.com','shine.com',
  'monsterindia.com','foundit.in','yellowpages.com','tradeford.com',
  'go4worldbusiness.com','alibaba.com','made-in-china.com',
  'cpcb.nic.in','www.cpcb.nic.in','mpcb.gov.in','tnpcb.gov.in','mahapcb.gov.in',
  'rotehuegels.com','www.rotehuegels.com','nicoex.com','www.nicoex.com',
  'tradewheel.com','thomasnet.com','dnbindia.com','manta.com','yelp.com',
]);

const ALLOWED_TLDS = /\.(in|com|co\.in|net|org|biz|info|io|co)$/i;

async function httpGet(url, ua) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: ctl.signal, redirect: 'follow',
      headers: { 'User-Agent': ua || pickUA(), 'Accept-Language': 'en-IN,en;q=0.9', 'Accept': 'text/html' },
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    return { html: await res.text() };
  } catch (e) { return { error: e.message }; } finally { clearTimeout(t); }
}

function hostOf(u) { try { return new URL(u).host.toLowerCase(); } catch { return null; } }

function nameTokens(name) {
  return String(name).toLowerCase()
    .replace(/\b(pvt|private|ltd|limited|p\.?\s*ltd|\(p\)|llp|inc|corp|company|co)\b/g, '')
    .replace(/\b(unit|plant)\s*[ivx\d-]+/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ').filter(w => w.length >= 3);
}

function hostTokens(host) {
  const base = host.replace(/^www\./, '').split('.')[0];
  return base.replace(/[^a-z0-9]+/g, ' ').split(' ').filter(Boolean);
}

function scoreCandidate(row, host) {
  if (BLOCKLIST.has(host)) return -1;
  if (host.endsWith('.gov.in') || host.endsWith('.nic.in')) return -1;
  if (!ALLOWED_TLDS.test(host)) return -1;
  // PDFs, .doc, forums
  const nt = nameTokens(row.company_name);
  const base = host.replace(/^www\./, '');
  const ht = hostTokens(host).join('').toLowerCase();
  const htSpaced = hostTokens(host).join(' ').toLowerCase();
  let score = 0;
  for (const t of nt) {
    if (ht.includes(t)) score += 3;
    else if (htSpaced.includes(t)) score += 1;
  }
  if (base.split('.').length > 3) score -= 1;
  if (base.endsWith('.in')) score += 1; // prefer .in
  else if (base.endsWith('.com') || base.endsWith('.co.in')) score += 0.5;
  return score;
}

async function braveUrls(query) {
  const url = `https://search.brave.com/search?q=${encodeURIComponent(query)}`;
  const r = await httpGet(url);
  if (r.error) return { error: r.error, urls: [] };
  // Reject CAPTCHA / challenge pages
  if (r.html.includes('Please prove you are a human') || r.html.length < 5000) {
    return { error: 'challenge', urls: [] };
  }
  const hrefs = [];
  const seen = new Set();
  const junkHosts = new Set([
    'search.brave.com','brave.com','cdn.search.brave.com','imgs.search.brave.com',
    'tiles.search.brave.com','fonts.gstatic.com','chrome.google.com','play.google.com',
    'apps.apple.com','marginalia-search.com','search.marginalia.nu','basedbuddy.com',
  ]);
  for (const m of r.html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
    try {
      const u = new URL(m[1]);
      const h = u.host.toLowerCase();
      if (junkHosts.has(h) || h.endsWith('.brave.com')) continue;
      if (seen.has(h)) continue;
      seen.add(h);
      hrefs.push(m[1]);
    } catch {}
    if (hrefs.length >= 18) break;
  }
  return { urls: hrefs };
}

async function ddgLiteUrls(query) {
  const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
  const r = await httpGet(url);
  if (r.error) return { error: r.error, urls: [] };
  if (r.html.includes('anomaly-modal')) return { error: 'ddg-anomaly', urls: [] };
  const hrefs = [];
  const seen = new Set();
  for (const m of r.html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
    try {
      const u = new URL(m[1]);
      const h = u.host.toLowerCase();
      if (h.includes('duckduckgo')) continue;
      if (seen.has(h)) continue;
      seen.add(h);
      hrefs.push(m[1]);
    } catch {}
    if (hrefs.length >= 18) break;
  }
  return { urls: hrefs };
}

async function startpageUrls(query) {
  const url = `https://www.startpage.com/do/search?q=${encodeURIComponent(query)}&cat=web`;
  const r = await httpGet(url);
  if (r.error) return { error: r.error, urls: [] };
  const hrefs = [];
  const seen = new Set();
  for (const m of r.html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
    try {
      const u = new URL(m[1]);
      const h = u.host.toLowerCase();
      if (h.endsWith('startpage.com')) continue;
      if (seen.has(h)) continue;
      seen.add(h);
      hrefs.push(m[1]);
    } catch {}
    if (hrefs.length >= 18) break;
  }
  return { urls: hrefs };
}

async function mojeekUrls(query) {
  const url = `https://www.mojeek.com/search?q=${encodeURIComponent(query)}`;
  const r = await httpGet(url);
  if (r.error) return { error: r.error, urls: [] };
  const hrefs = [];
  const seen = new Set();
  for (const m of r.html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
    try {
      const u = new URL(m[1]);
      const h = u.host.toLowerCase();
      if (h.endsWith('mojeek.com') || h.endsWith('blocksurvey.io') || h.endsWith('mastodon.social') || h.endsWith('buttondown.email')) continue;
      if (seen.has(h)) continue;
      seen.add(h);
      hrefs.push(m[1]);
    } catch {}
    if (hrefs.length >= 18) break;
  }
  return { urls: hrefs };
}

// Per-engine backoff when we get 429 / anomaly.
const backoff = { brave: 0, ddg: 0, startpage: 0, mojeek: 0 };

async function tryEngine(name, q) {
  if (Date.now() < backoff[name]) return { error: `${name}:backoff`, urls: [] };
  const fn = { brave: braveUrls, ddg: ddgLiteUrls, startpage: startpageUrls, mojeek: mojeekUrls }[name];
  const r = await fn(q);
  if (r.error) {
    if (/HTTP 429/.test(r.error) || /anomaly/.test(r.error)) backoff[name] = Date.now() + 120_000;
    return { error: `${name}:${r.error}`, urls: [] };
  }
  return { urls: r.urls };
}

async function searchCandidates(row) {
  const queries = [
    `"${row.company_name}" ${row.city || row.state || ''} official website`.trim(),
    `"${row.company_name}" site:.in`,
  ];
  const all = new Map();
  let lastError = null;
  // Engine rotation — try them in order of availability.
  const engineOrder = ['brave', 'startpage', 'mojeek', 'ddg'];
  for (const q of queries) {
    let gotResults = false;
    for (const eng of engineOrder) {
      const r = await tryEngine(eng, q);
      if (r.error) { lastError = r.error; continue; }
      for (const u of r.urls) {
        const h = hostOf(u);
        if (!h) continue;
        const s = scoreCandidate(row, h);
        if (s < 0) continue;
        const prev = all.get(h);
        if (!prev || s > prev.score) all.set(h, { url: u, score: s });
      }
      gotResults = true;
      break; // only need one engine per query
    }
    if (!gotResults) lastError = lastError || 'all-engines-blocked';
    if ([...all.values()].some(v => v.score >= 3)) break;
    await sleep(500);
  }
  const ranked = [...all.entries()]
    .map(([host, v]) => ({ host, ...v }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Tiebreak: prefer .in over .com
      const aIn = a.host.endsWith('.in'), bIn = b.host.endsWith('.in');
      if (aIn !== bIn) return bIn ? 1 : -1;
      return 0;
    });
  return { candidates: ranked, error: ranked.length ? null : lastError };
}

// Light verification — homepage title must mention at least one name token.
async function verifyHomepage(row, host) {
  const url = `https://${host}/`;
  const r = await httpGet(url);
  if (r.error) return { ok: false, reason: `hp ${r.error}` };
  const html = r.html.slice(0, 300_000); // truncate heavy pages
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').trim().toLowerCase();
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '').replace(/<[^>]+>/g, '').trim().toLowerCase();
  const meta = (html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i)?.[1] || '').toLowerCase();
  const nt = nameTokens(row.company_name);
  // Any meaningful token present
  let hits = 0;
  for (const t of nt) {
    if (title.includes(t) || h1.includes(t) || meta.includes(t)) hits++;
  }
  if (hits === 0) return { ok: false, reason: `no-name-match title="${title.slice(0,80)}"` };
  return { ok: true };
}

async function main() {
  const t0 = Date.now();
  const input = JSON.parse(readFileSync(IN, 'utf-8'));
  let rows = input.stage1;
  if (LIMIT) rows = rows.slice(0, LIMIT);
  console.log(`${rows.length} rows to search (timeout=${TIMEOUT_SEC}s)\n`);

  mkdirSync(dirname(LOG), { recursive: true });

  const results = [];
  let found = 0, rejected = 0, skipped = 0;
  for (let i = 0; i < rows.length; i++) {
    const elapsedSec = (Date.now() - t0) / 1000;
    if (elapsedSec > TIMEOUT_SEC) {
      console.log(`\n⏱  hit ${TIMEOUT_SEC}s cap at row ${i+1}/${rows.length} — stopping gracefully`);
      break;
    }
    const r = rows[i];
    const prefix = `[${String(i+1).padStart(3)}/${rows.length}] ${r.recycler_code.padEnd(14)}`;
    let outRow = { id: r.id, recycler_code: r.recycler_code, company_name: r.company_name, website: null, confidence: null, candidates: [] };
    try {
      const res = await searchCandidates(r);
      if (res.error && !res.candidates.length) {
        skipped++;
        appendFileSync(LOG, `${r.recycler_code}\t${r.company_name}\tsearch-error:${res.error}\n`);
        console.log(`${prefix} ✗ ${res.error}`);
      } else if (!res.candidates.length) {
        skipped++;
        appendFileSync(LOG, `${r.recycler_code}\t${r.company_name}\tno-candidates\n`);
        console.log(`${prefix} ✗ no candidates`);
      } else {
        const best = res.candidates[0];
        const second = res.candidates[1];
        // Low-confidence if best score < 3 or tied with second at high score
        const isTied = second && second.score === best.score && best.score >= 3
          && best.host.replace(/^www\./,'').split('.')[0] !== second.host.replace(/^www\./,'').split('.')[0];
        if (best.score < 3) {
          skipped++;
          appendFileSync(LOG, `${r.recycler_code}\t${r.company_name}\tlow-score=${best.score}\thost=${best.host}\n`);
          console.log(`${prefix} ? low-score=${best.score} ${best.host}`);
        } else if (isTied) {
          skipped++;
          appendFileSync(LOG, `${r.recycler_code}\t${r.company_name}\ttied:${best.host}=${second.host}\n`);
          console.log(`${prefix} ? tie ${best.host}≈${second.host}`);
        } else {
          // Verify homepage title mentions the name
          const v = await verifyHomepage(r, best.host);
          if (!v.ok) {
            rejected++;
            appendFileSync(LOG, `${r.recycler_code}\t${r.company_name}\tverify-fail:${v.reason}\thost=${best.host}\n`);
            console.log(`${prefix} ✗ verify ${v.reason} (${best.host})`);
          } else {
            outRow.website = `https://${best.host.replace(/^https?:\/\//,'')}`;
            outRow.confidence = best.score;
            outRow.candidates = res.candidates.slice(0, 3);
            found++;
            console.log(`${prefix} ✓ ${best.host.padEnd(32)} score=${best.score}`);
          }
        }
      }
    } catch (e) {
      skipped++;
      appendFileSync(LOG, `${r.recycler_code}\t${r.company_name}\texception:${e.message}\n`);
      console.log(`${prefix} ✗ exc ${e.message}`);
    }
    results.push(outRow);
    // Save progress every 10 rows
    if ((i+1) % 10 === 0) {
      writeFileSync(OUT, JSON.stringify({ generated_at: new Date().toISOString(), found, rejected, skipped, results }, null, 2));
    }
    // jitter delay
    await sleep(MIN_DELAY + Math.floor(Math.random() * 800));
  }

  const elapsed = Math.round((Date.now() - t0) / 1000);
  writeFileSync(OUT, JSON.stringify({
    generated_at: new Date().toISOString(),
    elapsed_sec: elapsed,
    total_input: rows.length,
    found, rejected, skipped,
    results,
  }, null, 2));
  console.log(`\n✓ ${OUT}`);
  console.log(`  found=${found} rejected=${rejected} skipped=${skipped} elapsed=${elapsed}s`);
}

main().catch(e => { console.error(e); process.exit(1); });
