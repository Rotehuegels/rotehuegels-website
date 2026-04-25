# Archived scripts

These were one-time **reference-data builders**: bulk seeders, enrichment passes,
and parsers that fed the recyclers / companies tables. The data they produced is
already in the database. They live here as documentation (where did this row
come from?) and as a starting point if a similar bulk task ever recurs.

If you need to re-run anything here, copy it back to `scripts/` first — paths
in some scripts assume top-level `scripts/`.

Pure debug/check/probe/fix scripts were removed entirely; their full source is
recoverable via `git log -- scripts/<name>.mjs`.

## Categories

- **CPCB / MRAI / NFMR ingestion** — `parse-mrai-directory.mjs`,
  `match-mrai-to-recyclers.mjs`, `parse-nfmr-capacities.mjs`,
  `match-nfmr-to-recyclers.mjs`.
- **EV chain seeders** — `seed-ev-oems-pack-makers.mjs`,
  `seed-ev-oems-tier{2,3,4}.mjs`, `update-ev-chain-capacities.mjs`,
  `update-ev-chain-gps.mjs`.
- **Critical-minerals seeders** — `seed-critical-minerals.mjs`,
  `seed-critical-minerals-2.mjs`.
- **Top-group enrichers** — `enrich-top-groups{,-2,-3,-4}.mjs`, plus
  per-company helpers (`enrich-attero.mjs`, the Jain Metal Group set,
  `add-navprakriti-epicenergy.mjs`).
- **LinkedIn discovery** — `mine-linkedin-recyclers.mjs`,
  `classify-linkedin-candidates.mjs`, `match-linkedin-contacts.mjs`,
  `match-linkedin-contacts-full.mjs`.
- **Website / contact scrapers** — `find-websites-bulk.mjs`,
  `enrich-contacts-from-website.mjs`, `enrich-tn-contacts-via-search.mjs`,
  `scrape-ecosystem-websites.mjs`, `playwright-scrape-waf.mjs`.
- **Two-stage enrichment pipeline** — `stage1-find-websites.mjs`,
  `stage1-consolidate.mjs`, `stage2-scrape-pass2.mjs`,
  `build-stage1-migration.mjs`, `build-stage2-migration.mjs`,
  `enrichment-query-stage1.mjs`, `consolidate-ecosystem-enrichment.mjs`,
  `compile-missing-recyclers.mjs`, `overnight-enrich.mjs`.
- **Geocoding** — `geocode-recyclers.mjs`.
- **One-off Tally GSTIN import** — `import-gstins-from-tally.mjs`.
- **Capacity sweeps** — `update-capacities-majors.mjs`.

## What stayed at the top of `scripts/`

The active set — generic utilities, audit/backfill/merge for the current
facility_code refactor, and the GSTIN gateway scripts. See `scripts/` directly.
