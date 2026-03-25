// app/api/me/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { prisma } from '@/lib/prisma';

export async function GET() {
  // Get logged-in user from Supabase session
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Ensure Profile exists (create if missing, update if email changed)
  await prisma.profile.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email ?? '',
    },
    update: {
      email: user.email ?? '',
    },
  });

  // Return user and profile
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
  });

  return NextResponse.json({ user, profile });
}