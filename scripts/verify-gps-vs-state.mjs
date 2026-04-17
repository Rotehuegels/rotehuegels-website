#!/usr/bin/env node
/**
 * Sanity-check every row's GPS against its declared state. Flags rows
 * where the (lat, lng) falls outside the state's approximate bounding
 * box — likely sign of a data-entry or geocoding error (e.g. BatX Pune
 * → Gurugram that we just found).
 *
 * Run: node --env-file=.env.local scripts/verify-gps-vs-state.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) { console.error('Missing env'); process.exit(1); }
const sb = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } });

// State → [minLat, maxLat, minLng, maxLng] with generous padding so border
// towns don't false-flag. Source: approximate bboxes from standard India
// state outlines; padded ±0.3° which is ~33 km.
const STATE_BBOX = {
  'Andhra Pradesh':    [12.5, 19.9, 76.5, 84.8],
  'Arunachal Pradesh': [26.5, 29.6, 91.3, 97.7],
  'Assam':             [24.0, 28.3, 89.6, 96.1],
  'Bihar':             [24.2, 27.6, 83.1, 88.3],
  'Chhattisgarh':      [17.5, 24.4, 80.1, 84.8],
  'Delhi':             [28.3, 29.0, 76.7, 77.5],
  'Goa':               [14.5, 15.9, 73.5, 74.4],
  'Gujarat':           [20.0, 24.9, 68.0, 74.8],
  'Haryana':           [27.5, 31.1, 74.2, 77.8],
  'Himachal Pradesh':  [30.2, 33.3, 75.4, 79.1],
  'Jammu & Kashmir':   [32.1, 37.2, 72.4, 80.4],
  'Jharkhand':         [21.7, 25.6, 83.2, 87.9],
  'Karnataka':         [11.3, 18.7, 74.0, 78.7],
  'Kerala':            [8.0,  13.0, 74.6, 77.5],
  'Ladakh':            [32.2, 36.2, 75.9, 80.4],
  'Madhya Pradesh':    [21.0, 26.9, 74.0, 82.8],
  'Maharashtra':       [15.4, 22.3, 72.3, 80.9],
  'Manipur':           [23.5, 25.9, 92.8, 95.0],
  'Meghalaya':         [24.9, 26.6, 89.6, 92.9],
  'Mizoram':           [21.7, 24.6, 92.2, 93.7],
  'Nagaland':          [25.3, 27.3, 93.1, 95.7],
  'Odisha':            [17.5, 22.8, 81.1, 87.9],
  'Puducherry':        [10.5, 12.3, 79.4, 79.9],
  'Punjab':            [29.2, 32.6, 73.6, 77.0],
  'Rajasthan':         [22.9, 30.5, 68.9, 78.6],
  'Sikkim':            [26.9, 28.4, 87.7, 88.9],
  'Tamil Nadu':        [7.9,  13.7, 76.1, 80.6],
  'Telangana':         [15.5, 19.9, 77.0, 81.4],
  'Tripura':           [22.7, 24.7, 90.9, 92.6],
  'Uttar Pradesh':     [23.6, 31.0, 77.0, 84.9],
  'Uttarakhand':       [28.6, 31.6, 77.3, 81.4],
  'West Bengal':       [21.4, 27.2, 85.5, 89.9],
};

function inBbox(lat, lng, [a, b, c, d]) {
  return lat >= a && lat <= b && lng >= c && lng <= d;
}

async function main() {
  let all = [];
  let from = 0;
  const size = 1000;
  while (true) {
    const { data, error } = await sb
      .from('recyclers')
      .select('id, recycler_code, company_name, state, latitude, longitude, capacity_per_month, website')
      .eq('is_active', true)
      .not('latitude', 'is', null)
      .not('state', 'is', null)
      .range(from, from + size - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < size) break;
    from += size;
  }
  console.log(`Scanning ${all.length} rows\n`);

  const mismatches = [];
  const unknown = new Set();
  for (const r of all) {
    const bbox = STATE_BBOX[r.state];
    if (!bbox) { unknown.add(r.state); continue; }
    const lat = Number(r.latitude), lng = Number(r.longitude);
    if (!inBbox(lat, lng, bbox)) {
      mismatches.push({ ...r, lat, lng });
    }
  }

  if (unknown.size) console.log('Unknown states (skipped):', [...unknown].join(', '), '\n');

  // Sort by capacity DESC (prioritise big facilities)
  const parseCap = (s) => {
    if (!s) return 0;
    const m = String(s).match(/([\d,]+(?:\.\d+)?)/);
    return m ? parseFloat(m[1].replace(/,/g, '')) : 0;
  };
  mismatches.sort((a, b) => parseCap(b.capacity_per_month) - parseCap(a.capacity_per_month));

  console.log(`Found ${mismatches.length} rows where GPS falls outside declared state bbox:\n`);
  for (const m of mismatches) {
    const cap = m.capacity_per_month ?? '-';
    console.log(`  ${m.recycler_code.padEnd(14)} | state=${m.state.padEnd(18)} | GPS=${m.lat.toFixed(2)},${m.lng.toFixed(2).padEnd(6)} | cap=${String(cap).padEnd(14)} | ${m.company_name.slice(0, 50)}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
