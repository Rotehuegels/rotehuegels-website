'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, Save, Plus, ExternalLink,
  CheckCircle2, Clock, AlertCircle, UserPlus,
} from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const inputCls = 'w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-colors';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const milestoneStatusIcon: Record<string, React.ElementType> = {
  completed: CheckCircle2, in_progress: Clock, pending: AlertCircle,
};

const statusColors: Record<string, string> = {
  requested: 'text-amber-400', under_review: 'text-blue-400', approved: 'text-emerald-400',
  rejected: 'text-red-400', implemented: 'text-cyan-400',
};

export default function AdminProjectDetailPage() {
  const { id } = useParams();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'overview' | 'milestones' | 'changes' | 'clients'>('overview');

  // Client creation form
  const [clientEmail, setClientEmail] = useState('');
  const [clientPass, setClientPass] = useState('');
  const [clientName, setClientName] = useState('');
  const [creatingClient, setCreatingClient] = useState(false);
  const [clientMsg, setClientMsg] = useState('');

  const load = () => {
    fetch(`/api/projects/${id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  };

  useEffect(() => { load(); }, [id]);

  const updateProject = async (updates: Record<string, unknown>) => {
    setSaving(true);
    await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    load();
    setSaving(false);
  };

  const updateMilestone = async (milestoneId: string, updates: Record<string, unknown>) => {
    await fetch(`/api/projects/${id}/milestones/${milestoneId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    load();
  };

  const reviewChange = async (changeId: string, status: string, notes: string) => {
    await fetch(`/api/projects/${id}/changes/${changeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, admin_notes: notes, reviewed_by: 'Sivakumar Shanmugam' }),
    });
    load();
  };

  const createClient = async () => {
    if (!clientEmail || !clientPass) return;
    setCreatingClient(true);
    setClientMsg('');
    const res = await fetch(`/api/projects/${id}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: clientEmail, password: clientPass, display_name: clientName }),
    });
    const d = await res.json();
    setCreatingClient(false);
    if (res.ok) {
      setClientMsg(`Client account created: ${d.email}`);
      setClientEmail(''); setClientPass(''); setClientName('');
      load();
    } else {
      setClientMsg(`Error: ${d.error}`);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>;
  if (!data?.project) return <div className="p-6 text-zinc-500">Project not found.</div>;

  const { project, milestones, linkedOrders, changeRequests, clientUsers } = data;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Link href="/d/projects" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> All Projects
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-zinc-600">{project.project_code}</span>
          <h1 className="text-xl font-bold text-white">{project.name}</h1>
          <p className="text-sm text-zinc-500">
            {project.customers?.name} • {project.site_location || 'No location'} • {project.completion_pct}%
          </p>
        </div>
        <a
          href={`/portal/${project.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300"
        >
          <ExternalLink className="h-3.5 w-3.5" /> View Portal
        </a>
      </div>

      {/* Quick update */}
      <div className={`${glass} p-4 flex flex-wrap items-center gap-4`}>
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500">Status:</label>
          <select
            value={project.status}
            onChange={e => updateProject({ status: e.target.value })}
            className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-2 py-1 text-xs text-white"
          >
            {['planning', 'active', 'on_hold', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500">Completion:</label>
          <input
            type="number"
            min={0} max={100}
            defaultValue={project.completion_pct}
            onBlur={e => updateProject({ completion_pct: parseInt(e.target.value) })}
            className="w-16 rounded-lg border border-zinc-700 bg-zinc-800/60 px-2 py-1 text-xs text-white"
          />
          <span className="text-xs text-zinc-500">%</span>
        </div>
        {saving && <Loader2 className="h-4 w-4 animate-spin text-rose-400" />}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800">
        {(['overview', 'milestones', 'changes', 'clients'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t ? 'text-rose-400 border-b-2 border-rose-400' : 'text-zinc-500 hover:text-white'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'changes' && changeRequests.filter((c: { status: string }) => c.status === 'requested').length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-400">
                {changeRequests.filter((c: { status: string }) => c.status === 'requested').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className={`${glass} p-5`}>
            <h2 className="text-sm font-semibold text-white mb-3">Linked Orders ({linkedOrders.length})</h2>
            {linkedOrders.length === 0 ? (
              <p className="text-sm text-zinc-500">No orders linked yet.</p>
            ) : (
              <div className="space-y-2">
                {linkedOrders.map((lo: { order_id: string; orders: { order_no: string; description: string; total_value_incl_gst: number; status: string } }) => (
                  <Link
                    key={lo.order_id}
                    href={`/d/orders/${lo.order_id}`}
                    className="flex items-center justify-between rounded-xl bg-zinc-800/40 px-4 py-2.5 hover:bg-zinc-800/60 transition-colors"
                  >
                    <div>
                      <span className="text-sm text-white font-medium">{lo.orders.order_no}</span>
                      <span className="text-xs text-zinc-500 ml-2">{lo.orders.description?.slice(0, 60)}</span>
                    </div>
                    <span className="text-sm text-zinc-400">{fmt(lo.orders.total_value_incl_gst ?? 0)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Milestones tab */}
      {tab === 'milestones' && (
        <div className="space-y-3">
          {milestones.map((m: { id: string; milestone_no: number; title: string; status: string; completion_pct: number; target_date: string }) => {
            const Icon = milestoneStatusIcon[m.status] ?? AlertCircle;
            return (
              <div key={m.id} className={`${glass} p-4 flex items-center gap-4`}>
                <Icon className={`h-5 w-5 shrink-0 ${m.status === 'completed' ? 'text-emerald-400' : m.status === 'in_progress' ? 'text-blue-400' : 'text-zinc-500'}`} />
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">#{m.milestone_no} {m.title}</p>
                  <p className="text-xs text-zinc-500">Target: {fmtDate(m.target_date)}</p>
                </div>
                <select
                  value={m.status}
                  onChange={e => updateMilestone(m.id, { status: e.target.value, completion_pct: e.target.value === 'completed' ? 100 : m.completion_pct, completed_date: e.target.value === 'completed' ? new Date().toISOString().split('T')[0] : null })}
                  className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-white"
                >
                  {['pending', 'in_progress', 'completed', 'skipped'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            );
          })}
        </div>
      )}

      {/* Changes tab */}
      {tab === 'changes' && (
        <div className="space-y-3">
          {changeRequests.length === 0 ? (
            <p className="text-sm text-zinc-500">No change requests.</p>
          ) : changeRequests.map((cr: { id: string; change_no: string; title: string; description: string; status: string; cost_impact: number; created_at: string }) => (
            <div key={cr.id} className={`${glass} p-4`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-mono text-zinc-600">{cr.change_no}</span>
                  <span className={`ml-2 text-xs font-medium ${statusColors[cr.status] ?? 'text-zinc-400'}`}>{cr.status}</span>
                </div>
                <span className="text-xs text-zinc-600">{fmtDate(cr.created_at)}</span>
              </div>
              <p className="text-sm text-white font-medium">{cr.title}</p>
              <p className="text-xs text-zinc-400 mt-1">{cr.description}</p>
              {cr.status === 'requested' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => reviewChange(cr.id, 'approved', 'Approved — will be included in scope.')} className="px-3 py-1 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-500">Approve</button>
                  <button onClick={() => reviewChange(cr.id, 'rejected', 'Cannot accommodate this change.')} className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-500">Reject</button>
                  <button onClick={() => reviewChange(cr.id, 'under_review', 'Reviewing impact on scope and timeline.')} className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-500">Under Review</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Clients tab */}
      {tab === 'clients' && (
        <div className="space-y-4">
          <div className={`${glass} p-5`}>
            <h2 className="text-sm font-semibold text-white mb-3">Client Portal Users ({clientUsers.length})</h2>
            {clientUsers.length > 0 && (
              <div className="space-y-2 mb-4">
                {clientUsers.map((c: { id: string; display_name: string | null }) => (
                  <div key={c.id} className="flex items-center gap-2 rounded-xl bg-zinc-800/40 px-4 py-2">
                    <span className="text-sm text-white">{c.display_name || 'Unnamed'}</span>
                  </div>
                ))}
              </div>
            )}

            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <UserPlus className="h-3.5 w-3.5" /> Create Client Account
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Display name" className={inputCls} />
              <input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="Email *" className={inputCls} />
              <input value={clientPass} onChange={e => setClientPass(e.target.value)} placeholder="Password *" type="password" className={inputCls} />
            </div>
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={createClient}
                disabled={creatingClient}
                className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-500 disabled:opacity-50"
              >
                {creatingClient ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create Account
              </button>
              {clientMsg && <span className="text-xs text-zinc-400">{clientMsg}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
