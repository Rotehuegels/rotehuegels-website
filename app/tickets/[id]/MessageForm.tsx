'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function MessageForm({ ticketId }: { ticketId: string }) {
  const [body, setBody] = useState('');
  const [isPending, startTransition] = useTransition();
  const r = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    const res = await fetch(`/api/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data?.error ?? 'Failed to send message');
      return;
    }
    setBody('');
    // Re-fetch server component data
    startTransition(() => r.refresh());
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 border border-gray-700 p-4 rounded bg-black">
      <h3 className="font-medium">Add a reply</h3>
      <textarea
        className="w-full min-h-32 border border-gray-600 p-2 rounded bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Write your message…"
        value={body}
        onChange={e => setBody(e.target.value)}
      />
      <button
        disabled={isPending || !body.trim()}
        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-70"
      >
        {isPending ? 'Sending…' : 'Send'}
      </button>
    </form>
  );
}