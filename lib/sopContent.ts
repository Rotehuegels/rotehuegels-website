// ── Reusable SOP body content for pdfmake ────────────────────────────────────
// One source of truth for how a SOP renders inside a PDF. Used by:
//   • app/api/ims/sops/[id]/pdf/route.ts        (single-SOP PDF)
//   • app/api/ims/manual/pdf/route.ts §8        (every SOP inlined into the manual)
// Whatever changes in this file is reflected in both places automatically.

import { type SOP } from '@/lib/sops';
import { COLORS, FONT, TABLE_LAYOUT } from '@/lib/pdfTemplate';

/* eslint-disable @typescript-eslint/no-explicit-any */

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export type SopBodyOpts = {
  /** Force a page break before this SOP. Default true so each SOP starts on
   *  a fresh page when inlined into the manual; the standalone SOP PDF
   *  passes false so the body sits directly under the page header. */
  pageBreak?: boolean;
  /** Optional section prefix shown as a small caption above the title block,
   *  e.g. "§8.12" when inlining into the IMS manual. */
  sectionLabel?: string;
};

export function buildSopBody(sop: SOP, opts: SopBodyOpts = {}): any[] {
  const { pageBreak = true, sectionLabel: secLabel } = opts;
  const content: any[] = [];

  // ── Section caption (e.g. "§8.12" inside the manual) ─────────────────────
  if (secLabel) {
    content.push({
      text: secLabel,
      fontSize: FONT.small,
      bold: true,
      color: COLORS.medGray,
      characterSpacing: 0.5,
      ...(pageBreak ? { pageBreak: 'before' as const } : {}),
      margin: [0, 0, 0, 1],
    });
  }

  // ── Big title (visible in TOC outline if pdfmake supports it) ────────────
  content.push({
    text: `${sop.id}  —  ${sop.title}`,
    fontSize: FONT.heading + 1,
    bold: true,
    color: COLORS.black,
    ...(pageBreak && !secLabel ? { pageBreak: 'before' as const } : {}),
    margin: [0, 0, 0, 4],
  });

  // ── Title block (8 metadata rows) ────────────────────────────────────────
  const titleRows: any[][] = [
    [{ text: 'Doc No.',        bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small }, { text: sop.id,                       fontSize: FONT.small }],
    [{ text: 'Version',        bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small }, { text: `${sop.version}  |  R0`,       fontSize: FONT.small }],
    [{ text: 'Department',     bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small }, { text: sop.department,                fontSize: FONT.small }],
    [{ text: 'Category',       bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small }, { text: sop.category,                  fontSize: FONT.small }],
    [{ text: 'Effective Date', bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small }, { text: fmtDate(sop.effectiveDate),    fontSize: FONT.small }],
    [{ text: 'Review Date',    bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small }, { text: fmtDate(sop.reviewDate),       fontSize: FONT.small }],
    [{ text: 'Approved By',    bold: true, fillColor: COLORS.headerBg, fontSize: FONT.small }, { text: sop.approvedBy,                fontSize: FONT.small }],
  ];
  content.push({
    table: { headerRows: 0, widths: [80, '*'], body: titleRows },
    layout: TABLE_LAYOUT,
    margin: [0, 0, 0, 6],
  });

  function sectionHeader(num: number, title: string): any {
    return {
      text: `${num}. ${title.toUpperCase()}`,
      fontSize: FONT.heading,
      bold: true,
      color: COLORS.black,
      characterSpacing: 0.3,
      margin: [0, 6, 0, 3],
    };
  }

  // ── 1. Purpose ──────────────────────────────────────────────────────────
  content.push(sectionHeader(1, 'Purpose'));
  content.push({ text: sop.purpose, fontSize: FONT.body, color: COLORS.darkGray, margin: [0, 0, 0, 2], lineHeight: 1.3 });

  // ── 2. Scope ────────────────────────────────────────────────────────────
  content.push(sectionHeader(2, 'Scope'));
  content.push({ text: sop.scope, fontSize: FONT.body, color: COLORS.darkGray, margin: [0, 0, 0, 2], lineHeight: 1.3 });

  // ── 3. Responsibilities ─────────────────────────────────────────────────
  content.push(sectionHeader(3, 'Responsibilities'));
  const respRows: any[][] = sop.responsibilities.map(r => {
    const [role, ...descParts] = r.split(':');
    const desc = descParts.join(':').trim();
    return [
      { text: role.trim(), bold: true, fillColor: COLORS.headerBg, fontSize: FONT.table },
      { text: desc || role,                               color: COLORS.darkGray, fontSize: FONT.table },
    ];
  });
  content.push({
    table: { headerRows: 0, widths: [130, '*'], body: respRows },
    layout: TABLE_LAYOUT,
    margin: [0, 0, 0, 2],
  });

  // ── 4. Procedure ────────────────────────────────────────────────────────
  content.push(sectionHeader(4, 'Procedure'));
  const procHeader: any[] = [
    { text: 'Step',       bold: true, fillColor: COLORS.headerBg, color: COLORS.headerText, alignment: 'center', fontSize: FONT.tableHeader },
    { text: 'Action',     bold: true, fillColor: COLORS.headerBg, color: COLORS.headerText,                       fontSize: FONT.tableHeader },
    { text: 'Detail',     bold: true, fillColor: COLORS.headerBg, color: COLORS.headerText,                       fontSize: FONT.tableHeader },
    { text: 'System Ref', bold: true, fillColor: COLORS.headerBg, color: COLORS.headerText,                       fontSize: FONT.tableHeader },
  ];
  const procRows: any[][] = sop.procedure.map(step => [
    { text: String(step.step),    alignment: 'center', bold: true, color: COLORS.darkGray, fontSize: FONT.table },
    { text: step.action,          bold: true,                       color: COLORS.black,    fontSize: FONT.table },
    { text: step.detail,                                            color: COLORS.darkGray, fontSize: FONT.table },
    { text: step.system ?? '—',                                color: COLORS.medGray,  fontSize: FONT.small },
  ]);
  content.push({
    table: {
      headerRows: 1,
      widths: [24, 80, '*', 70],
      body: [procHeader, ...procRows],
      dontBreakRows: true,
    },
    layout: TABLE_LAYOUT,
    margin: [0, 0, 0, 2],
  });

  let nextSectionNum = 5;

  // ── 5. KPIs ─────────────────────────────────────────────────────────────
  if (sop.kpis && sop.kpis.length > 0) {
    content.push(sectionHeader(nextSectionNum++, 'Key Performance Indicators'));
    const kpiHeader: any[] = [
      { text: '#',   bold: true, fillColor: COLORS.headerBg, alignment: 'center', fontSize: FONT.tableHeader },
      { text: 'KPI', bold: true, fillColor: COLORS.headerBg,                       fontSize: FONT.tableHeader },
    ];
    const kpiRows: any[][] = sop.kpis.map((kpi, i) => [
      { text: String(i + 1), alignment: 'center', color: COLORS.medGray,  fontSize: FONT.table },
      { text: kpi,                                  color: COLORS.darkGray, fontSize: FONT.table },
    ]);
    content.push({
      table: { headerRows: 1, widths: [22, '*'], body: [kpiHeader, ...kpiRows] },
      layout: TABLE_LAYOUT,
      margin: [0, 0, 0, 2],
    });
  }

  // ── Related Documents ───────────────────────────────────────────────────
  content.push(sectionHeader(nextSectionNum, 'Related Documents'));
  const relHeader: any[] = [
    { text: '#',        bold: true, fillColor: COLORS.headerBg, alignment: 'center', fontSize: FONT.tableHeader },
    { text: 'Document', bold: true, fillColor: COLORS.headerBg,                       fontSize: FONT.tableHeader },
  ];
  const relRows: any[][] = sop.relatedDocs.map((doc, i) => [
    { text: String(i + 1), alignment: 'center', color: COLORS.medGray,  fontSize: FONT.table },
    { text: doc,                                  color: COLORS.darkGray, fontSize: FONT.table },
  ]);
  content.push({
    table: { headerRows: 1, widths: [22, '*'], body: [relHeader, ...relRows] },
    layout: TABLE_LAYOUT,
    margin: [0, 0, 0, 0],
  });

  return content;
}
