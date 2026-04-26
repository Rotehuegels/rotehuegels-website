// ── Integrated Management System Manual ────────────────────────────────────
// Live-generated. Edit a SOP in lib/sops.ts (or a register entry in
// lib/imsRegister.ts) and the manual reflects on next page load.
//
// Framework: ISO 9001:2015 + ISO 14001:2015 + ISO 45001:2018 share the
// Annex SL high-level structure (10 clauses, identical numbering), so an
// integrated manual fits naturally rather than duplicating across three.
//
// Cross-clause grouping of SOPs follows ISO Annex SL §8 (Operation) which
// is where the bulk of operational SOPs live; performance/improvement SOPs
// fall under §9 and §10.

import { ALL_SOPS, deriveChangeHistory } from '@/lib/sops';
import { DOCUMENTS, RECORDS, FORMATS } from '@/lib/imsRegister';
import { ShieldCheck } from 'lucide-react';
import PrintButton from './PrintButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'IMS Manual — Rotehügels' };

// SOP → ISO clause mapping. Most operational SOPs live under Clause 8 (Operation).
// Performance / monitoring / audit SOPs go under §9. Improvement / NCR / CAPA → §10.
const CLAUSE_FOR_SOP: Record<string, string> = {
  'SOP-IT-002':   '9',   // Audit Trail & Security Monitoring → Performance evaluation
  'SOP-QMS-001':  '10',  // Document Control + NCR → Improvement
};

function clauseForSop(id: string): string {
  return CLAUSE_FOR_SOP[id] ?? '8';
}

const REVISION = 'Rev 1.0';
const ISSUE_DATE = '2026-04-26';

const MR  = 'Management Representative';
const CEO = 'Sivakumar Shanmugam, CEO';

const STD = {
  qms: 'ISO 9001:2015',
  ems: 'ISO 14001:2015',
  ohs: 'ISO 45001:2018',
};

export default function IMSManualPage() {
  const clauseSops = (clauseNo: string) =>
    ALL_SOPS.filter((s) => clauseForSop(s.id) === clauseNo).sort((a, b) => a.id.localeCompare(b.id));

  const documentsByDept: Record<string, typeof ALL_SOPS> = {};
  for (const s of ALL_SOPS) {
    (documentsByDept[s.department] ??= []).push(s);
  }
  const departmentOrder = Object.keys(documentsByDept).sort();

  return (
    <div className="ims-manual bg-zinc-950 text-zinc-200">
      <PrintStyles />

      {/* Print toolbar — hidden when printing */}
      <div className="no-print sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-rose-400" />
          <span className="text-sm font-semibold text-white">IMS Manual ({REVISION})</span>
        </div>
        <PrintButton />
      </div>

      <article className="max-w-[900px] mx-auto px-6 md:px-10 py-10 print:py-0 space-y-8 leading-relaxed">

        {/* ── Cover page ──────────────────────────────────────────── */}
        <section className="cover-page break-after">
          <div className="text-center space-y-4 pt-12">
            <p className="text-xs uppercase tracking-[0.3em] text-rose-400">Rotehügels</p>
            <h1 className="text-4xl font-black leading-tight">
              Integrated Management System Manual
            </h1>
            <p className="text-sm text-zinc-400 max-w-xl mx-auto">
              Quality, Environmental, and Occupational Health & Safety<br />
              {STD.qms} · {STD.ems} · {STD.ohs}
            </p>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-6 text-xs max-w-md mx-auto">
            <Info label="Document ID"  value="DOC-IMS-MANUAL" />
            <Info label="Revision"     value={REVISION} />
            <Info label="Issue date"   value={ISSUE_DATE} />
            <Info label="Owner"        value={MR} />
            <Info label="Approved by"  value={CEO} />
            <Info label="Distribution" value="All staff (read-only)" />
          </div>
          <p className="mt-12 text-[11px] text-zinc-500 text-center max-w-xl mx-auto italic">
            Controlled document — printed copies are uncontrolled. Always refer to the latest revision at <span className="font-mono not-italic">/d/ims/manual</span>.
          </p>
        </section>

        {/* ── Table of Contents ──────────────────────────────────── */}
        <ManualSection num="" title="Table of Contents" id="toc">
          <ol className="space-y-1 text-sm">
            {[
              ['1', 'Scope of the IMS'],
              ['2', 'Normative references'],
              ['3', 'Terms and definitions'],
              ['4', 'Context of the organisation'],
              ['5', 'Leadership'],
              ['6', 'Planning'],
              ['7', 'Support'],
              ['8', 'Operation'],
              ['9', 'Performance evaluation'],
              ['10', 'Improvement'],
              ['A', 'Appendix A — SOP Register (with change history)'],
              ['B', 'Appendix B — Clause × SOP Cross-reference Matrix'],
              ['C', 'Appendix C — Documents, Records & Formats Registers'],
            ].map(([n, t]) => (
              <li key={n} className="flex items-baseline gap-3">
                <span className="font-mono text-xs w-6 text-zinc-500">{n}</span>
                <a href={`#clause-${n}`} className="text-rose-300 hover:text-rose-200 no-underline">{t}</a>
              </li>
            ))}
          </ol>
        </ManualSection>

        {/* ── Clause 1 ──────────────────────────────────────────── */}
        <ManualSection num="1" title="Scope of the IMS" id="clause-1">
          <p>
            This Integrated Management System (IMS) covers all operations of <strong>Rotehügels Research Business Consultancy Private Limited</strong> at its
            Chennai head office, the in-house pilot facility, and engagements executed at customer sites in India and overseas. It applies to:
          </p>
          <ul>
            <li>Engineering and design services for process plants (EPC, brownfield retrofit, custom equipment fabrication)</li>
            <li>Operations and laboratory services for metals, recycling, hydrometallurgy, and adjacent process industries</li>
            <li>R&D, pilot trials, method development, and testwork for clients and internal scale-up</li>
            <li>Software products under the AutoREX™ platform — AutoREX™ Core, Operon ERP, and LabREX LIMS</li>
            <li>Procurement, warehousing, logistics, and supplier ecosystem management</li>
            <li>Recycling-ecosystem activities including pickup intake, recycler assignment, and certificate issuance</li>
            <li>Sales & marketing, including the regional representative network</li>
            <li>Administrative functions — Finance & Accounts, Legal & Compliance, Human Resources, IT & Systems</li>
          </ul>
          <p>
            The IMS is designed to integrate the requirements of <strong>{STD.qms}</strong> (Quality), <strong>{STD.ems}</strong> (Environment), and <strong>{STD.ohs}</strong> (Occupational Health & Safety). Where a clause has overlapping requirements across the three standards, this manual treats it as a single integrated requirement.
          </p>
          <p className="text-xs text-zinc-500">
            Permissible exclusions: none claimed at this revision. Future exclusions, if any, will be justified in clause 4.3 with explicit reference to the standard clause being excluded.
          </p>
        </ManualSection>

        {/* ── Clause 2 ──────────────────────────────────────────── */}
        <ManualSection num="2" title="Normative references" id="clause-2">
          <p>The following are referred to throughout this manual:</p>
          <ul>
            <li><strong>{STD.qms}</strong> — Quality management systems — Requirements</li>
            <li><strong>{STD.ems}</strong> — Environmental management systems — Requirements with guidance for use</li>
            <li><strong>{STD.ohs}</strong> — Occupational health and safety management systems — Requirements with guidance for use</li>
            <li>Companies Act, 2013 (India) and rules made thereunder</li>
            <li>Goods and Services Tax (CGST/SGST/IGST) Acts and Rules</li>
            <li>E-Waste (Management) Rules, 2022 — CPCB</li>
            <li>Hazardous and Other Wastes Rules, 2016 (as amended)</li>
            <li>Factories Act 1948, Tamil Nadu Factories Rules, applicable State Pollution Control Board (SPCB) consents</li>
            <li>EPF Act 1952, ESI Act 1948, Payment of Bonus Act 1965, Payment of Gratuity Act 1972</li>
            <li>BIS / IS standards relevant to engineering deliverables (ASME B31.3, IS 800, IS 808, IEC 60079, etc.)</li>
          </ul>
        </ManualSection>

        {/* ── Clause 3 ──────────────────────────────────────────── */}
        <ManualSection num="3" title="Terms and definitions" id="clause-3">
          <p>For the purposes of this manual, the terms and definitions in {STD.qms} clause 3, {STD.ems} clause 3, and {STD.ohs} clause 3 apply. The following Rotehügels-specific terms are also used:</p>
          <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="font-semibold">REX</dt>             <dd>Rotehügels Expert Network — community of independent professionals registered with us for project assignments</dd>
            <dt className="font-semibold">Indent</dt>          <dd>Internal purchase requisition raised before a Purchase Order is issued</dd>
            <dt className="font-semibold">3-way match</dt>     <dd>Verification that a supplier invoice matches the corresponding PO and GRN before payment authorisation</dd>
            <dt className="font-semibold">FIFO layer</dt>      <dd>A cost layer in the inventory ledger representing one receipt of stock at a known unit cost</dd>
            <dt className="font-semibold">COA</dt>             <dd>Certificate of Analysis — laboratory result report issued to the customer for a tested sample</dd>
            <dt className="font-semibold">EPR</dt>             <dd>Extended Producer Responsibility under E-Waste Rules</dd>
            <dt className="font-semibold">NCR</dt>             <dd>Non-Conformance Report</dd>
            <dt className="font-semibold">CAPA</dt>            <dd>Corrective Action / Preventive Action</dd>
            <dt className="font-semibold">ECN</dt>             <dd>Engineering Change Note — controlled change to an issued drawing</dd>
            <dt className="font-semibold">IFC</dt>             <dd>Issued For Construction — drawing release stage at which the design is buildable</dd>
          </dl>
        </ManualSection>

        {/* ── Clause 4 ──────────────────────────────────────────── */}
        <ManualSection num="4" title="Context of the organisation" id="clause-4">
          <SubClause num="4.1" title="Understanding the organisation and its context">
            <p>
              Rotehügels positions itself as an integrated provider of process-engineering services and industrial software, serving customers across metals, recycling, hydrometallurgy, and adjacent process industries. The internal context (capability, capital, culture, IP) and external context (regulatory environment, customer demand, technology shifts, competitor landscape) are reviewed by management at least annually as part of the management review (clause 9.3).
            </p>
          </SubClause>
          <SubClause num="4.2" title="Needs and expectations of interested parties">
            <p>Interested parties and their relevant requirements:</p>
            <ul>
              <li><strong>Customers</strong> — quality, on-time delivery, regulatory compliance, IP confidentiality</li>
              <li><strong>Suppliers</strong> — clear specifications, on-time payment, fair commercial terms</li>
              <li><strong>Employees & REX network</strong> — safe workplace, fair compensation, career growth</li>
              <li><strong>Regulators (CPCB, SPCB, GST, EPF, ESI, MCA)</strong> — statutory compliance, accurate reporting</li>
              <li><strong>Local community (around plant / pilot facility)</strong> — minimal environmental impact, no nuisance</li>
              <li><strong>Investors / lenders</strong> — financial discipline, governance, growth</li>
            </ul>
          </SubClause>
          <SubClause num="4.3" title="Scope of the IMS">
            <p>As stated in clause 1.</p>
          </SubClause>
          <SubClause num="4.4" title="The IMS and its processes">
            <p>
              The processes of the IMS, their inputs, outputs, and interactions are documented as Standard Operating Procedures (SOPs) in <a href="#clause-A" className="text-rose-300">Appendix A</a>. The clause-by-clause mapping is in <a href="#clause-B" className="text-rose-300">Appendix B</a>.
            </p>
          </SubClause>
        </ManualSection>

        {/* ── Clause 5 — Leadership + Policies ──────────────────── */}
        <ManualSection num="5" title="Leadership" id="clause-5">
          <SubClause num="5.1" title="Leadership and commitment">
            <p>
              The CEO accepts overall accountability for the effectiveness of the IMS. This includes ensuring the policy and objectives below are established, are compatible with the strategic direction of the organisation, and are integrated with day-to-day business processes. The CEO promotes a culture of continual improvement, customer focus, environmental responsibility, and worker safety, and ensures that the resources needed for the IMS are available.
            </p>
          </SubClause>

          {/* Policies — placeholder copy. Overwrite with company-final language. */}
          <SubClause num="5.2.0" title="Integrated Management Policy" anchor="policy-integrated">
            <PolicyBlock approvedBy={CEO}>
              Rotehügels is committed to delivering engineering services and industrial software that meet customer requirements, comply with applicable statutes, protect the environment, and safeguard the health and safety of every person at work — whether employee, REX-network consultant, supplier, or visitor. We will achieve this by integrating quality, environmental, and OHS considerations into every operational decision; by setting measurable objectives and reviewing them at least annually; by complying with {STD.qms}, {STD.ems}, and {STD.ohs} and all other obligations we subscribe to; by consulting our workers on matters that affect them; and by continually improving the IMS.
            </PolicyBlock>
          </SubClause>

          <SubClause num="5.2.1" title="Quality Policy" anchor="policy-quality">
            <PolicyBlock approvedBy={CEO}>
              Quality at Rotehügels means our deliverables — drawings, plants, equipment, software releases, lab reports — meet the customer's specification first time, every time, with traceability that survives an audit a decade later. We pursue this through rigorous design control, supplier qualification, three-way commercial discipline, and structured non-conformance handling.
            </PolicyBlock>
          </SubClause>

          <SubClause num="5.2.2" title="Environmental Policy" anchor="policy-environment">
            <PolicyBlock approvedBy={CEO}>
              We minimise the environmental footprint of every project we touch — through zero-liquid-discharge design defaults, energy-efficient process choices, responsible chemical handling, and full participation in the circular economy via our recycling-ecosystem operations. We comply with all applicable CPCB, SPCB, and MoEF regulations, and we set targets to reduce waste, water, and emissions year over year.
            </PolicyBlock>
          </SubClause>

          <SubClause num="5.2.3" title="Occupational Health & Safety Policy" anchor="policy-ohs">
            <PolicyBlock approvedBy={CEO}>
              No project, deadline, or commercial outcome justifies an unsafe act. We assess hazards before every pilot, every site visit, and every commissioning campaign. We provide PPE, training, and authority-to-stop to every worker. We consult workers on OHS matters and record every incident, near-miss, and corrective action so we get steadily safer with time.
            </PolicyBlock>
          </SubClause>

          <SubClause num="5.3" title="Roles, responsibilities and authorities">
            <p>
              Organisational roles and reporting relationships are maintained in the live org chart at <a href="/d/hr/org-chart" className="text-rose-300">/d/hr/org-chart</a>. The Management Representative (currently {MR}) has authority to ensure the IMS conforms to ISO requirements, to report IMS performance to top management, and to liaise with external auditors. Approval authority for procurement, expenditure, and HR decisions follows the cascade encoded in the org chart — vacant positions roll up to the next filled superior.
            </p>
          </SubClause>
        </ManualSection>

        {/* ── Clause 6 ──────────────────────────────────────────── */}
        <ManualSection num="6" title="Planning" id="clause-6">
          <SubClause num="6.1" title="Actions to address risks and opportunities">
            <p>
              Risks and opportunities are captured in the Risk Register (a controlled document maintained by the Management Representative). Each entry has an owner, a likelihood and impact rating, planned mitigation/exploitation actions, and a review cadence. Material risks (financial, reputational, statutory) are reviewed at every management review.
            </p>
          </SubClause>
          <SubClause num="6.2" title="IMS objectives and planning">
            <p>
              IMS objectives are set annually by the CEO and Management Representative, are SMART, are aligned with the policies in 5.2, and are tracked monthly. Examples of recurring objectives:
            </p>
            <ul>
              <li><strong>Quality:</strong> on-time engineering delivery ≥ 90%, customer rejection rate &lt; 2%</li>
              <li><strong>Environment:</strong> zero exceedances of consent limits; 100% e-waste handled by authorised recyclers</li>
              <li><strong>OHS:</strong> zero LTI (Lost-Time Injury); 100% pilot trials have a signed JSA before run</li>
              <li><strong>Compliance:</strong> 100% on-time statutory filings (per SOP-LEG-002)</li>
            </ul>
          </SubClause>
          <SubClause num="6.3" title="Planning of changes">
            <p>
              Changes to the IMS — new SOPs, revised SOPs, organisational changes, technology changes — are managed through the change history mechanism on each SOP (visible in Appendix A) and through formal Engineering Change Notes (ECN) for design changes.
            </p>
          </SubClause>
        </ManualSection>

        {/* ── Clause 7 ──────────────────────────────────────────── */}
        <ManualSection num="7" title="Support" id="clause-7">
          <SubClause num="7.1" title="Resources">
            <p>The CEO ensures that human, infrastructure, and financial resources required for the IMS are made available. Specific commitments include the Chennai pilot facility, the in-house engineering team, the AutoREX software platform, and budget for external audits and certifications.</p>
          </SubClause>
          <SubClause num="7.2" title="Competence">
            <p>Competence requirements per role are defined in job descriptions and reinforced by SOP-HR-001 (onboarding), SOP-RND-002 (analyst method-competency), and on-the-job competency cards for plant operators. Records of training are retained per <a href="#clause-C" className="text-rose-300">Appendix C</a>.</p>
          </SubClause>
          <SubClause num="7.3" title="Awareness">
            <p>Every employee and contractor is made aware of the integrated policy (5.2.0), their contribution to the IMS, and the consequences of departing from documented procedures. Awareness is reinforced through induction, periodic toolbox talks, and the contents of this manual.</p>
          </SubClause>
          <SubClause num="7.4" title="Communication">
            <p>Internal communication channels: dashboard announcements, mail, Approvals inbox at /d/approvals, monthly all-hands. External communication channels: customer email, supplier email, statutory portal submissions. Spokesperson authority for media and regulator communication rests with the CEO.</p>
          </SubClause>
          <SubClause num="7.5" title="Documented information">
            <p>The IMS uses three categories of documented information, maintained as registers in <a href="#clause-C" className="text-rose-300">Appendix C</a>:</p>
            <ul>
              <li><strong>Documents</strong> (controlled): SOPs, this manual, policies, registers</li>
              <li><strong>Records</strong> (evidence): GRN, invoice, payslip, audit log, etc.</li>
              <li><strong>Formats / forms / templates</strong>: blanks used to capture records</li>
            </ul>
            <p>Each is uniquely identified, version-controlled, retention-stated, and stored at a defined location. Distribution of controlled copies is recorded; printed copies of any controlled document carry the watermark "uncontrolled when printed".</p>
          </SubClause>
        </ManualSection>

        {/* ── Clause 8 — Operation (the bulk) ──────────────────── */}
        <ManualSection num="8" title="Operation" id="clause-8">
          <p>
            Operational planning and control of all IMS processes is documented through SOPs. The list below shows every operational SOP grouped by department; full content of each SOP is in <a href="#clause-A" className="text-rose-300">Appendix A</a>.
          </p>
          {departmentOrder.map((dept) => {
            const opsSops = documentsByDept[dept].filter((s) => clauseForSop(s.id) === '8');
            if (opsSops.length === 0) return null;
            return (
              <div key={dept} className="mt-4">
                <h3 className="text-sm font-bold text-zinc-200 mt-4">{dept}</h3>
                <ul className="text-xs space-y-0.5">
                  {opsSops.map((s) => (
                    <li key={s.id}><a href={`#sop-${s.id}`} className="text-rose-300 hover:text-rose-200">{s.id}</a> &middot; {s.title}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </ManualSection>

        {/* ── Clause 9 ──────────────────────────────────────────── */}
        <ManualSection num="9" title="Performance evaluation" id="clause-9">
          <SubClause num="9.1" title="Monitoring, measurement, analysis and evaluation">
            <p>KPIs are defined inside each SOP. Performance against those KPIs is reviewed at minimum quarterly by the Management Representative; trends and exceptions feed into management review.</p>
          </SubClause>
          <SubClause num="9.2" title="Internal audit">
            <p>An internal audit programme covers every IMS clause and every SOP at least once per 3-year certification cycle, with risk-weighted areas audited annually. Audit reports and CAPAs are retained per <a href="#clause-C" className="text-rose-300">Appendix C</a>.</p>
            <p>Relevant SOPs:</p>
            <ul className="text-xs">
              {clauseSops('9').map((s) => (
                <li key={s.id}><a href={`#sop-${s.id}`} className="text-rose-300 hover:text-rose-200">{s.id}</a> &middot; {s.title}</li>
              ))}
            </ul>
          </SubClause>
          <SubClause num="9.3" title="Management review">
            <p>The CEO chairs a Management Review at least annually. Inputs include: status of actions from previous review, changes in external/internal issues, KPI performance, audit findings, customer feedback, supplier performance, environmental performance, OHS performance, statutory non-compliance status, opportunities for improvement, and resource needs. Outputs are recorded as decisions and action items with owners and deadlines.</p>
          </SubClause>
        </ManualSection>

        {/* ── Clause 10 ─────────────────────────────────────────── */}
        <ManualSection num="10" title="Improvement" id="clause-10">
          <SubClause num="10.1" title="General">
            <p>Rotehügels seeks opportunities for improvement at every operational interaction — through customer feedback, audit findings, and worker suggestions.</p>
          </SubClause>
          <SubClause num="10.2" title="Non-conformity and corrective action">
            <p>Every NCR is logged on Format F-QMS-01 (see Appendix C). Each NCR triggers root-cause analysis and a CAPA with verification of effectiveness. Repeat NCRs against the same SOP trigger a SOP revision (logged in the SOP's change history).</p>
            <p>Relevant SOPs:</p>
            <ul className="text-xs">
              {clauseSops('10').map((s) => (
                <li key={s.id}><a href={`#sop-${s.id}`} className="text-rose-300 hover:text-rose-200">{s.id}</a> &middot; {s.title}</li>
              ))}
            </ul>
          </SubClause>
          <SubClause num="10.3" title="Continual improvement">
            <p>The CEO and Management Representative evaluate IMS effectiveness in every Management Review and target the most impactful improvement initiatives for the coming year, with accountability and budget assigned.</p>
          </SubClause>
        </ManualSection>

        {/* ── Appendix A — SOP Register ────────────────────────── */}
        <ManualSection num="A" title="Appendix A — SOP Register (with change history)" id="clause-A">
          <p className="text-sm">{ALL_SOPS.length} SOPs in this register. Each SOP's change history is shown immediately below its summary; an empty history means the SOP is at its initial release.</p>
          <div className="space-y-6 mt-6">
            {ALL_SOPS.map((s) => {
              const history = deriveChangeHistory(s);
              return (
                <div key={s.id} id={`sop-${s.id}`} className="border-l-2 border-zinc-800 pl-4 py-1 break-inside-avoid">
                  <h3 className="text-sm font-bold">
                    <span className="font-mono text-rose-300">{s.id}</span> &middot; {s.title}
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {s.department} &middot; {s.category} &middot; v{s.version} &middot; effective {s.effectiveDate} &middot; review by {s.reviewDate}
                  </p>
                  <p className="text-xs text-zinc-300 mt-2"><strong>Purpose:</strong> {s.purpose}</p>
                  <p className="text-xs text-zinc-300 mt-1"><strong>Scope:</strong> {s.scope}</p>
                  {/* Change history table */}
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-[11px] border border-zinc-800">
                      <thead>
                        <tr className="bg-zinc-900/60">
                          <th className="px-2 py-1 text-left font-semibold w-16">Version</th>
                          <th className="px-2 py-1 text-left font-semibold w-24">Date</th>
                          <th className="px-2 py-1 text-left font-semibold w-20">Type</th>
                          <th className="px-2 py-1 text-left font-semibold">Description</th>
                          <th className="px-2 py-1 text-left font-semibold w-32">Approved by</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((h, i) => (
                          <tr key={i} className="border-t border-zinc-800/60">
                            <td className="px-2 py-1 font-mono">{h.version}</td>
                            <td className="px-2 py-1">{h.date}</td>
                            <td className="px-2 py-1 capitalize">
                              <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                h.type === 'major' ? 'bg-rose-500/15 text-rose-300' :
                                h.type === 'minor' ? 'bg-amber-500/15 text-amber-300' :
                                'bg-zinc-700/40 text-zinc-400'
                              }`}>{h.type}</span>
                            </td>
                            <td className="px-2 py-1">{h.description}</td>
                            <td className="px-2 py-1 text-zinc-400">{h.approvedBy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </ManualSection>

        {/* ── Appendix B — Cross-reference matrix ──────────────── */}
        <ManualSection num="B" title="Appendix B — Clause × SOP Cross-reference Matrix" id="clause-B">
          <p className="text-sm">Which SOPs evidence which IMS clause. Each operational SOP is listed under the clause it primarily satisfies; some SOPs satisfy multiple clauses but appear only against the primary one to keep the matrix readable.</p>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-xs border border-zinc-800">
              <thead>
                <tr className="bg-zinc-900/60">
                  <th className="px-3 py-2 text-left font-semibold w-24">Clause</th>
                  <th className="px-3 py-2 text-left font-semibold">SOPs</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['1',  'Scope',                         'This manual'],
                  ['2',  'Normative references',          'This manual + statutes listed in §2'],
                  ['3',  'Terms and definitions',         'This manual'],
                  ['4',  'Context of the organisation',   'This manual + Risk Register'],
                  ['5',  'Leadership',                    'This manual §5 (policies) + org chart'],
                  ['6',  'Planning',                      'This manual §6 + Risk Register'],
                  ['7',  'Support',                       'SOP-HR-001, SOP-IT-001, SOP-IT-002, SOP-SET-001, SOP-RND-002'],
                  ['8',  'Operation',                     'All other SOPs (see Appendix A)'],
                  ['9',  'Performance evaluation',        'SOP-IT-002 + KPIs inside each SOP'],
                  ['10', 'Improvement',                   'SOP-QMS-001 + change history per SOP'],
                ].map(([n, t, sops]) => (
                  <tr key={n} className="border-t border-zinc-800/60">
                    <td className="px-3 py-2"><span className="font-mono text-rose-300">{n}</span> &middot; {t}</td>
                    <td className="px-3 py-2">{sops}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ManualSection>

        {/* ── Appendix C — Documents/Records/Formats ──────────── */}
        <ManualSection num="C" title="Appendix C — Documents, Records & Formats Registers" id="clause-C">

          <h3 className="text-sm font-bold mt-4">C.1 — Documents (controlled)</h3>
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-xs border border-zinc-800 break-inside-avoid">
              <thead>
                <tr className="bg-zinc-900/60">
                  <th className="px-2 py-1 text-left font-semibold">ID</th>
                  <th className="px-2 py-1 text-left font-semibold">Title</th>
                  <th className="px-2 py-1 text-left font-semibold">Type</th>
                  <th className="px-2 py-1 text-left font-semibold">Owner</th>
                  <th className="px-2 py-1 text-left font-semibold">Rev</th>
                  <th className="px-2 py-1 text-left font-semibold">Source</th>
                </tr>
              </thead>
              <tbody>
                {DOCUMENTS.map((d) => (
                  <tr key={d.id} className="border-t border-zinc-800/60">
                    <td className="px-2 py-1 font-mono text-rose-300">{d.id}</td>
                    <td className="px-2 py-1">{d.title}</td>
                    <td className="px-2 py-1 capitalize">{d.type}</td>
                    <td className="px-2 py-1 text-zinc-400">{d.owner}</td>
                    <td className="px-2 py-1">{d.revision}</td>
                    <td className="px-2 py-1 font-mono text-zinc-500">{d.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-sm font-bold mt-8">C.2 — Records (with retention)</h3>
          <p className="text-[11px] text-zinc-500">Retention periods reflect the longest applicable Indian statutory baseline (Companies Act, CGST, Income Tax, EPF/ESI, CPCB rules). Permanent retention is reserved for items where lifetime traceability is needed.</p>
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-xs border border-zinc-800 break-inside-avoid">
              <thead>
                <tr className="bg-zinc-900/60">
                  <th className="px-2 py-1 text-left font-semibold">ID</th>
                  <th className="px-2 py-1 text-left font-semibold">Record</th>
                  <th className="px-2 py-1 text-left font-semibold">Generated by</th>
                  <th className="px-2 py-1 text-left font-semibold">Retention</th>
                  <th className="px-2 py-1 text-left font-semibold">Rationale</th>
                  <th className="px-2 py-1 text-left font-semibold">Disposition</th>
                </tr>
              </thead>
              <tbody>
                {RECORDS.map((r) => (
                  <tr key={r.id} className="border-t border-zinc-800/60">
                    <td className="px-2 py-1 font-mono text-rose-300">{r.id}</td>
                    <td className="px-2 py-1">{r.title}</td>
                    <td className="px-2 py-1 font-mono text-zinc-500">{r.generatedBy}</td>
                    <td className="px-2 py-1">{r.retention}</td>
                    <td className="px-2 py-1 text-zinc-400">{r.retentionRationale}</td>
                    <td className="px-2 py-1 text-zinc-400">{r.disposition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-sm font-bold mt-8">C.3 — Formats / Forms / Templates</h3>
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-xs border border-zinc-800 break-inside-avoid">
              <thead>
                <tr className="bg-zinc-900/60">
                  <th className="px-2 py-1 text-left font-semibold">Format No.</th>
                  <th className="px-2 py-1 text-left font-semibold">Title</th>
                  <th className="px-2 py-1 text-left font-semibold">Revision</th>
                  <th className="px-2 py-1 text-left font-semibold">Parent SOP</th>
                  <th className="px-2 py-1 text-left font-semibold">Status</th>
                  <th className="px-2 py-1 text-left font-semibold">Where</th>
                </tr>
              </thead>
              <tbody>
                {FORMATS.map((f) => (
                  <tr key={f.formatNo} className="border-t border-zinc-800/60">
                    <td className="px-2 py-1 font-mono text-rose-300">{f.formatNo}</td>
                    <td className="px-2 py-1">{f.title}</td>
                    <td className="px-2 py-1">{f.revision}</td>
                    <td className="px-2 py-1 font-mono text-zinc-500">{f.parentSop}</td>
                    <td className="px-2 py-1 capitalize">{f.status}</td>
                    <td className="px-2 py-1 font-mono text-zinc-500">{f.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ManualSection>

        {/* End-of-document signoff */}
        <section className="break-before pt-12 text-center text-xs text-zinc-500">
          <p className="font-semibold text-zinc-300">End of Document</p>
          <p className="mt-2">{REVISION} &middot; issued {ISSUE_DATE} &middot; approved by {CEO}</p>
        </section>
      </article>
    </div>
  );
}

// ── small bits ─────────────────────────────────────────────────────────────

function ManualSection({ num, title, id, children }: { num: string; title: string; id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="manual-section break-before scroll-mt-24">
      <h2 className="text-2xl font-bold mt-2 pb-2 border-b border-zinc-700">
        {num && <span className="font-mono text-rose-400 mr-2">{num}.</span>}{title}
      </h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

function SubClause({ num, title, anchor, children }: { num: string; title: string; anchor?: string; children: React.ReactNode }) {
  return (
    <div id={anchor} className="mt-6 break-inside-avoid">
      <h3 className="text-base font-semibold">
        <span className="font-mono text-rose-300/80 mr-2">{num}</span>{title}
      </h3>
      <div className="mt-2 space-y-2 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function PolicyBlock({ approvedBy, children }: { approvedBy: string; children: React.ReactNode }) {
  return (
    <blockquote className="rounded-lg border-l-4 border-rose-500/40 bg-zinc-900/40 px-5 py-4 italic text-sm leading-relaxed">
      {children}
      <footer className="mt-3 not-italic text-[11px] text-zinc-500">Approved by {approvedBy}</footer>
    </blockquote>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  );
}

function PrintStyles() {
  return (
    <style>{`
      @media print {
        .no-print { display: none !important; }
        body, html, .ims-manual { background: white !important; color: black !important; }
        article, article * { color: black !important; background: transparent !important; border-color: #ccc !important; }
        a { color: black !important; text-decoration: none !important; }
        .break-before { page-break-before: always; break-before: page; }
        .break-after  { page-break-after: always;  break-after: page;  }
        .break-inside-avoid { page-break-inside: avoid; break-inside: avoid; }
        @page { margin: 18mm 16mm; }
        article {
          font-size: 10.5pt; line-height: 1.45;
        }
        h1 { font-size: 22pt; }
        h2 { font-size: 14pt; }
        h3 { font-size: 11pt; }
        thead { display: table-header-group; }
        tr, td, th { page-break-inside: avoid; }
      }
      /* Web styling — keep cards/sections visually distinct */
      .ims-manual h2 + div ul { list-style: disc; padding-left: 1.25rem; }
    `}</style>
  );
}
