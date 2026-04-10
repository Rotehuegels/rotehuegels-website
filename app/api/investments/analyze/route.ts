import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { analyzeFilingText } from '@/lib/stockAnalysis';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { symbol, filingType, period, text } = body as {
      symbol: string;
      filingType: string;
      period: string;
      text: string;
    };

    if (!symbol || !filingType || !period || !text) {
      return NextResponse.json({ error: 'Missing required fields: symbol, filingType, period, text' }, { status: 400 });
    }

    // Look up company name
    const { data: holding } = await supabaseAdmin
      .from('demat_holdings')
      .select('company_name')
      .eq('symbol', symbol)
      .single();

    const companyName = holding?.company_name ?? symbol;

    // Run analysis
    const result = await analyzeFilingText(symbol, companyName, filingType, period, text);

    // Save filing
    const { data: filing } = await supabaseAdmin
      .from('stock_filings')
      .insert({
        symbol,
        filing_type: filingType,
        title: `${filingType.replace(/_/g, ' ')} — ${period}`,
        period,
        raw_text: text.slice(0, 50000),
        ai_analysis: result,
        signals_generated: result.signals.length,
        analyzed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    // Save signals
    if (result.signals.length > 0) {
      const signalRows = result.signals.map((s) => ({
        symbol,
        signal_type: s.type,
        severity: s.severity,
        title: s.title,
        description: s.description,
        source: filingType,
        source_period: period,
        evidence: s.evidence,
        ai_confidence: s.confidence,
      }));
      await supabaseAdmin.from('stock_signals').insert(signalRows);
    }

    // Save claims
    if (result.claims.length > 0) {
      const claimRows = result.claims.map((c) => ({
        symbol,
        claim: c.claim,
        source: c.source,
        target_date: c.target_date || null,
      }));
      await supabaseAdmin.from('stock_claims').insert(claimRows);
    }

    return NextResponse.json({ success: true, filing_id: filing?.id, result });
  } catch (err) {
    console.error('Analysis error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Analysis failed' },
      { status: 500 },
    );
  }
}
