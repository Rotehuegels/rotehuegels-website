#!/usr/bin/env node
/**
 * Set latitude/longitude for the 52 EV OEMs + battery-pack + cell/CAM
 * rows that were seeded without GPS. Coordinates are plant-level
 * (factory location, not city centre) where publicly known; otherwise
 * HQ / announced-site coordinates with a note in the log.
 *
 * Run: node --env-file=.env.local scripts/update-ev-chain-gps.mjs [--dry-run]
 */
import { createClient } from '@supabase/supabase-js';

const DRY = process.argv.includes('--dry-run');
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

// [lat, lng] — plant-level where known, HQ otherwise.
const GPS = {
  // ── EV OEMs ────────────────────────────────────────────────────
  'EVOEM-AP-001': [14.6508, 77.6013],  // Kia Anantapur Plant
  'EVOEM-DL-001': [13.2128, 79.0928],  // Hero VIDA Chittoor Plant
  'EVOEM-DL-002': [28.3600, 76.9470],  // Revolt Manesar Plant
  'EVOEM-DL-003': [28.1312, 77.3221],  // Euler Palwal Plant
  'EVOEM-DL-004': [30.9569, 76.7902],  // Okaya EV Baddi Plant
  'EVOEM-GJ-001': [22.4929, 73.4668],  // MG Motor Halol Plant
  'EVOEM-GJ-002': [23.3078, 71.9625],  // Suzuki Hansalpur Plant
  'EVOEM-GJ-003': [23.1089, 72.5767],  // Matter Khodiyar Ahmedabad
  'EVOEM-HR-001': [12.8395, 80.0479],  // BMW Chennai (CKD)
  'EVOEM-HR-002': [28.1997, 76.8575],  // Okinawa Bhiwadi Plant
  'EVOEM-HR-003': [28.4376, 77.0430],  // Volvo Gurugram HQ
  'EVOEM-HR-004': [22.4929, 73.4668],  // JSW MG Halol (JV)
  'EVOEM-KA-001': [12.4684, 77.7816],  // Ola Futurefactory Krishnagiri
  'EVOEM-KA-002': [12.7431, 77.8119],  // Ather Hosur Plant
  'EVOEM-KA-003': [12.9397, 77.6266],  // Bounce Bengaluru HQ
  'EVOEM-KA-004': [12.5685, 77.8428],  // Simple Energy Shoolagiri
  'EVOEM-MH-001': [18.6289, 73.7923],  // Tata Motors Pimpri Pune EV Plant
  'EVOEM-MH-002': [18.7783, 73.8555],  // Mahindra Chakan EV Plant
  'EVOEM-MH-003': [18.7805, 73.8566],  // Mercedes-Benz Chakan Plant
  'EVOEM-MH-004': [18.7813, 73.8572],  // Skoda/VW/Audi Chakan Plant
  'EVOEM-PN-001': [18.6501, 73.7728],  // Bajaj Akurdi Chetak Plant
  'EVOEM-TN-001': [12.7220, 77.8250],  // TVS Motor Hosur Plant
  'EVOEM-TN-002': [12.9634, 79.9400],  // Hyundai Sriperumbudur Plant
  'EVOEM-TN-003': [13.2340, 80.3240],  // Ashok Leyland Ennore Plant
  'EVOEM-TN-004': [12.9235, 79.3330],  // Greaves/Ampere Ranipet Plant
  'EVOEM-TN-005': [12.8260, 79.9200],  // Renault-Nissan Oragadam Plant
  'EVOEM-TN-006': [12.8260, 79.9200],  // Nissan Oragadam
  'EVOEM-TS-001': [17.4760, 77.9870],  // Olectra Sangareddy Bus Plant

  // ── Battery Pack Makers ────────────────────────────────────────
  'BPACK-AP-001': [16.7170, 78.1220],  // Amara Raja Divitipalli Giga Corridor
  'BPACK-DL-001': [28.4595, 77.0266],  // Battery Smart Gurugram Operations
  'BPACK-DL-002': [28.6358, 77.2245],  // Okaya Delhi HQ
  'BPACK-DL-003': [28.6358, 77.2245],  // Chargeup Delhi HQ
  'BPACK-HR-001': [28.8765, 77.1148],  // iPower Kundli Plant
  'BPACK-KA-001': [12.9879, 77.7133],  // SUN Mobility Doddanekundi HQ
  'BPACK-MH-001': [19.0764, 72.8777],  // Waaree Mumbai HQ
  'BPACK-MH-002': [18.5479, 73.8207],  // Tata AutoComp Pune HQ
  'BPACK-TG-001': [17.3850, 78.4870],  // RACEnergy Hyderabad Pack Plant
  'BPACK-TN-001': [12.5186, 78.2137],  // Delta Krishnagiri Plant
  'BPACK-UP-001': [28.6072, 77.3463],  // Livguard Noida Plant
  'BPACK-WB-001': [22.5408, 88.3614],  // Exide House Kolkata HQ

  // ── Cell / CAM Makers ──────────────────────────────────────────
  'CELL-GJ-001': [22.3000, 69.7600],   // Reliance Jamnagar Giga Complex
  'CELL-KA-001': [12.7865, 77.6382],   // Log9 Jigani Bengaluru
  'CELL-KA-002': [12.7870, 77.5852],   // Exide Energy Bengaluru Giga
  'CELL-KA-003': [12.9716, 77.5946],   // Rajesh Exports KA — announced Bengaluru
  'CELL-MH-001': [21.1458, 79.0882],   // JSW Neo Energy Nagpur (planned)
  'CELL-MH-002': [18.5479, 73.8207],   // Tata AutoComp Gotion Pune JV
  'CELL-TG-001': [17.3850, 78.4870],   // BGR Mining Hyderabad HQ
  'CELL-TN-002': [13.0827, 80.2707],   // Panasonic Carbon Chennai
  'CAM-GJ-001':  [22.2400, 72.1500],   // Tata Chemicals Dholera Li-ion + CAM
  'CAM-KA-001':  [15.1394, 76.9214],   // Epsilon Bellari CAM
  'CAM-TG-001':  [17.3850, 78.4870],   // Altmin Telangana LFP Gigafactory (announced)
  'CAM-WB-001':  [22.5750, 88.4050],   // Himadri Kolkata HQ
};

let updated = 0, skipped = 0, failed = 0;
for (const [code, [lat, lng]] of Object.entries(GPS)) {
  const { data: row, error: selErr } = await sb
    .from('recyclers')
    .select('id, recycler_code, company_name, latitude, longitude')
    .eq('recycler_code', code)
    .maybeSingle();
  if (selErr) { console.log(`✗ ${code}: ${selErr.message}`); failed++; continue; }
  if (!row)   { console.log(`✗ ${code}: not found`); skipped++; continue; }
  if (row.latitude != null && row.longitude != null) {
    console.log(`- ${code}: already has GPS (${row.latitude}, ${row.longitude}) — skipping`);
    skipped++;
    continue;
  }
  if (DRY) {
    console.log(`~ ${code.padEnd(14)} ${lat.toFixed(4)}, ${lng.toFixed(4)}  — ${row.company_name}`);
    updated++;
    continue;
  }
  const { error } = await sb.from('recyclers')
    .update({ latitude: lat, longitude: lng })
    .eq('id', row.id);
  if (error) { console.log(`✗ ${code}: ${error.message}`); failed++; continue; }
  updated++;
  console.log(`✓ ${code.padEnd(14)} ${lat.toFixed(4)}, ${lng.toFixed(4)}  — ${row.company_name}`);
}

console.log(`\n${DRY ? 'DRY RUN — ' : ''}updated ${updated}, skipped ${skipped}, failed ${failed}`);
