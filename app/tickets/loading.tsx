export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-900 text-white p-6 animate-pulse">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 rounded-xl bg-zinc-800" />
        <div className="flex gap-3">
          <div className="h-9 w-28 rounded-lg bg-zinc-800" />
          <div className="h-9 w-16 rounded-lg bg-zinc-800" />
        </div>
      </div>

      {/* Ticket rows */}
      <ul className="mt-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="rounded-lg border border-zinc-800 bg-black p-4 space-y-2">
            <div className="h-5 w-64 rounded-lg bg-zinc-800" />
            <div className="h-3 w-full rounded-lg bg-zinc-800/50" />
            <div className="h-3 w-3/4 rounded-lg bg-zinc-800/40" />
            <div className="h-3 w-40 rounded-lg bg-zinc-800/30" />
          </li>
        ))}
      </ul>
    </main>
  );
}
