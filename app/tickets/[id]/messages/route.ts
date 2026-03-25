import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { supabaseServer } from '@/lib/supabaseServer';

const CreateMessage = z.object({
  body: z.string().min(1, 'Message cannot be empty'),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // ✅ Next.js 15 fix

  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const bodyJson = await req.json();
  const parsed = CreateMessage.safeParse(bodyJson);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Ensure the ticket belongs to the user (basic authz)
  const ticket = await prisma.ticket.findFirst({
    where: { id, userId: user.id }, // ✅ use id
    select: { id: true },
  });

  if (!ticket) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const created = await prisma.ticketMessage.create({
    data: {
      ticketId: id, // ✅ use id
      authorId: user.id,
      body: parsed.data.body,
    },
  });

  return NextResponse.json({ created }, { status: 201 });
}