import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Radar, Building2, Users, CheckCircle, Clock, AlertCircle, Handshake } from 'lucide-react';
import TriggerCrawl from './TriggerCrawl';
import LeadsTable from './LeadsTable';

export const dynamic = 'force-dynamic';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

export default async function IntelligencePage() {
  const oneWeekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();

  const [
    { count: supplierTotal },
    { count: customerTotal },
    { count: tradingTotal },
    { count: newThisWeek },
    { count: approvedCount },
    { count: pendingCount },
    { data: supplierLeads },
    { data: customerLeads },
    { data: tradingLeads },
  ] = await Promise.all([
    supabaseAdmin.from('supplier_leads').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('customer_leads').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('trading_leads').select('*', { count: 'exact', head: true }),
    // New across all 3 tables this week
    supabaseAdmin.from('supplier_leads').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgo),
    // Approved across supplier + customer
    supabaseAdmin.from('supplier_leads').select('*', { count: 'exact', head: true }).in('status', ['approved', 'qualified']),
    // Pending review across all
    supabaseAdmin.from('supplier_leads').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabaseAdmin.from('supplier_leads').select('*').order('created_at', { ascending: false }).limit(50),
    supabaseAdmin.from('customer_leads').select('*').order('created_at', { ascending: false }).limit(50),
    supabaseAdmin.from('trading_leads').select('*').order('created_at', { ascending: false }).limit(50),
  ]);

  const kpis = [
    { label: 'Supplier Leads', value: supplierTotal ?? 0, icon: Building2, color: 'text-orange-400' },
    { label: 'Customer Leads', value: customerTotal ?? 0, icon: Users, color: 'text-sky-400' },
    { label: 'Trading Leads', value: tradingTotal ?? 0, icon: Handshake, color: 'text-emerald-400' },
    { label: 'New This Week', value: newThisWeek ?? 0, icon: Clock, color: 'text-yellow-400' },
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
            <p className="text-sm text-zinc-500">AI-powered lead discovery — suppliers, customers, and trading partners</p>
          </div>
        </div>
        <TriggerCrawl />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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

      {/* Leads Tables */}
      <LeadsTable
        supplierLeads={supplierLeads ?? []}
        customerLeads={customerLeads ?? []}
        tradingLeads={tradingLeads ?? []}
      />
    </div>
  );
}
