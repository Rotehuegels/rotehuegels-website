export default function Loading() {
  return (
    <main className="p-6 animate-pulse">
      <div className="h-8 w-60 rounded-xl bg-zinc-800" />
      <div className="mt-2 h-4 w-72 rounded-lg bg-zinc-800/60" />

      <div className="mt-6 grid gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-5 w-48 rounded-lg bg-zinc-800/50" />
        ))}
      </div>
    </main>
  );
}
