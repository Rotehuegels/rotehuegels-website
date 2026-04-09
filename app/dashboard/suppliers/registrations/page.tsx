import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import RegistrationsTable from './RegistrationsTable';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

export default async function SupplierRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = 'pending' } = await searchParams;

  const { data } = await supabaseAdmin
    .from('supplier_registrations')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  const [{ count: pending }, { count: approved }, { count: rejected }] = await Promise.all([
    supabaseAdmin.from('supplier_registrations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('supplier_registrations').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabaseAdmin.from('supplier_registrations').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
  ]);

  const tabs = [
    { key: 'pending',  label: 'Pending',  count: pending  ?? 0, color: 'text-amber-400' },
    { key: 'approved', label: 'Approved', count: approved ?? 0, color: 'text-emerald-400' },
    { key: 'rejected', label: 'Rejected', count: rejected ?? 0, color: 'text-rose-400' },
  ];

  return (
    <div className="p-5 md:p-8 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/suppliers" className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Supplier Registrations</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Self-registered suppliers — review and approve to add to your verified list</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/40 p-1 w-fit">
        {tabs.map(tab => (
          <Link
            key={tab.key}
            href={`/dashboard/suppliers/registrations?status=${tab.key}`}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              status === tab.key
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.label}
            <span className={`text-xs font-semibold ${tab.color}`}>{tab.count}</span>
          </Link>
        ))}
      </div>

      <div className={glass}>
        <RegistrationsTable registrations={data ?? []} currentStatus={status} />
      </div>
    </div>
  );
}
