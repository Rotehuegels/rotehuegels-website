'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

const inputCls = 'w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-colors';

interface Customer { id: string; name: string; customer_id: string }

export default function NewProjectPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    customer_id: '',
    name: '',
    description: '',
    start_date: '',
    target_end_date: '',
    site_location: '',
    project_manager: '',
  });

  useEffect(() => {
    fetch('/api/accounts/customers')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCustomers(d); });
  }, []);

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_id || !form.name) {
      setError('Customer and project name are required.');
      return;
    }
    setSaving(true);
    setError('');

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Something went wrong.');
      setSaving(false);
      return;
    }

    const project = await res.json();
    router.push(`/dashboard/projects/${project.id}`);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href="/dashboard/projects" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </Link>

      <h1 className="text-xl font-bold text-white mb-6">Create New Project</h1>

      <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Customer *</label>
          <select value={form.customer_id} onChange={e => set('customer_id', e.target.value)} className={inputCls}>
            <option value="">Select customer…</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.customer_id})</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Project Name *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g., Zinc Dross Recovery Plant" className={inputCls} />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Start Date</label>
            <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Target End Date</label>
            <input type="date" value={form.target_end_date} onChange={e => set('target_end_date', e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Site Location</label>
            <input value={form.site_location} onChange={e => set('site_location', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Project Manager</label>
            <input value={form.project_manager} onChange={e => set('project_manager', e.target.value)} className={inputCls} />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Creating…' : 'Create Project'}
        </button>
      </form>
    </div>
  );
}
