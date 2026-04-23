import { supabaseAdmin } from '../lib/supabaseAdmin.ts';

const PROJECT_CODE = 'PRJ-2026-001';
const ACTOR = 'Sivakumar Shanmugam';

const { data: project } = await supabaseAdmin
  .from('projects')
  .select('id, customer_id')
  .eq('project_code', PROJECT_CODE)
  .single();
if (!project) { console.error('Project not found'); process.exit(1); }

// ── Project header + narrative notes ─────────────────────────────────
await supabaseAdmin
  .from('projects')
  .update({
    start_date:      '2025-09-25',
    target_end_date: '2026-04-11',
    completion_pct:  85,
    status:          'active',
    description:
      'Turnkey engineering, procurement, and commissioning of a 300 kg/day zinc dross recovery ' +
      'plant — layout and civil, process equipment, electrowinning cell hardware (custom high-purity ' +
      'lead anodes + high-purity aluminium cathode), LabREX-ready instrumentation, and zero-liquid-' +
      'discharge design. Plant is delivered AutoREX-compliant; AutoREX software is available separately.',
    notes:
      'TIMELINE: Originally targeted for first-week December 2025 completion. Slipped through:\n' +
      '  · 1-week rain delay + 2-week buffer → target moved to 31 Dec 2025.\n' +
      '  · Board-approved 1-month extension → revised target end-Jan 2026.\n' +
      '  · Client-side plumbing and electrical scope ran long. Rotehügels took over plumbing as a\n' +
      '    separate paid service to keep the project moving.\n' +
      '  · Custom lead anodes + aluminium cathodes supplied at cost-to-cost pricing as a concession.\n' +
      '  · Delay charges for Feb-Mar 2026 agreed at ₹1 lakh + GST per month (total ₹2 lakh + GST).\n' +
      '  · Balance 20% (commissioning) moved to new financial year with target 11 Apr 2026.\n' +
      '  · As of 24 Apr 2026, commissioning BLOCKED by pending client-side electrical work.\n\n' +
      'DELAY RATE from 11 Apr 2026:\n' +
      '  · ₹2.0 lakh + GST if commissioning completed by 30 Apr 2026.\n' +
      '  · ₹2.5 lakh + GST if not completed in April 2026.\n' +
      '  · ₹2.5 lakh + GST per month from May 2026, pro-rata for partial months.\n\n' +
      'OPERATIONS PROPOSAL: Rotehügels available to operate the plant as a consultant at ' +
      '₹2.5 lakh + GST per month. Separate agreement from the EPC scope.',
  })
  .eq('id', project.id);
console.log('Project description + notes rewritten');

// ── Milestones — align dates to the real chronology ───────────────────
const milestones = [
  {
    no: 1, title: 'Engineering & Design', phase: 'Phase 1: Design',
    status: 'completed',
    start_date: '2025-09-25', target_date: '2025-11-15', completed_date: '2025-11-20',
    completion_pct: 100,
    deliverables: 'PFDs, P&IDs, equipment data sheets, electrical single-line, civil & structural drawings.',
    notes: null,
  },
  {
    no: 2, title: 'Equipment Procurement', phase: 'Phase 2: Procurement',
    status: 'completed',
    start_date: '2025-11-01', target_date: '2026-02-28', completed_date: '2026-04-20',
    completion_pct: 100,
    deliverables:
      'Rectifier, EW cells and cell furniture, pumps, tanks, PLC and instrumentation. ' +
      'Custom high-purity lead anodes (Galena Metals — delivered 17 April 2026) and high-purity ' +
      'aluminium cathode delivered at cost-to-cost price as a concession.',
    notes: 'Anodes and cathode supplied at cost-to-cost pricing — see CR-2026-002.',
  },
  {
    no: 3, title: 'Civil, Plumbing & Electrical Installation', phase: 'Phase 3: Installation',
    status: 'completed',
    start_date: '2025-12-10', target_date: '2026-01-31', completed_date: '2026-03-22',
    completion_pct: 100,
    deliverables:
      'Foundations, bunded floor, ZLD piping, cable trays, bus-bar dressing, earth grid. ' +
      'Plumbing executed by Rotehügels as a paid scope-extension (client original scope; see ' +
      'CR-2026-001). Rotehügels electrical scope complete — final interconnect is client-side ' +
      'and pending.',
    notes: 'Plumbing scope takeover billed separately — see CR-2026-001.',
  },
  {
    no: 4, title: 'AutoREX Readiness — sensors, instruments, cabling', phase: 'Phase 4: Instrumentation',
    status: 'completed',
    start_date: '2026-01-15', target_date: '2026-03-22', completed_date: '2026-03-22',
    completion_pct: 100,
    deliverables:
      'Process sensors (T, P, flow, level), electrical instrumentation, rectifier data tap, ' +
      'LabREX sample-tagging infrastructure, PLC-compatible cable runs and data bus — all ' +
      'AutoREX-compliant and ready for integration if/when AutoREX software is purchased separately.',
    notes: 'AutoREX software is a separate purchase — complimentary inclusion has lapsed. See CR-2026-005.',
  },
  {
    no: 5, title: 'Commissioning & Handover', phase: 'Phase 5: Handover',
    status: 'pending',
    start_date: '2026-04-01', target_date: '2026-04-11', completed_date: null,
    completion_pct: 0,
    deliverables:
      'Water-only dry run, electrolyte first-fill, first harvest (Day 7), performance tests, ' +
      'O&M handover, 30-day stabilisation support.',
    notes:
      'BLOCKED as of 24 Apr 2026: water commissioning cannot start until client completes ' +
      'electrical interconnect work on site. Delay charges apply per CR-2026-004 rate schedule.',
  },
];

for (const m of milestones) {
  const { error } = await supabaseAdmin
    .from('project_milestones')
    .update({
      title: m.title, phase: m.phase, status: m.status,
      start_date: m.start_date, target_date: m.target_date, completed_date: m.completed_date,
      completion_pct: m.completion_pct, deliverables: m.deliverables, notes: m.notes,
    })
    .eq('project_id', project.id).eq('milestone_no', m.no);
  if (error) console.error(`milestone ${m.no}:`, error.message);
  else console.log(`  milestone #${m.no} updated`);
}

// ── Activity feed — clear and re-seed in chronological order ─────────
await supabaseAdmin.from('project_activities').delete().eq('project_id', project.id);
const feed = [
  { at: '2025-09-25T10:00:00+05:30', type: 'note',
    title: 'Project kickoff',
    desc: 'EPC engagement initiated for the 300 kg/day zinc dross recovery plant at Chennai. Original target completion: first week of December 2025.' },
  { at: '2025-11-20T17:00:00+05:30', type: 'milestone_update',
    title: 'Design phase closed',
    desc: 'P&IDs, equipment data sheets, and electrical single-line approved.' },
  { at: '2025-11-25T09:30:00+05:30', type: 'status_change',
    title: 'Rain delay — 1 week + 2-week buffer',
    desc: 'Site work paused due to unseasonal rain. 1-week loss recovered within the agreed 2-week buffer. Target held at 31 December 2025.' },
  { at: '2026-01-03T10:00:00+05:30', type: 'change_request',
    title: 'Timeline extended — board approval',
    desc: 'Rotehügels board approved a one-month extension to end-January 2026 to accommodate installation dependencies.' },
  { at: '2026-02-05T14:00:00+05:30', type: 'change_request',
    title: 'Rotehügels takes over client plumbing scope',
    desc: 'Client-side plumbing running behind; to preserve momentum, Rotehügels absorbed the plumbing scope as a separate paid service (CR-2026-001).' },
  { at: '2026-02-28T18:30:00+05:30', type: 'payment_received',
    title: 'Feb 2026 delay charge invoiced',
    desc: 'Client agreed ₹1 lakh + GST for February 2026 delay (CR-2026-004).' },
  { at: '2026-03-22T16:40:00+05:30', type: 'milestone_update',
    title: 'Installation phase completed (Phase 3)',
    desc: 'Civil, plumbing (by Rotehügels), bus-bar dressing, and Rotehügels electrical scope complete. Final interconnect is client-side and pending.' },
  { at: '2026-03-22T17:15:00+05:30', type: 'milestone_update',
    title: 'AutoREX readiness complete (Phase 4)',
    desc: 'All sensors, instruments, and PLC-compatible cabling in place. Plant is AutoREX-compliant — software remains a separate order.' },
  { at: '2026-03-31T19:00:00+05:30', type: 'payment_received',
    title: 'Mar 2026 delay charge invoiced',
    desc: 'Second delay-charge invoice of ₹1 lakh + GST raised for March 2026 (CR-2026-004).' },
  { at: '2026-04-05T10:00:00+05:30', type: 'change_request',
    title: 'Balance 20% milestone shifted to new financial year',
    desc: 'Commissioning (final 20%) moved into FY 2026-27 with revised target 11 April 2026 and forward-looking delay rate agreed (CR-2026-004).' },
  { at: '2026-04-17T11:15:00+05:30', type: 'deliverable',
    title: 'High-purity lead anodes delivered',
    desc: 'Custom lead anodes shipped by Galena Metals (tracking B4002064885) delivered on site. Supplied at cost-to-cost pricing as a concession (CR-2026-002).' },
  { at: '2026-04-20T14:00:00+05:30', type: 'deliverable',
    title: 'Aluminium cathode fitted',
    desc: 'High-purity aluminium cathode delivered and fitted. Equipment procurement milestone (Phase 2) now closed.' },
  { at: '2026-04-22T10:00:00+05:30', type: 'note',
    title: 'AutoREX software — now a separate order',
    desc: 'Original proposal included complimentary AutoREX implementation. Because project schedule extended past the paid envelope, the inclusion has lapsed. Plant is AutoREX-ready; AutoREX software is available as a separately-scoped order (CR-2026-005).' },
  { at: '2026-04-24T09:30:00+05:30', type: 'status_change',
    title: 'Commissioning on hold — awaiting client electrical interconnect',
    desc: 'Water dry-run cannot start until client completes site-side electrical interconnect. Delay rate schedule from 11 April 2026 now in effect (CR-2026-004): ₹2 lakh + GST if complete by 30 April; ₹2.5 lakh + GST for April if not; ₹2.5 lakh + GST per month from May onwards (pro-rata).' },
  { at: '2026-04-24T09:45:00+05:30', type: 'change_request',
    title: 'Plant operations proposal — Rotehügels as consultant',
    desc: 'Rotehügels available to operate the plant as a consultant at ₹2.5 lakh + GST per month. Scope separate from EPC. Full proposal in CR-2026-006.' },
];
for (const e of feed) {
  await supabaseAdmin.from('project_activities').insert({
    project_id: project.id,
    activity_type: e.type,
    title: e.title, description: e.desc,
    actor: ACTOR, visible_to_client: true, created_at: e.at,
  });
}
console.log(`Activity feed re-seeded with ${feed.length} entries`);

// ── Change requests — wipe existing and seed the six commercial variations ──
await supabaseAdmin.from('change_requests').delete().eq('project_id', project.id);
const changes = [
  {
    no: 'CR-2026-001', title: 'Rotehügels takes over client plumbing scope',
    description:
      'Client-side plumbing was falling behind the installation window. To preserve schedule, ' +
      'Rotehügels absorbed the plumbing scope and executed it alongside the client\'s work as a ' +
      'separately-priced variation.',
    reason: 'Client scope slippage; project could not wait.',
    cost_impact: 0, schedule_impact: 'Held Phase 3 target (installation) within revised window.',
    status: 'implemented', admin_notes: 'Invoiced separately per agreed terms.',
    reviewed_by: ACTOR, reviewed_at: '2026-02-08T10:00:00+05:30',
  },
  {
    no: 'CR-2026-002', title: 'Cost-to-cost pricing on custom electrodes',
    description:
      'Custom high-purity lead anodes (Galena Metals) and high-purity aluminium cathode supplied ' +
      'at cost-to-cost price — no Rotehügels margin on the electrode scope — as a commercial ' +
      'concession tied to the timeline slip.',
    reason: 'Goodwill concession during schedule extension.',
    cost_impact: 0, schedule_impact: 'No schedule impact.',
    status: 'implemented', admin_notes: 'Cost savings passed through in full. Electrodes delivered 17 Apr 2026.',
    reviewed_by: ACTOR, reviewed_at: '2026-04-17T12:00:00+05:30',
  },
  {
    no: 'CR-2026-003', title: 'Board-approved 1-month timeline extension (Jan 2026)',
    description:
      'Rotehügels board approved a one-month extension of the delivery window from 31 Dec 2025 ' +
      'to end-January 2026 to accommodate installation dependencies. No delay charge for this period.',
    reason: 'Installation dependency chain.',
    cost_impact: 0, schedule_impact: 'Target pushed from 31 Dec 2025 → end-Jan 2026.',
    status: 'implemented', admin_notes: 'Board resolution on file.',
    reviewed_by: ACTOR, reviewed_at: '2026-01-03T11:00:00+05:30',
  },
  {
    no: 'CR-2026-004', title: 'Delay charges — Feb 2026 onwards',
    description:
      'Feb 2026: ₹1 lakh + GST.\n' +
      'Mar 2026: ₹1 lakh + GST (total for Feb-Mar: ₹2 lakh + GST — both invoiced and agreed).\n' +
      'From 11 Apr 2026 (new target):\n' +
      '  · ₹2 lakh + GST if commissioning completes by 30 Apr 2026.\n' +
      '  · ₹2.5 lakh + GST for April 2026 if not completed by 30 Apr.\n' +
      '  · ₹2.5 lakh + GST per month from May 2026 onwards, pro-rata for partial months.',
    reason: 'Schedule extension beyond the original paid envelope.',
    cost_impact: 200000, schedule_impact: 'Rolls forward until client completes electrical interconnect.',
    status: 'implemented', admin_notes: 'Feb + Mar invoiced. Apr and onward rate schedule agreed.',
    reviewed_by: ACTOR, reviewed_at: '2026-03-05T14:00:00+05:30',
  },
  {
    no: 'CR-2026-005', title: 'AutoREX software — separately-scoped',
    description:
      'Original proposal included AutoREX software implementation complimentary with EPC. ' +
      'Because the project has extended beyond the paid envelope, the complimentary inclusion has ' +
      'lapsed. Plant is delivered AutoREX-compliant (sensors, instruments, PLC-compatible cabling). ' +
      'AutoREX software is available as a separately-quoted order — scoped proposal available on request.',
    reason: 'Project timeline ran past the paid scope envelope.',
    cost_impact: 0, schedule_impact: 'No impact to current EPC schedule.',
    status: 'under_review', admin_notes: 'Awaiting client decision on AutoREX purchase.',
    reviewed_by: null, reviewed_at: null,
  },
  {
    no: 'CR-2026-006', title: 'Plant operations — Rotehügels as consultant',
    description:
      'Rotehügels proposes to operate the plant post-commissioning as a retained consultant. ' +
      'Charge: ₹2.5 lakh + GST per month. Scope: day-to-day plant operations, electrolyte chemistry ' +
      'management, first-harvest cycle oversight, monthly performance reporting. Separate agreement ' +
      'from EPC scope. Typically engaged for 3-6 months post-commissioning.',
    reason: 'Client request for operations continuity.',
    cost_impact: 250000, schedule_impact: 'Ongoing monthly engagement after commissioning.',
    status: 'requested', admin_notes: 'Scoped proposal can be issued on approval.',
    reviewed_by: null, reviewed_at: null,
  },
];

for (const c of changes) {
  await supabaseAdmin.from('change_requests').insert({
    project_id: project.id,
    change_no: c.no,
    title: c.title, description: c.description, reason: c.reason,
    cost_impact: c.cost_impact, schedule_impact: c.schedule_impact,
    status: c.status, admin_notes: c.admin_notes,
    reviewed_by: c.reviewed_by, reviewed_at: c.reviewed_at,
  });
}
console.log(`Change requests seeded: ${changes.length}`);

console.log('\nPortal narrative fully rewritten. Mr. Sabare will see the complete commercial history.');
