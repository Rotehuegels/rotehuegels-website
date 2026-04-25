#!/usr/bin/env node
/**
 * Build supabase/migrations/20260420_recyclers_contacts_pass2.sql.
 *
 * High-confidence rules:
 *   email: same registered domain OR starts with info@/contact@/sales@/enquiry@/reach@/customercare@/care@
 *   phone: normalised +91XXXXXXXXXX with count >= 2 across site
 *
 * Lower-confidence rows go to .draft file with reasons.
 *
 * Existing email/phone are preserved via COALESCE + placeholder guard.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const IN        = '/Users/sivakumar/Projects/rotehuegels-website/.buddy/website-scrape-pass2.json';
const OUT_SQL   = '/Users/sivakumar/Projects/rotehuegels-website/supabase/migrations/20260420_recyclers_contacts_pass2.sql';
const OUT_DRAFT = '/Users/sivakumar/Projects/rotehuegels-website/supabase/migrations/20260420_recyclers_contacts_pass2.sql.draft';

const data = JSON.parse(readFileSync(IN, 'utf-8'));

const ACCEPTED_PREFIXES = ['info@', 'contact@', 'sales@', 'enquiry@', 'reach@', 'customercare@', 'care@'];

const esc = (s) => String(s).replace(/'/g, "''");

function domainFromUrl(u) {
  try { return new URL(u.startsWith('http') ? u : 'https://' + u).host.replace(/^www\./, ''); }
  catch { return null; }
}

const high = [];
const draft = [];

for (const r of data.results) {
  const siteDomain = domainFromUrl(r.url);
  // Pick a high-confidence email
  let email = null;
  let emailReason = null;
  const emailCounts = r.email_counts || {};
  // 1) same-domain email wins
  const sameDomain = Object.keys(emailCounts).find(e => e.split('@')[1] === siteDomain);
  if (sameDomain) { email = sameDomain; emailReason = 'same-domain'; }
  else {
    // 2) any email with accepted prefix (even if wrong domain — unlikely but fallback)
    for (const e of Object.keys(emailCounts)) {
      if (ACCEPTED_PREFIXES.some(p => e.startsWith(p))) { email = e; emailReason = 'prefix-match'; break; }
    }
  }
  // If multiple same-domain, prefer one with accepted prefix
  if (emailReason === 'same-domain') {
    const sameList = Object.keys(emailCounts).filter(e => e.split('@')[1] === siteDomain);
    const withPrefix = sameList.find(e => ACCEPTED_PREFIXES.some(p => e.startsWith(p)));
    if (withPrefix) email = withPrefix;
  }

  // High-confidence phone: count >= 2
  const phoneCounts = r.phone_counts || {};
  const goodPhones = Object.entries(phoneCounts).filter(([,c]) => c >= 2).map(([p]) => p);
  const phone = goodPhones[0] || null;

  const entry = {
    id: r.id, recycler_code: r.recycler_code, company_name: r.company_name,
    url: r.url, origin: r.origin,
    email, emailReason,
    phone, phoneReason: phone ? `count=${phoneCounts[phone]}` : null,
    all_emails: r.all_emails || [], all_phones: r.all_phones || [],
    phone_counts: phoneCounts, email_counts: emailCounts,
    error: r.error, rescued: r.rescued,
  };

  if (email || phone) {
    high.push(entry);
  } else if (r.all_emails?.length || r.all_phones?.length) {
    // draft: had signal but didn't meet high-conf bar
    entry._reason = [
      r.all_emails?.length && !email ? 'no-same-domain-email' : null,
      r.all_phones?.length && !phone ? 'all-phones-count-<2' : null,
    ].filter(Boolean).join(',');
    draft.push(entry);
  }
}

// Emit SQL
const lines = [
  '-- Stage 2 — Scraper pass-2 contact enrichment (high-confidence only).',
  '-- email: same-domain or info@/contact@/sales@/enquiry@/reach@/customercare@/care@',
  '-- phone: +91NNNNNNNNNN with count >= 2 across site',
  '-- Existing non-placeholder email/phone preserved via COALESCE + regex guard.',
  `-- Generated: ${new Date().toISOString()}`,
  `-- High-confidence rows: ${high.length}  Draft rows: ${draft.length}`,
  '',
  'BEGIN;',
  '',
];

for (const r of high) {
  const parts = [];
  if (r.email) {
    parts.push(`email = CASE
    WHEN email IS NULL OR TRIM(email) = '' OR email ~* '@(recycler|placeholder)\\.'
      THEN '${esc(r.email)}'
    ELSE email
  END`);
  }
  if (r.phone) {
    parts.push(`phone = COALESCE(NULLIF(TRIM(phone), ''), '${esc(r.phone)}')`);
  }
  if (parts.length === 0) continue;
  lines.push(`-- ${r.recycler_code} ${esc(r.company_name)}  (email:${r.emailReason||'-'} phone:${r.phoneReason||'-'})`);
  lines.push(`UPDATE recyclers SET`);
  lines.push('  ' + parts.join(',\n  '));
  lines.push(`WHERE id = '${r.id}';`);
  lines.push('');
}

lines.push('COMMIT;');
lines.push('');
writeFileSync(OUT_SQL, lines.join('\n'));
console.log(`wrote ${OUT_SQL} (${high.length} high-confidence updates)`);

// Draft file
const dLines = [
  '-- Lower-confidence Stage-2 rows — REVIEW before applying.',
  `-- Generated: ${new Date().toISOString()}`,
  '-- Reasons: no same-domain email, or all phones appeared <2 times on the site.',
  '',
];
for (const r of draft) {
  dLines.push(`-- ${r.recycler_code} ${esc(r.company_name)}  reason=${r._reason}`);
  dLines.push(`--   url=${r.url}`);
  dLines.push(`--   emails: ${(r.all_emails || []).join(', ') || '—'}`);
  dLines.push(`--   phones: ${Object.entries(r.phone_counts || {}).map(([p,c]) => `${p}(${c})`).join(', ') || '—'}`);
  dLines.push('');
}
writeFileSync(OUT_DRAFT, dLines.join('\n'));
console.log(`wrote ${OUT_DRAFT} (${draft.length} draft rows)`);
