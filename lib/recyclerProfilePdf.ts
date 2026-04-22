// lib/recyclerProfilePdf.ts
// ═══════════════════════════════════════════════════════════════════════════════
// Recycler / Company profile factsheet PDF — used to share a listing snapshot
// from the India Circular Economy Directory with the listed company for
// verification and feedback. Non-commercial document; does not run through the
// Reports module (no items, no GST, no bank block).
// ═══════════════════════════════════════════════════════════════════════════════

/* eslint-disable @typescript-eslint/no-explicit-any */

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCompanyCO } from '@/lib/company';
import {
  generateSmartPdf,
  getLogoDataUrl,
  sanitizePdfText,
  fmtDate as fmtDateLong,
} from '@/lib/pdfConfig';
import {
  COLORS, FONT, BOX_LAYOUT,
  buildHeader, sectionLabel, sectionBox, twoColumnBox,
} from '@/lib/pdfTemplate';

const CATEGORY_LABELS: Record<string, string> = {
  'e-waste':       'E-Waste',
  'battery':       'Battery (Hydromet)',
  'black-mass':    'Black Mass / Mechanical',
  'both':          'E-Waste + Battery',
  'hazardous':     'Non-Ferrous Metals',
  'zinc-dross':    'Zinc Dross / Zinc Ash',
  'primary-metal': 'Primary Metal Producer',
  'ev-oem':        'EV OEM (vehicle + pack)',
  'battery-pack':  'Battery Pack Maker',
  'cell-maker':    'Li-ion Cell / CAM Maker',
};

export interface RecyclerProfilePdfResult {
  buffer: Buffer;
  filename: string;
}

export async function generateRecyclerProfilePdfBuffer(code: string): Promise<RecyclerProfilePdfResult> {
  const { data: r, error } = await supabaseAdmin
    .from('recyclers')
    .select('*')
    .eq('recycler_code', code)
    .eq('is_active', true)
    .maybeSingle();
  if (error || !r) throw new Error(`Recycler not found: ${code}`);

  const CO = await getCompanyCO();
  const logoUrl = getLogoDataUrl();

  const category = CATEGORY_LABELS[r.waste_type ?? ''] ?? 'Recycler';
  const verified = r.is_verified ? 'Verified' : 'Unverified';
  const generatedOn = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // ── Header (shared letterhead + document title) ────────────────────────────
  const header = buildHeader({
    logoUrl,
    companyName: CO.name,
    address: `${CO.addr1} ${CO.addr2}`,
    contactLine: `${CO.email}  |  ${CO.phone}  |  ${CO.web}`,
    gstin: CO.gstin,
    pan: CO.pan,
    cin: CO.cin,
    tan: CO.tan,
    documentTitle: 'COMPANY PROFILE',
  });

  const subtitle = {
    text: 'India Circular Economy Directory — Listing Snapshot',
    fontSize: FONT.body, italics: true, color: COLORS.medGray, alignment: 'right',
    margin: [0, -4, 0, 8],
  };

  // ── Meta strip (code + generated date) ─────────────────────────────────────
  const metaStrip = {
    columns: [
      { width: '*', text: '' },
      {
        width: 'auto',
        table: {
          widths: ['auto', 'auto'],
          body: [
            [
              { text: 'Facility Code', fontSize: FONT.small, color: COLORS.labelText },
              { text: r.recycler_code, fontSize: FONT.body, bold: true, color: '#b45309' },
            ],
            [
              { text: 'Snapshot Date', fontSize: FONT.small, color: COLORS.labelText },
              { text: generatedOn, fontSize: FONT.body },
            ],
          ],
        },
        layout: 'noBorders',
      },
    ],
    margin: [0, 0, 0, 8],
  };

  // ── Company identity block ────────────────────────────────────────────────
  const badgeRow = {
    columns: [
      { text: category, fontSize: FONT.small, bold: true, color: '#b45309', width: 'auto' },
      { text: `  ·  ${verified}`, fontSize: FONT.small, color: r.is_verified ? '#16a34a' : COLORS.medGray, width: 'auto' },
    ],
    margin: [0, 0, 0, 2],
  };

  const locationLine = [r.city, r.state].filter(Boolean).join(', ')
    + (r.pincode ? ` · ${r.pincode}` : '');

  const identityBlock = sectionBox({
    stack: [
      badgeRow,
      { text: sanitizePdfText(r.company_name), fontSize: 14, bold: true, color: COLORS.black, margin: [0, 2, 0, 2] },
      { text: locationLine, fontSize: FONT.body, color: COLORS.gray },
      ...(r.address ? [{ text: sanitizePdfText(r.address), fontSize: FONT.body, color: COLORS.gray, margin: [0, 2, 0, 0] }] : []),
      ...(r.latitude != null && r.longitude != null ? [{
        text: `GPS: ${Number(r.latitude).toFixed(4)}°N, ${Number(r.longitude).toFixed(4)}°E`,
        fontSize: FONT.small, color: COLORS.medGray, margin: [0, 3, 0, 0],
      }] : []),
    ],
  });

  // ── Operations metrics row (4 cells) ──────────────────────────────────────
  const metricCell = (label: string, value: string | null | undefined, color = COLORS.black): any => ({
    stack: [
      { text: label.toUpperCase(), fontSize: FONT.sectionLabel, color: COLORS.labelText, characterSpacing: 0.5 },
      { text: value ?? '—', fontSize: 9, bold: true, color: value ? color : COLORS.medGray, margin: [0, 2, 0, 0] },
    ],
  });

  const blackMassText = r.black_mass_mta
    ? `${new Intl.NumberFormat('en-IN').format(Number(r.black_mass_mta))} MTA`
    : null;

  const opsRow = {
    table: {
      widths: ['*', '*', '*', '*'],
      body: [[
        metricCell('Facility Type', r.facility_type ? String(r.facility_type).replace(/\b\w/g, (c: string) => c.toUpperCase()) : null),
        metricCell('Capacity / Month', r.capacity_per_month),
        metricCell('Black Mass Output', blackMassText, '#0891b2'),
        metricCell('Service Radius', r.service_radius_km ? `${r.service_radius_km} km` : null),
      ]],
    },
    layout: BOX_LAYOUT,
    margin: [0, 0, 0, 6],
  };

  // ── Contact / Authorisation two-column block ──────────────────────────────
  const fieldRow = (label: string, value: string | null | undefined, mono = false): any => {
    if (!value) return null;
    return {
      stack: [
        { text: label.toUpperCase(), fontSize: FONT.sectionLabel, color: COLORS.labelText, characterSpacing: 0.5 },
        {
          text: sanitizePdfText(value),
          fontSize: mono ? 7 : FONT.body,
          color: COLORS.black,
          font: mono ? undefined : undefined, // NotoSans handles both
          margin: [0, 1, 0, 0],
        },
      ],
      margin: [0, 0, 0, 4],
    };
  };

  const isPlaceholderEmail = (e: string | null | undefined) =>
    !e || /placeholder|^cpcb\.|^mrai\./i.test(e);

  const contactStack = {
    stack: [
      sectionLabel('Primary Contact'),
      ...([
        r.contact_person && r.contact_person !== 'Registered Facility' ? fieldRow('Contact Person', r.contact_person) : null,
        !isPlaceholderEmail(r.email) ? fieldRow('Email', r.email) : null,
        r.phone ? fieldRow('Phone', r.phone) : null,
        r.website ? fieldRow('Website', r.website.replace(/^https?:\/\//, '')) : null,
      ].filter(Boolean) as any[]),
      ...(
        !r.contact_person && isPlaceholderEmail(r.email) && !r.phone && !r.website
          ? [{ text: 'No primary contact publicly listed.', fontSize: FONT.small, italics: true, color: COLORS.medGray }]
          : []
      ),
    ],
  };

  const authStack = {
    stack: [
      sectionLabel('Authorisation & Identifiers'),
      ...([
        fieldRow('CPCB Registration', r.cpcb_registration, true),
        fieldRow('SPCB Registration', r.spcb_registration, true),
        fieldRow('Licence Valid Until', r.license_valid_until ? fmtDateLong(r.license_valid_until) : null),
        fieldRow('GSTIN', r.gstin, true),
        fieldRow('CIN', r.cin, true),
      ].filter(Boolean) as any[]),
      ...(
        !r.cpcb_registration && !r.spcb_registration && !r.gstin && !r.cin && !r.license_valid_until
          ? [{ text: 'No statutory identifiers on record yet.', fontSize: FONT.small, italics: true, color: COLORS.medGray }]
          : []
      ),
    ],
  };

  const contactAuthRow = twoColumnBox(contactStack, authStack);

  // ── Capabilities ──────────────────────────────────────────────────────────
  let capabilitiesBlock: any = null;
  if (Array.isArray(r.capabilities) && r.capabilities.length > 0) {
    capabilitiesBlock = sectionBox({
      stack: [
        sectionLabel('Capabilities'),
        { text: (r.capabilities as string[]).map(sanitizePdfText).join('  ·  '), fontSize: FONT.body, color: COLORS.black, margin: [0, 2, 0, 0] },
      ],
    });
  }

  // ── Description / notes ──────────────────────────────────────────────────
  let notesBlock: any = null;
  const isDupNote = r.notes && /\[(cross-category )?dup/i.test(r.notes);
  if (r.notes && !isDupNote) {
    notesBlock = sectionBox({
      stack: [
        sectionLabel('Description'),
        { text: sanitizePdfText(r.notes), fontSize: FONT.body, color: COLORS.gray, lineHeight: 1.3, margin: [0, 2, 0, 0] },
      ],
    });
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const footer = (currentPage: number, pageCount: number) => ({
    columns: [
      { text: `${r.company_name}  ·  ${r.recycler_code}`, fontSize: 6, color: COLORS.medGray, margin: [36, 0, 0, 0] },
      { text: `${CO.web}  |  ${CO.email}`, fontSize: 6, color: COLORS.medGray, alignment: 'center' },
      { text: `Page ${currentPage} of ${pageCount}`, fontSize: 6, color: COLORS.medGray, alignment: 'right', margin: [0, 0, 36, 0] },
    ],
    margin: [0, 12, 0, 0],
  });

  // ── Disclaimer (body, not page footer) ───────────────────────────────────
  const disclaimer = {
    text: [
      { text: 'Disclaimer: ', fontSize: FONT.small, bold: true, color: COLORS.medGray },
      {
        text: 'Rotehügels operates as a digital facilitator only. Listing information is sourced from CPCB, SPCB, MPCB, and MoEF registries, MCA filings, and publicly available disclosures. Rotehügels does not physically collect, store, handle, or transport any waste. Listing on this directory does not constitute endorsement. This snapshot is shared for verification and feedback; corrections are welcomed at sivakumar@rotehuegels.com.',
        fontSize: FONT.small, color: COLORS.medGray,
      },
    ],
    margin: [0, 8, 0, 0],
  };

  // ── Assemble content ──────────────────────────────────────────────────────
  const content: any[] = [
    header,
    subtitle,
    metaStrip,
    identityBlock,
    opsRow,
    contactAuthRow,
    ...(capabilitiesBlock ? [capabilitiesBlock] : []),
    ...(notesBlock ? [notesBlock] : []),
    disclaimer,
  ];

  const buffer = await generateSmartPdf(content, footer);

  const safeName = (r.company_name ?? 'profile').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const filename = `${safeName}-${r.recycler_code}-Profile.pdf`;

  return { buffer, filename };
}
