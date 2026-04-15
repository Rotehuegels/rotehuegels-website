import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import StatementFYSelector from './StatementFYSelector';
import PDFDocumentViewer from '@/components/PDFDocumentViewer';

export const dynamic = 'force-dynamic';

export default async function CustomerStatementPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fy?: string }>;
}) {
  const { id } = await params;
  const { fy: fyParam } = await searchParams;
  const selectedFY = fyParam ?? 'all';

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: customer, error } = await supabaseAdmin
    .from('customers')
    .select('name, customer_id')
    .eq('id', id)
    .single();
  if (error || !customer) notFound();

  const pdfUrl = `/api/accounts/customers/${id}/statement/pdf${selectedFY !== 'all' ? `?fy=${selectedFY}` : ''}`;
  const filename = `Statement-${customer.customer_id ?? customer.name}`;

  return (
    <div className="p-4 print:p-0">
      {/* Toolbar */}
      <div className="flex items-start justify-between mb-4 no-print">
        <div>
          <Link href={`/d/customers/${id}`}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-2 transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back to Customer
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-white">{customer.name}</span>
            <span className="text-xs text-zinc-500 font-mono">{customer.customer_id}</span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">Statement of Account</p>
        </div>
        <StatementFYSelector customerId={id} current={selectedFY} />
      </div>

      {/* PDF Viewer */}
      <PDFDocumentViewer pdfUrl={pdfUrl} filename={filename} />
    </div>
  );
}
