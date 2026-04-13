'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, Users, Handshake, ExternalLink, Check, X } from 'lucide-react';

type Lead = Record<string, unknown>;
type Tab = 'supplier' | 'customer' | 'trading';

function Badge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: 'bg-blue-500/20 text-blue-400',
    reviewed: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-emerald-500/20 text-emerald-400',
    qualified: 'bg-emerald-500/20 text-emerald-400',
    rejected: 'bg-red-500/20 text-red-400',
    contacted: 'bg-purple-500/20 text-purple-400',
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] ?? 'bg-zinc-700 text-zinc-300'}`}>
      {status}
    </span>
  );
}

function ConfidenceDot({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-emerald-400' : score >= 40 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-xs text-zinc-400">{score}</span>
    </div>
  );
}

export default function LeadsTable({
  supplierLeads,
  customerLeads,
  tradingLeads,
}: {
  supplierLeads: Lead[];
  customerLeads: Lead[];
  tradingLeads: Lead[];
}) {
  const [tab, setTab] = useState<Tab>('supplier');
  const [filter, setFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const leads = tab === 'supplier' ? supplierLeads : tab === 'customer' ? customerLeads : tradingLeads;
  const filtered = filter === 'all' ? leads : leads.filter((l) => l.status === filter);

  async function updateStatus(id: string, status: string) {
    setActionLoading(id);
    try {
      const table = tab === 'supplier' ? 'supplier_leads' : tab === 'customer' ? 'customer_leads' : 'trading_leads';
      await fetch(`/api/crawl/leads/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, table }),
      });
      window.location.reload();
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  }

  const statuses = ['all', 'new', 'reviewed', 'approved', 'rejected', 'contacted'];
  if (tab === 'customer') statuses.splice(3, 0, 'qualified');

  const tabs: { key: Tab; label: string; icon: typeof Building2; color: string; count: number }[] = [
    { key: 'supplier', label: 'Supplier Leads', icon: Building2, color: 'orange', count: supplierLeads.length },
    { key: 'customer', label: 'Customer Leads', icon: Users, color: 'sky', count: customerLeads.length },
    { key: 'trading', label: 'Trading Leads', icon: Handshake, color: 'emerald', count: tradingLeads.length },
  ];

  // Extra columns per type
  const extraHeader = tab === 'supplier' ? 'Products' : tab === 'customer' ? 'Needs' : 'Commodities';

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm p-6">
      {/* Tab headers */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex gap-2">
          {tabs.map(({ key, label, icon: Icon, color, count }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setFilter('all'); }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === key ? `bg-${color}-500/20 text-${color}-400` : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-1">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                filter === s ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500 py-8 text-center">No leads found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500 border-b border-zinc-800">
                <th className="pb-2 pr-4">Company</th>
                <th className="pb-2 pr-4">Contact</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Phone</th>
                <th className="pb-2 pr-4">Location</th>
                <th className="pb-2 pr-4">{extraHeader}</th>
                <th className="pb-2 pr-4">Source</th>
                <th className="pb-2 pr-4">Score</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => {
                const extra = tab === 'supplier'
                  ? ((lead.products_services as string[]) ?? []).join(', ')
                  : tab === 'customer'
                  ? ((lead.potential_needs as string[]) ?? []).join(', ')
                  : ((lead.commodities as string[]) ?? []).join(', ');

                return (
                  <tr key={lead.id as string} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="py-2.5 pr-4">
                      <Link
                        href={`/dashboard/intelligence/${lead.id}`}
                        className="text-zinc-200 hover:text-rose-400 font-medium transition-colors"
                      >
                        {lead.company_name as string}
                      </Link>
                      {(lead.website as string) ? (
                        <a
                          href={lead.website as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1.5 inline-block text-zinc-600 hover:text-zinc-400"
                        >
                          <ExternalLink className="h-3 w-3 inline" />
                        </a>
                      ) : null}
                    </td>
                    <td className="py-2.5 pr-4 text-zinc-400 text-xs">
                      {(lead.contact_person as string) ?? '-'}
                      {(lead.designation as string) ? <span className="text-zinc-600 block">{lead.designation as string}</span> : null}
                    </td>
                    <td className="py-2.5 pr-4 text-zinc-400 text-xs">{(lead.email as string) ?? '-'}</td>
                    <td className="py-2.5 pr-4 text-zinc-400 text-xs">{(lead.phone as string) ?? '-'}</td>
                    <td className="py-2.5 pr-4 text-zinc-400 text-xs">
                      {[lead.city, lead.state].filter(Boolean).join(', ') || (lead.country as string) || '-'}
                    </td>
                    <td className="py-2.5 pr-4 text-zinc-400 text-xs max-w-[200px] truncate" title={extra}>
                      {extra || '-'}
                    </td>
                    <td className="py-2.5 pr-4 text-zinc-500 text-xs">
                      {(lead.source_type as string) ?? '-'}
                    </td>
                    <td className="py-2.5 pr-4">
                      <ConfidenceDot score={(lead.confidence_score as number) ?? 0} />
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge status={(lead.status as string) ?? 'new'} />
                    </td>
                    <td className="py-2.5">
                      <div className="flex gap-1">
                        <button
                          onClick={() => updateStatus(lead.id as string, 'approved')}
                          disabled={actionLoading === lead.id}
                          className="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                          title="Approve"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => updateStatus(lead.id as string, 'rejected')}
                          disabled={actionLoading === lead.id}
                          className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                          title="Reject"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
