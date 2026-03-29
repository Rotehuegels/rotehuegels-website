export default function Loading() {
  return (
    <div className="container mx-auto px-6 py-12 animate-pulse">
      <div className="h-9 w-40 rounded-xl bg-zinc-800 mb-6" />

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
        {/* Table header */}
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 rounded-lg bg-zinc-700" />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-4 rounded-lg bg-zinc-800/60" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
