'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, Users, ExternalLink, Check, X } from 'lucide-react';

type Lead = Record<string, unknown>;

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
}: {
  supplierLeads: Lead[];
  customerLeads: Lead[];
}) {
  const [tab, setTab] = useState<'supplier' | 'customer'>('supplier');
  const [filter, setFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const leads = tab === 'supplier' ? supplierLeads : customerLeads;
  const filtered = filter === 'all' ? leads : leads.filter((l) => l.status === filter);

  async function updateStatus(id: string, status: string) {
    setActionLoading(id);
    try {
      await fetch(`/api/crawl/leads/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          table: tab === 'supplier' ? 'supplier_leads' : 'customer_leads',
        }),
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

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm p-6">
      {/* Tab headers */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => { setTab('supplier'); setFilter('all'); }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'supplier' ? 'bg-orange-500/20 text-orange-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Building2 className="h-4 w-4" />
            Supplier Leads ({supplierLeads.length})
          </button>
          <button
            onClick={() => { setTab('customer'); setFilter('all'); }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'customer' ? 'bg-sky-500/20 text-sky-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            Customer Leads ({customerLeads.length})
          </button>
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
                <th className="pb-2 pr-4">Industry</th>
                <th className="pb-2 pr-4">Source</th>
                <th className="pb-2 pr-4">Confidence</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id as string} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="py-2.5 pr-4">
                    <Link
                      href={`/dashboard/intelligence/${lead.id}`}
                      className="text-zinc-200 hover:text-rose-400 font-medium transition-colors"
                    >
                      {lead.company_name as string}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 text-zinc-400">{(lead.contact_person as string) ?? '-'}</td>
                  <td className="py-2.5 pr-4 text-zinc-400 text-xs">{(lead.email as string) ?? '-'}</td>
                  <td className="py-2.5 pr-4 text-zinc-400 text-xs">{(lead.phone as string) ?? '-'}</td>
                  <td className="py-2.5 pr-4 text-zinc-400">{(lead.industry as string) ?? '-'}</td>
                  <td className="py-2.5 pr-4">
                    {lead.source_url ? (
                      <a
                        href={lead.source_url as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 text-xs"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {(lead.source_type as string) ?? 'web'}
                      </a>
                    ) : (
                      <span className="text-zinc-600 text-xs">-</span>
                    )}
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
