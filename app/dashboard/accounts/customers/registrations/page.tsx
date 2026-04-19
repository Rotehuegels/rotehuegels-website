'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  UserCheck, Clock, CheckCircle2, XCircle, Mail, Loader2,
  Building2, ArrowLeft,
} from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending:         { icon: Clock,        color: 'text-zinc-400 bg-zinc-500/10',      label: 'Pending Email' },
  email_verified:  { icon: Mail,         color: 'text-blue-400 bg-blue-500/10',      label: 'Email Verified' },
  kyc_submitted:   { icon: UserCheck,    color: 'text-amber-400 bg-amber-500/10',    label: 'KYC Review' },
  approved:        { icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10', label: 'Approved' },
  rejected:        { icon: XCircle,      color: 'text-red-400 bg-red-500/10',        label: 'Rejected' },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Reg = Record<string, any>;

export default function CustomerRegistrationsPage() {
  const [regs, setRegs] = useState<Reg[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [acting, setActing] = useState<string | null>(null);

  const load = () => {
    fetch('/api/customer-registrations')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setRegs(d); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    setActing(id);
    await fetch(`/api/customer-registrations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', approved_by: 'Sivakumar Shanmugam' }),
    });
    load();
    setActing(null);
  };

  const reject = async (id: string) => {
    setActing(id);
    await fetch(`/api/customer-registrations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', rejection_reason: 'KYC verification failed' }),
    });
    load();
    setActing(null);
  };

  const filtered = filter === 'all' ? regs : regs.filter(r => r.status === filter);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>;

  return (
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto">
      <Link href="/d/customers" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white mb-4">
        <ArrowLeft className="h-4 w-4" /> Customers
      </Link>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <UserCheck className="h-5 w-5 text-rose-400" />
          <h1 className="text-xl font-bold text-white">Customer Registrations</h1>
          <span className="text-xs text-zinc-500 bg-zinc-800 rounded-full px-2 py-0.5">
            {regs.filter(r => r.status === 'kyc_submitted').length} pending review
          </span>
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs text-white">
          <option value="all">All ({regs.length})</option>
          <option value="kyc_submitted">KYC Review ({regs.filter(r => r.status === 'kyc_submitted').length})</option>
          <option value="pending">Pending Email ({regs.filter(r => r.status === 'pending').length})</option>
          <option value="approved">Approved ({regs.filter(r => r.status === 'approved').length})</option>
          <option value="rejected">Rejected ({regs.filter(r => r.status === 'rejected').length})</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className={`${glass} p-12 text-center`}>
          <Building2 className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No registrations found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const cfg = statusConfig[r.status] ?? statusConfig.pending;
            const Icon = cfg.icon;
            const addr = r.billing_address || {};
            return (
              <div key={r.id} className={`${glass} p-5`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-zinc-600">{r.reg_no}</span>
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                        <Icon className="h-3 w-3" /> {cfg.label}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white">{r.company_name}</h3>
                    <p className="text-xs text-zinc-400">{r.contact_person} · {r.email} {r.phone && `· ${r.phone}`}</p>
                  </div>
                  <span className="text-xs text-zinc-600 shrink-0">{fmtDate(r.created_at)}</span>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-zinc-500 mb-3">
                  {r.gstin && <span>GSTIN: <span className="font-mono text-zinc-400">{r.gstin}</span></span>}
                  {r.pan && <span>PAN: <span className="font-mono text-zinc-400">{r.pan}</span></span>}
                  {r.business_type && <span>Type: {r.business_type}</span>}
                  {r.industry && <span>Industry: {r.industry}</span>}
                  {addr.city && <span>{addr.city}, {addr.state}</span>}
                </div>

                {r.status === 'kyc_submitted' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => approve(r.id)}
                      disabled={acting === r.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {acting === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                      Approve & Create Customer
                    </button>
                    <button
                      onClick={() => reject(r.id)}
                      disabled={acting === r.id}
                      className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white hover:bg-red-500 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {r.status === 'approved' && r.customer_id && (
                  <p className="text-xs text-emerald-400 mt-1">
                    Approved by {r.approved_by} · Customer record created
                  </p>
                )}

                {r.status === 'rejected' && r.rejection_reason && (
                  <p className="text-xs text-red-400 mt-1">Reason: {r.rejection_reason}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
