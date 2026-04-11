// components/DocumentFooter.tsx — IMS controlled document footer (ISO 9001:2015 §7.5)

interface DocumentFooterProps {
  docNumber: string;
  version?: number;
  revision?: string;
  status?: 'draft' | 'under_review' | 'approved' | 'obsolete' | 'superseded';
  preparedBy?: string;
  approvedBy?: string;
  date?: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'DRAFT',
  under_review: 'UNDER REVIEW',
  approved: 'APPROVED',
  obsolete: 'OBSOLETE',
  superseded: 'SUPERSEDED',
};

export default function DocumentFooter({
  docNumber,
  version = 1,
  revision = 'R0',
  status = 'draft',
  preparedBy,
  approvedBy,
  date,
}: DocumentFooterProps) {
  const statusLabel = STATUS_LABELS[status] ?? status.toUpperCase();
  const isApproved = status === 'approved';

  return (
    <div style={{
      marginTop: '32px',
      borderTop: '1px solid #d1d5db',
      paddingTop: '12px',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '9px',
      color: '#6b7280',
      lineHeight: '1.5',
    }}>
      {/* Controlled copy watermark */}
      {isApproved ? (
        <div style={{
          textAlign: 'center',
          marginBottom: '8px',
          padding: '4px 0',
          fontSize: '8px',
          fontWeight: 700,
          letterSpacing: '2px',
          color: '#16a34a',
          border: '1px solid #bbf7d0',
          backgroundColor: '#f0fdf4',
        }}>
          CONTROLLED COPY
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          marginBottom: '8px',
          padding: '4px 0',
          fontSize: '8px',
          fontWeight: 700,
          letterSpacing: '2px',
          color: '#9ca3af',
          border: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
        }}>
          UNCONTROLLED COPY — FOR REFERENCE ONLY
        </div>
      )}

      {/* Footer info grid */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '16px',
      }}>
        {/* Left: doc identification */}
        <div>
          <div style={{ fontWeight: 700, fontSize: '9px', color: '#374151' }}>
            {docNumber}
          </div>
          <div>
            Version {version} | {revision} | {statusLabel}
          </div>
        </div>

        {/* Center: prepared / approved */}
        <div style={{ textAlign: 'center' }}>
          {preparedBy && (
            <div>Prepared by: {preparedBy}</div>
          )}
          {approvedBy && (
            <div>Approved by: {approvedBy}</div>
          )}
          {date && (
            <div>Date: {date}</div>
          )}
        </div>

        {/* Right: company */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, color: '#374151' }}>
            Roteh&uuml;gels
          </div>
          <div>Integrated Management System</div>
        </div>
      </div>
    </div>
  );
}
