import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Radar, Search, Building2, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import TriggerCrawl from './TriggerCrawl';
import LeadsTable from './LeadsTable';

export const dynamic = 'force-dynamic';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

function Badge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: 'bg-blue-500/20 text-blue-400',
    reviewed: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-emerald-500/20 text-emerald-400',
    qualified: 'bg-emerald-500/20 text-emerald-400',
    rejected: 'bg-red-500/20 text-red-400',
    contacted: 'bg-purple-500/20 text-purple-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    running: 'bg-blue-500/20 text-blue-400',
    completed: 'bg-emerald-500/20 text-emerald-400',
    failed: 'bg-red-500/20 text-red-400',
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] ?? 'bg-zinc-700 text-zinc-300'}`}>
      {status}
    </span>
  );
}

export default async function IntelligencePage() {
  const oneWeekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();

  const [
    { count: supplierTotal },
    { count: customerTotal },
    { count: supplierNew },
    { count: customerNew },
    { count: approvedCount },
    { count: pendingCount },
    { data: jobs },
    { data: supplierLeads },
    { data: customerLeads },
  ] = await Promise.all([
    supabaseAdmin.from('supplier_leads').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('customer_leads').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('supplier_leads').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgo),
    supabaseAdmin.from('customer_leads').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgo),
    supabaseAdmin.from('supplier_leads').select('*', { count: 'exact', head: true }).in('status', ['approved', 'qualified']),
    supabaseAdmin.from('supplier_leads').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabaseAdmin.from('crawl_jobs').select('*').order('created_at', { ascending: false }).limit(10),
    supabaseAdmin.from('supplier_leads').select('*').order('created_at', { ascending: false }).limit(50),
    supabaseAdmin.from('customer_leads').select('*').order('created_at', { ascending: false }).limit(50),
  ]);

  const kpis = [
    { label: 'Supplier Leads', value: supplierTotal ?? 0, icon: Building2, color: 'text-orange-400' },
    { label: 'Customer Leads', value: customerTotal ?? 0, icon: Users, color: 'text-sky-400' },
    { label: 'New This Week', value: (supplierNew ?? 0) + (customerNew ?? 0), icon: Clock, color: 'text-yellow-400' },
    { label: 'Approved', value: approvedCount ?? 0, icon: CheckCircle, color: 'text-emerald-400' },
    { label: 'Pending Review', value: pendingCount ?? 0, icon: AlertCircle, color: 'text-rose-400' },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Radar className="h-7 w-7 text-rose-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Market Intelligence</h1>
            <p className="text-sm text-zinc-500">Discover potential suppliers and customers automatically</p>
          </div>
        </div>
        <TriggerCrawl />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className={`${glass} p-5`}>
            <div className="flex items-center gap-2 mb-2">
              <k.icon className={`h-4 w-4 ${k.color}`} />
              <span className="text-xs text-zinc-500 uppercase tracking-wide">{k.label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Crawl Jobs */}
      <div className={`${glass} p-6`}>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Search className="h-5 w-5 text-zinc-400" />
          Recent Crawl Jobs
        </h2>
        {!jobs || jobs.length === 0 ? (
          <p className="text-sm text-zinc-500">No crawl jobs yet. Trigger one above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-800">
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">Queries</th>
                  <th className="pb-2 pr-4">Results</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j: Record<string, unknown>) => (
                  <tr key={j.id as string} className="border-b border-zinc-800/50">
                    <td className="py-2.5 pr-4 text-zinc-300">{j.job_type as string}</td>
                    <td className="py-2.5 pr-4 text-zinc-400 max-w-xs truncate">
                      {((j.search_queries as string[]) ?? []).slice(0, 2).join(', ')}
                      {((j.search_queries as string[]) ?? []).length > 2 && '...'}
                    </td>
                    <td className="py-2.5 pr-4 text-zinc-300">{j.results_count as number}</td>
                    <td className="py-2.5 pr-4"><Badge status={j.status as string} /></td>
                    <td className="py-2.5 text-zinc-500 text-xs">
                      {new Date(j.created_at as string).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leads Tables */}
      <LeadsTable supplierLeads={supplierLeads ?? []} customerLeads={customerLeads ?? []} />
    </div>
  );
}
