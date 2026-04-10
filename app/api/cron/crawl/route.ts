import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  runCrawlJob,
  DEFAULT_SUPPLIER_QUERIES,
  DEFAULT_CUSTOMER_QUERIES,
} from '@/lib/crawler';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// ── GET — Cron-triggered crawl (daily at 2 AM IST) ───────────────────────────

export async function GET(req: Request) {
  // Validate cron secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Odd days = suppliers, even days = customers
    const dayOfMonth = new Date().getDate();
    const type: 'supplier' | 'customer' = dayOfMonth % 2 === 1 ? 'supplier' : 'customer';
    const allQueries = type === 'supplier' ? DEFAULT_SUPPLIER_QUERIES : DEFAULT_CUSTOMER_QUERIES;

    // Pick 3 random queries
    const shuffled = [...allQueries].sort(() => Math.random() - 0.5);
    const queries = shuffled.slice(0, 3);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await runCrawlJob(type, queries, supabaseAdmin as any);

    return NextResponse.json({
      ok: true,
      type,
      queries,
      resultsCount: result.resultsCount,
      errors: result.errors,
    });
  } catch (err: unknown) {
    console.error('[CRON /api/cron/crawl] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
