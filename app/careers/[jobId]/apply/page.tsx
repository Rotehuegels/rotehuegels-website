'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { CheckCircle, Network } from 'lucide-react';

const inputCls = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-rose-400/60 focus:ring-1 focus:ring-rose-400/30';

export default function ApplyPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isRex, setIsRex] = useState(false);
  const [rexId, setRexId] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = { job_id: jobId };
    fd.forEach((v, k) => { if (v !== '') body[k] = v; });

    const res = await fetch('/api/ats/apply', {
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

    setIsRex(data.is_rex_member);
    setRexId(data.rex_id ?? '');
    setStatus('success');
  }

  if (status === 'success') {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg text-center">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-10">
            <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white">Application submitted!</h1>
            <p className="mt-2 text-zinc-400 text-sm">
              Thank you for applying. Our team will review your application and reach out if there&apos;s a fit.
            </p>

            {isRex && rexId && (
              <div className="mt-6 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 flex items-center gap-3">
                <Network className="h-5 w-5 text-rose-400 shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-semibold text-rose-400">REX Member detected</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Your REX profile (<span className="font-mono">{rexId}</span>) has been linked to your application.</p>
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/careers" className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-5 py-2.5 text-sm font-semibold text-zinc-200 hover:border-zinc-600 transition-colors">
                Back to Careers
              </Link>
              <Link href="/" className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 transition-colors">
                Go to homepage
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/careers" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
        ← Back to Careers
      </Link>

      <h1 className="mt-4 text-3xl font-bold text-white">Apply for this role</h1>
      <p className="mt-2 text-zinc-400 text-sm">
        Fill in your details below. If you&apos;re a REX member, your profile will be automatically linked.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {/* Hidden job title — filled by page, but we need it */}
        <input type="hidden" name="job_title" value="Position" />

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Full name <span className="text-rose-400">*</span></label>
            <input name="full_name" required className={inputCls} placeholder="As per official ID" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email <span className="text-rose-400">*</span></label>
            <input name="email" type="email" required className={inputCls} placeholder="your@email.com" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Phone</label>
          <input name="phone" type="tel" className={inputCls} placeholder="+91 00000 00000" />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">LinkedIn profile URL</label>
          <input name="linkedin_url" type="url" className={inputCls} placeholder="https://linkedin.com/in/yourprofile" />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">CV / Portfolio URL</label>
          <input name="cv_url" type="url" className={inputCls} placeholder="Google Drive / Dropbox link to your CV" />
          <p className="mt-1 text-xs text-zinc-600">Upload your CV to Google Drive or Dropbox and paste the link here.</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Cover letter <span className="text-zinc-600">(optional)</span></label>
          <textarea name="cover_letter" rows={5} maxLength={2000} className={`${inputCls} resize-none`}
            placeholder="Tell us why you're a great fit and what outcomes you'll own in your first 90 days…" />
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 text-xs text-zinc-500 space-y-1">
          <p>• Your application will be reviewed by the Rotehügels team.</p>
          <p>• If you are a REX member, your profile will be automatically linked.</p>
          <p>• Your data is stored securely and used only for recruitment purposes.</p>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{errorMsg}</div>
        )}

        <button type="submit" disabled={status === 'loading'}
          className="w-full rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {status === 'loading' ? 'Submitting…' : 'Submit Application'}
        </button>
      </form>
    </main>
  );
}
