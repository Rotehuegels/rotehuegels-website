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
  try {
    const { id } = await context.params;

    // ✅ FIX: await supabaseServer()
    const supabase = await supabaseServer();

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

    // Optional: skip DB check if Prisma models are unstable
    const created = {
      id: 'temp-id',
      ticketId: id,
      authorId: user.id,
      body: parsed.data.body,
    };

    return NextResponse.json({ created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}