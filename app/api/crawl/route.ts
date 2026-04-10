import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  runCrawlJob,
  DEFAULT_SUPPLIER_QUERIES,
  DEFAULT_CUSTOMER_QUERIES,
} from '@/lib/crawler';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

// ── POST — Trigger a crawl job ────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const type: 'supplier' | 'customer' = body.type ?? 'supplier';
    const queries: string[] =
      body.queries?.length > 0
        ? body.queries
        : type === 'supplier'
          ? DEFAULT_SUPPLIER_QUERIES
          : DEFAULT_CUSTOMER_QUERIES;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await runCrawlJob(type, queries, supabaseAdmin as any);

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('[POST /api/crawl] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ── GET — List recent crawl jobs ──────────────────────────────────────────────

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('crawl_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return NextResponse.json({ jobs: data ?? [] });
  } catch (err: unknown) {
    console.error('[GET /api/crawl] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
