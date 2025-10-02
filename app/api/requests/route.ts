import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabaseServer';
import { prisma } from '@/lib/prisma';

const CreateRequest = z.object({
  title: z.string().min(3, 'Title too short'),
  details: z.string().min(5, 'Please add more details'),
});

export async function GET() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const items = await prisma.request.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = CreateRequest.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { title, details } = parsed.data;
  const created = await prisma.request.create({
    data: { userId: user.id, title, details },
  });

  return NextResponse.json({ created }, { status: 201 });
}
