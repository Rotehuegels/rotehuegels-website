'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewTicket() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [loading, setLoading] = useState(false);
  const r = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, body, priority }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(()=>({}));
      alert(data?.error ? JSON.stringify(data.error) : 'Something went wrong');
      return;
    }
    r.push('/tickets');
  }

  return (
    <main className="min-h-screen grid place-items-center p-6 bg-gray-900 text-white">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 border border-gray-700 p-6 rounded-xl bg-black">
        <h1 className="text-xl font-semibold">New Support Ticket</h1>
        <input
          className="w-full border border-gray-600 p-2 rounded bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Subject"
          value={subject}
          onChange={e => setSubject(e.target.value)}
        />
        <textarea
          className="w-full min-h-40 border border-gray-600 p-2 rounded bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe your issue"
          value={body}
          onChange={e => setBody(e.target.value)}
        />
        <select
          className="w-full border border-gray-600 p-2 rounded bg-gray-900 text-white"
          value={priority}
          onChange={e => setPriority(e.target.value)}
        >
          <option value="LOW">Low</option>
          <option value="NORMAL">Normal</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
        <button disabled={loading} className="w-full p-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-70">
          {loading ? 'Submitting…' : 'Submit Ticket'}
        </button>
      </form>
    </main>
  );
}
