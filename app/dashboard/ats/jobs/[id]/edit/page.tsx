'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const input = 'w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600';

export default function EditJobPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', department: '', employment_type: 'full_time',
    description: '', status: 'draft',
  });

  useEffect(() => {
    fetch(`/api/ats/jobs/${id}`).then(r => r.json()).then(d => {
      if (d.data) setForm(d.data);
      setLoading(false);
    });
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/ats/jobs/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    if (res.ok) router.push(`/d/jobs/${id}`);
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading...</div>;

  return (
    <div className="p-5 md:p-8 max-w-2xl space-y-6">
      <Link href={`/d/jobs/${id}`} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
        <ArrowLeft className="h-3 w-3" /> Back to Job
      </Link>
      <h1 className="text-2xl font-bold text-white">Edit Job Posting</h1>

      <div className={`${glass} p-6 space-y-4`}>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Job Title</label>
          <input className={input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Department</label>
            <input className={input} value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Employment Type</label>
            <select className={input} value={form.employment_type} onChange={e => setForm(f => ({ ...f, employment_type: e.target.value }))}>
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="intern">Intern</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Status</label>
          <select className={input} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Description</label>
          <textarea className={`${input} resize-none`} rows={8} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save Changes
      </button>
    </div>
  );
}
