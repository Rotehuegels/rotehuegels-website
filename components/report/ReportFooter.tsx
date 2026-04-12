// components/report/ReportFooter.tsx
// Standardized footer for ALL PDF reports.

interface ReportFooterProps {
  companyName: string;
  generatedDate?: string;
  page?: number;
  totalPages?: number;
  disclaimer?: string;
}

export default function ReportFooter({ companyName, generatedDate, page, totalPages, disclaimer }: ReportFooterProps) {
  const today = generatedDate || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{ borderTop: '0.5px solid #ccc', marginTop: '20px', paddingTop: '6px' }}>
      {disclaimer && (
        <div style={{ fontSize: '8px', color: '#999', marginBottom: '4px', lineHeight: 1.5 }}>
          {disclaimer}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', color: '#999' }}>
        <span>Generated on {today} &nbsp;|&nbsp; {companyName}</span>
        {page != null && totalPages != null && (
          <span>Page {page} of {totalPages}</span>
        )}
        {page == null && (
          <span>This is a computer-generated document.</span>
        )}
      </div>
    </div>
  );
}
