// lib/pdfConfig.ts
// Shared PDF configuration for all pdfmake reports.
// Change values here to affect ALL generated PDFs globally.

import fs from 'fs';
import path from 'path';

// ── Page layout ──────────────────────────────────────────────────────────────
export const PDF_PAGE_SIZE = 'A4' as const;
export const PDF_PAGE_MARGINS: [number, number, number, number] = [32, 22, 32, 40];

// ── Default text style ───────────────────────────────────────────────────────
export const PDF_DEFAULT_STYLE = {
  fontSize: 8,
  lineHeight: 1.2,
};

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

// ── Font loading (works on Vercel + local) ───────────────────────────────────
export function loadFont(name: string): Buffer {
  try {
    return fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'Roboto', name));
  } catch {
    return fs.readFileSync(path.join(process.cwd(), 'node_modules', 'pdfmake', 'fonts', 'Roboto', name));
  }
}

export function getLogoDataUrl(): string | null {
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), 'public', 'assets', 'Logo2_black.png'));
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

export function getSignatureDataUrl(): string | null {
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), 'private', 'signature.jpg'));
    return `data:image/jpeg;base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

// ── Initialize pdfmake with fonts ────────────────────────────────────────────
export function initPdfMake() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfmake = require('pdfmake');
  const fonts = ['Roboto-Regular.ttf', 'Roboto-Medium.ttf', 'Roboto-Italic.ttf', 'Roboto-MediumItalic.ttf'];
  for (const f of fonts) pdfmake.virtualfs.writeFileSync(f, loadFont(f));
  pdfmake.fonts = {
    Roboto: {
      normal: 'Roboto-Regular.ttf',
      bold: 'Roboto-Medium.ttf',
      italics: 'Roboto-Italic.ttf',
      bolditalics: 'Roboto-MediumItalic.ttf',
    },
  };
  return pdfmake;
}

// ── Generate PDF buffer with global defaults ─────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generatePdf(content: any[], footer?: any): Promise<Buffer> {
  const pdfmake = initPdfMake();
  const docDefinition = {
    pageSize: PDF_PAGE_SIZE,
    pageMargins: PDF_PAGE_MARGINS,
    defaultStyle: PDF_DEFAULT_STYLE,
    content,
    ...(footer ? { footer } : {}),
  };
  return await pdfmake.createPdf(docDefinition).getBuffer();
}

// ── Formatters ───────────────────────────────────────────────────────────────
export const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// ── Simple table layout (no node.table references) ───────────────────────────
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
