import Link from 'next/link';
import { ALL_SOPS, getSOPById } from '@/lib/sops';
import { notFound } from 'next/navigation';
import { getLogoBase64 } from '@/lib/serverAssets';
import { getCompanyCO } from '@/lib/company';
import ReportContainer from '@/components/ReportContainer';

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default async function SOPDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sop = getSOPById(id);
  if (!sop) return notFound();

  const logoSrc = getLogoBase64();
  const CO = await getCompanyCO();

  const kpiSection = sop.kpis && sop.kpis.length > 0 ? 5 : null;
  const relatedSection = kpiSection ? 6 : 5;

  // Shared cell styles
  const thCell: React.CSSProperties = { padding: '3px 6px', border: '1px solid #d1d5db', fontWeight: 700, color: '#374151', backgroundColor: '#f3f4f6' };
  const tdCell: React.CSSProperties = { padding: '2.5px 6px', border: '1px solid #e5e7eb', color: '#374151', verticalAlign: 'top' };
  const sectionHead: React.CSSProperties = { fontSize: '10.5px', fontWeight: 800, color: '#b45309', marginBottom: '3px', borderBottom: '1px solid #fde68a', paddingBottom: '1px' };

  return (
    <div className="p-6 print:p-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 no-print">
        <div className="flex items-center gap-3">
          <Link href="/d/ims/sops" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            &larr; Back to SOPs
          </Link>
          <span className="text-zinc-700">|</span>
          <span className="font-mono text-sm text-amber-400 font-bold">{sop.id}</span>
        </div>
      </div>

      {/* A4 Document */}
      <ReportContainer
        filename={`${sop.id}-${sop.title.replace(/\s+/g, '-')}`}
        docNumber={sop.id}
        docStatus="approved"
        docVersion={parseInt(sop.version)}
        docRevision="R0"
        docPreparedBy="Process Owner"
        docApprovedBy={sop.approvedBy}
      >
        <div
          className="bg-white text-zinc-900"
          style={{ padding: '8mm 12mm', fontFamily: 'Arial, sans-serif', fontSize: '9.5px', lineHeight: 1.45 }}
        >

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2.5px solid #111', paddingBottom: '5px', marginBottom: '7px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoSrc} alt="Rotehügels" style={{ height: '40px', width: 'auto', objectFit: 'contain', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 900, lineHeight: 1.2, color: '#111', textTransform: 'uppercase' }}>
                  {CO.name}
                </div>
                <div style={{ marginTop: '3px', fontSize: '7.5px', color: '#666', lineHeight: 1.5 }}>
                  {CO.addr1} {CO.addr2}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '10px' }}>
              <div style={{ display: 'inline-block', border: '2px solid #b45309', padding: '2px 8px', marginBottom: '3px' }}>
                <span style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '1.5px', color: '#b45309' }}>
                  STANDARD OPERATING PROCEDURE
                </span>
              </div>
              <div style={{ fontSize: '7.5px', color: '#555', lineHeight: 1.6 }}>
                <div><strong>Doc No:</strong> {sop.id}</div>
                <div><strong>Version:</strong> {sop.version} &nbsp;|&nbsp; <strong>Revision:</strong> R0</div>
              </div>
            </div>
          </div>

          {/* ── Title Block ──────────────────────────────────────────────── */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '7px', fontSize: '9px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '3px 6px', border: '1px solid #d1d5db', fontWeight: 700, width: '100px', backgroundColor: '#f9fafb', color: '#374151' }}>Title</td>
                <td style={{ padding: '3px 6px', border: '1px solid #d1d5db', fontSize: '11px', fontWeight: 800, color: '#111' }}>{sop.title}</td>
              </tr>
              {[
                ['Department', sop.department],
                ['Category', sop.category],
                ['Effective Date', fmtDate(sop.effectiveDate)],
                ['Review Date', fmtDate(sop.reviewDate)],
                ['Approved By', sop.approvedBy],
              ].map(([label, value]) => (
                <tr key={label}>
                  <td style={{ padding: '2.5px 6px', border: '1px solid #d1d5db', fontWeight: 700, backgroundColor: '#f9fafb', color: '#374151' }}>{label}</td>
                  <td style={{ padding: '2.5px 6px', border: '1px solid #d1d5db' }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── 1. Purpose ───────────────────────────────────────────────── */}
          <div style={{ marginBottom: '7px' }}>
            <div style={sectionHead}>1. Purpose</div>
            <p style={{ margin: 0, color: '#374151' }}>{sop.purpose}</p>
          </div>

          {/* ── 2. Scope ─────────────────────────────────────────────────── */}
          <div style={{ marginBottom: '7px' }}>
            <div style={sectionHead}>2. Scope</div>
            <p style={{ margin: 0, color: '#374151' }}>{sop.scope}</p>
          </div>

          {/* ── 3. Responsibilities ──────────────────────────────────────── */}
          <div style={{ marginBottom: '7px' }}>
            <div style={sectionHead}>3. Responsibilities</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
              <tbody>
                {sop.responsibilities.map((r, i) => {
                  const [role, ...descParts] = r.split(':');
                  const desc = descParts.join(':').trim();
                  return (
                    <tr key={i}>
                      <td style={{ ...tdCell, fontWeight: 700, width: '140px', backgroundColor: '#f9fafb' }}>
                        {role.trim()}
                      </td>
                      <td style={tdCell}>
                        {desc || role}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── 4. Procedure ─────────────────────────────────────────────── */}
          <div style={{ marginBottom: '7px' }}>
            <div style={sectionHead}>4. Procedure</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
              <thead>
                <tr>
                  <th style={{ ...thCell, textAlign: 'center', width: '30px' }}>Step</th>
                  <th style={{ ...thCell, textAlign: 'left', width: '120px' }}>Action</th>
                  <th style={{ ...thCell, textAlign: 'left' }}>Detail</th>
                  <th style={{ ...thCell, textAlign: 'left', width: '100px' }}>System Ref</th>
                </tr>
              </thead>
              <tbody>
                {sop.procedure.map(step => (
                  <tr key={step.step}>
                    <td style={{ ...tdCell, textAlign: 'center', fontWeight: 700, color: '#b45309' }}>
                      {step.step}
                    </td>
                    <td style={{ ...tdCell, fontWeight: 700, color: '#111' }}>
                      {step.action}
                    </td>
                    <td style={tdCell}>
                      {step.detail}
                    </td>
                    <td style={{ ...tdCell, color: '#6b7280', fontFamily: 'monospace', fontSize: '8px' }}>
                      {step.system ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── 5. KPIs (if any) ──────────────────────────────────────────── */}
          {sop.kpis && sop.kpis.length > 0 && (
            <div style={{ marginBottom: '7px' }}>
              <div style={sectionHead}>5. Key Performance Indicators</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                <thead>
                  <tr>
                    <th style={{ ...thCell, textAlign: 'center', width: '30px' }}>#</th>
                    <th style={{ ...thCell, textAlign: 'left' }}>KPI</th>
                  </tr>
                </thead>
                <tbody>
                  {sop.kpis.map((kpi, i) => (
                    <tr key={i}>
                      <td style={{ ...tdCell, textAlign: 'center', color: '#6b7280' }}>{i + 1}</td>
                      <td style={tdCell}>{kpi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Related Documents ─────────────────────────────────────────── */}
          <div>
            <div style={sectionHead}>{relatedSection}. Related Documents</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
              <thead>
                <tr>
                  <th style={{ ...thCell, textAlign: 'center', width: '30px' }}>#</th>
                  <th style={{ ...thCell, textAlign: 'left' }}>Document</th>
                </tr>
              </thead>
              <tbody>
                {sop.relatedDocs.map((doc, i) => (
                  <tr key={i}>
                    <td style={{ ...tdCell, textAlign: 'center', color: '#6b7280' }}>{i + 1}</td>
                    <td style={tdCell}>{doc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </ReportContainer>
    </div>
  );
}
