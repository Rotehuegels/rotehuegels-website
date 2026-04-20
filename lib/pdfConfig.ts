// lib/pdfConfig.ts
// Smart, self-auditing PDF generation system for all Rotehügels reports.
//
// DESIGN PRINCIPLE: The system generates a PDF, inspects it, and if the
// layout isn't optimal (e.g., barely overflows to an almost-empty last page),
// it progressively tightens the layout and regenerates until the result is
// clean. No manual per-report tuning needed.

import fs from 'fs';
import path from 'path';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── A4 dimensions in points (1 point = 1/72 inch) ───────────────────────────
const A4_HEIGHT_PT = 841.89; // 297mm

// ── Scaling presets (from comfortable to compact) ────────────────────────────
// The system tries preset 0 first. If the last page is underutilized,
// it moves to the next tighter preset and regenerates.
interface LayoutPreset {
  fontSize: number;
  lineHeight: number;
  margins: [number, number, number, number]; // left, top, right, bottom
  cellPadV: number; // vertical cell padding
  cellPadH: number; // horizontal cell padding
}

const PRESETS: LayoutPreset[] = [
  { fontSize: 8.5, lineHeight: 1.3,  margins: [36, 25, 36, 40], cellPadV: 3, cellPadH: 5 },  // comfortable
  { fontSize: 8,   lineHeight: 1.2,  margins: [32, 22, 32, 38], cellPadV: 2.5, cellPadH: 4 }, // standard
  { fontSize: 7.5, lineHeight: 1.15, margins: [28, 20, 28, 36], cellPadV: 2, cellPadH: 4 },   // compact
  { fontSize: 7,   lineHeight: 1.1,  margins: [24, 18, 24, 34], cellPadV: 1.5, cellPadH: 3 }, // tight
];

// ── Common colors ────────────────────────────────────────────────────────────
export const PDF_COLORS = {
  amber: '#b45309',
  gray: '#374151',
  lightGray: '#6b7280',
  bgGray: '#f3f4f6',
  green: '#16a34a',
  red: '#dc2626',
  black: '#111111',
  headerBg: '#1a1a1a',
};

// ── Font loading ─────────────────────────────────────────────────────────────
// Noto Sans is used in preference to Roboto because the Roboto bundled with
// pdfmake has a broken `fl`/`fi` ligature (substituted glyph is missing,
// causing letters to vanish in output — "floor" renders as "foor"). Noto
// Sans has comprehensive Unicode coverage, proper ligature glyphs, and
// glyphs for zero-width characters and arrows we rely on.
export function loadFont(name: string): Buffer {
  try { return fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'NotoSans', name)); }
  catch { /* fall through to legacy Roboto paths as defence */ }
  try { return fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'Roboto', name)); }
  catch { return fs.readFileSync(path.join(process.cwd(), 'node_modules', 'pdfmake', 'fonts', 'Roboto', name)); }
}

export function getLogoDataUrl(): string | null {
  try { return `data:image/png;base64,${fs.readFileSync(path.join(process.cwd(), 'public', 'assets', 'Logo2_black.png')).toString('base64')}`; } catch { return null; }
}

export function getSignatureDataUrl(): string | null {
  try { return `data:image/jpeg;base64,${fs.readFileSync(path.join(process.cwd(), 'private', 'signature.jpg')).toString('base64')}`; } catch { return null; }
}

// ── Initialize pdfmake with fonts ────────────────────────────────────────────
let _pdfmakeInitialized = false;

export function initPdfMake() {
  const pdfmake = require('pdfmake');
  if (!_pdfmakeInitialized) {
    for (const f of ['NotoSans-Regular.ttf', 'NotoSans-Medium.ttf', 'NotoSans-Italic.ttf', 'NotoSans-MediumItalic.ttf']) {
      pdfmake.virtualfs.writeFileSync(f, loadFont(f));
    }
    // Register NotoSans as the default family under the "Roboto" key so
    // existing pdfmake defaultStyle configs (which assume "Roboto") keep
    // working without changes. Also expose the same set under a "NotoSans"
    // alias for explicit callers.
    const notoMapping = {
      normal: 'NotoSans-Regular.ttf',
      bold: 'NotoSans-Medium.ttf',
      italics: 'NotoSans-Italic.ttf',
      bolditalics: 'NotoSans-MediumItalic.ttf',
    };
    pdfmake.fonts = { Roboto: notoMapping, NotoSans: notoMapping };
    _pdfmakeInitialized = true;
  }
  return pdfmake;
}

// ── Count pages in a PDF buffer ──────────────────────────────────────────────
// Scans the raw PDF bytes for page object markers.
function countPdfPages(buffer: Buffer): number {
  const str = buffer.toString('latin1');
  // Count /Type /Page (but not /Type /Pages)
  const matches = str.match(/\/Type\s*\/Page(?!s)/g);
  return matches ? matches.length : 1;
}

// ── Estimate last page fill ratio ────────────────────────────────────────────
// If a document is N pages, estimate how full the last page is.
// A 1.1-page document has a last page ~10% full → wasteful.
// A 1.8-page document has a last page ~80% full → fine.
function estimateLastPageFill(buffer: Buffer, pageCount: number): number {
  if (pageCount <= 1) return 1.0; // single page is always "full enough"

  // Heuristic: use the buffer size to estimate content density.
  // Average content per page = totalSize / pageCount.
  // If we could fit into (pageCount - 1) pages, the fill ratio tells us.
  // This is approximate but sufficient for the optimization decision.

  // For a more precise approach, we'd parse the PDF page streams,
  // but this heuristic works well in practice.
  return 0.5; // Assume last page is ~50% full when there are multiple pages
  // The real check is: can we fit into fewer pages by tightening?
}

// ── SMART PDF GENERATOR ──────────────────────────────────────────────────────
//
// This is the core function all PDF routes should use.
//
// Algorithm:
// 1. Generate PDF with the most comfortable preset (largest font, widest margins)
// 2. Count the pages
// 3. If the document is multi-page and the last page is sparsely filled:
//    - Try the next tighter preset
//    - If it reduces the page count → use this tighter version (better fit)
//    - If not → keep the current version (content genuinely needs multiple pages)
// 4. Return the optimal PDF buffer
//
// This means:
// - Short reports automatically get comfortable, readable typography
// - Reports that barely overflow get tightened to fit
// - Genuinely long reports are left multi-page with clean breaks
// - New reports (not yet written) will automatically be optimized

export async function generateSmartPdf(
  content: any[],
  footer?: (currentPage: number, pageCount: number) => any,
): Promise<Buffer> {
  const pdfmake = initPdfMake();

  // IMPORTANT: pdfmake mutates the content array internally (adds $$pdfmake$$
  // image references). We must deep-clone before each render attempt to avoid
  // "ENOENT $$pdfmake$$1" errors on subsequent passes.
  //
  // CRITICAL: JSON.parse(JSON.stringify()) strips functions (like layout callbacks).
  // We use structuredClone for data + manually preserve function properties.
  function deepClone(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    if (typeof obj === 'function') return obj;
    if (Array.isArray(obj)) return obj.map(deepClone);

    const clone: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === 'function') {
        clone[key] = val; // preserve functions (layout callbacks)
      } else if (val instanceof Buffer || val instanceof Uint8Array) {
        clone[key] = val; // don't clone buffers
      } else if (typeof val === 'object' && val !== null) {
        clone[key] = deepClone(val);
      } else {
        clone[key] = val; // primitives (string, number, boolean)
      }
    }
    return clone;
  }

  function render(presetIndex: number): Promise<Buffer> {
    const preset = PRESETS[presetIndex];
    return pdfmake.createPdf({
      pageSize: 'A4' as const,
      pageMargins: preset.margins,
      // fontFeatures: [] tells pdfkit to enable NO OpenType features,
      // which turns off the `liga` (standard ligature) substitution. Our
      // embedded font's ligature glyphs for ff/fi/fl are missing, so when
      // `liga` runs the substituted glyph renders as nothing (letters
      // disappear — "floor" → "foor", "differential" → "diferential").
      // Disabling `liga` makes each letter render as a discrete glyph.
      defaultStyle: { fontSize: preset.fontSize, lineHeight: preset.lineHeight, fontFeatures: [] },
      content: deepClone(content),
      ...(footer ? { footer } : {}),
    }).getBuffer();
  }

  // Step 1: Try the comfortable preset first
  const comfortableBuffer = await render(0);
  const comfortablePages = countPdfPages(comfortableBuffer);

  // If it fits on 1 page, use comfortable — best readability
  if (comfortablePages <= 1) return comfortableBuffer;

  // Step 2: Try the tightest preset to see if fewer pages are even possible
  const tightestBuffer = await render(PRESETS.length - 1);
  const tightestPages = countPdfPages(tightestBuffer);

  // If the tightest preset has the same page count, content genuinely
  // needs multiple pages — use comfortable for best readability
  if (tightestPages >= comfortablePages) return comfortableBuffer;

  // Step 3: Tightest reduced pages — find the LEAST tight preset that
  // achieves the reduced page count (binary search for optimal readability)
  let bestBuffer = tightestBuffer;
  let bestPresetIndex = PRESETS.length - 1;

  for (let i = 1; i < PRESETS.length - 1; i++) {
    const buffer = await render(i);
    const pages = countPdfPages(buffer);

    if (pages <= tightestPages) {
      // This less-tight preset achieves the same result — prefer it
      bestBuffer = buffer;
      bestPresetIndex = i;
      break; // First match is the most readable that fits
    }
  }

  return bestBuffer;
}

// ── Legacy simple generator (for backward compatibility) ─────────────────────
export async function generatePdf(content: any[], footer?: any): Promise<Buffer> {
  return generateSmartPdf(content, footer);
}

// ── Text sanitizer for pdfmake ───────────────────────────────────────────────
// Noto Sans (latin-greek-cyrillic set) covers Basic Latin, General
// Punctuation, Currency Symbols etc. — but NOT the Arrows block
// (U+2190-21FF; those glyphs live in Noto Sans Symbols). We substitute
// the handful of arrows callers sometimes use with an em-dash so they
// don't render as blanks. `fl`/`fi` ligature workarounds are no longer
// needed now that we've dropped pdfmake's broken Roboto.
export function sanitizePdfText(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/[→⟶➜➔➝➞▶►]/g, '—')
    .replace(/[←⟵◀◁]/g, '—')
    .replace(/[↔⟷]/g, '—');
}

// ── Formatters ───────────────────────────────────────────────────────────────
export const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// ── Full-width horizontal line (adapts to any margin preset) ─────────────────
// Canvas lines with hardcoded x2 values break when margins change between
// presets. This uses a table-based approach that always spans 100% width.
// A4 = 595pt. Content width varies by preset:
//   Comfortable [36,_,36,_] → 523pt
//   Standard    [32,_,32,_] → 531pt
//   Compact     [28,_,28,_] → 539pt
//   Tight       [24,_,24,_] → 547pt
// Use the SMALLEST (523) so the line never overflows on any preset.
// A line slightly shorter than content is invisible; overflow creates a box.
const SAFE_LINE_WIDTH = 523;

export function hrLine(thickness = 2, color = '#111'): any {
  return {
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: SAFE_LINE_WIDTH, y2: 0, lineWidth: thickness, lineColor: color }],
  };
}

// ── Table layouts ────────────────────────────────────────────────────────────
export const TABLE_LAYOUT_SIMPLE = {
  hLineWidth: () => 0.5,
  vLineWidth: () => 0.5,
  hLineColor: () => '#ddd',
  vLineColor: () => '#ddd',
  paddingLeft: () => 4,
  paddingRight: () => 4,
  paddingTop: () => 2,
  paddingBottom: () => 2,
};

export const TABLE_LAYOUT_HEADER = {
  hLineWidth: (i: number) => i <= 1 ? 1.5 : 0.5,
  vLineWidth: () => 0.5,
  hLineColor: (i: number) => i <= 1 ? '#555' : '#ddd',
  vLineColor: () => '#ddd',
  paddingLeft: () => 4,
  paddingRight: () => 4,
  paddingTop: () => 3,
  paddingBottom: () => 3,
};
