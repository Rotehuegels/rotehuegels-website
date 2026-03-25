export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Ticket #{id}</h1>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <p className="text-zinc-300">
          Ticket details module will be available soon.
        </p>
      </div>
    </div>
  );
}