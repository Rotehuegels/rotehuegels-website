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
        docRevision={`R0`}
        docPreparedBy="Process Owner"
        docApprovedBy={sop.approvedBy}
      >
        <div
          className="bg-white text-zinc-900"
          style={{ padding: '10mm 14mm', fontFamily: 'Arial, sans-serif', fontSize: '11px', lineHeight: 1.6 }}
        >

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2.5px solid #111', paddingBottom: '6px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoSrc} alt="Rotehügels" style={{ height: '48px', width: 'auto', objectFit: 'contain', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 900, lineHeight: 1.2, color: '#111', textTransform: 'uppercase' }}>
                  {CO.name}
                </div>
                <div style={{ marginTop: '4px', fontSize: '8.5px', color: '#666', lineHeight: 1.6 }}>
                  {CO.addr1} {CO.addr2}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
              <div style={{ display: 'inline-block', border: '2px solid #b45309', padding: '3px 10px', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '1.5px', color: '#b45309' }}>
                  STANDARD OPERATING PROCEDURE
                </span>
              </div>
              <div style={{ fontSize: '8.5px', color: '#555', lineHeight: 1.7 }}>
                <div><strong>Doc No:</strong> {sop.id}</div>
                <div><strong>Version:</strong> {sop.version} &nbsp;|&nbsp; <strong>Revision:</strong> R0</div>
              </div>
            </div>
          </div>

          {/* ── Title Block ──────────────────────────────────────────────── */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '10px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '5px 8px', border: '1px solid #d1d5db', fontWeight: 700, width: '120px', backgroundColor: '#f9fafb', color: '#374151' }}>Title</td>
                <td style={{ padding: '5px 8px', border: '1px solid #d1d5db', fontSize: '12px', fontWeight: 800, color: '#111' }}>{sop.title}</td>
              </tr>
              <tr>
                <td style={{ padding: '5px 8px', border: '1px solid #d1d5db', fontWeight: 700, backgroundColor: '#f9fafb', color: '#374151' }}>Department</td>
                <td style={{ padding: '5px 8px', border: '1px solid #d1d5db' }}>{sop.department}</td>
              </tr>
              <tr>
                <td style={{ padding: '5px 8px', border: '1px solid #d1d5db', fontWeight: 700, backgroundColor: '#f9fafb', color: '#374151' }}>Category</td>
                <td style={{ padding: '5px 8px', border: '1px solid #d1d5db' }}>{sop.category}</td>
              </tr>
              <tr>
                <td style={{ padding: '5px 8px', border: '1px solid #d1d5db', fontWeight: 700, backgroundColor: '#f9fafb', color: '#374151' }}>Effective Date</td>
                <td style={{ padding: '5px 8px', border: '1px solid #d1d5db' }}>{fmtDate(sop.effectiveDate)}</td>
              </tr>
              <tr>
                <td style={{ padding: '5px 8px', border: '1px solid #d1d5db', fontWeight: 700, backgroundColor: '#f9fafb', color: '#374151' }}>Review Date</td>
                <td style={{ padding: '5px 8px', border: '1px solid #d1d5db' }}>{fmtDate(sop.reviewDate)}</td>
              </tr>
              <tr>
                <td style={{ padding: '5px 8px', border: '1px solid #d1d5db', fontWeight: 700, backgroundColor: '#f9fafb', color: '#374151' }}>Approved By</td>
                <td style={{ padding: '5px 8px', border: '1px solid #d1d5db' }}>{sop.approvedBy}</td>
              </tr>
            </tbody>
          </table>

          {/* ── 1. Purpose ───────────────────────────────────────────────── */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#b45309', marginBottom: '4px', borderBottom: '1px solid #fde68a', paddingBottom: '2px' }}>
              1. Purpose
            </div>
            <p style={{ margin: 0, color: '#374151' }}>{sop.purpose}</p>
          </div>

          {/* ── 2. Scope ─────────────────────────────────────────────────── */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#b45309', marginBottom: '4px', borderBottom: '1px solid #fde68a', paddingBottom: '2px' }}>
              2. Scope
            </div>
            <p style={{ margin: 0, color: '#374151' }}>{sop.scope}</p>
          </div>

          {/* ── 3. Responsibilities ──────────────────────────────────────── */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#b45309', marginBottom: '4px', borderBottom: '1px solid #fde68a', paddingBottom: '2px' }}>
              3. Responsibilities
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <tbody>
                {sop.responsibilities.map((r, i) => {
                  const [role, ...descParts] = r.split(':');
                  const desc = descParts.join(':').trim();
                  return (
                    <tr key={i}>
                      <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', fontWeight: 700, width: '160px', backgroundColor: '#f9fafb', color: '#374151', verticalAlign: 'top' }}>
                        {role.trim()}
                      </td>
                      <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', color: '#374151' }}>
                        {desc || role}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── 4. Procedure ─────────────────────────────────────────────── */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#b45309', marginBottom: '6px', borderBottom: '1px solid #fde68a', paddingBottom: '2px' }}>
              4. Procedure
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ padding: '5px 6px', border: '1px solid #d1d5db', textAlign: 'center', width: '36px', fontWeight: 700, color: '#374151' }}>Step</th>
                  <th style={{ padding: '5px 8px', border: '1px solid #d1d5db', textAlign: 'left', width: '140px', fontWeight: 700, color: '#374151' }}>Action</th>
                  <th style={{ padding: '5px 8px', border: '1px solid #d1d5db', textAlign: 'left', fontWeight: 700, color: '#374151' }}>Detail</th>
                  <th style={{ padding: '5px 8px', border: '1px solid #d1d5db', textAlign: 'left', width: '120px', fontWeight: 700, color: '#374151' }}>System Ref</th>
                </tr>
              </thead>
              <tbody>
                {sop.procedure.map(step => (
                  <tr key={step.step}>
                    <td style={{ padding: '4px 6px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 700, color: '#b45309', verticalAlign: 'top' }}>
                      {step.step}
                    </td>
                    <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', fontWeight: 700, color: '#111', verticalAlign: 'top' }}>
                      {step.action}
                    </td>
                    <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', color: '#374151', verticalAlign: 'top' }}>
                      {step.detail}
                    </td>
                    <td style={{ padding: '4px 8px', border: '1px solid #e5e7eb', color: '#6b7280', fontFamily: 'monospace', fontSize: '9px', verticalAlign: 'top' }}>
                      {step.system ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── 5. KPIs (if any) ──────────────────────────────────────────── */}
          {sop.kpis && sop.kpis.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#b45309', marginBottom: '4px', borderBottom: '1px solid #fde68a', paddingBottom: '2px' }}>
                5. Key Performance Indicators
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <th style={{ padding: '4px 8px', border: '1px solid #d1d5db', textAlign: 'center', width: '36px', fontWeight: 700, color: '#374151' }}>#</th>
                    <th style={{ padding: '4px 8px', border: '1px solid #d1d5db', textAlign: 'left', fontWeight: 700, color: '#374151' }}>KPI</th>
                  </tr>
                </thead>
                <tbody>
                  {sop.kpis.map((kpi, i) => (
                    <tr key={i}>
                      <td style={{ padding: '3px 8px', border: '1px solid #e5e7eb', textAlign: 'center', color: '#6b7280' }}>{i + 1}</td>
                      <td style={{ padding: '3px 8px', border: '1px solid #e5e7eb', color: '#374151' }}>{kpi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Related Documents ─────────────────────────────────────────── */}
          <div style={{ marginBottom: '4px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#b45309', marginBottom: '4px', borderBottom: '1px solid #fde68a', paddingBottom: '2px' }}>
              {relatedSection}. Related Documents
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ padding: '4px 8px', border: '1px solid #d1d5db', textAlign: 'center', width: '36px', fontWeight: 700, color: '#374151' }}>#</th>
                  <th style={{ padding: '4px 8px', border: '1px solid #d1d5db', textAlign: 'left', fontWeight: 700, color: '#374151' }}>Document</th>
                </tr>
              </thead>
              <tbody>
                {sop.relatedDocs.map((doc, i) => (
                  <tr key={i}>
                    <td style={{ padding: '3px 8px', border: '1px solid #e5e7eb', textAlign: 'center', color: '#6b7280' }}>{i + 1}</td>
                    <td style={{ padding: '3px 8px', border: '1px solid #e5e7eb', color: '#374151' }}>{doc}</td>
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
