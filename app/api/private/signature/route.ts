import { supabaseServer } from '@/lib/supabaseServer';
import { readFileSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const filePath = join(process.cwd(), 'private', 'signature.jpg');
  const file = readFileSync(filePath);

  return new NextResponse(file, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'private, no-store',
    },
  });
}
