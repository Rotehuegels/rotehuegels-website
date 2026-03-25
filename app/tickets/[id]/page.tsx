import { prisma } from '@/lib/prisma';

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ✅ Next.js 15 fix

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!ticket) {
    return (
      <div className="container mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold">Ticket not found</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Ticket #{ticket.id}</h1>

      <div className="space-y-4">
        {ticket.messages.map((msg: any) => (
          <div
            key={msg.id}
            className="p-4 border border-zinc-800 rounded-lg bg-zinc-900/40"
          >
            <p className="text-sm text-zinc-300">{msg.body}</p>
            <p className="text-xs text-zinc-500 mt-2">
              {new Date(msg.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}