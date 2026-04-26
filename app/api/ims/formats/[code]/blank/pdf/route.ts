// ── Blank IMS Format (Form Template) PDF ────────────────────────────────────
// Renders printable / fillable blank versions of any controlled format.
// The 8 originally-pending forms (NCR, Audit Checklist, Pilot Trial Charter,
// Method Validation, Compliance Calendar, Cycle Count, Contract Drafting
// Request, Software Release Notes) all have specialised bodies below; every
// other format falls through to a generic "key-fields-as-input-rows" layout
// driven by FormatEntry.keyFields[].

import { NextResponse } from 'next/server';
import { FORMATS, type FormatEntry } from '@/lib/imsRegister';
import { getCompanyCO } from '@/lib/company';
import { getLogoDataUrl, generateSmartPdf } from '@/lib/pdfConfig';
import { COLORS, FONT, TABLE_LAYOUT, buildHeader } from '@/lib/pdfTemplate';

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = 'force-dynamic';

// ── Reusable building blocks ────────────────────────────────────────────────

function fieldLabel(text: string): any {
  return {
    text: text.toUpperCase(),
    fontSize: FONT.small,
    bold: true,
    color: COLORS.sectionHeader,
    characterSpacing: 0.4,
    margin: [0, 0, 0, 1],
  };
}

/** Empty box for handwritten fill-in. `lines` controls the height. */
function fillBox(lines = 1): any {
  return {
    table: {
      widths: ['*'],
      body: [[{
        text: ' ',
        fontSize: FONT.body,
        margin: [0, 0, 0, lines * 9],
      }]],
    },
    layout: TABLE_LAYOUT,
    margin: [0, 0, 0, 4],
  };
}

/** A labelled row with N empty boxes side-by-side (e.g., Date | Time | Initials). */
function rowOfFields(items: Array<{ label: string; lines?: number; widthRatio?: number }>): any {
  const widths = items.map((i) => (i.widthRatio ? `${i.widthRatio}%` : '*'));
  const cells = items.map((i) => ({
    stack: [fieldLabel(i.label), fillBox(i.lines ?? 1)],
  }));
  return { columns: cells, columnGap: 8, margin: [0, 0, 0, 0] };
}

/** Section band rendered via a 1-row table (for proper width fill). */
function sectionBand(num: string, title: string): any {
  return {
    table: {
      widths: ['*'],
      body: [[{
        text: `${num}.  ${title.toUpperCase()}`,
        fontSize: FONT.heading,
        bold: true,
        color: COLORS.white,
        fillColor: COLORS.darkGray,
        characterSpacing: 0.4,
        margin: [6, 3, 0, 3],
      }]],
    },
    layout: 'noBorders',
    margin: [0, 8, 0, 4],
  };
}

/** Approval / signatory block — three signatories side-by-side. */
function signatureRow(roles: string[]): any {
  return {
    columns: roles.map((role) => ({
      stack: [
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 140, y2: 0, lineWidth: 0.5, lineColor: COLORS.lightGray }], margin: [0, 22, 0, 1] },
        { text: role, fontSize: FONT.small, color: COLORS.medGray, alignment: 'center' },
        { text: 'Name / Date / Signature', fontSize: 5.5, color: COLORS.lightGray, alignment: 'center' },
      ],
      width: '*',
    })),
    columnGap: 14,
    margin: [0, 6, 0, 4],
  };
}

/** Standard meta-block at the top of every blank: format no, revision, instructions. */
function metaBlock(f: FormatEntry): any {
  return {
    table: {
      widths: [80, '*', 80, '*'],
      body: [
        [
          { text: 'FORMAT NO.',  bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small, characterSpacing: 0.3 },
          { text: f.formatNo,                                              fontSize: FONT.small, color: COLORS.black, bold: true },
          { text: 'REVISION',    bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small, characterSpacing: 0.3 },
          { text: f.revision,                                              fontSize: FONT.small, color: COLORS.darkGray },
        ],
        [
          { text: 'PARENT SOP', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small, characterSpacing: 0.3 },
          { text: f.parentSop,                                             fontSize: FONT.small, color: COLORS.darkGray },
          { text: 'OWNER',      bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small, characterSpacing: 0.3 },
          { text: 'Management Representative',                              fontSize: FONT.small, color: COLORS.darkGray },
        ],
      ],
    },
    layout: TABLE_LAYOUT,
    margin: [0, 0, 0, 4],
  };
}

// ── Per-form bodies ─────────────────────────────────────────────────────────

function bodyNCR(): any[] {
  return [
    sectionBand('1', 'Identification'),
    {
      columns: [
        { stack: [fieldLabel('NCR Number'), fillBox(1)],     width: '*' },
        { stack: [fieldLabel('Date Raised'), fillBox(1)],    width: '*' },
        { stack: [fieldLabel('Originator'), fillBox(1)],     width: '*' },
      ],
      columnGap: 8,
    },
    {
      columns: [
        { stack: [fieldLabel('Source: ☐ In-house  ☐ Supplier  ☐ Customer Complaint  ☐ Internal Audit'), fillBox(1)], width: '*' },
        { stack: [fieldLabel('Severity: ☐ Minor  ☐ Major  ☐ Critical'),                                  fillBox(1)], width: '*' },
      ],
      columnGap: 8,
    },

    sectionBand('2', 'Description of Non-conformance'),
    fillBox(4),

    sectionBand('3', 'Immediate Containment Action'),
    { text: 'What was done within 24 hours to stop the bleed?', fontSize: FONT.small, italics: true, color: COLORS.medGray, margin: [0, 0, 0, 2] },
    fillBox(3),
    rowOfFields([
      { label: 'Containment owner',  lines: 1 },
      { label: 'Date completed',     lines: 1 },
    ]),

    sectionBand('4', 'Root Cause Analysis'),
    { text: '5-Whys, fishbone, or fault-tree. Attach evidence as needed.', fontSize: FONT.small, italics: true, color: COLORS.medGray, margin: [0, 0, 0, 2] },
    fillBox(5),

    sectionBand('5', 'Corrective Action (CAPA)'),
    fillBox(4),
    rowOfFields([
      { label: 'CAPA owner',  lines: 1 },
      { label: 'Due date',    lines: 1 },
      { label: 'Date closed', lines: 1 },
    ]),

    sectionBand('6', 'Verification of Effectiveness'),
    { text: 'How will we know the action worked? Verify at the next quality review.', fontSize: FONT.small, italics: true, color: COLORS.medGray, margin: [0, 0, 0, 2] },
    fillBox(3),
    rowOfFields([
      { label: 'Verified by', lines: 1 },
      { label: 'Date',         lines: 1 },
      { label: 'Result: ☐ Effective  ☐ Re-open', lines: 1 },
    ]),

    sectionBand('7', 'Closure Approval'),
    signatureRow(['Originator', 'Quality Function', 'Management Representative']),
  ];
}

function bodyAuditChecklist(): any[] {
  const findingsHeader = [
    { text: '#',              bold: true, fillColor: COLORS.headerBg, alignment: 'center', fontSize: FONT.small },
    { text: 'Clause / SOP',   bold: true, fillColor: COLORS.headerBg,                       fontSize: FONT.small },
    { text: 'Requirement',    bold: true, fillColor: COLORS.headerBg,                       fontSize: FONT.small },
    { text: 'Evidence reviewed', bold: true, fillColor: COLORS.headerBg,                    fontSize: FONT.small },
    { text: 'C / OFI / mNC / MNC', bold: true, fillColor: COLORS.headerBg, alignment: 'center', fontSize: FONT.small },
    { text: 'Notes',          bold: true, fillColor: COLORS.headerBg,                       fontSize: FONT.small },
  ];
  const blankRow = (i: number) => [
    { text: String(i),  alignment: 'center', color: COLORS.medGray, fontSize: FONT.small },
    { text: ' ',                                                      fontSize: FONT.body, margin: [0, 0, 0, 12] },
    { text: ' ',                                                      fontSize: FONT.body, margin: [0, 0, 0, 12] },
    { text: ' ',                                                      fontSize: FONT.body, margin: [0, 0, 0, 12] },
    { text: ' ',                                                      fontSize: FONT.body, alignment: 'center', margin: [0, 0, 0, 12] },
    { text: ' ',                                                      fontSize: FONT.body, margin: [0, 0, 0, 12] },
  ];

  return [
    sectionBand('1', 'Audit Identification'),
    {
      columns: [
        { stack: [fieldLabel('Audit ID'),         fillBox(1)], width: '*' },
        { stack: [fieldLabel('Date(s) of audit'), fillBox(1)], width: '*' },
        { stack: [fieldLabel('Lead auditor'),      fillBox(1)], width: '*' },
      ],
      columnGap: 8,
    },
    {
      columns: [
        { stack: [fieldLabel('Department(s) audited'), fillBox(1)], width: '*' },
        { stack: [fieldLabel('Clauses / SOPs in scope'), fillBox(1)], width: '*' },
      ],
      columnGap: 8,
    },

    sectionBand('2', 'Findings'),
    { text: 'Rating key — C: Conform | OFI: Opportunity for Improvement | mNC: Minor Non-conformity | MNC: Major Non-conformity', fontSize: FONT.small, italics: true, color: COLORS.medGray, margin: [0, 0, 0, 4] },
    {
      table: {
        headerRows: 1,
        widths: [22, 70, '*', '*', 60, '*'],
        body: [findingsHeader, ...Array.from({ length: 12 }, (_, i) => blankRow(i + 1))],
      },
      layout: TABLE_LAYOUT,
      margin: [0, 0, 0, 4],
    },

    sectionBand('3', 'Findings Summary'),
    rowOfFields([
      { label: '# Conform',  lines: 1 },
      { label: '# OFI',      lines: 1 },
      { label: '# Minor NC', lines: 1 },
      { label: '# Major NC', lines: 1 },
    ]),

    sectionBand('4', 'Auditor / Auditee Sign-off'),
    signatureRow(['Lead Auditor', 'Auditee Department Head', 'Management Representative']),
  ];
}

function bodyPilotTrialCharter(): any[] {
  return [
    sectionBand('1', 'Trial Identification'),
    {
      columns: [
        { stack: [fieldLabel('Trial name'),    fillBox(1)], width: '*' },
        { stack: [fieldLabel('Project ID'),    fillBox(1)], width: '*' },
        { stack: [fieldLabel('Planned dates'), fillBox(1)], width: '*' },
      ],
      columnGap: 8,
    },
    rowOfFields([
      { label: 'Lead investigator', lines: 1 },
      { label: 'Facility',          lines: 1 },
    ]),

    sectionBand('2', 'Hypothesis & Success Criteria'),
    { text: 'State quantitatively. "If we feed X dross at Y°C in Z reactor, we recover ≥ A% Zn at ≤ B kWh/kg power".', fontSize: FONT.small, italics: true, color: COLORS.medGray, margin: [0, 0, 0, 2] },
    fillBox(4),

    sectionBand('3', 'Conditions to Vary (DOE)'),
    {
      table: {
        headerRows: 1,
        widths: [40, '*', '*', '*', '*', '*'],
        body: [
          [
            { text: 'Run',     bold: true, fillColor: COLORS.headerBg, alignment: 'center', fontSize: FONT.small },
            { text: 'Var 1',   bold: true, fillColor: COLORS.headerBg, alignment: 'center', fontSize: FONT.small },
            { text: 'Var 2',   bold: true, fillColor: COLORS.headerBg, alignment: 'center', fontSize: FONT.small },
            { text: 'Var 3',   bold: true, fillColor: COLORS.headerBg, alignment: 'center', fontSize: FONT.small },
            { text: 'Var 4',   bold: true, fillColor: COLORS.headerBg, alignment: 'center', fontSize: FONT.small },
            { text: 'Notes',   bold: true, fillColor: COLORS.headerBg,                       fontSize: FONT.small },
          ],
          ...Array.from({ length: 6 }, (_, i) => [
            { text: String(i + 1), alignment: 'center', color: COLORS.medGray, fontSize: FONT.small },
            { text: ' ', margin: [0, 0, 0, 10] },
            { text: ' ', margin: [0, 0, 0, 10] },
            { text: ' ', margin: [0, 0, 0, 10] },
            { text: ' ', margin: [0, 0, 0, 10] },
            { text: ' ', margin: [0, 0, 0, 10] },
          ]),
        ],
      },
      layout: TABLE_LAYOUT,
      margin: [0, 0, 0, 4],
    },

    sectionBand('4', 'Equipment & Materials'),
    fillBox(3),

    sectionBand('5', 'Safety (JSA reference)'),
    fillBox(3),
    rowOfFields([
      { label: 'JSA document ID', lines: 1 },
      { label: 'PPE required',    lines: 1 },
    ]),

    sectionBand('6', 'Environmental Plan'),
    { text: 'Effluent / emission / hazardous-waste handling for each run. Where does the residue go?', fontSize: FONT.small, italics: true, color: COLORS.medGray, margin: [0, 0, 0, 2] },
    fillBox(3),

    sectionBand('7', 'Approvals'),
    signatureRow(['R&D Lead', 'OHS Officer', 'CEO']),
  ];
}

function bodyMethodValidation(): any[] {
  return [
    sectionBand('1', 'Method Identification'),
    {
      columns: [
        { stack: [fieldLabel('Method name'), fillBox(1)], width: '*' },
        { stack: [fieldLabel('Analyte'),     fillBox(1)], width: '*' },
        { stack: [fieldLabel('Matrix'),      fillBox(1)], width: '*' },
      ],
      columnGap: 8,
    },
    rowOfFields([
      { label: 'Instrument',         lines: 1 },
      { label: 'Validation reason',  lines: 1 },
      { label: 'Validation period',  lines: 1 },
    ]),

    sectionBand('2', 'Reference Standards & Traceability'),
    fillBox(3),

    sectionBand('3', 'Linearity'),
    rowOfFields([
      { label: 'Calibration range', lines: 1 },
      { label: 'No. of points',     lines: 1 },
      { label: 'R²',                lines: 1 },
    ]),

    sectionBand('4', 'Limit of Detection / Quantification'),
    rowOfFields([
      { label: 'LOD',                lines: 1 },
      { label: 'LOQ',                lines: 1 },
      { label: 'Determined by',      lines: 1 },
    ]),

    sectionBand('5', 'Accuracy (Recovery Studies)'),
    {
      table: {
        headerRows: 1,
        widths: ['*', '*', '*', '*'],
        body: [
          [
            { text: 'Spike level',     bold: true, fillColor: COLORS.headerBg, alignment: 'center', fontSize: FONT.small },
            { text: 'Mean recovery %', bold: true, fillColor: COLORS.headerBg, alignment: 'center', fontSize: FONT.small },
            { text: 'RSD %',           bold: true, fillColor: COLORS.headerBg, alignment: 'center', fontSize: FONT.small },
            { text: 'Pass / Fail',     bold: true, fillColor: COLORS.headerBg, alignment: 'center', fontSize: FONT.small },
          ],
          ...Array.from({ length: 4 }, () => [
            { text: ' ', margin: [0, 0, 0, 10] },
            { text: ' ', margin: [0, 0, 0, 10] },
            { text: ' ', margin: [0, 0, 0, 10] },
            { text: ' ', margin: [0, 0, 0, 10] },
          ]),
        ],
      },
      layout: TABLE_LAYOUT,
      margin: [0, 0, 0, 4],
    },

    sectionBand('6', 'Precision'),
    rowOfFields([
      { label: 'Intra-day RSD %', lines: 1 },
      { label: 'Inter-day RSD %', lines: 1 },
      { label: 'No. of replicates', lines: 1 },
    ]),

    sectionBand('7', 'Ruggedness'),
    fillBox(3),

    sectionBand('8', 'Conclusion & Production Approval'),
    fillBox(3),
    signatureRow(['Method Owner', 'Lab Manager', 'R&D Lead']),
  ];
}

function bodyComplianceCalendar(): any[] {
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

  const monthHeader: any[] = [
    { text: 'Filing',    bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small },
    { text: 'Statute',   bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small },
    { text: 'Owner',     bold: true, fillColor: COLORS.headerBg, alignment: 'center', fontSize: FONT.small },
    ...months.map((m) => ({ text: m, bold: true, fillColor: COLORS.headerBg, alignment: 'center', fontSize: FONT.small })),
  ];
  const blankCell = { text: ' ', alignment: 'center', fontSize: FONT.small, margin: [0, 0, 0, 7] };
  const blankRow = () => [
    { text: ' ', fontSize: FONT.small, margin: [0, 0, 0, 7] },
    { text: ' ', fontSize: FONT.small, margin: [0, 0, 0, 7] },
    { text: ' ', fontSize: FONT.small, alignment: 'center', margin: [0, 0, 0, 7] },
    ...months.map(() => ({ ...blankCell })),
  ];

  return [
    sectionBand('1', 'Financial Year & Custodian'),
    rowOfFields([
      { label: 'FY',          lines: 1 },
      { label: 'Prepared by', lines: 1 },
      { label: 'Approved by', lines: 1 },
    ]),

    sectionBand('2', 'Year-at-a-glance Compliance Calendar'),
    { text: 'Mark each cell when filed and capture acknowledgement reference. Cells within 7 days of due date pull red on the live dashboard.', fontSize: FONT.small, italics: true, color: COLORS.medGray, margin: [0, 0, 0, 4] },
    {
      table: {
        headerRows: 1,
        widths: [80, 70, 50, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18],
        body: [monthHeader, ...Array.from({ length: 18 }, () => blankRow())],
      },
      layout: TABLE_LAYOUT,
      margin: [0, 0, 0, 4],
    },

    sectionBand('3', 'Notes'),
    fillBox(3),
  ];
}

function bodyCycleCount(): any[] {
  const header: any[] = [
    { text: '#',           bold: true, fillColor: COLORS.headerBg, alignment: 'center', fontSize: FONT.small },
    { text: 'Item code',   bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small },
    { text: 'Description', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small },
    { text: 'Location',    bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small },
    { text: 'System qty',  bold: true, fillColor: COLORS.headerBg, alignment: 'center', fontSize: FONT.small },
    { text: 'Physical qty',bold: true, fillColor: COLORS.headerBg, alignment: 'center', fontSize: FONT.small },
    { text: 'Variance',    bold: true, fillColor: COLORS.headerBg, alignment: 'center', fontSize: FONT.small },
    { text: 'Reason',      bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small },
  ];
  const blankRow = (i: number) => [
    { text: String(i),  alignment: 'center', color: COLORS.medGray, fontSize: FONT.small },
    { text: ' ', margin: [0, 0, 0, 9] },
    { text: ' ', margin: [0, 0, 0, 9] },
    { text: ' ', margin: [0, 0, 0, 9] },
    { text: ' ', alignment: 'center', margin: [0, 0, 0, 9] },
    { text: ' ', alignment: 'center', margin: [0, 0, 0, 9] },
    { text: ' ', alignment: 'center', margin: [0, 0, 0, 9] },
    { text: ' ', margin: [0, 0, 0, 9] },
  ];

  return [
    sectionBand('1', 'Count Session'),
    rowOfFields([
      { label: 'Session ID',         lines: 1 },
      { label: 'Date',               lines: 1 },
      { label: 'Class (A / B / C)',  lines: 1 },
    ]),
    rowOfFields([
      { label: 'Counter(s)',  lines: 1 },
      { label: 'Supervisor',  lines: 1 },
    ]),

    sectionBand('2', 'Items Counted'),
    {
      table: {
        headerRows: 1,
        widths: [22, 60, '*', 50, 40, 40, 40, '*'],
        body: [header, ...Array.from({ length: 18 }, (_, i) => blankRow(i + 1))],
      },
      layout: TABLE_LAYOUT,
      margin: [0, 0, 0, 4],
    },

    sectionBand('3', 'Variance Approval'),
    { text: 'Variances over the agreed tolerance must be authorised by Operations Head before any stock_movements adjustment is posted.', fontSize: FONT.small, italics: true, color: COLORS.medGray, margin: [0, 0, 0, 4] },
    signatureRow(['Counter', 'Supervisor', 'Operations Head']),
  ];
}

function bodyContractRequest(): any[] {
  return [
    sectionBand('1', 'Request Identification'),
    rowOfFields([
      { label: 'Request date',      lines: 1 },
      { label: 'Sponsor',           lines: 1 },
      { label: 'Internal approver', lines: 1 },
    ]),
    {
      columns: [
        { stack: [fieldLabel('Contract type: ☐ NDA  ☐ MoU  ☐ Customer Contract  ☐ Supplier MSA  ☐ Other'), fillBox(1)], width: '*' },
        { stack: [fieldLabel('Counter-party (full legal name)'),                                            fillBox(1)], width: '*' },
      ],
      columnGap: 8,
    },

    sectionBand('2', 'Business Context'),
    { text: 'One paragraph: what is the deal, who owns the relationship, why does it matter.', fontSize: FONT.small, italics: true, color: COLORS.medGray, margin: [0, 0, 0, 2] },
    fillBox(4),

    sectionBand('3', 'Key Commercial Terms'),
    rowOfFields([
      { label: 'Value (₹)',     lines: 1 },
      { label: 'Duration',      lines: 1 },
      { label: 'Payment terms', lines: 1 },
    ]),
    rowOfFields([
      { label: 'Deliverables', lines: 1 },
      { label: 'Milestones',   lines: 1 },
    ]),

    sectionBand('4', 'IP & Confidentiality'),
    fillBox(3),

    sectionBand('5', 'Deadline'),
    rowOfFields([
      { label: 'First-draft needed by',  lines: 1 },
      { label: 'Sign-off needed by',     lines: 1 },
    ]),

    sectionBand('6', 'Routing'),
    signatureRow(['Sponsor', 'Legal Officer', 'CEO']),
  ];
}

function bodyReleaseNotes(): any[] {
  return [
    sectionBand('1', 'Release Identification'),
    {
      columns: [
        { stack: [fieldLabel('Product (AutoREX / Operon / LabREX)'), fillBox(1)], width: '*' },
        { stack: [fieldLabel('Version'),                              fillBox(1)], width: '*' },
        { stack: [fieldLabel('Release date'),                          fillBox(1)], width: '*' },
      ],
      columnGap: 8,
    },
    rowOfFields([
      { label: 'Commit SHA / git tag',   lines: 1 },
      { label: 'Modules touched',        lines: 1 },
      { label: 'Released by',            lines: 1 },
    ]),

    sectionBand('2', 'New Features'),
    { text: 'List each feature, who asked for it, and a screenshot/video link.', fontSize: FONT.small, italics: true, color: COLORS.medGray, margin: [0, 0, 0, 2] },
    fillBox(5),

    sectionBand('3', 'Bug Fixes'),
    fillBox(4),

    sectionBand('4', 'Breaking Changes / Migration Notes'),
    { text: 'Anything that requires action by users on the existing system. If none, write "None".', fontSize: FONT.small, italics: true, color: COLORS.medGray, margin: [0, 0, 0, 2] },
    fillBox(3),

    sectionBand('5', 'Test Plan & Sign-off'),
    fillBox(4),
    rowOfFields([
      { label: 'QA tested by', lines: 1 },
      { label: 'Date',         lines: 1 },
      { label: 'Pass / Fail',  lines: 1 },
    ]),

    sectionBand('6', 'Rollback Procedure'),
    { text: 'Exact commands / steps to restore the prior version. Tested before deploy.', fontSize: FONT.small, italics: true, color: COLORS.medGray, margin: [0, 0, 0, 2] },
    fillBox(3),

    sectionBand('7', 'Approvals'),
    signatureRow(['Engineering Lead', 'CTO', 'CEO']),
  ];
}

/** Generic fallback — renders keyFields[] as labelled fill-in boxes. */
function bodyGeneric(f: FormatEntry): any[] {
  const out: any[] = [];

  if (f.purpose) {
    out.push({ text: f.purpose, fontSize: FONT.small, italics: true, color: COLORS.medGray, margin: [0, 0, 0, 6], lineHeight: 1.3 });
  }

  out.push(sectionBand('1', 'Form Inputs'));
  if (f.keyFields && f.keyFields.length > 0) {
    for (const kf of f.keyFields) {
      out.push(fieldLabel(kf.note ? `${kf.label}  —  ${kf.note}` : kf.label));
      out.push(fillBox(2));
    }
  } else {
    out.push(fillBox(8));
  }

  out.push(sectionBand('2', 'Submitted by'));
  out.push(signatureRow(['Submitter', 'Reviewer', 'Approver']));
  return out;
}

// ── Body resolver ───────────────────────────────────────────────────────────

function buildBody(f: FormatEntry): any[] {
  switch (f.formatNo) {
    case 'F-QMS-01-NCR':                return bodyNCR();
    case 'F-QMS-02-INTERNAL-AUDIT':     return bodyAuditChecklist();
    case 'F-RND-01-TRIAL-CHARTER':      return bodyPilotTrialCharter();
    case 'F-RND-02-METHOD-VALIDATION':  return bodyMethodValidation();
    case 'F-LEG-01-CONTRACT-REQUEST':   return bodyContractRequest();
    case 'F-LEG-02-COMPLIANCE-CALENDAR':return bodyComplianceCalendar();
    case 'F-SW-01-RELEASE-NOTES':       return bodyReleaseNotes();
    case 'F-WH-03-CYCLECOUNT':          return bodyCycleCount();
    default:                            return bodyGeneric(f);
  }
}

// ── GET ─────────────────────────────────────────────────────────────────────

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const format = FORMATS.find((f) => f.formatNo === code);
  if (!format) {
    return NextResponse.json({ error: 'Format not found' }, { status: 404 });
  }

  try {
    const CO = await getCompanyCO();
    const logoUrl = getLogoDataUrl();

    const content: any[] = [
      buildHeader({
        logoUrl,
        companyName: CO.name,
        address: `${CO.addr1} ${CO.addr2}`,
        contactLine: `${CO.email}  |  ${CO.phone}  |  ${CO.web}`,
        gstin: CO.gstin,
        pan: CO.pan,
        cin: CO.cin,
        tan: CO.tan,
        documentTitle: format.formatNo,
      }),
      // Big title
      { text: format.title.toUpperCase(), fontSize: FONT.title + 2, bold: true, alignment: 'center', color: COLORS.black, margin: [0, 4, 0, 2], characterSpacing: 0.4 },
      { text: 'CONTROLLED FORM — fill in then submit per parent SOP', fontSize: FONT.small, italics: true, alignment: 'center', color: COLORS.medGray, margin: [0, 0, 0, 6] },
      // Meta block
      metaBlock(format),
      // Body
      ...buildBody(format),
    ];

    const footer = (currentPage: number, pageCount: number) => ({
      columns: [
        { text: `${format.formatNo}  |  ${format.revision}`, fontSize: 5.5, color: COLORS.lightGray, margin: [32, 0, 0, 0] },
        { text: 'CONTROLLED COPY — uncontrolled when printed', fontSize: 5.5, bold: true, color: COLORS.positive, alignment: 'center' },
        { text: `Rotehügels IMS  |  Page ${currentPage} of ${pageCount}`, fontSize: 5.5, color: COLORS.lightGray, alignment: 'right', margin: [0, 0, 32, 0] },
      ],
    });

    const pdfBuffer = await generateSmartPdf(content, footer);

    const url = new URL(req.url);
    const download = url.searchParams.get('download') === '1';

    const headers: Record<string, string> = {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'public, max-age=300',
    };
    headers['Content-Disposition'] = download
      ? `attachment; filename="${format.formatNo}-blank.pdf"`
      : 'inline';

    return new Response(pdfBuffer as unknown as BodyInit, { status: 200, headers });
  } catch (err) {
    console.error('[GET /api/ims/formats/[code]/blank/pdf]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'PDF generation failed' },
      { status: 500 },
    );
  }
}
