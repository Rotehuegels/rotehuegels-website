import Link from 'next/link';

async function getRequests() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/requests`, {
    cache: 'no-store',
  });
  if (!res.ok) return { items: [] as any[] };
  return res.json();
}

export default async function RequestsList() {
  const { items } = await getRequests();

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Requests</h1>
        <Link href="/requests/new" className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700">New</Link>
      </div>

      <ul className="mt-6 space-y-3">
        {items.length === 0 && <li className="text-gray-400">No requests yet.</li>}
        {items.map((r: any) => (
          <li key={r.id} className="border border-gray-700 rounded p-4 bg-black">
            <div className="text-lg font-medium">{r.title}</div>
            <div className="text-sm text-gray-300 mt-1">{r.details}</div>
            <div className="text-xs text-gray-400 mt-2">Status: {r.status}</div>
            <div className="text-xs text-gray-500">Created: {new Date(r.createdAt).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
