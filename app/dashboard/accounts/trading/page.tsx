'use client';

import { useEffect, useState } from 'react';
import {
  Scale, CheckCircle2, XCircle, Clock, Loader2,
} from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending:   { icon: Clock,        color: 'text-amber-400 bg-amber-500/10',     label: 'Pending' },
  verified:  { icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10', label: 'Verified' },
  rejected:  { icon: XCircle,      color: 'text-red-400 bg-red-500/10',         label: 'Rejected' },
  suspended: { icon: XCircle,      color: 'text-zinc-400 bg-zinc-500/10',       label: 'Suspended' },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TP = Record<string, any>;

export default function TradingPartnersPage() {
  const [partners, setPartners] = useState<TP[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [acting, setActing] = useState<string | null>(null);

  const load = () => {
    fetch('/api/trading-partners').then(r => r.json()).then(d => { if (Array.isArray(d)) setPartners(d); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const review = async (id: string, status: string) => {
    setActing(id);
    await fetch(`/api/trading-partners/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, verified_by: 'Sivakumar Shanmugam' }),
    });
    load();
    setActing(null);
  };

  const filtered = filter === 'all' ? partners : partners.filter(p => p.status === filter);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>;

  return (
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Scale className="h-5 w-5 text-rose-400" />
          <h1 className="text-xl font-bold text-white">Trading Partners</h1>
          <span className="text-xs text-zinc-500 bg-zinc-800 rounded-full px-2 py-0.5">
            {partners.filter(p => p.status === 'pending').length} pending
          </span>
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs text-white">
          <option value="all">All ({partners.length})</option>
          <option value="pending">Pending ({partners.filter(p => p.status === 'pending').length})</option>
          <option value="verified">Verified ({partners.filter(p => p.status === 'verified').length})</option>
          <option value="rejected">Rejected ({partners.filter(p => p.status === 'rejected').length})</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className={`${glass} p-12 text-center`}>
          <Scale className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No trading partner registrations found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => {
            const cfg = statusConfig[p.status] ?? statusConfig.pending;
            const Icon = cfg.icon;
            return (
              <div key={p.id} className={`${glass} p-5`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-zinc-600">{p.reg_no}</span>
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                        <Icon className="h-3 w-3" /> {cfg.label}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{p.trade_type}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white">{p.company_name}</h3>
                    <p className="text-xs text-zinc-400">{p.contact_person} · {p.email} {p.phone && `· ${p.phone}`}</p>
                  </div>
                  <span className="text-xs text-zinc-600 shrink-0">{fmtDate(p.created_at)}</span>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-zinc-500 mb-2">
                  {p.country && <span>{p.country}</span>}
                  {p.typical_volume && <span>Vol: {p.typical_volume}</span>}
                  {p.gstin && <span>GSTIN: <span className="font-mono text-zinc-400">{p.gstin}</span></span>}
                </div>

                {/* Commodities */}
                {p.commodities?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {p.commodities.map((c: string) => (
                      <span key={c} className="rounded-full bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-300">{c}</span>
                    ))}
                  </div>
                )}

                {p.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => review(p.id, 'verified')} disabled={acting === p.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50">
                      {acting === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />} Verify
                    </button>
                    <button onClick={() => review(p.id, 'rejected')} disabled={acting === p.id}
                      className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white hover:bg-red-500 disabled:opacity-50">Reject</button>
                  </div>
                )}

                {p.status === 'verified' && (
                  <div className="flex items-center gap-3 text-xs">
                    {p.partner_id && (
                      <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        {p.partner_id}
                      </span>
                    )}
                    {p.verified_by && <span className="text-zinc-500">Verified by {p.verified_by}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
