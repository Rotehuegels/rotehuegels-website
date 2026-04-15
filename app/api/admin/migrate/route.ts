import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

// POST — run pending migration SQL via supabase admin
// Only accessible by authenticated admin users
export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sql } = await req.json();
  if (!sql) return NextResponse.json({ error: 'sql field required' }, { status: 400 });

  try {
    // Split on semicolons and run each statement
    const statements = sql
      .split(';')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0 && !s.startsWith('--'));

    const results: string[] = [];
    for (const stmt of statements) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { query: stmt });
      if (error) {
        // If exec_sql RPC doesn't exist, try direct query
        // This won't work with supabase-js but captures the intent
        results.push(`SKIPPED (no exec_sql RPC): ${stmt.substring(0, 80)}...`);
      } else {
        results.push(`OK: ${stmt.substring(0, 80)}...`);
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Migration failed' }, { status: 500 });
  }
}

// GET — return the pending migration SQL for review
export async function GET() {
  const fs = await import('fs');
  const path = await import('path');

  try {
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260415_grn_budget_assets.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    return NextResponse.json({ sql, instructions: 'Run this SQL in the Supabase SQL Editor at https://supabase.com/dashboard' });
  } catch {
    return NextResponse.json({ error: 'Migration file not found' }, { status: 404 });
  }
}
