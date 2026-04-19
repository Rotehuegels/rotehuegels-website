'use client';

import { useEffect, useState } from 'react';
import {
  CalendarDays, CheckCircle2, XCircle, Clock, Plus, Loader2,
  Filter, Users,
} from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const inputCls = 'w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-colors';

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  pending:   { icon: Clock,        color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  approved:  { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  rejected:  { icon: XCircle,      color: 'text-red-400',     bg: 'bg-red-500/10' },
  cancelled: { icon: XCircle,      color: 'text-zinc-500',    bg: 'bg-zinc-500/10' },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

export default function LeaveManagementPage() {
  const [tab, setTab] = useState<'applications' | 'balances' | 'apply'>('applications');
  const [applications, setApplications] = useState<AnyObj[]>([]);
  const [balances, setBalances] = useState<AnyObj[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<AnyObj[]>([]);
  const [employees, setEmployees] = useState<AnyObj[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Apply form
  const [form, setForm] = useState({ employee_id: '', leave_type_id: '', from_date: '', to_date: '', days: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/leave/applications').then(r => r.json()),
      fetch('/api/leave/balances').then(r => r.json()),
      fetch('/api/leave/types').then(r => r.json()),
      fetch('/api/employees').then(r => r.json()),
    ]).then(([apps, bals, types, emps]) => {
      if (Array.isArray(apps)) setApplications(apps);
      if (Array.isArray(bals)) setBalances(bals);
      if (Array.isArray(types)) setLeaveTypes(types);
      if (Array.isArray(emps)) setEmployees(emps.filter((e: AnyObj) => e.status === 'active'));
      setLoading(false);
    });
  }, []);

  const reload = async () => {
    const [apps, bals] = await Promise.all([
      fetch('/api/leave/applications').then(r => r.json()),
      fetch('/api/leave/balances').then(r => r.json()),
    ]);
    if (Array.isArray(apps)) setApplications(apps);
    if (Array.isArray(bals)) setBalances(bals);
  };

  const approve = async (id: string) => {
    await fetch(`/api/leave/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved', approved_by: 'Sivakumar Shanmugam' }),
    });
    reload();
  };

  const reject = async (id: string) => {
    await fetch(`/api/leave/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected', rejection_reason: 'Declined by admin' }),
    });
    reload();
  };

  const applyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employee_id || !form.leave_type_id || !form.from_date || !form.to_date || !form.days) {
      setMsg('All fields except reason are required.');
      return;
    }
    setSubmitting(true); setMsg('');
    const res = await fetch('/api/leave/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, days: parseFloat(form.days) }),
    });
    setSubmitting(false);
    if (res.ok) {
      setMsg('Leave application submitted.');
      setForm({ employee_id: '', leave_type_id: '', from_date: '', to_date: '', days: '', reason: '' });
      setTab('applications');
      reload();
    } else {
      const d = await res.json();
      setMsg(`Error: ${d.error}`);
    }
  };

  // Auto-calculate days when dates change
  const onDateChange = (field: 'from_date' | 'to_date', value: string) => {
    const updated = { ...form, [field]: value };
    if (updated.from_date && updated.to_date) {
      const from = new Date(updated.from_date);
      const to = new Date(updated.to_date);
      if (to >= from) {
        const diff = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        updated.days = String(diff);
      }
    }
    setForm(updated);
  };

  const filteredApps = statusFilter === 'all'
    ? applications
    : applications.filter(a => a.status === statusFilter);

  // Group balances by employee
  const balancesByEmployee = balances.reduce<Record<string, AnyObj[]>>((acc, b) => {
    const key = b.employee_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>;

  return (
    <div className="p-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-rose-400" />
          <h1 className="text-xl font-bold text-white">Leave Management</h1>
        </div>
        <button
          onClick={() => setTab('apply')}
          className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 transition-colors"
        >
          <Plus className="h-4 w-4" /> Apply Leave
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800 mb-6">
        {(['applications', 'balances', 'apply'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t ? 'text-rose-400 border-b-2 border-rose-400' : 'text-zinc-500 hover:text-white'
            }`}
          >
            {t === 'applications' ? 'Applications' : t === 'balances' ? 'Balances' : 'Apply Leave'}
            {t === 'applications' && applications.filter(a => a.status === 'pending').length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-400">
                {applications.filter(a => a.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Applications Tab */}
      {tab === 'applications' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-zinc-500" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs text-white">
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {filteredApps.length === 0 ? (
            <div className={`${glass} p-12 text-center`}>
              <p className="text-zinc-500 text-sm">No leave applications found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApps.map(a => {
                const cfg = statusConfig[a.status] ?? statusConfig.pending;
                const Icon = cfg.icon;
                return (
                  <div key={a.id} className={`${glass} p-4`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white">{a.employees?.full_name}</span>
                          <span className="text-xs text-zinc-600">({a.employees?.engagement_id})</span>
                          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color} ${cfg.bg}`}>
                            <Icon className="h-3 w-3" /> {a.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-zinc-400">
                          <span className="font-medium text-rose-400">{a.leave_types?.name} ({a.leave_types?.short_code})</span>
                          <span>{fmtDate(a.from_date)} — {fmtDate(a.to_date)}</span>
                          <span>{a.days} day{a.days !== 1 ? 's' : ''}</span>
                        </div>
                        {a.reason && <p className="text-xs text-zinc-500 mt-1">{a.reason}</p>}
                      </div>
                      {a.status === 'pending' && (
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => approve(a.id)} className="px-3 py-1 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-500">Approve</button>
                          <button onClick={() => reject(a.id)} className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-500">Reject</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Balances Tab */}
      {tab === 'balances' && (
        <div className="space-y-4">
          {Object.entries(balancesByEmployee).length === 0 ? (
            <div className={`${glass} p-12 text-center`}>
              <p className="text-zinc-500 text-sm">No leave balances found. Run the migration first.</p>
            </div>
          ) : (
            Object.entries(balancesByEmployee).map(([empId, bals]) => {
              const emp = bals[0]?.employees;
              return (
                <div key={empId} className={`${glass} p-4`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm font-medium text-white">{emp?.full_name}</span>
                    <span className="text-xs text-zinc-600">({emp?.engagement_id})</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {bals.map(b => (
                      <div key={b.id} className="rounded-lg bg-zinc-800/60 px-3 py-2">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-medium text-zinc-400">{b.leave_types?.short_code}</span>
                          <span className={`text-sm font-bold ${b.balance > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                            {b.balance}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-600">
                          {b.credited} credited · {b.used} used
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Apply Tab */}
      {tab === 'apply' && (
        <form onSubmit={applyLeave} className={`${glass} p-6 space-y-4 max-w-2xl`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Employee *</label>
              <select value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))} className={inputCls}>
                <option value="">Select…</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.engagement_id})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Leave Type *</label>
              <select value={form.leave_type_id} onChange={e => setForm(f => ({ ...f, leave_type_id: e.target.value }))} className={inputCls}>
                <option value="">Select…</option>
                {leaveTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.name} ({lt.short_code})</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">From Date *</label>
              <input type="date" value={form.from_date} onChange={e => onDateChange('from_date', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">To Date *</label>
              <input type="date" value={form.to_date} onChange={e => onDateChange('to_date', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Days *</label>
              <input type="number" step="0.5" min="0.5" value={form.days} onChange={e => setForm(f => ({ ...f, days: e.target.value }))} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Reason</label>
            <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={2} className={inputCls} />
          </div>

          {msg && <p className="text-xs text-zinc-400">{msg}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-50 transition-colors"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
            {submitting ? 'Submitting…' : 'Submit Leave Application'}
          </button>
        </form>
      )}
    </div>
  );
}
