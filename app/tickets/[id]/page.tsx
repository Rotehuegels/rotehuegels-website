import { supabaseServer } from '@/lib/supabaseServer';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import MessageForm from './MessageForm';

type Props = { params: { id: string } };

export default async function TicketDetail({ params }: Props) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const ticket = await prisma.ticket.findFirst({
    where: { id: params.id, userId: user.id }, // ensure ownership
    include: {
      messages: {
        include: { author: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!ticket) {
    return (
      <main className="min-h-screen bg-gray-900 text-white p-6">
        <h1 className="text-2xl font-semibold">Ticket not found</h1>
        <a className="underline mt-4 inline-block" href="/tickets">Back to tickets</a>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Ticket: {ticket.subject}</h1>
        <a className="underline" href="/tickets">Back to tickets</a>
      </div>

      <div className="grid gap-1 text-sm">
        <div><span className="text-gray-400">Status:</span> {ticket.status}</div>
        <div><span className="text-gray-400">Priority:</span> {ticket.priority}</div>
        <div><span className="text-gray-400">Created:</span> {new Date(ticket.createdAt).toLocaleString()}</div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Conversation</h2>
        <div className="space-y-2">
          {/* Original body as first message */}
          <div className="border border-gray-700 rounded p-3 bg-black">
            <div className="text-xs text-gray-400 mb-1">You • {new Date(ticket.createdAt).toLocaleString()}</div>
            <div className="whitespace-pre-wrap">{ticket.body}</div>
          </div>

          {ticket.messages.map(m => (
            <div key={m.id} className="border border-gray-700 rounded p-3 bg-black">
              <div className="text-xs text-gray-400 mb-1">
                {m.author?.email ?? 'User'} • {new Date(m.createdAt).toLocaleString()}
              </div>
              <div className="whitespace-pre-wrap">{m.body}</div>
            </div>
          ))}
        </div>
      </section>

      <MessageForm ticketId={ticket.id} />
    </main>
  );
}