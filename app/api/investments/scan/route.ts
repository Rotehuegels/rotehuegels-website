export const runtime = 'nodejs';
export const maxDuration = 300;

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { fetchAndAnalyzeStock } from '@/lib/stockAnalysis';

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// POST — Scan one or all stocks for forensic signals
// Body: { symbol?: string } — if empty, scans all holdings
export async function POST(req: Request) {
  let body: { symbol?: string } = {};
  try { body = await req.json(); } catch {}

  const { symbol } = body;

  // Get holdings to scan
  let query = supabaseAdmin.from('demat_holdings').select('symbol, company_name');
  if (symbol) query = query.eq('symbol', symbol);
  // Skip gold bonds
  query = query.neq('sector', 'Gold');

  const { data: holdings } = await query;
  if (!holdings?.length) {
    return NextResponse.json({ error: 'No holdings found.' }, { status: 404 });
  }

  const results: Array<{ symbol: string; status: string; signals: number; risk_score: number }> = [];

  for (const h of holdings) {
    try {
      const analysis = await fetchAndAnalyzeStock(h.symbol, h.company_name);

      // Save filing record
      await supabaseAdmin.from('stock_filings').insert({
        symbol: h.symbol,
        filing_type: 'ai_forensic_scan',
        title: `Forensic intelligence scan — ${h.company_name}`,
        period: `Scan ${new Date().toISOString().split('T')[0]}`,
        raw_text: `AI-generated forensic analysis using Groq llama-3.3-70b`,
        ai_analysis: analysis,
        signals_generated: analysis.signals.length,
        analyzed_at: new Date().toISOString(),
      });

      // Save signals (skip if duplicates exist)
      for (const s of analysis.signals) {
        // Check for duplicate by title + symbol
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

      // Save claims
      for (const cl of analysis.claims) {
        const { data: existingClaim } = await supabaseAdmin
          .from('stock_claims')
          .select('id')
          .eq('symbol', h.symbol)
          .eq('claim', cl.claim)
          .maybeSingle();

        if (!existingClaim) {
          await supabaseAdmin.from('stock_claims').insert({
            symbol: h.symbol,
            claim: cl.claim,
            source: cl.source,
            target_date: cl.target_date || null,
          });
        }
      }

      // Update last check
      await supabaseAdmin
        .from('demat_holdings')
        .update({ last_signal_check: new Date().toISOString() })
        .eq('symbol', h.symbol);

      results.push({
        symbol: h.symbol,
        status: 'analyzed',
        signals: analysis.signals.length,
        risk_score: analysis.risk_score,
      });

      // Rate limit — wait between stocks to respect Groq limits
      await sleep(2000);
    } catch (err) {
      results.push({
        symbol: h.symbol,
        status: `error: ${err instanceof Error ? err.message : 'unknown'}`,
        signals: 0,
        risk_score: 0,
      });
    }
  }

  const totalSignals = results.reduce((s, r) => s + r.signals, 0);

  return NextResponse.json({
    success: true,
    stocksScanned: results.length,
    totalSignals,
    results,
  });
}
