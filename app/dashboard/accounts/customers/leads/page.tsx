'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users, Plus, Loader2, ArrowLeft, Phone, Mail, Calendar,
} from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const inputCls = 'w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-rose-500 outline-none';

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const statusColor: Record<string, string> = {
  new:           'bg-blue-500/10 text-blue-400',
  contacted:     'bg-zinc-500/10 text-zinc-400',
  interested:    'bg-amber-500/10 text-amber-400',
  proposal_sent: 'bg-violet-500/10 text-violet-400',
  negotiating:   'bg-rose-500/10 text-rose-400',
  converted:     'bg-emerald-500/10 text-emerald-400',
  lost:          'bg-red-500/10 text-red-400',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Lead = Record<string, any>;

export default function CustomerLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch('/api/customer-leads').then(r => r.json()).then(d => { if (Array.isArray(d)) setLeads(d); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const addLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    await fetch('/api/customer-leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: fd.get('company_name'),
        contact_person: fd.get('contact_person'),
        email: fd.get('email'),
        phone: fd.get('phone'),
        industry: fd.get('industry'),
        source: fd.get('source'),
        notes: fd.get('notes'),
      }),
    });
    setSaving(false);
    setShowForm(false);
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/customer-leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>;

  return (
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto">
      <Link href="/d/customers" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white mb-4">
        <ArrowLeft className="h-4 w-4" /> Customers
      </Link>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-rose-400" />
          <h1 className="text-xl font-bold text-white">Customer Leads</h1>
          <span className="text-xs text-zinc-500 bg-zinc-800 rounded-full px-2 py-0.5">{leads.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs text-white">
            <option value="all">All</option>
            {Object.keys(statusColor).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs text-white hover:bg-rose-500">
            <Plus className="h-3.5 w-3.5" /> Add Lead
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={addLead} className={`${glass} p-5 mb-6`}>
          <h2 className="text-sm font-semibold text-white mb-3">New Lead</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <input name="company_name" required placeholder="Company name *" className={inputCls} />
            <input name="contact_person" placeholder="Contact person" className={inputCls} />
            <input name="email" type="email" placeholder="Email" className={inputCls} />
            <input name="phone" placeholder="Phone" className={inputCls} />
            <input name="industry" placeholder="Industry" className={inputCls} />
            <select name="source" className={inputCls}>
              <option value="inquiry">Inquiry</option>
              <option value="referral">Referral</option>
              <option value="market_intel">Market Intelligence</option>
              <option value="event">Event</option>
              <option value="cold_call">Cold Call</option>
            </select>
          </div>
          <input name="notes" placeholder="Notes…" className={`${inputCls} mb-3`} />
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-500 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save Lead
          </button>
        </form>
      )}

      {filtered.length === 0 ? (
        <div className={`${glass} p-12 text-center`}>
          <Users className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No leads found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(l => (
            <div key={l.id} className={`${glass} p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-zinc-600">{l.lead_code}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[l.status] ?? ''}`}>
                      {l.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">{l.company_name}</h3>
                  <div className="flex flex-wrap gap-3 text-xs text-zinc-500 mt-1">
                    {l.contact_person && <span>{l.contact_person}</span>}
                    {l.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{l.email}</span>}
                    {l.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{l.phone}</span>}
                    {l.industry && <span>{l.industry}</span>}
                    {l.next_follow_up && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Follow-up: {fmtDate(l.next_follow_up)}</span>}
                  </div>
                  {l.notes && <p className="text-xs text-zinc-500 mt-1">{l.notes}</p>}
                </div>
                <select
                  value={l.status}
                  onChange={e => updateStatus(l.id, e.target.value)}
                  className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-white shrink-0"
                >
                  {Object.keys(statusColor).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
