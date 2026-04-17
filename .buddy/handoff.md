# Buddy Handoff → Next Session
Generated: 2026-04-17 (evening, autonomous run while user away)
Agent: Claude (Opus 4.7, 1M context)

## Completed This Session — dense, lots of ground covered

### Recycler directory (the big one)
- **38 black-mass producers** surfaced (from 0 → 38) across 11 states, ~69,000 MTA combined — 6 pure-mechanical shredders + 8 integrated recyclers flagged via new `black_mass_mta` column + 10 new dedicated entries (Cerberus, LiRem, Evren/Raasi, Enviro Hub India, Eon Lithium, GreenTek Reman, Greenwaves, Remine, Salvex, Cellectric) + Tata Chemicals Dholera, Nulife Power, BatX, Revos, Ecoreco
- **21 primary metal producers** (HZL, Hindalco, NALCO, Vedanta Al, BALCO, HCL, Adani Copper, JSW Al) seeded with plant-level rows + CIN + GPS
- **Runaya Group** (3 entities)
- **10 missing majors** (Cero/Mahindra-MSTC, Tata Re.Wi.Re, Re Sustainability / Ramky, GEM Enviro, Saahas Zero Waste, Epsilon Advanced Materials, plus 4 tangential — Binani, Electrotherm, Trimex, Manaksia)
- **100 % GPS coverage** — all 1,261+ active facilities now have lat/lng (scraper: ~1,228 rows in ~70 min, plus hand-seeded primaries)
- **State + address corrections** — BatX Pune → Gurugram (verified from batxenergies.com), Bridge Green upcoming plant Navallur → Maraimalai Nagar, nicoex.com malicious domain stripped
- **Capacity dedup** — 9 rows flagged with `[dup]` disclaimer notes, ~7,298 MTA double-counting removed (CBS, E-Recon, Nagraj, Solapur + cross-category Gravita, Moogambigai, K.G. Metalloys)
- **New schema**: cin, latitude, longitude, black_mass_mta columns with indexes

### Map improvements (both SVG choropleth + new Leaflet Live Map)
- Calibrated affine projection (23 state centroids, RDP-fitted, ±40 km national-scale)
- Polygon-snap post-hoc correction (pins outside their state polygon snap in)
- Wheel zoom + drag pan + scale slider + reset (1×–20×)
- **Live Map** built on Leaflet with:
  - OSM / Esri Satellite / Carto Dark tile base layers
  - **Survey of India / Bhuvan-ISRO boundaries overlay** (checked-by-default so Govt of India's official J&K / Ladakh / Arunachal borders render even on international base tiles)
  - State-level choropleth overlay (RDP-simplified district GeoJSON dissolved into 35 state MultiPolygons, 457 KB, lazy-loaded)
  - Marker clustering (react-leaflet-cluster — pins collapse at low zoom, colour-coded by count)
  - Facility-level pins at real GPS (sub-metre accuracy on Leaflet vs ±40 km on SVG)
- Directory page widened from `max-w-5xl` → `max-w-[1800px]`
- Primary-producer positioning fix on directory heading

### Dashboards / ERP
- **GRN detail + new pages** (`/d/grn/[id]`, `/d/grn/new`) — were empty folders throwing 404s
- **GRN PDF export** with Print + Download buttons (shared pdfTemplate styling)
- **EWB detail page** (`/d/eway-bills/[id]`) — Part A vs Part A+B differentiation, expiry banner, linked order link, from/to address cards
- **EWB list page** — new "Part B Pending" stat card, status cell distinguishes "Part A only" (amber) vs "Valid" (green) vs "Expired" (red)
- **[dup] disclaimer badges** on dashboard recycler list (yellow AlertTriangle)

### AI chat
- COMPANY_CONTEXT now knows the recycling platform — all 7 categories, ~1,260 facilities, 28 states, all public URLs, tile layers, data sources
- Hard rule: never recite specific recycler contacts/CIN/GSTIN from memory — always direct users to the live public directory
- Sales agent owns all recycling-platform queries
- Supplier agent routes recycling-facility registrations to Sales
- Only answers from public data; stays strictly on-topic

### Tools built
- `scripts/geocode-recyclers.mjs` — Nominatim + website-JSON-LD/og/Google-Maps fallback chain, capacity-ordered, idempotent, DOMAIN_BLOCKLIST
- `scripts/enrich-contacts-from-website.mjs` — homepage + /contact/+ /about scrape for emails/phones, Chrome UA, DOMAIN_BLOCKLIST
- `scripts/enrich-gstin.mjs` — GSTIN regex scrape from websites (found 1 / 70 — low yield by design; most sites don't display GSTIN)
- `scripts/verify-gps-vs-state.mjs` — sanity-check row lat/lng against declared state bbox
- `scripts/seed-psu-gstins.mjs` — candidate-GSTIN validation via GSTINCHECK API
- `scripts/import-gstins-from-tally.mjs` — **CSV importer ready for Tally Prime ledger export** (user buying 2,500 credits at ₹0.60 each; meanwhile Tally export is the zero-cost path)

### Business records
- **GDS-001 e-way bill** (5419 9050 3284, Part A generated via NIC portal, Part B pending with ARC tomorrow 18-Apr)
- **GRN-2026-001** created for PO-2026-001 (Galena Metals → 12 Lead Anodes, drop-ship flow via ARC to India Zinc)
- **GST payment** ₹2,52,212 logged (CPIN 26043300311426, FY 2025-26 year-end, CGST ₹1,24,599 + SGST ₹1,27,613, ICICI credit card)
- **Astral email** drafted to haribaskar.c@astralltd.com cc chennai.depot@astralltd.com (OEM supply + dealership enquiry for Chem Pro CPVC)

### Infrastructure / bugs fixed
- `@types/geojson` dev dep added — **this was blocking Vercel builds for multiple hours**, stuck prod on an earlier commit while main had the new features
- `ewaste_*` → `recyclers` rename migration (was done via Supabase UI only, now captured)
- pnpm is the sole lockfile (old package-lock.json and its duplicate `package-lock 2.json` removed, -20 K lines)
- next.config.js canvas stub for Turbopack+Webpack (pdfjs-dist transitive)
- `URL` shadow bug fixed in both scripts (`const URL = ...` was shadowing global URL class)

## Standing commits as of this handoff
`053ed9e` GRN PDF export + Print/Download buttons
`a7195d1` EWB detail page + Tally GSTIN importer
`c47b8be` GSTIN seed+validate script (nothing saved; credits exhausted on first pass)
`ba2e51f` **@types/geojson fix** — unblocks Vercel builds
`cdafcc3` GRN detail + new pages
`24cd89d` EWB dashboard Part-A vs Part-A+B
`074618d` State choropleth on Leaflet (accidentally broke Vercel)
`8306a42` [dup] badges
`d9bfa76` Marker clustering + directory positioning
`f7f9690` Polygon-snap fix
`09f3202` Wheel zoom + scale slider
…plus ~15 more data/content commits

## Pending for Next Session

### Blocking / time-sensitive
1. **EWB Part B tomorrow (18-Apr)** — ARC files vehicle no. Update our DB record `541990503284` from "Part A only" → "Valid".
2. **EWB Place of Dispatch decision** — Tiruvallur (as filed) vs cancel+regenerate with Sholavaram. 24h cancel window closes ~18:00 IST on 18-Apr.
3. **India Zinc delivery receipt** — get GRN-acknowledged by their stores once anodes arrive.
4. **Astral email** — send from user's mailbox OR via webmail (`/d/mail`) with sent-copy capture.

### GSTIN enrichment (waiting on external inputs)
5. **GSTINCHECK credit top-up** — user buying 2,500 at ₹0.60 ea (~₹1,500). Once loaded, run `scripts/seed-psu-gstins.mjs` but switch to `/pansearch/{key}/{pan}` endpoint instead of direct validate (one PAN → all state-GSTINs). Tier-1 PAN list is in handoff: AAACH1632L (HZL), AAACN7449M (NALCO), AAACB7523M (BALCO), AAACH2551A (HCL), AAACH2041L (Hindalco), AAACS7101K (Vedanta), AAACA6279B (Adani), AABCG5983Q (Gravita), AAACT1163R (Tata Chem), AAACE1344A (Exide), etc.
6. **Tally ledger export** — user to provide Tally Prime ledger CSV; importer `scripts/import-gstins-from-tally.mjs` is ready and waiting.

### Data enrichment (grindy, not automatable for free)
7. MRAI directory — 113 placeholder emails
8. CPCB UP micro-operators — ~230 placeholder emails
9. NFMR mid-tier contacts — ~680 missing email/phone
10. Street-level geocoding second pass — most pins at city centroid; needs paid Google Geocoding

### Autonomous work done after user stepped away (second wind)
- **EWB PDF export route** ✓ — with Print/Download buttons on detail page
- **GRN PDF export route** ✓ — same pattern
- **CSV export** on dashboard recycler list ✓
- **Category coverage stats band** on /recycling landing ✓
- **Public recycler profile pages** ✓ — `/recycling/recyclers/[code]` with hero, contacts, authorisation, mini-map, related facilities, SEO metadata
- **Directory drilldown** ✓ — state selection now shows a facility list; each entry links to the profile page. Live Map popups also link.
- **Tally importer script** ✓ — ready for when user exports Tally ledgers

### Autonomous work available (no paid service)
12. **Headless-browser scraper** — Playwright for SPA sites (Runaya, Cero, Tata Motors) that failed the current scraper; 18 failed rows could become 10-15 enriched
13. **Verify prod features** — marker clustering, state choropleth, dup badges, GRN/EWB detail pages on the live deploy
14. **Chat smoke test** — confirm "which recyclers in Karnataka?" surfaces the platform info on prod
15. **Raipur RK black-mass producer** — user mentioned but no details provided
16. **More known-major black-mass producers** — if any come to mind; currently 38 covers the market well

### Coverage snapshot
| Metric | Value |
|---|---|
| Active facilities | 1,277 (after today's adds) |
| Categories | 7 (e-waste, battery, both, hazardous, zinc-dross, primary-metal, black-mass) |
| GPS coverage | 100 % |
| Real email | ~46 % (after scraper pass fix) |
| Phone | ~39 % |
| CIN | 32 |
| GSTIN | **1** (Metal Gems — scrape hit) + awaiting /pansearch run |
| Black-mass MTA | ~69,000 across 38 producers |
| Aggregate capacity | ~51,06,590 MTA (after dedup) |

## Useful locations (updated)
- Seed migrations: `supabase/migrations/20260419*.sql`, `20260420*.sql`
- Geocoder: `scripts/geocode-recyclers.mjs`
- Contact enricher: `scripts/enrich-contacts-from-website.mjs`
- GSTIN scraper: `scripts/enrich-gstin.mjs`
- Tally importer: `scripts/import-gstins-from-tally.mjs`
- GPS-vs-state checker: `scripts/verify-gps-vs-state.mjs`
- Live map: `components/IndiaMapLive.tsx`
- SVG choropleth: `components/IndiaMap.tsx`
- State GeoJSON: `public/data/india-states-leaflet.geojson`
- Chat agents: `lib/agents.ts`
- Directory page: `app/recycling/recyclers/RecyclerDirectory.tsx`
- GRN pages: `app/dashboard/accounts/grn/{page,new,[id]}/`
- GRN PDF: `app/api/accounts/grn/[id]/pdf/route.ts`
- EWB pages: `app/dashboard/accounts/eway-bills/{page,new,[id]}/`
