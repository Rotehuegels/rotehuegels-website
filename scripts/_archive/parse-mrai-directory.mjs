#!/usr/bin/env node
/**
 * Parse MRAI Membership Directory PDF using pdftohtml -xml output.
 *
 * The PDF is a structured table: each company record starts with a font="2"
 * (Arial Bold) text element at left≈22. Subsequent text elements until the
 * next font=2 left=22 anchor belong to that company. We extract columns by
 * x-range (name / address / contact / phone / fax / email / website /
 * scrap-types / role).
 *
 * Writes .buddy/mrai-parsed.json.
 *
 * Run: node scripts/parse-mrai-directory.mjs [pdf-path]
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';

const pdfArg = process.argv[2] || '/Users/sivakumar/Downloads/436933701-mrai-membership-directory-2019-20-pdf.pdf';
const pdfPath = resolve(pdfArg);
if (!existsSync(pdfPath)) { console.error('PDF not found:', pdfPath); process.exit(1); }

mkdirSync(resolve('.buddy'), { recursive: true });
const outPath = resolve('.buddy/mrai-parsed.json');
const tmpBase = '/tmp/mrai-xml-parse';

// Generate XML. pdftohtml writes to <base>.xml
try { unlinkSync(`${tmpBase}.xml`); } catch {}
execSync(`pdftohtml -xml "${pdfPath}" ${tmpBase} >/dev/null 2>&1`);
const xml = readFileSync(`${tmpBase}.xml`, 'utf8');
console.log(`XML size: ${xml.length} chars`);

// Column x-ranges, measured from the header on page 2.
const COLS = {
  name:     [10,   150],
  address:  [150,  290],
  contact:  [290,  378],
  phone:    [378,  478],
  fax:      [478,  548],
  email_web:[548,  750],  // email + website share this span
  scrap:    [750,  1400], // all scrap-type columns
  role:     [1400, 1500], // "Active in the Sector As"
};

// Extract text elements per page. Each page is bounded by <page ...> tags.
const pageRe = /<page number="(\d+)"[^>]*>([\s\S]*?)<\/page>/g;
const textRe = /<text\s+top="(-?\d+)"\s+left="(-?\d+)"\s+width="(-?\d+)"\s+height="(-?\d+)"\s+font="(\d+)"[^>]*>([\s\S]*?)<\/text>/g;

function decode(s) {
  return s.replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/\s+/g, ' ').trim();
}

function colOf(left) {
  for (const [k, [a, b]] of Object.entries(COLS)) if (left >= a && left < b) return k;
  return null;
}

const EMAIL_RE = /[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g;
const WEBSITE_RE = /(?:https?:\/\/)?(?:www\.)[A-Za-z0-9][A-Za-z0-9\-]*(?:\.[A-Za-z0-9\-]+)+(?:\/[^\s,;]*)?/g;

function extract(text, re) {
  const out = new Set();
  let m;
  re.lastIndex = 0;
  while ((m = re.exec(text)) !== null) out.add(m[0]);
  return [...out];
}

function normaliseWebsite(w) {
  let s = w.trim().replace(/[.,;:]+$/, '');
  if (!/^https?:\/\//.test(s)) s = 'https://' + s;
  try { return new URL(s).origin.toLowerCase(); } catch { return null; }
}

function cleanPhone(s) {
  const digits = s.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) return null;
  if (/^\d{6}$/.test(digits)) return null; // pincode
  return s.trim().replace(/\s+/g, ' ');
}

const records = [];
let page;
while ((page = pageRe.exec(xml)) !== null) {
  const pageNum = +page[1];
  const body = page[2];

  // Pull every <text> element
  const elems = [];
  let t;
  while ((t = textRe.exec(body)) !== null) {
    elems.push({
      top: +t[1], left: +t[2], width: +t[3], height: +t[4], font: +t[5],
      text: decode(t[6]),
    });
  }
  if (!elems.length) continue;

  // Company-name anchors: font=2 AND left < 150 AND top > 170 (skip header)
  const anchors = elems
    .filter(e => e.font === 2 && e.left < 150 && e.top > 170)
    .sort((a, b) => a.top - b.top);

  if (!anchors.length) continue;

  // Group anchors into logical rows — rows that are within 50px of each other
  // in `top` are part of the same multi-line company name.
  const groups = [];
  for (const a of anchors) {
    const last = groups[groups.length - 1];
    if (last && Math.abs(a.top - last.topEnd) < 50 && a.left < 150) {
      last.names.push(a.text);
      last.topEnd = Math.max(last.topEnd, a.top);
    } else {
      groups.push({ topStart: a.top, topEnd: a.top, names: [a.text] });
    }
  }

  // For each group, the record's y-range is [topStart - 60, next topStart).
  for (let gi = 0; gi < groups.length; gi++) {
    const g = groups[gi];
    const yMin = g.topStart - 60;
    const yMax = gi + 1 < groups.length ? groups[gi + 1].topStart - 20 : 100_000;
    const inRecord = elems.filter(e => e.top >= yMin && e.top < yMax);

    // Group into rows by top-coordinate clusters
    const byCol = {};
    for (const e of inRecord) {
      const col = colOf(e.left);
      if (!col) continue;
      byCol[col] = (byCol[col] || []) + ' ' + e.text;
    }

    const company_name = g.names.join(' ').replace(/\s+/g, ' ').trim();
    if (!company_name || company_name.length < 3 || company_name.length > 120) continue;

    const addressBlob = (byCol.address || '').trim();
    const contactBlob = (byCol.contact || '').trim();
    const phoneBlob   = (byCol.phone   || '').trim();
    const emailWebBlob = (byCol.email_web || '').trim();
    const roleBlob    = (byCol.role    || '').trim();

    const emails = extract(emailWebBlob, EMAIL_RE).filter(e => !/^\s*$/.test(e) && e.length <= 80);
    // Remove email parts from blob before extracting websites
    let webBlob = emailWebBlob;
    for (const e of emails) webBlob = webBlob.replace(e, ' ');
    const websites = extract(webBlob, WEBSITE_RE).map(normaliseWebsite).filter(Boolean);

    const phones = Array.from(new Set(
      phoneBlob.split(/\s{2,}|\s{4,}/)
        .map(cleanPhone).filter(Boolean)
    ));

    // Contact person: take the largest "Mr." / "Ms." / "Dr." prefix, then
    // the following words (max 5).
    let contact_person = null;
    const cm = contactBlob.match(/\b(Mr\.?|Ms\.?|Mrs\.?|Dr\.?|Er\.?)\s+([A-Z][A-Za-z.\-]*(?:\s+[A-Z][A-Za-z.\-]*){0,4})/);
    if (cm) contact_person = `${cm[1]} ${cm[2]}`.replace(/\s+/g, ' ').trim();

    const pincode = (addressBlob.match(/Pin\s*-\s*(\d{6})/) || [])[1] ?? null;
    const city = (() => {
      // Last part of address before "Pin -" usually has "City, State"
      const beforePin = addressBlob.split(/Pin\s*-/)[0];
      const parts = beforePin.split(',').map(s => s.trim()).filter(Boolean);
      return parts.length >= 2 ? parts[parts.length - 2] : null;
    })();
    const state = (() => {
      const beforePin = addressBlob.split(/Pin\s*-/)[0];
      const parts = beforePin.split(',').map(s => s.trim()).filter(Boolean);
      return parts.length >= 1 ? parts[parts.length - 1] : null;
    })();

    records.push({
      page: pageNum,
      company_name,
      emails,
      phones,
      website: websites[0] || null,
      contact_person,
      city,
      state,
      pincode,
      role: roleBlob || null,
      _address_blob: addressBlob.slice(0, 200),
    });
  }
}

// Dedupe by normalised company_name
const seen = new Set();
const deduped = [];
for (const r of records) {
  const k = r.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '');
  if (seen.has(k)) continue;
  seen.add(k);
  deduped.push(r);
}

const withEmail = deduped.filter(r => r.emails.length).length;
const withPhone = deduped.filter(r => r.phones.length).length;
const withWebsite = deduped.filter(r => r.website).length;
const withContact = deduped.filter(r => r.contact_person).length;

console.log(`records: ${records.length} raw, ${deduped.length} unique`);
console.log(`  with email:   ${withEmail}`);
console.log(`  with phone:   ${withPhone}`);
console.log(`  with website: ${withWebsite}`);
console.log(`  with contact: ${withContact}`);

writeFileSync(outPath, JSON.stringify(deduped, null, 2));
console.log(`wrote: ${outPath}`);
