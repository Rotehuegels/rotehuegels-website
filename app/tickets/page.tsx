import Link from 'next/link';

async function getTickets() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/tickets`,
    { cache: 'no-store' }
  );
  if (!res.ok) return { items: [] as any[] };
  return res.json();
}

export default async function TicketsList() {
  const { items } = await getTickets();

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Support Tickets</h1>
        <div className="flex gap-3">
          <Link href="/dashboard" className="px-3 py-2 rounded border border-gray-700 bg-black hover:bg-gray-800">
            Back to Dashboard
          </Link>
          <Link href="/tickets/new" className="px-3 py-2 rounded bg-green-600 hover:bg-green-700">
            New
          </Link>
        </div>
      </div>

      <ul className="mt-6 space-y-3">
        {items.length === 0 && <li className="text-gray-400">No tickets yet.</li>}
        {items.map((t: any) => (
          <li key={t.id} className="border border-gray-700 rounded p-4 bg-black">
            <div className="text-lg font-medium">
              <Link href={`/tickets/${t.id}`} className="underline">
                {t.subject}
              </Link>
            </div>
            <div className="text-sm text-gray-300 mt-1">{t.body}</div>
            <div className="text-xs text-gray-400 mt-2">
              Status: {t.status} | Priority: {t.priority}
            </div>
            <div className="text-xs text-gray-500">Created: {new Date(t.createdAt).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}