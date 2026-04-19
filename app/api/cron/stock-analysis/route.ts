import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { fetchAndAnalyzeStock } from '@/lib/stockAnalysis';

export const maxDuration = 300;

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// Daily cron: analyze a batch of portfolio stocks
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all holdings except gold bonds, ordered by least recently checked
    const { data: holdings } = await supabaseAdmin
      .from('demat_holdings')
      .select('symbol, company_name, last_signal_check')
      .neq('sector', 'Gold')
      .order('last_signal_check', { ascending: true, nullsFirst: true });

    if (!holdings?.length) {
      return NextResponse.json({ message: 'No holdings found' });
    }

    // Scan 5 stocks per cron run (to stay within Groq rate limits + Vercel timeout)
    const batch = holdings.slice(0, 5);
    const results: Array<{ symbol: string; status: string; signals: number }> = [];

    for (const h of batch) {
      try {
        const analysis = await fetchAndAnalyzeStock(h.symbol, h.company_name);

        // Save filing
        await supabaseAdmin.from('stock_filings').insert({
          symbol: h.symbol,
          filing_type: 'ai_forensic_scan',
          title: `Daily forensic scan — ${h.company_name}`,
          period: `Scan ${new Date().toISOString().split('T')[0]}`,
          raw_text: 'AI-generated forensic analysis using Groq llama-3.3-70b',
          ai_analysis: analysis,
          signals_generated: analysis.signals.length,
          analyzed_at: new Date().toISOString(),
        });

        // Save signals (deduplicate)
        for (const s of analysis.signals) {
          const { data: existing } = await supabaseAdmin
            .from('stock_signals')
            .select('id')
            .eq('symbol', h.symbol)
            .eq('title', s.title)
            .maybeSingle();

          if (!existing) {
            await supabaseAdmin.from('stock_signals').insert({
              symbol: h.symbol,
              signal_type: s.type,
              severity: s.severity,
              title: s.title,
              description: s.description,
              source: 'ai_forensic_scan',
              source_period: `Scan ${new Date().toISOString().split('T')[0]}`,
              evidence: s.evidence,
              ai_confidence: s.confidence,
            });
          }
        }

        // Save claims (deduplicate)
        for (const cl of analysis.claims) {
          const { data: existing } = await supabaseAdmin
            .from('stock_claims')
            .select('id')
            .eq('symbol', h.symbol)
            .eq('claim', cl.claim)
            .maybeSingle();

          if (!existing) {
            await supabaseAdmin.from('stock_claims').insert({
              symbol: h.symbol,
              claim: cl.claim,
              source: cl.source,
              target_date: cl.target_date || null,
            });
          }
        }

        await supabaseAdmin
          .from('demat_holdings')
          .update({ last_signal_check: new Date().toISOString() })
          .eq('symbol', h.symbol);

        results.push({ symbol: h.symbol, status: 'analyzed', signals: analysis.signals.length });
        await sleep(3000); // Groq rate limit
      } catch (err) {
        results.push({ symbol: h.symbol, status: `error: ${err instanceof Error ? err.message : 'unknown'}`, signals: 0 });
      }
    }

    return NextResponse.json({ success: true, batch: batch.length, results });
  } catch (err) {
    console.error('Stock analysis cron error:', err);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
