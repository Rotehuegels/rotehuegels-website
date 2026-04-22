// lib/recyclerProfilePdf.ts
// ═══════════════════════════════════════════════════════════════════════════════
// Recycler / Company profile factsheet PDF — an internal document that is also
// shareable with the listed recycler for verification and correction. Scrubs
// internal-only metadata (dup tags, scraping sources, MCA-derived director
// rosters) before rendering.
// ═══════════════════════════════════════════════════════════════════════════════

/* eslint-disable @typescript-eslint/no-explicit-any */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
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

  // ── Information request ──────────────────────────────────────────────────
  const missingList: string[] = [];
  if (!r.cpcb_registration) missingList.push('CPCB authorisation / registration number');
  if (!r.spcb_registration) missingList.push('SPCB authorisation / registration number');
  if (!r.license_valid_until) missingList.push('Licence validity (current expiry date)');
  if (!r.gstin && !r.cin) missingList.push('GSTIN and CIN');
  else if (!r.gstin) missingList.push('GSTIN');
  else if (!r.cin) missingList.push('CIN (if applicable)');
  if (!r.address || !r.pincode) missingList.push('Full postal address with pincode');
  if (!r.phone && !realContactPerson) missingList.push('Direct phone and a named primary contact with role');
  else if (!r.phone) missingList.push('Direct phone for the facility');
  else if (!realContactPerson) missingList.push('Name and role of the primary contact');
  if (!r.capabilities || (Array.isArray(r.capabilities) && r.capabilities.length === 0)) {
    missingList.push('Specific waste streams and processing capabilities handled');
  }
  if ((r.waste_type === 'battery' || r.waste_type === 'both' || r.waste_type === 'black-mass') && !r.black_mass_mta) {
    missingList.push('Black-mass / Li-ion material output capacity (MTA)');
  }

  const suggestions = [
    'Licensed vs. operational capacity — FY24 and FY25 actual throughput by material stream',
    'Material recovery yields and product purities achieved for each stream',
    'Quality and environmental certifications held (ISO 9001 / 14001 / 45001, IATF, BIS, R2, and sector-specific)',
    'EPR registration numbers for battery and e-waste streams',
    'Recent and planned capacity expansion, including capex commitments',
    'Additional facilities, depots, or collection points not already captured above',
    'Preferred single point of contact for commercial and for technical enquiries',
    'Any public narrative you would like highlighted (awards, partnerships, recent milestones)',
  ];

  type MarketField = { label: string; height: number; multiline?: boolean };
  const marketplace: MarketField[] = [
    { label: 'Interest in joining the Rotehügels marketplace — yes / would like to learn more / not at this stage', height: 24 },
    { label: 'Contact person for marketplace procurement of e-waste and industry byproducts — name, role, direct email and phone. Please flag separately if different contacts handle e-waste vs. industry byproduct.', height: 48, multiline: true },
    { label: 'Material streams and sub-categories you would be willing to accept via the platform (e-waste sub-streams, Li-ion chemistries, non-ferrous scrap, industry byproducts, etc.)', height: 44, multiline: true },
    { label: 'Preferred service geography — pin-code radius around the plant, state-wise, pan-India, or export-inclusive', height: 30 },
    { label: 'Minimum and maximum pickup lot sizes you would accept (specify unit — kg or MT)', height: 28 },
    { label: 'Response-time commitment you can offer from post to confirmation (hours or days)', height: 28 },
    { label: 'Logistics handling preference — own fleet, platform-arranged transporter, or third-party tie-up', height: 28 },
    { label: 'EPR-fulfilment certificate handling — how you would like credits and traceability documents generated, routed, and reconciled on the platform', height: 44, multiline: true },
    { label: 'What would make this marketplace most useful for your operation — design preferences, dealbreakers, or features you would want built in before go-live', height: 56, multiline: true },
  ];

  // The editable Information Request form is appended by pdf-lib after
  // pdfmake finishes, so `missingList`, `suggestions`, and `marketplace`
  // are carried forward below — no pdfmake rendering of the form on page 1.

  // Page-level footers are stamped by pdf-lib AFTER both the pdfmake
  // snapshot and the form pages are assembled — that way the "Page X of Y"
  // count reflects the total document, not just the pdfmake portion. See
  // appendEditableFormPages().

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

  const snapshotBuffer = await generateSmartPdf(content);
  const buffer = await appendEditableFormPages(snapshotBuffer, {
    companyName: r.company_name,
    recyclerCode: r.recycler_code,
    footerLeft: `${r.company_name}  ·  ${r.recycler_code}`,
    footerCenter: `${CO.web}  |  ${CO.email}`,
    missingList,
    suggestions,
    marketplace,
  });

  const safeName = (r.company_name ?? 'profile').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const filename = `${safeName}-${r.recycler_code}-Profile.pdf`;

  return { buffer, filename };
}

// ── pdf-lib: append editable "Information Request" page(s) ──────────────────
// pdfmake cannot produce AcroForm fields, so we open the pdfmake output with
// pdf-lib, add one or more new pages, and place real editable text fields on
// them. The recipient can type directly in any PDF viewer.
async function appendEditableFormPages(
  baseBuffer: Buffer,
  opts: {
    companyName: string;
    recyclerCode: string;
    footerLeft: string;
    footerCenter: string;
    missingList: string[];
    suggestions: string[];
    marketplace: Array<{ label: string; height: number; multiline?: boolean }>;
  },
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(baseBuffer);
  const form = pdfDoc.getForm();
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const gray = rgb(0.35, 0.35, 0.35);
  const medGray = rgb(0.55, 0.55, 0.55);
  const labelGray = rgb(0.4, 0.4, 0.4);
  const dark = rgb(0.1, 0.1, 0.1);
  const borderColor = rgb(0.83, 0.83, 0.85);
  const fillColor = rgb(0.98, 0.98, 0.98);

  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 36;
  const contentWidth = pageWidth - 2 * margin;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  let pageIndex = 1;

  const newPage = () => {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
    pageIndex++;
    // continuation header
    page.drawText(`Information Request (cont.) — ${opts.companyName} · ${opts.recyclerCode}`, {
      x: margin, y: y - 10, size: 9, font: helv, color: medGray,
    });
    y -= 22;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < margin + 30) newPage();
  };

  // Sanitise text for StandardFonts (Helvetica WinAnsi encoding — cannot
  // render ü, ö, etc.) So we replace common non-ASCII characters.
  const enc = (s: string) => s
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ä/g, 'a').replace(/Ä/g, 'A')
    .replace(/[–—]/g, '-')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/…/g, '...')
    .replace(/·/g, '-');

  // Unique field-name slugifier (names must be unique per PDF)
  const usedNames = new Set<string>();
  const slug = (s: string) => {
    const base = s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
    let name = base;
    let i = 1;
    while (usedNames.has(name)) name = `${base}_${i++}`;
    usedNames.add(name);
    return name;
  };

  // Draw wrapped text, returns the y-position after drawing.
  const drawWrapped = (text: string, opts2: {
    size: number; font: any; color: any; maxWidth: number; lineHeight?: number;
  }): void => {
    const lh = opts2.lineHeight ?? opts2.size * 1.25;
    const words = enc(text).split(/\s+/);
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      const width = opts2.font.widthOfTextAtSize(test, opts2.size);
      if (width > opts2.maxWidth && line) {
        page.drawText(line, { x: margin, y: y - opts2.size, size: opts2.size, font: opts2.font, color: opts2.color });
        y -= lh;
        line = w;
      } else {
        line = test;
      }
    }
    if (line) {
      page.drawText(line, { x: margin, y: y - opts2.size, size: opts2.size, font: opts2.font, color: opts2.color });
      y -= lh;
    }
  };

  // ── Page header ─────────────────────────────────────────────────────────
  page.drawText(enc('Information Request — Please Review & Complete'), {
    x: margin, y: y - 14, size: 13, font: helvBold, color: dark,
  });
  y -= 24;
  page.drawText(enc(`For ${opts.companyName} · ${opts.recyclerCode}`), {
    x: margin, y: y - 10, size: 9, font: helv, color: gray,
  });
  y -= 18;
  drawWrapped(
    'If any details on page 1 need correction, please let us know. You can type directly into the fields below using any PDF viewer (or print and annotate).',
    { size: 9, font: helvItalic, color: gray, maxWidth: contentWidth, lineHeight: 12 },
  );
  y -= 8;

  // ── Helper: add a field with a label above it ──────────────────────────
  const addField = (label: string, opts3: { height: number; multiline?: boolean }) => {
    const labelLines = wrapIntoLines(enc(label), helv, 8.5, contentWidth);
    const labelHeight = labelLines.length * 11 + 2;
    ensureSpace(labelHeight + opts3.height + 8);
    for (const line of labelLines) {
      page.drawText(line, { x: margin, y: y - 8.5, size: 8.5, font: helv, color: labelGray });
      y -= 11;
    }
    y -= 2;
    const field = form.createTextField(slug(label));
    field.setText('');
    if (opts3.multiline) field.enableMultiline();
    field.addToPage(page, {
      x: margin, y: y - opts3.height, width: contentWidth, height: opts3.height,
      borderColor, backgroundColor: fillColor, borderWidth: 0.5,
    });
    y -= opts3.height + 8;
  };

  // ── Currently missing ─────────────────────────────────────────────────
  if (opts.missingList.length > 0) {
    ensureSpace(18);
    page.drawText(enc('CURRENTLY MISSING — PLEASE PROVIDE'), {
      x: margin, y: y - 9, size: 8, font: helvBold, color: gray,
    });
    y -= 16;
    for (const label of opts.missingList) {
      addField(label, { height: 18 });
    }
    y -= 4;
  }

  // ── Additional context ─────────────────────────────────────────────────
  ensureSpace(18);
  page.drawText(enc('ADDITIONAL CONTEXT THAT WOULD STRENGTHEN YOUR LISTING'), {
    x: margin, y: y - 9, size: 8, font: helvBold, color: gray,
  });
  y -= 16;
  for (const label of opts.suggestions) {
    addField(label, { height: 42, multiline: true });
  }
  y -= 4;

  // ── Marketplace participation ──────────────────────────────────────────
  ensureSpace(80);
  page.drawText(enc('MARKETPLACE PARTICIPATION — YOUR INTEREST & INPUT'), {
    x: margin, y: y - 9, size: 8, font: helvBold, color: gray,
  });
  y -= 16;
  drawWrapped(
    'Rotehügels is preparing to launch a digital marketplace layered on top of this directory. In outline: bulk generators of e-waste and spent Li-ion batteries — factories, OEMs, licensed collection agencies, institutional producers — post available stock with material stream, quantity, location, and condition details. The platform matches each lot against recyclers whose licence class, headroom, material capability, and operational geography fit the requirement. Matched recyclers confirm availability and terms; the platform handles pickup scheduling and transporter coordination; chain-of-custody data is captured at every handover; and an EPR-fulfilment certificate is generated on closure.',
    { size: 8.5, font: helv, color: gray, maxWidth: contentWidth, lineHeight: 11 },
  );
  y -= 4;
  drawWrapped(
    'Before go-live, we would value your input on whether participation is of interest and on the design choices that would make the platform useful for your operation.',
    { size: 8.5, font: helvItalic, color: gray, maxWidth: contentWidth, lineHeight: 11 },
  );
  y -= 8;
  for (const m of opts.marketplace) {
    addField(m.label, { height: m.height, multiline: m.multiline });
  }
  y -= 4;

  // ── Response submitted by ─────────────────────────────────────────────
  ensureSpace(60);
  page.drawText(enc('RESPONSE SUBMITTED BY'), {
    x: margin, y: y - 9, size: 8, font: helvBold, color: gray,
  });
  y -= 16;
  page.drawText('Name & role', { x: margin, y: y - 8, size: 8.5, font: helv, color: labelGray });
  page.drawText('Date', { x: margin + contentWidth - 150, y: y - 8, size: 8.5, font: helv, color: labelGray });
  y -= 12;
  const nameField = form.createTextField(slug('response_name_role'));
  nameField.setText('');
  nameField.addToPage(page, {
    x: margin, y: y - 20, width: contentWidth - 160, height: 20,
    borderColor, backgroundColor: fillColor, borderWidth: 0.5,
  });
  const dateField = form.createTextField(slug('response_date'));
  dateField.setText('');
  dateField.addToPage(page, {
    x: margin + contentWidth - 150, y: y - 20, width: 150, height: 20,
    borderColor, backgroundColor: fillColor, borderWidth: 0.5,
  });
  y -= 30;

  drawWrapped(
    'Reply by email to sivakumar@rotehuegels.com, or let us know a convenient time for a short call.',
    { size: 8.5, font: helvItalic, color: gray, maxWidth: contentWidth, lineHeight: 11 },
  );

  // Render a default appearance stream for every field using Helvetica so
  // viewers that do not regenerate appearances on demand (notably some
  // macOS Preview versions) still show the fields as clickable + typable.
  form.updateFieldAppearances(helv);

  // Stamp a consistent "Page X of Y" footer across every page of the
  // assembled document — both the pdfmake snapshot page(s) and the
  // pdf-lib form pages — so the count reflects the true total.
  const allPages = pdfDoc.getPages();
  const pageTotal = allPages.length;
  const footerFontSize = 6;
  const footerColor = medGray;
  const footerBottom = 22;
  const footerLeft = enc(opts.footerLeft);
  const footerCenter = enc(opts.footerCenter);
  for (let i = 0; i < pageTotal; i++) {
    const p = allPages[i];
    const { width } = p.getSize();
    const rightText = `Page ${i + 1} of ${pageTotal}`;
    p.drawText(footerLeft, {
      x: margin, y: footerBottom,
      size: footerFontSize, font: helv, color: footerColor,
    });
    const centerWidth = helv.widthOfTextAtSize(footerCenter, footerFontSize);
    p.drawText(footerCenter, {
      x: (width - centerWidth) / 2, y: footerBottom,
      size: footerFontSize, font: helv, color: footerColor,
    });
    const rightWidth = helv.widthOfTextAtSize(rightText, footerFontSize);
    p.drawText(rightText, {
      x: width - margin - rightWidth, y: footerBottom,
      size: footerFontSize, font: helv, color: footerColor,
    });
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

// Wrap text into lines that fit within maxWidth at the given font/size.
function wrapIntoLines(text: string, font: any, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line); line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}
