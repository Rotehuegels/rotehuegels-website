import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { fetchStockPrice } from '@/lib/stockAnalysis';

export const revalidate = 300; // cache for 5 mins

export async function GET() {
  try {
    const { data: holdings, error } = await supabaseAdmin
      .from('demat_holdings')
      .select('symbol, company_name, yahoo_symbol, quantity, avg_buy_price, total_invested, sector');

    if (error) throw error;
    if (!holdings?.length) return NextResponse.json({ holdings: [] });

    // Fetch prices in parallel (batch of 5 to avoid rate limiting)
    const enriched = [];
    for (let i = 0; i < holdings.length; i += 5) {
      const batch = holdings.slice(i, i + 5);
      const prices = await Promise.all(batch.map((h) => fetchStockPrice(h.yahoo_symbol)));
      for (let j = 0; j < batch.length; j++) {
        const h = batch[j];
        const p = prices[j];
        const currentValue = p.price ? p.price * h.quantity : null;
        const pnl = currentValue ? currentValue - h.total_invested : null;
        const pnlPct = pnl != null ? (pnl / h.total_invested) * 100 : null;
        enriched.push({ ...h, ...p, currentValue, pnl, pnlPct });
      }
    }

    return NextResponse.json({ holdings: enriched });
  } catch (err) {
    console.error('Prices fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
  }
}
