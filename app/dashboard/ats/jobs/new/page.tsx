'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const inputCls = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-rose-400/60 focus:ring-1 focus:ring-rose-400/30';
const labelCls = 'block text-xs font-medium text-zinc-400 mb-1.5';

export default function NewJobPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {};
    fd.forEach((v, k) => { if (v !== '') body[k] = v; });

    const res = await fetch('/api/ats/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) {
      const firstErr = typeof data.error === 'string' ? data.error
        : Object.values(data.error as Record<string, string[]>)[0]?.[0] ?? 'Something went wrong.';
      setErrorMsg(firstErr);
      setStatus('error');
      return;
    }

    router.push(`/d/jobs/${data.id}`);
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <Link href="/d/jobs" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          ← Back to Jobs
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-white">New Job Posting</h1>
        <p className="mt-1 text-sm text-zinc-400">Draft first, then publish when ready.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className={labelCls}>Job title <span className="text-rose-400">*</span></label>
            <input name="title" required className={inputCls} placeholder="e.g. Process Engineer — Hydrometallurgy" />
          </div>

          <div>
            <label className={labelCls}>Department</label>
            <input name="department" className={inputCls} placeholder="e.g. Engineering" />
          </div>

          <div>
            <label className={labelCls}>Location</label>
            <input name="location" className={inputCls} defaultValue="Chennai, India" />
          </div>

          <div>
            <label className={labelCls}>Employment type <span className="text-rose-400">*</span></label>
            <select name="employment_type" required defaultValue="" className={`${inputCls} cursor-pointer`}>
              <option value="" disabled>Select…</option>
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="consultant">Consultant</option>
              <option value="contract">Contract</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Publish status</label>
            <select name="status" defaultValue="draft" className={`${inputCls} cursor-pointer`}>
              <option value="draft">Save as Draft</option>
              <option value="published">Publish immediately</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className={labelCls}>Job description <span className="text-rose-400">*</span></label>
            <textarea name="description" required rows={8} className={`${inputCls} resize-none`}
              placeholder="Describe the role, responsibilities, and what the candidate will own..." />
          </div>

          <div className="md:col-span-2">
            <label className={labelCls}>Requirements</label>
            <textarea name="requirements" rows={5} className={`${inputCls} resize-none`}
              placeholder="Required qualifications, experience, and skills..." />
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{errorMsg}</div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={status === 'loading'}
            className="rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {status === 'loading' ? 'Creating…' : 'Create Job'}
          </button>
          <Link href="/d/jobs"
            className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-6 py-2.5 text-sm font-semibold text-zinc-300 hover:border-zinc-600 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
