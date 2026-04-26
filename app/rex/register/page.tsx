'use client';

import { useState } from 'react';
import Link from 'next/link';

type Status = 'idle' | 'loading' | 'success' | 'error';

const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-rose-400/60 focus:ring-1 focus:ring-rose-400/40';

const TITLES = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.', 'Engr.', 'Er.'];
const MEMBER_TYPES = [
  { value: 'student', label: 'Student' },
  { value: 'professional', label: 'Professional' },
  { value: 'academic', label: 'Academic' },
  { value: 'enthusiast', label: 'Enthusiast' },
];

export default function RexRegisterPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [rexId, setRexId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const fd = new FormData(e.currentTarget);
    const body = {
      title: fd.get('title'),
      full_name: fd.get('full_name'),
      date_of_birth: fd.get('date_of_birth'),
      email: fd.get('email'),
      linkedin_url: fd.get('linkedin_url'),
      cv_url: fd.get('cv_url') || undefined,
      member_type: fd.get('member_type'),
      interests: fd.get('interests') || undefined,
    };

    try {
      const res = await fetch('/api/rex/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        const firstErr =
          typeof data.error === 'string'
            ? data.error
            : Object.values(data.error as Record<string, string[]>)[0]?.[0] ?? 'Something went wrong.';
        setErrorMsg(firstErr);
        setStatus('error');
        return;
      }

      setRexId(data.rex_id);
      setStatus('success');
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg text-center">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-10">
            <p className="text-4xl font-black text-emerald-400 mb-1">Welcome!</p>
            <p className="text-zinc-400 text-sm mb-6">You are now a lifelong member of the Rotehügels Expert Network.</p>

            <div className="rounded-xl border-2 border-rose-500/40 bg-rose-500/10 p-6 mb-6">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Your REX ID</p>
              <p className="text-3xl font-black text-rose-400 tracking-widest font-mono">{rexId}</p>
              <p className="text-xs text-zinc-500 mt-2">Keep this safe — it is your lifelong membership identifier</p>
            </div>

            <p className="text-sm text-zinc-400 mb-6">
              A welcome email with your REX ID has been sent to your registered email address.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/rex"
                className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-5 py-2.5 text-sm font-semibold text-zinc-200 hover:border-zinc-600"
              >
                Back to REX
              </Link>
              <Link
                href="/"
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-500"
              >
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
      {/* Back link */}
      <Link href="/rex" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
        ← Back to REX Network
      </Link>

      <h1 className="mt-4 text-3xl font-bold text-white">Join REX</h1>
      <p className="mt-2 text-zinc-400 text-sm">
        Register as a lifelong member of the Rotehügels Expert Network. Free, instant, and no obligation.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        {/* Title + Full name */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              Title <span className="text-rose-400">*</span>
            </label>
            <select name="title" required defaultValue="" className={`${inputCls} cursor-pointer`}>
              <option value="" disabled className="bg-zinc-900">Select…</option>
              {TITLES.map((t) => (
                <option key={t} value={t} className="bg-zinc-900">{t}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              Full name <span className="text-rose-400">*</span>
            </label>
            <input name="full_name" required placeholder="As per official ID" className={inputCls} />
          </div>
        </div>

        {/* DOB + Email */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              Date of birth <span className="text-rose-400">*</span>
            </label>
            <input
              name="date_of_birth"
              type="date"
              required
              max={new Date().toISOString().split('T')[0]}
              className={`${inputCls} [color-scheme:dark]`}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              Email address <span className="text-rose-400">*</span>
            </label>
            <input name="email" type="email" required placeholder="your@email.com" className={inputCls} />
          </div>
        </div>

        {/* Member type */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            I am a… <span className="text-rose-400">*</span>
          </label>
          <select name="member_type" required defaultValue="" className={`${inputCls} cursor-pointer`}>
            <option value="" disabled className="bg-zinc-900">Select member type…</option>
            {MEMBER_TYPES.map((m) => (
              <option key={m.value} value={m.value} className="bg-zinc-900">{m.label}</option>
            ))}
          </select>
        </div>

        {/* LinkedIn */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            LinkedIn profile URL <span className="text-rose-400">*</span>
          </label>
          <input
            name="linkedin_url"
            type="url"
            required
            placeholder="https://linkedin.com/in/yourprofile"
            className={inputCls}
          />
        </div>

        {/* CV URL (optional) */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            CV / Portfolio URL <span className="text-zinc-600">(optional)</span>
          </label>
          <input
            name="cv_url"
            type="url"
            placeholder="Link to your CV on Google Drive, Dropbox, etc."
            className={inputCls}
          />
          <p className="mt-1 text-xs text-zinc-600">Upload your CV to Google Drive or Dropbox and paste the link here.</p>
        </div>

        {/* Interests */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Areas of interest <span className="text-zinc-600">(optional)</span>
          </label>
          <textarea
            name="interests"
            rows={3}
            maxLength={500}
            placeholder="e.g. Battery recycling, hydrometallurgy, plant automation, sustainability…"
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Disclaimer */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 text-xs text-zinc-500 space-y-1">
          <p>By registering, you acknowledge that:</p>
          <p>• REX membership is voluntary and does not guarantee any assignment or compensation.</p>
          <p>• You may be contacted by Rotehügels based on your profile and project requirements.</p>
          <p>• Duplicate registrations are not allowed — one registration per email address.</p>
          <p>• Your data will be stored securely and not shared with third parties without consent.</p>
        </div>

        {/* Terms checkbox */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" required className="mt-0.5 h-4 w-4 rounded accent-rose-500" />
          <span className="text-sm text-zinc-400">
            I have read and agree to the above terms. I confirm this is my first registration with REX.
          </span>
        </label>

        {errorMsg && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === 'loading' ? 'Registering…' : 'Register & get my REX ID'}
        </button>
      </form>
    </main>
  );
}
