#!/usr/bin/env node
/* Token-bag comparison of before/after PDFs. Confirms content invariance
 * regardless of how pdfjs breaks lines. */
import fs from 'node:fs';
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');
const { getDocument } = pdfjs.default ?? pdfjs;

async function tokens(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await getDocument({ data, verbosity: 0 }).promise;
  const bag = new Map();
  let pageCount = doc.numPages;
  for (let i = 1; i <= pageCount; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    for (const it of tc.items) {
      const s = it.str.trim();
      if (!s) continue;
      bag.set(s, (bag.get(s) ?? 0) + 1);
    }
  }
  return { bag, pageCount };
}

function diffBags(before, after) {
  const all = new Set([...before.keys(), ...after.keys()]);
  const missing = [];
  const extra = [];
  const countChanged = [];
  for (const k of all) {
    const b = before.get(k) ?? 0, a = after.get(k) ?? 0;
    if (b === a) continue;
    if (b > 0 && a === 0) missing.push(`"${k}" x${b}`);
    else if (a > 0 && b === 0) extra.push(`"${k}" x${a}`);
    else countChanged.push(`"${k}" ${b} -> ${a}`);
  }
  return { missing, extra, countChanged };
}

for (const label of ['quote', 'invoice', 'po']) {
  const b = await tokens(`.buddy/report-refactor-verify/${label}-before.pdf`);
  const a = await tokens(`.buddy/report-refactor-verify/${label}.pdf`);
  const d = diffBags(b.bag, a.bag);
  console.log(`[${label}] pages before=${b.pageCount} after=${a.pageCount}`);
  console.log(`  missing in after:    ${d.missing.length}`);
  console.log(`  new in after:        ${d.extra.length}`);
  console.log(`  count changed:       ${d.countChanged.length}`);
  if (d.missing.length)    console.log('  MISSING:', d.missing.slice(0, 20));
  if (d.extra.length)      console.log('  EXTRA:  ', d.extra.slice(0, 20));
  if (d.countChanged.length) console.log('  CHANGED:', d.countChanged.slice(0, 20));
}
