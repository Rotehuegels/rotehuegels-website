export default function Loading() {
  return (
    <section className="container mx-auto px-4 md:px-6 lg:px-8 py-10 animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="h-9 w-52 rounded-xl bg-zinc-800" />
        <div className="mt-3 h-4 w-96 max-w-full rounded-lg bg-zinc-800/60" />
      </div>

      {/* Two widget cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="h-5 w-40 rounded-lg bg-zinc-800" />
              <div className="h-3 w-24 rounded-lg bg-zinc-800/60" />
            </div>
            <div className="h-[420px] rounded-xl bg-zinc-800/40" />
          </div>
        ))}
      </div>
    </section>
  );
}
