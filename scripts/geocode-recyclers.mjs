#!/usr/bin/env node
/**
 * Geocode every `recyclers` row that is missing latitude/longitude.
 *
 * Priority order, per user request:
 *   1. Published coords on the company's own website (JSON-LD Place, og:latitude/
 *      og:longitude meta tags, or a Google-Maps URL with @lat,lng / !3dLAT!4dLNG)
 *   2. OSM Nominatim on full address + city + state + pincode
 *   3. OSM Nominatim on city + state
 *   4. OSM Nominatim on pincode alone
 *   5. OSM Nominatim on state alone   (last resort — state centroid)
 *
 * Idempotent. Safe to re-run after interruption. Skips rows that already have
 * coords. Respects Nominatim's 1-req/sec policy with a 1.1s gap.
 *
 * Run with:   node --env-file=.env.local scripts/geocode-recyclers.mjs
 */
import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error('Missing Supabase env vars. Run with: node --env-file=.env.local scripts/geocode-recyclers.mjs');
  process.exit(1);
}

const sb = createClient(URL, KEY, { auth: { persistSession: false } });

const UA = 'Rotehuegels-Recycler-Directory/1.0 (sivakumarshanmugam@outlook.com)';
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_GAP = 1100; // 1 req/sec with a safety buffer
const FETCH_TIMEOUT_MS = 10_000;

let lastNominatim = 0;
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// India bounding box (approx): [west, east, south, north]
const IN_BBOX = [68.0, 97.5, 6.5, 37.5];
const inIndia = (lat, lng) => lng >= IN_BBOX[0] && lng <= IN_BBOX[1] && lat >= IN_BBOX[2] && lat <= IN_BBOX[3];

async function httpFetch(url, opts = {}, timeout = FETCH_TIMEOUT_MS) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeout);
  try {
    const res = await fetch(url, { ...opts, signal: ctl.signal, headers: { 'User-Agent': UA, 'Accept-Language': 'en', ...(opts.headers || {}) } });
    return res;
  } finally {
    clearTimeout(t);
  }
}

async function rateLimitedNominatim(url) {
  const gap = Date.now() - lastNominatim;
  if (gap < NOMINATIM_GAP) await sleep(NOMINATIM_GAP - gap);
  lastNominatim = Date.now();
  const res = await httpFetch(url);
  if (!res.ok) throw new Error(`nominatim ${res.status}`);
  return res.json();
}

const clean = s => (s ? String(s).replace(/\s+/g, ' ').trim() : '');

// ───────────────────────── Website-scraping strategies ────────────────────────
//
// Returns {lat, lng, method} if the company's own site publishes GPS.

function fromGoogleMapsUrl(html) {
  // /maps/@<lat>,<lng>,<zoom> OR !3d<lat>!4d<lng> OR ?q=<lat>,<lng>
  const patterns = [
    /google\.[^/]+\/maps[^"'\s]*?@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
    /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
    /goo\.gl\/maps\/[^"'\s]+/, // short link — can't resolve without following, skip
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1] && m[2]) {
      const lat = Number(m[1]); const lng = Number(m[2]);
      if (inIndia(lat, lng)) return { lat, lng, method: 'gmap-url' };
    }
  }
  return null;
}

function fromMetaTags(html) {
  const lat = html.match(/<meta[^>]*(?:property|name)=["'](?:og:latitude|place:location:latitude|geo\.position)["'][^>]*content=["']([^"']+)["']/i);
  const lng = html.match(/<meta[^>]*(?:property|name)=["'](?:og:longitude|place:location:longitude)["'][^>]*content=["']([^"']+)["']/i);
  if (lat && lng) {
    const la = Number(lat[1]); const ln = Number(lng[1]);
    if (inIndia(la, ln)) return { lat: la, lng: ln, method: 'og-meta' };
  }
  // geo.position sometimes holds "lat;lng"
  const gp = html.match(/<meta[^>]*name=["']geo\.position["'][^>]*content=["']([^"']+)["']/i);
  if (gp) {
    const parts = gp[1].split(/[;, ]+/).map(Number);
    if (parts.length === 2 && inIndia(parts[0], parts[1])) {
      return { lat: parts[0], lng: parts[1], method: 'geo-position' };
    }
  }
  return null;
}

function fromJsonLd(html) {
  // Find <script type="application/ld+json">...</script> and look for geo.latitude / geo.longitude
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const b of blocks) {
    try {
      const json = JSON.parse(b[1].trim());
      const arr = Array.isArray(json) ? json : [json];
      for (const node of arr) {
        const geo = node?.geo;
        const candidates = Array.isArray(geo) ? geo : geo ? [geo] : [];
        if (node?.address && node?.latitude && node?.longitude) {
          candidates.push({ latitude: node.latitude, longitude: node.longitude });
        }
        for (const g of candidates) {
          const la = Number(g?.latitude); const ln = Number(g?.longitude);
          if (Number.isFinite(la) && Number.isFinite(ln) && inIndia(la, ln)) {
            return { lat: la, lng: ln, method: 'json-ld' };
          }
        }
      }
    } catch { /* ignore malformed blocks */ }
  }
  return null;
}

async function geocodeFromWebsite(website) {
  if (!website) return null;
  let url = clean(website);
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  try {
    const res = await httpFetch(url, { redirect: 'follow' }, 8000);
    if (!res.ok) return null;
    const html = await res.text();
    return (
      fromJsonLd(html) ||
      fromMetaTags(html) ||
      fromGoogleMapsUrl(html) ||
      null
    );
  } catch {
    return null;
  }
}

// ─────────────────────────── Nominatim fallback chain ─────────────────────────

function buildQueries(row) {
  const q = [];
  const addr = clean(row.address);
  const city = clean(row.city);
  const state = clean(row.state);
  const pincode = clean(row.pincode);
  const cityDifferent = city && city.toLowerCase() !== state.toLowerCase();

  if (addr && cityDifferent) {
    q.push([addr, city, state, pincode, 'India'].filter(Boolean).join(', '));
  } else if (addr) {
    q.push([addr, state, pincode, 'India'].filter(Boolean).join(', '));
  }
  if (cityDifferent) q.push([city, state, 'India'].filter(Boolean).join(', '));
  if (pincode) q.push([pincode, 'India'].filter(Boolean).join(', '));
  if (state) q.push([state, 'India'].filter(Boolean).join(', '));
  return Array.from(new Set(q));
}

async function geocodeFromNominatim(q) {
  const url = `${NOMINATIM}?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=in&addressdetails=0`;
  try {
    const rows = await rateLimitedNominatim(url);
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const lat = Number(rows[0].lat); const lng = Number(rows[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !inIndia(lat, lng)) return null;
    return { lat, lng, method: 'nominatim' };
  } catch (e) {
    console.warn(`    nominatim error for "${q}": ${e.message}`);
    return null;
  }
}

async function tryAllStrategies(row) {
  // 1. Website scrape (no rate limit — different host each time)
  if (row.website) {
    const hit = await geocodeFromWebsite(row.website);
    if (hit) return { ...hit, query: `website:${row.website}` };
  }
  // 2-5. Nominatim fallback chain
  for (const q of buildQueries(row)) {
    const hit = await geocodeFromNominatim(q);
    if (hit) return { ...hit, query: q };
  }
  return null;
}

// ───────────────────────────────── Driver ─────────────────────────────────────

async function fetchMissing() {
  const all = [];
  let from = 0;
  const size = 1000;
  while (true) {
    const { data, error } = await sb
      .from('recyclers')
      .select('id, recycler_code, company_name, address, city, state, pincode, website')
      .is('latitude', null)
      .eq('is_active', true)
      .range(from, from + size - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < size) break;
    from += size;
  }
  return all;
}

async function main() {
  console.log('Fetching rows missing lat/lng…');
  const rows = await fetchMissing();
  const withSite = rows.filter(r => r.website).length;
  console.log(`Total to geocode: ${rows.length}  (with website: ${withSite}, without: ${rows.length - withSite})\n`);

  const counters = { ok: 0, fail: 0, 'gmap-url': 0, 'og-meta': 0, 'geo-position': 0, 'json-ld': 0, 'nominatim': 0 };
  const t0 = Date.now();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const prefix = `[${String(i + 1).padStart(4)}/${rows.length}] ${r.recycler_code ?? r.id}`;
    const hit = await tryAllStrategies(r);
    if (!hit) { counters.fail++; console.log(`${prefix} ✗ no match`); continue; }
    const { error } = await sb.from('recyclers').update({ latitude: hit.lat, longitude: hit.lng }).eq('id', r.id);
    if (error) { counters.fail++; console.warn(`${prefix} ✗ update error: ${error.message}`); continue; }
    counters.ok++;
    counters[hit.method] = (counters[hit.method] ?? 0) + 1;
    const short = hit.query.length > 60 ? hit.query.slice(0, 57) + '…' : hit.query;
    console.log(`${prefix} ✓ ${hit.lat.toFixed(4)}, ${hit.lng.toFixed(4)}  (${hit.method}) [${short}]`);

    if ((i + 1) % 100 === 0) {
      const elapsed = (Date.now() - t0) / 1000;
      const rate = (i + 1) / elapsed;
      const remaining = (rows.length - i - 1) / rate;
      console.log(`  — progress: ok=${counters.ok} fail=${counters.fail}  elapsed=${(elapsed/60).toFixed(1)}m  ETA=${(remaining/60).toFixed(1)}m\n`);
    }
  }

  const elapsed = (Date.now() - t0) / 1000;
  console.log(`\nDone in ${(elapsed / 60).toFixed(1)} min. ok=${counters.ok}/${rows.length}, fail=${counters.fail}`);
  console.log('Method breakdown:');
  for (const [k, v] of Object.entries(counters)) if (!['ok','fail'].includes(k) && v) console.log(`  ${k}: ${v}`);
}

main().catch(e => { console.error(e); process.exit(1); });
