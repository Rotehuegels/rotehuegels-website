// components/report/ReportLetterhead.tsx
// Standardized letterhead for ALL PDF reports.
// Usage: <ReportLetterhead logoSrc={...} company={CO} title="TAX INVOICE" subtitle="INV/25-26/001" date="12 Apr 2026" />

interface ReportLetterheadProps {
  logoSrc: string;
  company: {
    name: string;
    addr1: string;
    addr2: string;
    gstin: string;
    pan: string;
    cin: string;
    tan?: string;
    email: string;
    phone: string;
    web: string;
  };
  title: string;
  subtitle?: string;        // document number
  date?: string;             // document date
  extraRight?: React.ReactNode;
}

export default function ReportLetterhead({ logoSrc, company, title, subtitle, date, extraRight }: ReportLetterheadProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2.5px solid #111', paddingBottom: '10px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="Rotehügels" style={{ height: '48px', width: 'auto', objectFit: 'contain', marginTop: '2px', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.3, color: '#111' }}>
            {company.name}
          </div>
          <div style={{ marginTop: '4px', fontSize: '8.5px', color: '#666', lineHeight: 1.6 }}>
            <div>{company.addr1}</div>
            <div>{company.addr2}</div>
            <div style={{ marginTop: '2px' }}>
              ✉ {company.email} &nbsp;|&nbsp; ☎ {company.phone} &nbsp;|&nbsp; 🌐 {company.web}
            </div>
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
        <div style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', color: '#92400e', letterSpacing: '1px' }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, color: '#111', marginTop: '4px' }}>
            {subtitle}
          </div>
        )}
        {date && (
          <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>
            {date}
          </div>
        )}
        <div style={{ marginTop: '6px', fontSize: '8.5px', color: '#555', lineHeight: 1.7 }}>
          <div><strong>GSTIN:</strong> {company.gstin}</div>
          <div><strong>PAN:</strong> {company.pan}</div>
          <div><strong>CIN:</strong> {company.cin}</div>
          {company.tan && <div><strong>TAN:</strong> {company.tan}</div>}
        </div>
        {extraRight}
      </div>
    </div>
  );
}
