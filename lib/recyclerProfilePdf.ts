// lib/recyclerProfilePdf.ts
// ═══════════════════════════════════════════════════════════════════════════════
// Recycler / Company profile factsheet PDF — an internal document that is also
// shareable with the listed recycler for verification and correction. Scrubs
// internal-only metadata (dup tags, scraping sources, MCA-derived director
// rosters) before rendering.
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

// ── Ligature-safe text helper ───────────────────────────────────────────────
// pdfkit runs the `liga` OpenType feature on text even when pdfmake's
// defaultStyle.fontFeatures:[] is set — so our embedded Noto Sans still
// substitutes f+i / f+l / f+f with composed glyphs that render blank
// ("identifiers" → "identifers"). Inserting a zero-width non-joiner (U+200C)
// between the problem pairs prevents the shaper from forming the ligature
// regardless of pdfkit's fontFeatures behaviour.
function breakLigatures(s: string): string {
  return s
    .replace(/f([ifl])/g, 'f‌$1')
    .replace(/ffi/g, 'f‌f‌i')
    .replace(/ffl/g, 'f‌f‌l');
}

const T = (text: string, style: Record<string, any> = {}) =>
  ({ text: breakLigatures(text), fontFeatures: [], ...style });

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

type ContactRow = {
  name?: string | null; title?: string | null; department?: string | null;
  email?: string | null; phone?: string | null;
};
type WebsiteRow = { url: string };

export interface RecyclerProfilePdfResult {
  buffer: Buffer;
  filename: string;
}

function stripInternalTags(notes: string): string {
  return notes
    .replace(/\[cross-category dup\]/gi, '')
    .replace(/\[capacity[^\]]*\]/gi, '')
    .replace(/\[dup[^\]]*\]/gi, '')
    .replace(/\[merged[^\]]*\]/gi, '')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function notesAreDupTracking(notes: string): boolean {
  return /\[(cross-category )?dup/i.test(notes);
}

export async function generateRecyclerProfilePdfBuffer(code: string): Promise<RecyclerProfilePdfResult> {
  const { data: r, error } = await supabaseAdmin
    .from('recyclers')
    .select('*')
    .eq('recycler_code', code)
    .eq('is_active', true)
    .maybeSingle();
  if (error || !r) throw new Error(`Recycler not found: ${code}`);

  // Related units under the same parent company (public context only —
  // helps the recipient see how their multi-registration is linked).
  let related: Array<{ recycler_code: string; unit_name: string | null; city: string | null;
    state: string | null; waste_type: string | null; capacity_per_month: string | null }> = [];
  if (r.company_id) {
    const { data: rel } = await supabaseAdmin
      .from('recyclers')
      .select('recycler_code, unit_name, city, state, waste_type, capacity_per_month')
      .eq('company_id', r.company_id)
      .eq('is_active', true)
      .neq('recycler_code', code)
      .limit(12);
    related = rel ?? [];
  }

  const CO = await getCompanyCO();
  const logoUrl = getLogoDataUrl();

  const category = CATEGORY_LABELS[r.waste_type ?? ''] ?? 'Recycler';
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

  const subtitle = T('India Circular Economy Directory — Listing Snapshot', {
    fontSize: FONT.body, italics: true, color: COLORS.medGray, alignment: 'right',
    margin: [0, -4, 0, 8],
  });

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
              T('Facility Code', { fontSize: FONT.small, color: COLORS.labelText }),
              T(r.recycler_code, { fontSize: FONT.body, bold: true, color: '#b45309' }),
            ],
            [
              T('Snapshot Date', { fontSize: FONT.small, color: COLORS.labelText }),
              T(generatedOn, { fontSize: FONT.body }),
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
      T(category, { fontSize: FONT.small, bold: true, color: '#b45309', width: 'auto' }),
      ...(r.is_verified
        ? [T('  ·  Verified', { fontSize: FONT.small, color: '#16a34a', width: 'auto' })]
        : []),
    ],
    margin: [0, 0, 0, 2],
  };

  const locationLine = [r.city, r.state].filter(Boolean).join(', ')
    + (r.pincode ? ` · ${r.pincode}` : '');

  const identityStack: any[] = [
    badgeRow,
    T(sanitizePdfText(r.company_name), { fontSize: 14, bold: true, color: COLORS.black, margin: [0, 2, 0, 2] }),
  ];
  if (r.unit_name && r.unit_name !== locationLine) {
    identityStack.push(T(sanitizePdfText(r.unit_name), { fontSize: FONT.body, color: COLORS.gray }));
  }
  identityStack.push(T(locationLine, { fontSize: FONT.body, color: COLORS.gray }));
  if (r.address) {
    identityStack.push(T(sanitizePdfText(r.address), { fontSize: FONT.body, color: COLORS.gray, margin: [0, 2, 0, 0] }));
  }
  if (r.latitude != null && r.longitude != null) {
    identityStack.push(T(
      `GPS: ${Number(r.latitude).toFixed(4)}°N, ${Number(r.longitude).toFixed(4)}°E`,
      { fontSize: FONT.small, color: COLORS.medGray, margin: [0, 3, 0, 0] },
    ));
  }
  const identityBlock = sectionBox({ stack: identityStack });

  // ── Operations metrics row (4 cells) ──────────────────────────────────────
  const metricCell = (label: string, value: string | null | undefined, color = COLORS.black): any => ({
    stack: [
      T(label.toUpperCase(), { fontSize: FONT.sectionLabel, color: COLORS.labelText, characterSpacing: 0.5 }),
      T(value ?? '—', { fontSize: 9, bold: true, color: value ? color : COLORS.medGray, margin: [0, 2, 0, 0] }),
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

  // ── Field row helper (label above value) ──────────────────────────────────
  const fieldRow = (label: string, value: string | null | undefined): any => {
    if (!value) return null;
    return {
      stack: [
        T(label.toUpperCase(), { fontSize: FONT.sectionLabel, color: COLORS.labelText, characterSpacing: 0.5 }),
        T(sanitizePdfText(value), { fontSize: FONT.body, color: COLORS.black, margin: [0, 1, 0, 0] }),
      ],
      margin: [0, 0, 0, 4],
    };
  };

  // ── Primary contact block ─────────────────────────────────────────────────
  const isPlaceholderEmail = (e: string | null | undefined) =>
    !e || /placeholder|^cpcb\.|^mrai\./i.test(e);
  const realContactPerson = r.contact_person && r.contact_person !== 'Registered Facility'
    ? r.contact_person : null;

  const contactItems: any[] = [
    realContactPerson ? fieldRow('Contact Person', realContactPerson) : null,
    !isPlaceholderEmail(r.email) ? fieldRow('Email', r.email) : null,
    r.phone ? fieldRow('Phone', r.phone) : null,
    r.website ? fieldRow('Website', r.website.replace(/^https?:\/\//, '')) : null,
  ].filter(Boolean);

  const contactStack = {
    stack: [
      sectionLabel('Primary Contact'),
      ...(contactItems.length > 0
        ? contactItems
        : [T('No primary contact publicly listed.', {
            fontSize: FONT.small, italics: true, color: COLORS.medGray,
          })]),
    ],
  };

  // ── Authorisation & identifiers block ─────────────────────────────────────
  const authItems: any[] = [
    fieldRow('CPCB Registration', r.cpcb_registration),
    fieldRow('SPCB Registration', r.spcb_registration),
    fieldRow('Licence Valid Until', r.license_valid_until ? fmtDateLong(r.license_valid_until) : null),
    fieldRow('GSTIN', r.gstin),
    fieldRow('CIN', r.cin),
  ].filter(Boolean);

  const authStack = {
    stack: [
      sectionLabel('Authorisation & Identifiers'),
      ...(authItems.length > 0
        ? authItems
        : [T('No statutory identifiers on record yet.', {
            fontSize: FONT.small, italics: true, color: COLORS.medGray,
          })]),
    ],
  };

  const contactAuthRow = twoColumnBox(contactStack, authStack);

  // ── Additional public emails from contacts_all (non-director rows only)
  //    with a real email address. Director-only rows from MCA scraping are
  //    intentionally NOT shared — the recipient knows their own board.
  const contactsAll = (Array.isArray(r.contacts_all) ? r.contacts_all : []) as ContactRow[];
  const extraContacts = contactsAll
    .filter(c => c.email && c.email !== r.email)
    .map(c => ({
      name: c.name && c.name !== 'Registered Facility' ? c.name : null,
      title: c.title ?? null,
      email: c.email!,
      phone: c.phone ?? null,
    }));

  let extraContactsBlock: any = null;
  if (extraContacts.length > 0) {
    extraContactsBlock = sectionBox({
      stack: [
        sectionLabel('Additional Contact Points on Record'),
        {
          table: {
            widths: ['*', '*', '*', '*'],
            body: [
              [
                T('NAME', { fontSize: FONT.sectionLabel, color: COLORS.labelText }),
                T('TITLE', { fontSize: FONT.sectionLabel, color: COLORS.labelText }),
                T('EMAIL', { fontSize: FONT.sectionLabel, color: COLORS.labelText }),
                T('PHONE', { fontSize: FONT.sectionLabel, color: COLORS.labelText }),
              ],
              ...extraContacts.slice(0, 8).map(c => [
                T(c.name ?? '—', { fontSize: FONT.body }),
                T(c.title ?? '—', { fontSize: FONT.body }),
                T(c.email, { fontSize: FONT.body, color: '#0369a1' }),
                T(c.phone ?? '—', { fontSize: FONT.body }),
              ]),
            ],
          },
          layout: {
            hLineWidth: (i: number) => i === 1 ? 0.5 : 0,
            vLineWidth: () => 0,
            hLineColor: () => COLORS.border,
            paddingTop: () => 2, paddingBottom: () => 2,
            paddingLeft: () => 0, paddingRight: () => 4,
          },
          margin: [0, 2, 0, 0],
        },
      ],
    });
  }

  // ── Additional websites on record ─────────────────────────────────────────
  const websitesAll = (Array.isArray(r.websites_all) ? r.websites_all : []) as WebsiteRow[];
  const extraWebsites = websitesAll
    .map(w => w.url)
    .filter(url => url && url !== r.website);
  let extraWebsitesBlock: any = null;
  if (extraWebsites.length > 0) {
    extraWebsitesBlock = sectionBox({
      stack: [
        sectionLabel('Additional Websites on Record'),
        T(extraWebsites.map(u => u.replace(/^https?:\/\//, '')).join('  ·  '),
          { fontSize: FONT.body, color: COLORS.black, margin: [0, 2, 0, 0] }),
      ],
    });
  }

  // ── Related units under the same parent company ──────────────────────────
  let relatedBlock: any = null;
  if (related.length > 0) {
    relatedBlock = sectionBox({
      stack: [
        sectionLabel('Other Listed Units Under the Same Group'),
        {
          table: {
            widths: ['auto', '*', '*', 'auto'],
            body: [
              [
                T('CODE', { fontSize: FONT.sectionLabel, color: COLORS.labelText }),
                T('UNIT / LOCATION', { fontSize: FONT.sectionLabel, color: COLORS.labelText }),
                T('CATEGORY', { fontSize: FONT.sectionLabel, color: COLORS.labelText }),
                T('CAPACITY', { fontSize: FONT.sectionLabel, color: COLORS.labelText, alignment: 'right' }),
              ],
              ...related.map(o => [
                T(o.recycler_code, { fontSize: FONT.body, bold: true, color: '#b45309' }),
                T(sanitizePdfText(o.unit_name ?? [o.city, o.state].filter(Boolean).join(', ')), { fontSize: FONT.body }),
                T(CATEGORY_LABELS[o.waste_type ?? ''] ?? '—', { fontSize: FONT.body }),
                T(o.capacity_per_month ?? '—', { fontSize: FONT.body, alignment: 'right' }),
              ]),
            ],
          },
          layout: {
            hLineWidth: (i: number) => i === 1 ? 0.5 : 0,
            vLineWidth: () => 0,
            hLineColor: () => COLORS.border,
            paddingTop: () => 2, paddingBottom: () => 2,
            paddingLeft: () => 0, paddingRight: () => 4,
          },
          margin: [0, 2, 0, 0],
        },
      ],
    });
  }

  // ── Capabilities ─────────────────────────────────────────────────────────
  let capabilitiesBlock: any = null;
  if (Array.isArray(r.capabilities) && r.capabilities.length > 0) {
    capabilitiesBlock = sectionBox({
      stack: [
        sectionLabel('Capabilities'),
        T((r.capabilities as string[]).map(sanitizePdfText).join('  ·  '),
          { fontSize: FONT.body, color: COLORS.black, margin: [0, 2, 0, 0] }),
      ],
    });
  }

  // ── Description (scrubbed — internal dup/bookkeeping tags removed) ───────
  let notesBlock: any = null;
  if (r.notes && !notesAreDupTracking(r.notes)) {
    const cleaned = stripInternalTags(r.notes);
    if (cleaned.length > 0) {
      notesBlock = sectionBox({
        stack: [
          sectionLabel('Description'),
          T(sanitizePdfText(cleaned),
            { fontSize: FONT.body, color: COLORS.gray, lineHeight: 1.3, margin: [0, 2, 0, 0] }),
        ],
      });
    }
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const footer = (currentPage: number, pageCount: number) => ({
    columns: [
      T(`${r.company_name}  ·  ${r.recycler_code}`,
        { fontSize: 6, color: COLORS.medGray, margin: [36, 0, 0, 0] }),
      T(`${CO.web}  |  ${CO.email}`,
        { fontSize: 6, color: COLORS.medGray, alignment: 'center' }),
      T(`Page ${currentPage} of ${pageCount}`,
        { fontSize: 6, color: COLORS.medGray, alignment: 'right', margin: [0, 0, 36, 0] }),
    ],
    margin: [0, 12, 0, 0],
  });

  // ── Disclaimer ───────────────────────────────────────────────────────────
  const disclaimer = {
    text: [
      T('Disclaimer: ', { fontSize: FONT.small, bold: true, color: COLORS.medGray }),
      T(
        'Rotehügels operates as a digital facilitator only. Listing information is sourced from CPCB, SPCB, MPCB, and MoEF registries, MCA filings, and publicly available disclosures. Rotehügels does not physically collect, store, handle, or transport any waste. Listing on this directory does not constitute endorsement. This snapshot is shared with the listed facility for verification and feedback; corrections are welcomed at sivakumar@rotehuegels.com.',
        { fontSize: FONT.small, color: COLORS.medGray },
      ),
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
    ...(extraContactsBlock ? [extraContactsBlock] : []),
    ...(extraWebsitesBlock ? [extraWebsitesBlock] : []),
    ...(relatedBlock ? [relatedBlock] : []),
    ...(capabilitiesBlock ? [capabilitiesBlock] : []),
    ...(notesBlock ? [notesBlock] : []),
    disclaimer,
  ];

  const buffer = await generateSmartPdf(content, footer);

  const safeName = (r.company_name ?? 'profile').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const filename = `${safeName}-${r.recycler_code}-Profile.pdf`;

  return { buffer, filename };
}
