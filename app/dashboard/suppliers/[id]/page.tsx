import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import SupplierEditForm from './SupplierEditForm';

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: supplier, error } = await supabaseAdmin
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !supplier) notFound();

  return (
    <div className="p-8 space-y-6">
      <div>
        <Link href="/dashboard/suppliers"
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Suppliers
        </Link>
        <h1 className="text-2xl font-black text-white">{supplier.legal_name}</h1>
        {supplier.gstin
          ? <p className="text-sm font-mono text-amber-400 mt-1">{supplier.gstin}</p>
          : <p className="text-sm text-zinc-500 mt-1">No GSTIN — enter below and click Lookup</p>
        }
      </div>
      <SupplierEditForm supplier={supplier} />
    </div>
  );
}
