'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

function ComposeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [to, setTo]           = useState(searchParams.get('to') || '');
  const [cc, setCc]           = useState('');
  const [subject, setSubject] = useState(searchParams.get('subject') || '');
  const [body, setBody]       = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState('');

  const replyToId = searchParams.get('replyTo') || '';

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!to.trim()) { setError('Recipient is required'); return; }
    if (!subject.trim() && !replyToId) { setError('Subject is required'); return; }

    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: to.trim(),
          cc: cc.trim() || undefined,
          subject: subject.trim(),
          body: body.replace(/\n/g, '<br />'),
          replyToId: replyToId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send');
      }

      router.push('/dashboard/mail');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send email');
    } finally {
      setSending(false);
    }
  }

  const inputClass =
    'w-full bg-transparent text-sm text-white placeholder-zinc-600 outline-none px-4 py-3 border-b border-zinc-800/60 focus:border-zinc-700 transition-colors';

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/mail"
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to inbox
        </Link>
      </div>

      <div className={`${glass} overflow-hidden`}>
        <div className="px-6 py-4 border-b border-zinc-800/60">
          <h1 className="text-lg font-bold text-white">
            {replyToId ? 'Reply' : 'New Message'}
          </h1>
        </div>

        <form onSubmit={handleSend}>
          <input
            type="text"
            value={to}
            onChange={e => setTo(e.target.value)}
            placeholder="To (comma-separated)"
            className={inputClass}
          />
          <input
            type="text"
            value={cc}
            onChange={e => setCc(e.target.value)}
            placeholder="CC (optional)"
            className={inputClass}
          />
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Subject"
            className={inputClass}
          />
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Write your message..."
            rows={16}
            className="w-full bg-transparent text-sm text-white placeholder-zinc-600 outline-none px-4 py-4 resize-none"
          />

          {error && (
            <div className="px-4 pb-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-zinc-800/60">
            <Link
              href="/dashboard/mail"
              className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-600 transition-colors"
            >
              Discard
            </Link>
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ComposePage() {
  return (
    <Suspense fallback={
      <div className="p-8">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500 mx-auto" />
        </div>
      </div>
    }>
      <ComposeForm />
    </Suspense>
  );
}
