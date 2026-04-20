#!/usr/bin/env node
/* Diff the extracted-text of before/after PDFs. */
import fs from 'node:fs';

// Use pdfjs-dist via the legacy build (node-friendly).
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');
const { getDocument } = pdfjs.default ?? pdfjs;

async function extract(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await getDocument({ data, useSystemFonts: true, disableFontFace: true, verbosity: 0 }).promise;
  let out = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    // Sort by y (desc) then x (asc) so the layout roughly matches reading order.
    const items = tc.items.map(it => ({
      s: it.str,
      x: it.transform[4],
      y: it.transform[5],
    }));
    items.sort((a, b) => (b.y - a.y) || (a.x - b.x));
    let lastY = null;
    for (const it of items) {
      if (lastY != null && Math.abs(it.y - lastY) > 2) out += '\n';
      out += it.s + ' ';
      lastY = it.y;
    }
    out += `\n----- page ${i}/${doc.numPages} -----\n`;
  }
  return out;
}

async function diff(label, before, after) {
  const b = await extract(before);
  const a = await extract(after);
  fs.writeFileSync(before.replace('.pdf', '.txt'), b);
  fs.writeFileSync(after.replace('.pdf', '.txt'), a);
  if (b.trim() === a.trim()) {
    console.log(`[${label}] IDENTICAL`);
    return;
  }
  // Print a rough unified-diff by lines.
  const bl = b.split('\n'), al = a.split('\n');
  console.log(`[${label}] DIFFERENT — before=${bl.length} lines, after=${al.length} lines`);
  const max = Math.max(bl.length, al.length);
  let shown = 0;
  for (let i = 0; i < max && shown < 40; i++) {
    if (bl[i] !== al[i]) {
      console.log(`  line ${i+1}:`);
      console.log(`    - ${bl[i]}`);
      console.log(`    + ${al[i]}`);
      shown++;
    }
  }
}

await diff('quote',   '.buddy/report-refactor-verify/quote-before.pdf',   '.buddy/report-refactor-verify/quote.pdf');
await diff('invoice', '.buddy/report-refactor-verify/invoice-before.pdf', '.buddy/report-refactor-verify/invoice.pdf');
await diff('po',      '.buddy/report-refactor-verify/po-before.pdf',      '.buddy/report-refactor-verify/po.pdf');
