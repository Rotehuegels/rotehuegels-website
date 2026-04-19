import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { Factory, ExternalLink, Plus } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const statusColor: Record<string, string> = {
  draft:      'bg-zinc-500/10 text-zinc-400',
  active:     'bg-emerald-500/10 text-emerald-400',
  paused:     'bg-amber-500/10 text-amber-400',
  completed:  'bg-blue-500/10 text-blue-400',
  terminated: 'bg-red-500/10 text-red-400',
};

export default async function OperationsListPage() {
  const { data: contracts } = await supabaseAdmin
    .from('operations_contracts')
    .select('*, projects(project_code, name, customers(name))')
    .order('created_at', { ascending: false });

  const list = contracts ?? [];

  return (
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Factory className="h-5 w-5 text-rose-400" />
          <h1 className="text-xl font-bold text-white">Operations Contracts</h1>
        </div>
      </div>

      {list.length === 0 ? (
        <div className={`${glass} p-12 text-center`}>
          <Factory className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500">No operations contracts yet.</p>
          <p className="text-xs text-zinc-600 mt-1">Create one from a project's detail page.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {list.map((c: any) => (
            <Link
              key={c.id}
              href={`/d/operations/${c.id}`}
              className={`${glass} p-5 block hover:border-zinc-700 transition-colors group`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-zinc-600">{c.contract_code}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[c.status] ?? ''}`}>
                      {c.status}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold text-white mt-1">{c.projects?.name}</h2>
                  <p className="text-xs text-zinc-500">{c.projects?.customers?.name}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-zinc-600 group-hover:text-rose-400 transition-colors" />
              </div>
              <div className="flex gap-4 text-xs text-zinc-500">
                <span>Investment: {fmt(c.investment_amount)}</span>
                <span>Product: {c.product_type}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
