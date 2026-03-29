'use client';

import { useState } from 'react';

type Status = 'idle' | 'loading' | 'success' | 'error';

const INQUIRY_OPTIONS = [
  { value: 'general', label: 'General Enquiry' },
  { value: 'sales', label: 'RFP / Sales' },
  { value: 'investor', label: 'Investor Relations' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'careers', label: 'Careers' },
];

const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition focus:border-rose-400/60 focus:ring-1 focus:ring-rose-400/40';

export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get('name'),
      company: fd.get('company') || undefined,
      email: fd.get('email'),
      phone: fd.get('phone') || undefined,
      inquiry: fd.get('inquiry'),
      message: fd.get('message'),
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        const firstErr =
          typeof data.error === 'string'
            ? data.error
            : Object.values(data.error as Record<string, string[]>)[0]?.[0] ?? 'Something went wrong.';
        setErrorMsg(firstErr);
        setStatus('error');
        return;
      }

      setStatus('success');
      (e.target as HTMLFormElement).reset();
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
        <p className="text-2xl font-semibold text-emerald-400">Message sent</p>
        <p className="mt-2 text-sm text-white/70">
          We&apos;ll get back to you within one business day. Check your inbox for a confirmation.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-4 text-sm text-white/50 underline underline-offset-4 hover:text-white/80"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Name + Company */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-white/60">
            Full name <span className="text-rose-400">*</span>
          </label>
          <input name="name" required placeholder="Your name" className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-white/60">Company</label>
          <input name="company" placeholder="Company (optional)" className={inputCls} />
        </div>
      </div>

      {/* Email + Phone */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-white/60">
            Email <span className="text-rose-400">*</span>
          </label>
          <input
            name="email"
            type="email"
            required
            placeholder="you@company.com"
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-white/60">Phone</label>
          <input name="phone" type="tel" placeholder="+1 234 567 8900 (optional)" className={inputCls} />
        </div>
      </div>

      {/* Inquiry type */}
      <div>
        <label className="mb-1 block text-xs font-medium text-white/60">
          Inquiry type <span className="text-rose-400">*</span>
        </label>
        <select
          name="inquiry"
          required
          defaultValue=""
          className={`${inputCls} cursor-pointer`}
        >
          <option value="" disabled>
            Select inquiry type…
          </option>
          {INQUIRY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-zinc-900 text-white">
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div>
        <label className="mb-1 block text-xs font-medium text-white/60">
          Message <span className="text-rose-400">*</span>
        </label>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="Describe your project, requirement, or question…"
          className={`${inputCls} resize-none`}
        />
      </div>

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
        {status === 'loading' ? 'Sending…' : 'Send message'}
      </button>

      <p className="text-center text-xs text-white/40">
        We respond within one business day. Your data is kept confidential.
      </p>
    </form>
  );
}
