'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewRequest() {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const r = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, details }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(()=>({}));
      alert(data?.error ? JSON.stringify(data.error) : 'Something went wrong');
      return;
    }
    r.push('/requests');
  }

  return (
    <main className="min-h-screen grid place-items-center p-6 bg-gray-900 text-white">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 border border-gray-700 p-6 rounded-xl bg-black">
        <h1 className="text-xl font-semibold">New Enquiry (RFP)</h1>
        <input
          className="w-full border border-gray-600 p-2 rounded bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea
          className="w-full min-h-40 border border-gray-600 p-2 rounded bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Details"
          value={details}
          onChange={e => setDetails(e.target.value)}
        />
        <button disabled={loading} className="w-full p-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70">
          {loading ? 'Submitting…' : 'Submit'}
        </button>
      </form>
    </main>
  );
}
