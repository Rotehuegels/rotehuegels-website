# Buddy Handoff → Next Session
Generated: 2026-04-17 (evening)
Agent: Claude (Opus 4.7, 1M context)

## Completed This Session — Map accuracy, AI chat, category expansion

### Database — 1,228 → 1,261 active facilities
- Added **primary-metal** category (18 smelters/refineries — Hindustan Zinc, Hindalco, NALCO, Vedanta Al, BALCO, HCL, Adani Copper, JSW Al with plant-level entries and CIN/GPS)
- Added **Runaya Group** (Refining + Enviro + Solutions)
- Added **10 missing majors** (Cero Recycling, Tata Re.Wi.Re, Re Sustainability, GEM Enviro, Saahas Zero Waste, Epsilon Advanced Materials, plus 4 tangential players)
- Added schema columns: `cin`, `latitude`, `longitude` + lookup indexes
- **100% GPS coverage** across all 1,261 active rows (previously ~34)
- **32 CIN codes** seeded (primary-metal producers + missing majors from MCA public data)

### Geocoder — new tool at `scripts/geocode-recyclers.mjs`
- Priority chain: website scrape (JSON-LD / og:meta / Google Maps URL) → Nominatim address → city → pincode → state
- Capacity-ordered (largest facilities first)
- Respects Nominatim 1 req/sec, India bbox filter
- Idempotent — run with `node --env-file=.env.local scripts/geocode-recyclers.mjs`
- Last run: 265 rows in 10 min (262 Nominatim, 1 gmap-url, 1 json-ld, 1 og-meta)

### Map — two views now
1. **SVG Choropleth** (existing, state-tinted):
   - Calibrated affine lat/lng → pixel projection (mean ~40 km residual)
   - **Wheel zoom + drag pan + scale slider** (1x–20x)
   - **Polygon-snap correction** — pins outside their state polygon snap to nearest boundary
2. **Live Map · Satellite** (new, Leaflet-based):
   - OpenStreetMap base (default)
   - Esri World Imagery satellite (free)
   - Carto dark (theme-matched)
   - Bhuvan / ISRO boundaries WMS overlay (public, 70% opacity)
   - Real Mercator projection — sub-metre pin accuracy
   - CircleMarker per facility, coloured by waste_type, popup with name + GPS

### Page & content
- `/recycling` landing: broadened "What We Cover" (16 items), references expanded 4 → 10 sources, disclaimer covers Battery Waste Rules + MoEF NFMR
- `/recycling/quote`: back-link + hero broadened ("Your Recyclables" not "Your E-Waste")
- `/recycling/recyclers`: widened from `max-w-5xl` (1024px) to `max-w-[1800px]`
- Stale `/ewaste` redirect in `/recycling/request` fixed
- View toggle: Choropleth / Live Map · Satellite / Table

### AI chat — `/components/AssistWidget.tsx` + `/lib/agents.ts`
- COMPANY_CONTEXT now describes the full recycling platform: 1,260+ facilities, 6 categories, data sources (CPCB/SPCB/MoEF/MRAI), all public URLs, tile layers
- New hard rules:
  - Never recite specific recycler contacts, CIN, GSTIN, or capacities from memory
  - Always direct users to the live public directory for specific lookups
  - Only answer from public data
- Sales agent is now the owner of all recycling-platform queries
- Supplier agent routes recycling-facility registrations to Sales

### Infrastructure
- **ewaste_ → recyclers rename** captured as idempotent migration (was applied via Supabase UI only)
- pnpm is the sole lockfile — `package-lock.json` and duplicate `package-lock 2.json` deleted (~20K lines)
- Next.js `canvas` build failure (pdfjs-dist transitive) fixed via serverExternalPackages + webpack/turbopack aliases
- Bhuvan satellite base-layer replaced with public WMS overlay (full tiles need NRSC API token)

## Pending for Next Session

### Data enrichment (deferred — low priority, grind work)
1. **MRAI directory** — 113 entries have placeholder emails; user had link to a Scribd PDF of the 2019-20 membership directory
2. **CPCB UP micro-operators** — ~230 with placeholder emails; mostly Hapur/Meerut small scrap operators with zero web presence (phone calls / SPCB PDFs only)
3. **NFMR contact enrichment** — ~680 entries still without email/phone; top 20 facilities have contacts now, next targets are 1,000-5,000 MTA mid-tier

### Nice-to-have tool upgrades
1. **Dissolve districts → states GeoJSON** — for a proper state-level choropleth overlay on the Live Map (currently no state polygons on Leaflet view)
2. **Marker clustering** — 1,261 pins on a single viewport can lag on slow devices; `leaflet.markercluster` would group them
3. **Bhuvan API token** — register at bhuvan.nrsc.gov.in for real satellite base-layer tiles; replace the current boundaries overlay
4. **Street-level geocoding pass** — many pins land at city centroids; a second pass using full address could bring them closer to the actual plant

### Possible follow-ups
- Verify on the live Vercel deploy that Live Map tiles load, CircleMarkers cluster sensibly, and the AI chat answers recycling questions correctly
- Audit widget-width / stat cards now that page is wide

## Useful locations
- Seed migrations: `supabase/migrations/20260419*.sql`
- Geocoder: `scripts/geocode-recyclers.mjs`
- Live map: `components/IndiaMapLive.tsx`
- SVG choropleth: `components/IndiaMap.tsx`
- Chat agents: `lib/agents.ts`
- Directory page: `app/recycling/recyclers/RecyclerDirectory.tsx`

## Coverage snapshot
- **Active rows:** 1,261
- **GPS:** 1,261 (100%)
- **Real email:** 562 (45%)
- **Phone:** 477 (38%)
- **CIN:** 32 (top producers)
- **States covered:** 28
- **Categories:** 6 (e-waste, battery, both, hazardous/non-ferrous, zinc-dross, primary-metal)
