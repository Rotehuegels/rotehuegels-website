// ── IMS Manual PDF ──────────────────────────────────────────────────────────
// Renders the full Integrated Management System manual through the same
// pdfmake / Noto Sans / smart-pdf pipeline used by every other ERP report
// (quotes, invoices, POs, GST, P&L, balance sheet, SOPs).
// Live-driven by lib/sops.ts and lib/imsRegister.ts — edit those, regenerate.

import { NextResponse } from 'next/server';
import { ALL_SOPS, deriveChangeHistory } from '@/lib/sops';
import { DOCUMENTS, RECORDS, FORMATS } from '@/lib/imsRegister';
import { getCompanyCO } from '@/lib/company';
import { getLogoDataUrl, generateSmartPdf } from '@/lib/pdfConfig';
import { COLORS, FONT, TABLE_LAYOUT, buildHeader } from '@/lib/pdfTemplate';
import { buildSopBody } from '@/lib/sopContent';

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = 'force-dynamic';

const REVISION   = 'Rev 1.0';
const ISSUE_DATE = '2026-04-26';
const MR         = 'Management Representative';
const CEO        = 'Sivakumar Shanmugam, CEO';

const STD = {
  qms: 'ISO 9001:2015',
  ems: 'ISO 14001:2015',
  ohs: 'ISO 45001:2018',
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// ── Building blocks ─────────────────────────────────────────────────────────

function clauseHeading(num: string, title: string): any {
  return {
    text: num ? `${num}. ${title.toUpperCase()}` : title.toUpperCase(),
    fontSize: FONT.heading,
    bold: true,
    color: COLORS.black,
    pageBreak: 'before',
    margin: [0, 0, 0, 6],
  };
}

function subHeading(num: string, title: string): any {
  return {
    text: `${num}  ${title}`,
    fontSize: FONT.heading - 1,
    bold: true,
    color: COLORS.darkGray,
    margin: [0, 8, 0, 3],
  };
}

function para(text: string): any {
  return { text, fontSize: FONT.body, color: COLORS.darkGray, margin: [0, 0, 0, 3], lineHeight: 1.35 };
}

function bullets(items: string[]): any {
  return {
    ul: items.map((t) => ({ text: t, fontSize: FONT.body, color: COLORS.darkGray, lineHeight: 1.3 })),
    margin: [4, 2, 0, 4],
  };
}

function policyBlock(label: string, body: string): any {
  return {
    table: {
      widths: ['*'],
      body: [
        [{ text: label.toUpperCase(), fontSize: FONT.small, bold: true, color: COLORS.sectionHeader, characterSpacing: 0.4, margin: [0, 0, 0, 3] }],
        [{ text: body, fontSize: FONT.body, italics: true, color: COLORS.darkGray, lineHeight: 1.4 }],
        [{ text: `Approved by ${CEO}`, fontSize: FONT.small, color: COLORS.medGray, alignment: 'right', margin: [0, 4, 0, 0] }],
      ],
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: (i: number) => i === 0 ? 2 : 0,
      vLineColor: () => '#dc2626',
      paddingLeft: () => 8, paddingRight: () => 4, paddingTop: () => 2, paddingBottom: () => 2,
    },
    margin: [0, 0, 0, 6],
  };
}

function tocRow(num: string, title: string): any[] {
  return [
    { text: num, alignment: 'right', fontSize: FONT.body, color: COLORS.medGray },
    { text: title, fontSize: FONT.body, color: COLORS.darkGray },
  ];
}

// ── Build the document ──────────────────────────────────────────────────────

function buildContent(CO: Awaited<ReturnType<typeof getCompanyCO>>, logoUrl: string | null): any[] {
  const content: any[] = [];

  // Header (every page via pdfmake page header — but our convention is to put
  // the letterhead on page 1 and rely on the footer band for subsequent pages.
  // The SOP PDF does the same.)
  content.push(buildHeader({
    logoUrl,
    companyName: CO.name,
    address: `${CO.addr1} ${CO.addr2}`,
    contactLine: `${CO.email}  |  ${CO.phone}  |  ${CO.web}`,
    gstin: CO.gstin,
    pan: CO.pan,
    cin: CO.cin,
    tan: CO.tan,
    documentTitle: 'IMS MANUAL',
  }));

  // ── Cover ─────────────────────────────────────────────────────────────────
  content.push({ text: '\n\n' });
  content.push({ text: 'Integrated Management System Manual', fontSize: 22, bold: true, alignment: 'center', color: COLORS.black, margin: [0, 20, 0, 8] });
  content.push({
    text: `Quality, Environmental, and Occupational Health & Safety\n${STD.qms}  ·  ${STD.ems}  ·  ${STD.ohs}`,
    fontSize: FONT.body, alignment: 'center', color: COLORS.gray, margin: [0, 0, 0, 24],
  });
  content.push({
    table: {
      widths: ['*', '*'],
      body: [
        [
          { text: 'Document ID', fontSize: FONT.small, color: COLORS.labelText },
          { text: 'Revision',    fontSize: FONT.small, color: COLORS.labelText },
        ],
        [
          { text: 'DOC-IMS-MANUAL', fontSize: FONT.body, bold: true, color: COLORS.black },
          { text: REVISION,         fontSize: FONT.body, bold: true, color: COLORS.black },
        ],
        [
          { text: 'Issue date', fontSize: FONT.small, color: COLORS.labelText, margin: [0, 6, 0, 0] },
          { text: 'Owner',      fontSize: FONT.small, color: COLORS.labelText, margin: [0, 6, 0, 0] },
        ],
        [
          { text: ISSUE_DATE, fontSize: FONT.body, color: COLORS.darkGray },
          { text: MR,         fontSize: FONT.body, color: COLORS.darkGray },
        ],
        [
          { text: 'Approved by',  fontSize: FONT.small, color: COLORS.labelText, margin: [0, 6, 0, 0] },
          { text: 'Distribution', fontSize: FONT.small, color: COLORS.labelText, margin: [0, 6, 0, 0] },
        ],
        [
          { text: CEO, fontSize: FONT.body, color: COLORS.darkGray },
          { text: 'All staff (read-only)', fontSize: FONT.body, color: COLORS.darkGray },
        ],
      ],
    },
    layout: 'noBorders',
    margin: [60, 20, 60, 20],
  });
  content.push({
    text: 'Controlled document — printed copies are uncontrolled. Always refer to the latest revision in the dashboard at /d/ims/manual.',
    fontSize: FONT.small, italics: true, alignment: 'center', color: COLORS.medGray, margin: [40, 30, 40, 0],
  });

  // ── TOC ───────────────────────────────────────────────────────────────────
  content.push({ text: 'TABLE OF CONTENTS', fontSize: FONT.heading, bold: true, color: COLORS.black, pageBreak: 'before', margin: [0, 0, 0, 8] });
  const tocRows: any[][] = [
    tocRow('1',  'Scope of the IMS'),
    tocRow('2',  'Normative references'),
    tocRow('3',  'Terms and definitions'),
    tocRow('4',  'Context of the organisation'),
    tocRow('5',  'Leadership'),
    tocRow('6',  'Planning'),
    tocRow('7',  'Support'),
    tocRow('8',  'Operation'),
    tocRow('9',  'Performance evaluation'),
    tocRow('10', 'Improvement'),
    tocRow('A',  'Appendix A — SOP Register (with change history)'),
    tocRow('B',  'Appendix B — Clause × SOP Cross-reference Matrix'),
    tocRow('C',  'Appendix C — Documents & Records Registers'),
    tocRow('D',  'Appendix D — Formats Training Pack (forms used day-to-day)'),
  ];
  content.push({
    table: { widths: [30, '*'], body: tocRows },
    layout: 'noBorders',
    margin: [40, 4, 40, 0],
  });

  // ── §1 Scope ──────────────────────────────────────────────────────────────
  content.push(clauseHeading('1', 'Scope of the IMS'));
  content.push(para('This Integrated Management System (IMS) covers all operations of Rotehügels Research Business Consultancy Private Limited at its Chennai head office, the in-house pilot facility, and engagements executed at customer sites in India and overseas. It applies to:'));
  content.push(bullets([
    'Engineering and design services for process plants (EPC, brownfield retrofit, custom equipment fabrication)',
    'Operations and laboratory services for metals, recycling, hydrometallurgy, and adjacent process industries',
    'R&D, pilot trials, method development, and testwork for clients and internal scale-up',
    'Software products under the AutoREX™ platform — AutoREX™ Core, Operon ERP, and LabREX LIMS',
    'Procurement, warehousing, logistics, and supplier ecosystem management',
    'Recycling-ecosystem activities including pickup intake, recycler assignment, and certificate issuance',
    'Sales & marketing, including the regional representative network',
    'Administrative functions — Finance & Accounts, Legal & Compliance, Human Resources, IT & Systems',
  ]));
  content.push(para(`The IMS is designed to integrate the requirements of ${STD.qms} (Quality), ${STD.ems} (Environment), and ${STD.ohs} (Occupational Health & Safety). Where a clause has overlapping requirements across the three standards, this manual treats it as a single integrated requirement.`));
  content.push(para('Permissible exclusions: none claimed at this revision. Future exclusions, if any, will be justified in clause 4.3 with explicit reference to the standard clause being excluded.'));

  // ── §2 Normative references ──────────────────────────────────────────────
  content.push(clauseHeading('2', 'Normative references'));
  content.push(para('The following are referred to throughout this manual:'));
  content.push(bullets([
    `${STD.qms} — Quality management systems — Requirements`,
    `${STD.ems} — Environmental management systems — Requirements with guidance for use`,
    `${STD.ohs} — Occupational health and safety management systems — Requirements with guidance for use`,
    'Companies Act, 2013 (India) and rules made thereunder',
    'Goods and Services Tax (CGST/SGST/IGST) Acts and Rules',
    'E-Waste (Management) Rules, 2022 — CPCB',
    'Hazardous and Other Wastes Rules, 2016 (as amended)',
    'Factories Act 1948, Tamil Nadu Factories Rules, applicable State Pollution Control Board (SPCB) consents',
    'EPF Act 1952, ESI Act 1948, Payment of Bonus Act 1965, Payment of Gratuity Act 1972',
    'BIS / IS standards relevant to engineering deliverables (ASME B31.3, IS 800, IS 808, IEC 60079, etc.)',
  ]));

  // ── §3 Terms and definitions ─────────────────────────────────────────────
  content.push(clauseHeading('3', 'Terms and definitions'));
  content.push(para(`For the purposes of this manual, the terms and definitions in ${STD.qms} clause 3, ${STD.ems} clause 3, and ${STD.ohs} clause 3 apply. The following Rotehügels-specific terms are also used:`));
  const defRows: any[][] = [
    ['REX',         'Rotehügels Expert Network — community of independent professionals registered with us for project assignments'],
    ['Indent',      'Internal purchase requisition raised before a Purchase Order is issued'],
    ['3-way match', 'Verification that a supplier invoice matches the corresponding PO and GRN before payment authorisation'],
    ['FIFO layer',  'A cost layer in the inventory ledger representing one receipt of stock at a known unit cost'],
    ['COA',         'Certificate of Analysis — laboratory result report issued to the customer for a tested sample'],
    ['EPR',         'Extended Producer Responsibility under E-Waste Rules'],
    ['NCR',         'Non-Conformance Report'],
    ['CAPA',        'Corrective Action / Preventive Action'],
    ['ECN',         'Engineering Change Note — controlled change to an issued drawing'],
    ['IFC',         'Issued For Construction — drawing release stage at which the design is buildable'],
  ].map(([term, def]) => [
    { text: term, bold: true, fillColor: COLORS.headerBg, fontSize: FONT.table },
    { text: def, color: COLORS.darkGray, fontSize: FONT.table },
  ]);
  content.push({
    table: { widths: [80, '*'], body: defRows },
    layout: TABLE_LAYOUT,
    margin: [0, 0, 0, 4],
  });

  // ── §4 Context ────────────────────────────────────────────────────────────
  content.push(clauseHeading('4', 'Context of the organisation'));
  content.push(subHeading('4.1', 'Understanding the organisation and its context'));
  content.push(para('Rotehügels positions itself as an integrated provider of process-engineering services and industrial software, serving customers across metals, recycling, hydrometallurgy, and adjacent process industries. The internal context (capability, capital, culture, IP) and external context (regulatory environment, customer demand, technology shifts, competitor landscape) are reviewed by management at least annually as part of the management review (clause 9.3).'));
  content.push(subHeading('4.2', 'Needs and expectations of interested parties'));
  content.push(bullets([
    'Customers — quality, on-time delivery, regulatory compliance, IP confidentiality',
    'Suppliers — clear specifications, on-time payment, fair commercial terms',
    'Employees & REX network — safe workplace, fair compensation, career growth',
    'Regulators (CPCB, SPCB, GST, EPF, ESI, MCA) — statutory compliance, accurate reporting',
    'Local community (around plant / pilot facility) — minimal environmental impact, no nuisance',
    'Investors / lenders — financial discipline, governance, growth',
  ]));
  content.push(subHeading('4.3', 'Scope of the IMS'));
  content.push(para('As stated in clause 1.'));
  content.push(subHeading('4.4', 'The IMS and its processes'));
  content.push(para('The processes of the IMS, their inputs, outputs, and interactions are documented as Standard Operating Procedures (SOPs) in Appendix A. The clause-by-clause mapping is in Appendix B.'));

  // ── §5 Leadership ─────────────────────────────────────────────────────────
  content.push(clauseHeading('5', 'Leadership'));
  content.push(subHeading('5.1', 'Leadership and commitment'));
  content.push(para('The CEO accepts overall accountability for the effectiveness of the IMS. This includes ensuring the policy and objectives below are established, are compatible with the strategic direction of the organisation, and are integrated with day-to-day business processes. The CEO promotes a culture of continual improvement, customer focus, environmental responsibility, and worker safety, and ensures that the resources needed for the IMS are available.'));

  content.push(subHeading('5.2.0', 'Integrated Management Policy'));
  content.push(policyBlock('Integrated Management Policy',
    `Rotehügels is committed to delivering engineering services and industrial software that meet customer requirements, comply with applicable statutes, protect the environment, and safeguard the health and safety of every person at work — whether employee, REX-network consultant, supplier, or visitor. We will achieve this by integrating quality, environmental, and OHS considerations into every operational decision; by setting measurable objectives and reviewing them at least annually; by complying with ${STD.qms}, ${STD.ems}, and ${STD.ohs} and all other obligations we subscribe to; by consulting our workers on matters that affect them; and by continually improving the IMS.`
  ));
  content.push(subHeading('5.2.1', 'Quality Policy'));
  content.push(policyBlock('Quality Policy',
    `Quality at Rotehügels means our deliverables — drawings, plants, equipment, software releases, lab reports — meet the customer's specification first time, every time, with traceability that survives an audit a decade later. We pursue this through rigorous design control, supplier qualification, three-way commercial discipline, and structured non-conformance handling.`
  ));
  content.push(subHeading('5.2.2', 'Environmental Policy'));
  content.push(policyBlock('Environmental Policy',
    `We minimise the environmental footprint of every project we touch — through zero-liquid-discharge design defaults, energy-efficient process choices, responsible chemical handling, and full participation in the circular economy via our recycling-ecosystem operations. We comply with all applicable CPCB, SPCB, and MoEF regulations, and we set targets to reduce waste, water, and emissions year over year.`
  ));
  content.push(subHeading('5.2.3', 'Occupational Health & Safety Policy'));
  content.push(policyBlock('OHS Policy',
    `No project, deadline, or commercial outcome justifies an unsafe act. We assess hazards before every pilot, every site visit, and every commissioning campaign. We provide PPE, training, and authority-to-stop to every worker. We consult workers on OHS matters and record every incident, near-miss, and corrective action so we get steadily safer with time.`
  ));

  content.push(subHeading('5.3', 'Roles, responsibilities and authorities'));
  content.push(para(`Organisational roles and reporting relationships are maintained in the live org chart at /d/hr/org-chart. The Management Representative (currently ${MR}) has authority to ensure the IMS conforms to ISO requirements, to report IMS performance to top management, and to liaise with external auditors. Approval authority for procurement, expenditure, and HR decisions follows the cascade encoded in the org chart — vacant positions roll up to the next filled superior.`));

  // ── §6 Planning ───────────────────────────────────────────────────────────
  content.push(clauseHeading('6', 'Planning'));
  content.push(subHeading('6.1', 'Actions to address risks and opportunities'));
  content.push(para('Risks and opportunities are captured in the Risk Register (a controlled document maintained by the Management Representative). Each entry has an owner, a likelihood and impact rating, planned mitigation/exploitation actions, and a review cadence. Material risks (financial, reputational, statutory) are reviewed at every management review.'));
  content.push(subHeading('6.2', 'IMS objectives and planning'));
  content.push(para('IMS objectives are set annually by the CEO and Management Representative, are SMART, are aligned with the policies in 5.2, and are tracked monthly. Examples of recurring objectives:'));
  content.push(bullets([
    'Quality: on-time engineering delivery ≥ 90%, customer rejection rate < 2%',
    'Environment: zero exceedances of consent limits; 100% e-waste handled by authorised recyclers',
    'OHS: zero LTI (Lost-Time Injury); 100% pilot trials have a signed JSA before run',
    'Compliance: 100% on-time statutory filings (per SOP-LEG-002)',
  ]));
  content.push(subHeading('6.3', 'Planning of changes'));
  content.push(para('Changes to the IMS — new SOPs, revised SOPs, organisational changes, technology changes — are managed through the change history mechanism on each SOP (visible in Appendix A) and through formal Engineering Change Notes (ECN) for design changes.'));

  // ── §7 Support ───────────────────────────────────────────────────────────
  content.push(clauseHeading('7', 'Support'));
  content.push(subHeading('7.1', 'Resources'));
  content.push(para('The CEO ensures that human, infrastructure, and financial resources required for the IMS are made available. Specific commitments include the Chennai pilot facility, the in-house engineering team, the AutoREX software platform, and budget for external audits and certifications.'));
  content.push(subHeading('7.2', 'Competence'));
  content.push(para('Competence requirements per role are defined in job descriptions and reinforced by SOP-HR-001 (onboarding), SOP-RND-002 (analyst method-competency), and on-the-job competency cards for plant operators. Records of training are retained per Appendix C.'));
  content.push(subHeading('7.3', 'Awareness'));
  content.push(para('Every employee and contractor is made aware of the integrated policy (5.2.0), their contribution to the IMS, and the consequences of departing from documented procedures. Awareness is reinforced through induction, periodic toolbox talks, and the contents of this manual.'));
  content.push(subHeading('7.4', 'Communication'));
  content.push(para('Internal communication channels: dashboard announcements, mail, Approvals inbox at /d/approvals, monthly all-hands. External communication channels: customer email, supplier email, statutory portal submissions. Spokesperson authority for media and regulator communication rests with the CEO.'));
  content.push(subHeading('7.5', 'Documented information'));
  content.push(para('The IMS uses three categories of documented information, each maintained in its own register:'));
  content.push(bullets([
    'Documents (controlled): SOPs, this manual, policies, registers — listed in Appendix C.1',
    'Records (evidence): GRN, invoice, payslip, audit log, etc. — listed in Appendix C.2',
    'Formats / forms / templates: blanks used to capture records — full training pack in Appendix D',
  ]));
  content.push(para('Each is uniquely identified, version-controlled, retention-stated, and stored at a defined location. Distribution of controlled copies is recorded; printed copies of any controlled document carry the watermark "uncontrolled when printed".'));

  // ── §8 Operation ──────────────────────────────────────────────────────────
  // The bulk of the manual lives here: every operational SOP is inlined in
  // full so a new hire can read the manual end-to-end and learn each
  // procedure without chasing external documents.
  content.push(clauseHeading('8', 'Operation'));
  content.push(para('Operational planning and control of all IMS processes is documented through Standard Operating Procedures. The full body of every SOP — purpose, scope, responsibilities, step-by-step procedure, KPIs, related documents — follows below, organised by department. Each SOP starts on its own page and is uniquely numbered §8.x for navigation.'));

  // Department ordering: Accounts first (most numerous), then alphabetical.
  // We renumber within §8 as §8.1, §8.2, ... in the order SOPs are emitted.
  const departmentOrder = Array.from(new Set(ALL_SOPS.map((s) => s.department))).sort();
  let sopCounter = 0;

  for (const dept of departmentOrder) {
    const sopsInDept = ALL_SOPS.filter((s) => s.department === dept);
    if (sopsInDept.length === 0) continue;

    // Department divider — dark band rendered as a 1-row table so the fill
    // colour spans the full content width. Page break before so each
    // department starts cleanly.
    content.push({
      table: {
        widths: ['*'],
        body: [[{
          text: dept.toUpperCase(),
          fontSize: FONT.heading,
          bold: true,
          color: COLORS.white,
          fillColor: COLORS.darkGray,
          characterSpacing: 0.6,
          alignment: 'center',
          margin: [0, 4, 0, 4],
        }]],
      },
      layout: 'noBorders',
      pageBreak: 'before',
      margin: [0, 0, 0, 6],
    });

    sopsInDept.forEach((sop, idx) => {
      sopCounter += 1;
      content.push(...buildSopBody(sop, {
        // First SOP in a department sits directly under the department
        // band (same page); subsequent SOPs each get their own fresh page.
        pageBreak: idx > 0,
        sectionLabel: `§8.${sopCounter}`,
      }));
    });
  }

  // ── §9 Performance evaluation ────────────────────────────────────────────
  content.push(clauseHeading('9', 'Performance evaluation'));
  content.push(subHeading('9.1', 'Monitoring, measurement, analysis and evaluation'));
  content.push(para('KPIs are defined inside each SOP. Performance against those KPIs is reviewed at minimum quarterly by the Management Representative; trends and exceptions feed into management review.'));
  content.push(subHeading('9.2', 'Internal audit'));
  content.push(para('An internal audit programme covers every IMS clause and every SOP at least once per 3-year certification cycle, with risk-weighted areas audited annually. Audit reports and CAPAs are retained per Appendix C.'));
  content.push(subHeading('9.3', 'Management review'));
  content.push(para('The CEO chairs a Management Review at least annually. Inputs include: status of actions from previous review, changes in external/internal issues, KPI performance, audit findings, customer feedback, supplier performance, environmental performance, OHS performance, statutory non-compliance status, opportunities for improvement, and resource needs. Outputs are recorded as decisions and action items with owners and deadlines.'));

  // ── §10 Improvement ───────────────────────────────────────────────────────
  content.push(clauseHeading('10', 'Improvement'));
  content.push(subHeading('10.1', 'General'));
  content.push(para('Rotehügels seeks opportunities for improvement at every operational interaction — through customer feedback, audit findings, and worker suggestions.'));
  content.push(subHeading('10.2', 'Non-conformity and corrective action'));
  content.push(para('Every NCR is logged on Format F-QMS-01 (see Appendix D). Each NCR triggers root-cause analysis and a CAPA with verification of effectiveness. Repeat NCRs against the same SOP trigger a SOP revision (logged in the SOP\'s change history).'));
  content.push(subHeading('10.3', 'Continual improvement'));
  content.push(para('The CEO and Management Representative evaluate IMS effectiveness in every Management Review and target the most impactful improvement initiatives for the coming year, with accountability and budget assigned.'));

  // ── Appendix A — SOP register with change history ────────────────────────
  content.push(clauseHeading('A', 'Appendix A — SOP Register (with change history)'));
  content.push(para(`${ALL_SOPS.length} SOPs in this register. Each SOP's change history follows its summary block; an empty history means the SOP is at its initial release.`));

  for (const sop of ALL_SOPS) {
    const history = deriveChangeHistory(sop);
    content.push({ text: '', margin: [0, 4, 0, 0] });
    content.push({
      table: {
        widths: [90, '*'],
        body: [
          [
            { text: sop.id, fontSize: FONT.body, bold: true, color: COLORS.black, fillColor: COLORS.headerBg },
            { text: sop.title, fontSize: FONT.body, bold: true, color: COLORS.black, fillColor: COLORS.headerBg },
          ],
          [
            { text: 'Department', fontSize: FONT.small, color: COLORS.labelText },
            { text: `${sop.department}  ·  ${sop.category}`, fontSize: FONT.table, color: COLORS.darkGray },
          ],
          [
            { text: 'Effective', fontSize: FONT.small, color: COLORS.labelText },
            { text: `v${sop.version}  ·  effective ${fmtDate(sop.effectiveDate)}  ·  review by ${fmtDate(sop.reviewDate)}`, fontSize: FONT.table, color: COLORS.darkGray },
          ],
          [
            { text: 'Purpose', fontSize: FONT.small, color: COLORS.labelText },
            { text: sop.purpose, fontSize: FONT.table, color: COLORS.darkGray },
          ],
          [
            { text: 'Scope', fontSize: FONT.small, color: COLORS.labelText },
            { text: sop.scope, fontSize: FONT.table, color: COLORS.darkGray },
          ],
        ],
      },
      layout: TABLE_LAYOUT,
      dontBreakRows: true,
      margin: [0, 0, 0, 2],
    });
    // Change history sub-table
    const hHeader = [
      { text: 'Version', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small },
      { text: 'Date',    bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small },
      { text: 'Type',    bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small },
      { text: 'Description', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small },
      { text: 'Approved by', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small },
    ];
    const hRows = history.map((h) => [
      { text: h.version,                fontSize: FONT.small, color: COLORS.darkGray },
      { text: fmtDate(h.date),          fontSize: FONT.small, color: COLORS.darkGray },
      { text: h.type,                   fontSize: FONT.small, color: h.type === 'major' ? '#dc2626' : h.type === 'minor' ? '#d97706' : COLORS.medGray, bold: h.type !== 'editorial' },
      { text: h.description,            fontSize: FONT.small, color: COLORS.darkGray },
      { text: h.approvedBy,             fontSize: FONT.small, color: COLORS.medGray },
    ]);
    content.push({
      table: {
        headerRows: 1,
        widths: [40, 60, 50, '*', 90],
        body: [hHeader, ...hRows],
      },
      layout: TABLE_LAYOUT,
      margin: [0, 0, 0, 6],
    });
  }

  // ── Appendix B — Cross-reference matrix ──────────────────────────────────
  content.push(clauseHeading('B', 'Appendix B — Clause × SOP Cross-reference Matrix'));
  content.push(para('Which SOPs evidence which IMS clause. Each operational SOP is listed under its primary clause to keep the matrix readable; SOPs that satisfy multiple clauses are noted as such.'));
  const xrefHeader = [
    { text: 'Clause', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small },
    { text: 'SOPs',   bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small },
  ];
  const xrefRows: any[][] = [
    ['1.  Scope',                       'This manual'],
    ['2.  Normative references',        'This manual + statutes listed in §2'],
    ['3.  Terms and definitions',       'This manual'],
    ['4.  Context of the organisation', 'This manual + Risk Register'],
    ['5.  Leadership',                  'This manual §5 (policies) + org chart'],
    ['6.  Planning',                    'This manual §6 + Risk Register'],
    ['7.  Support',                     'SOP-HR-001, SOP-IT-001, SOP-IT-002, SOP-SET-001, SOP-RND-002'],
    ['8.  Operation',                   'All other SOPs (see Appendix A)'],
    ['9.  Performance evaluation',      'SOP-IT-002 + KPIs inside each SOP'],
    ['10. Improvement',                 'SOP-QMS-001 + change history per SOP'],
  ].map(([c, s]) => [
    { text: c, fontSize: FONT.table, color: COLORS.black, bold: true },
    { text: s, fontSize: FONT.table, color: COLORS.darkGray },
  ]);
  content.push({
    table: { headerRows: 1, widths: [180, '*'], body: [xrefHeader, ...xrefRows] },
    layout: TABLE_LAYOUT,
    margin: [0, 0, 0, 6],
  });

  // ── Appendix C — Documents & Records registers ──────────────────────────
  // Formats moved to Appendix D as a full training pack; this appendix keeps
  // the compact controlled-document and records registers used by auditors.
  content.push(clauseHeading('C', 'Appendix C — Documents & Records Registers'));

  // C.1 Documents
  content.push({ text: 'C.1 — Documents (controlled)', fontSize: FONT.heading - 1, bold: true, color: COLORS.black, margin: [0, 6, 0, 4] });
  const docHeader = [
    { text: 'ID',    bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small },
    { text: 'Title', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small },
    { text: 'Type',  bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small },
    { text: 'Owner', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small },
    { text: 'Rev',   bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small },
  ];
  const docRows = DOCUMENTS.map((d) => [
    { text: d.id,        fontSize: FONT.small, color: COLORS.black, bold: true },
    { text: d.title,     fontSize: FONT.small, color: COLORS.darkGray },
    { text: d.type,      fontSize: FONT.small, color: COLORS.darkGray },
    { text: d.owner,     fontSize: FONT.small, color: COLORS.darkGray },
    { text: d.revision,  fontSize: FONT.small, color: COLORS.darkGray },
  ]);
  content.push({
    table: { headerRows: 1, widths: [110, '*', 65, 75, 35], body: [docHeader, ...docRows] },
    layout: TABLE_LAYOUT,
    margin: [0, 0, 0, 6],
  });

  // C.2 Records
  content.push({ text: 'C.2 — Records (with retention)', fontSize: FONT.heading - 1, bold: true, color: COLORS.black, margin: [0, 6, 0, 2] });
  content.push(para('Retention reflects the longest applicable Indian statutory baseline (Companies Act, CGST, Income Tax, EPF/ESI, CPCB rules). Permanent retention is reserved for items where lifetime traceability is needed.'));
  const recHeader = [
    { text: 'ID',          bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small },
    { text: 'Record',      bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small },
    { text: 'Generated by', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small },
    { text: 'Retention',   bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small },
    { text: 'Disposition', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small },
  ];
  const recRows = RECORDS.map((r) => [
    { text: r.id,                 fontSize: FONT.small, color: COLORS.black, bold: true },
    { text: r.title,              fontSize: FONT.small, color: COLORS.darkGray },
    { text: r.generatedBy,        fontSize: FONT.small, color: COLORS.medGray },
    { text: r.retention,          fontSize: FONT.small, color: COLORS.darkGray },
    { text: r.disposition,        fontSize: FONT.small, color: COLORS.darkGray },
  ]);
  content.push({
    table: { headerRows: 1, widths: [95, '*', 80, 80, 90], body: [recHeader, ...recRows] },
    layout: TABLE_LAYOUT,
    margin: [0, 0, 0, 6],
  });

  // (Formats are no longer summarised here — see the full training pack in
  // Appendix D, which is the document new hires read before their first day.)

  // ── Appendix D — Formats Training Pack ──────────────────────────────────
  // Full per-format spec page: purpose, audience, when used, key fields,
  // workflow after submission, and a pointer to the live form or blank
  // template. Organised by department so a new hire reads only what's
  // relevant to them, but the full set lives here for cross-team awareness.
  content.push(clauseHeading('D', 'Appendix D — Formats Training Pack'));
  content.push(para(`This appendix is the on-boarding pack for every form (format) used across Rotehügels. ${FORMATS.length} formats are documented; each entry describes what the form captures, who fills it, when, what fields it has, and what happens after submission. Read end-to-end before your first day; refer back when you encounter a form for the first time.`));
  content.push(para('Every format has a printable blank PDF available at /api/ims/formats/<format-no>/blank/pdf — useful when the live system is unreachable, or when an auditor or trainee asks for the controlled blank.'));

  // Group by parent-SOP department label inferred from the format number prefix.
  const formatGroupLabel: Record<string, string> = {
    'F-ACC': 'Accounts & Finance',
    'F-PRO': 'Procurement',
    'F-WH':  'Warehouse & Stock',
    'F-HR':  'Human Resources',
    'F-ATS': 'Applicant Tracking',
    'F-OPS': 'Operations & Lab',
    'F-RND': 'Research & Development',
    'F-ECO': 'Recycling Ecosystem',
    'F-ENG': 'Engineering & Design',
    'F-LEG': 'Legal & Compliance',
    'F-SW':  'Software & Platform',
    'F-QMS': 'Quality Management',
    'F-IT':  'IT & Security',
  };
  const groupOrder = ['F-ACC', 'F-PRO', 'F-WH', 'F-HR', 'F-ATS', 'F-OPS', 'F-RND', 'F-ECO', 'F-ENG', 'F-LEG', 'F-SW', 'F-QMS', 'F-IT'];

  let formatCounter = 0;
  for (const prefix of groupOrder) {
    const group = FORMATS.filter((f) => f.formatNo.startsWith(prefix + '-'));
    if (group.length === 0) continue;

    // Department band — same style as §8 dividers, smaller.
    content.push({
      table: {
        widths: ['*'],
        body: [[{
          text: formatGroupLabel[prefix] ?? prefix,
          fontSize: FONT.heading - 1,
          bold: true,
          color: COLORS.white,
          fillColor: COLORS.darkGray,
          characterSpacing: 0.5,
          alignment: 'center',
          margin: [0, 3, 0, 3],
        }]],
      },
      layout: 'noBorders',
      pageBreak: 'before',
      margin: [0, 0, 0, 6],
    });

    group.forEach((f, idx) => {
      formatCounter += 1;
      // Source / live-form line.
      const liveLine = (f.source.startsWith('/') || f.source.startsWith('http'))
        ? `Live form: ${f.source}`
        : `Source: ${f.source}`;
      const blankLine = `Print blank: /api/ims/formats/${f.formatNo}/blank/pdf`;

      content.push({
        text: [
          { text: `§D.${formatCounter}  `,                                     fontSize: FONT.small, color: COLORS.medGray },
          { text: f.formatNo,                                                  fontSize: FONT.heading, bold: true, color: COLORS.black },
          { text: '   '   + (f.revision ? `(${f.revision})` : ''),             fontSize: FONT.small, color: COLORS.medGray },
        ],
        ...(idx > 0 ? { pageBreak: 'before' as const } : {}),
        margin: [0, 0, 0, 1],
      });
      content.push({ text: f.title, fontSize: FONT.heading - 1, bold: true, color: COLORS.darkGray, margin: [0, 0, 0, 3] });
      content.push({ text: liveLine,  fontSize: FONT.small, color: COLORS.positive, bold: true, margin: [0, 0, 0, 1] });
      content.push({ text: blankLine, fontSize: FONT.small, color: COLORS.medGray,                margin: [0, 0, 0, 4] });

      // Spec block
      const specRows: any[][] = [];
      if (f.purpose)   specRows.push(['Purpose',      f.purpose]);
      if (f.whoUses)   specRows.push(['Who fills',    f.whoUses]);
      if (f.whenUsed)  specRows.push(['When',         f.whenUsed]);
      specRows.push(['Parent SOP',                    f.parentSop]);

      content.push({
        table: {
          widths: [70, '*'],
          body: specRows.map(([k, v]) => [
            { text: k as string, bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small },
            { text: v as string,                                          fontSize: FONT.small, color: COLORS.darkGray },
          ]),
        },
        layout: TABLE_LAYOUT,
        margin: [0, 0, 0, 4],
      });

      // Key fields
      if (f.keyFields && f.keyFields.length > 0) {
        content.push({ text: 'Key fields captured', fontSize: FONT.small, bold: true, color: COLORS.sectionHeader, characterSpacing: 0.4, margin: [0, 2, 0, 2] });
        const kfHeader: any[] = [
          { text: '#',       bold: true, fillColor: COLORS.headerBg, alignment: 'center', fontSize: FONT.small },
          { text: 'Field',   bold: true, fillColor: COLORS.headerBg,                       fontSize: FONT.small },
          { text: 'Note',    bold: true, fillColor: COLORS.headerBg,                       fontSize: FONT.small },
        ];
        const kfRows: any[][] = f.keyFields.map((kf, i) => [
          { text: String(i + 1),  alignment: 'center', color: COLORS.medGray,  fontSize: FONT.small },
          { text: kf.label,        bold: true,           color: COLORS.black,    fontSize: FONT.small },
          { text: kf.note ?? '—', color: COLORS.darkGray,                       fontSize: FONT.small },
        ]);
        content.push({
          table: { headerRows: 1, widths: [22, 140, '*'], body: [kfHeader, ...kfRows] },
          layout: TABLE_LAYOUT,
          margin: [0, 0, 0, 4],
        });
      }

      // Workflow
      if (f.workflow) {
        content.push({ text: 'After submission', fontSize: FONT.small, bold: true, color: COLORS.sectionHeader, characterSpacing: 0.4, margin: [0, 2, 0, 2] });
        content.push({ text: f.workflow, fontSize: FONT.small, color: COLORS.darkGray, lineHeight: 1.35, margin: [0, 0, 0, 4] });
      }

      // Spacer to next format on same page
      content.push({ text: '', margin: [0, 0, 0, 2] });
    });
  }

  // End-of-document
  content.push({ text: '\n\n', pageBreak: 'before' });
  content.push({ text: 'End of Document', fontSize: FONT.heading, bold: true, alignment: 'center', color: COLORS.darkGray, margin: [0, 60, 0, 4] });
  content.push({ text: `${REVISION}  ·  issued ${ISSUE_DATE}  ·  approved by ${CEO}`, fontSize: FONT.small, alignment: 'center', color: COLORS.medGray });

  return content;
}

// ── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const CO = await getCompanyCO();
    const logoUrl = getLogoDataUrl();
    const content = buildContent(CO, logoUrl);

    const footer = (currentPage: number, pageCount: number) => ({
      columns: [
        { text: `DOC-IMS-MANUAL  |  ${REVISION}  |  ${ISSUE_DATE}`, fontSize: 5.5, color: COLORS.lightGray, margin: [32, 0, 0, 0] },
        { text: 'CONTROLLED COPY',                                  fontSize: 5.5, bold: true, color: COLORS.positive, alignment: 'center' },
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
      ? 'attachment; filename="Rotehuegels-IMS-Manual.pdf"'
      : 'inline';

    return new Response(pdfBuffer as unknown as BodyInit, { status: 200, headers });
  } catch (err) {
    console.error('[GET /api/ims/manual/pdf]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'PDF generation failed' },
      { status: 500 },
    );
  }
}
