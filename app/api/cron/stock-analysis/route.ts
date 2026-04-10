import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { analyzeFilingText } from '@/lib/stockAnalysis';

export const maxDuration = 300; // 5 min for Vercel

export async function GET(req: NextRequest) {
  // Validate cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: holdings } = await supabaseAdmin
      .from('demat_holdings')
      .select('symbol, company_name, yahoo_symbol, last_signal_check');

    if (!holdings?.length) {
      return NextResponse.json({ message: 'No holdings found' });
    }

    const results: Array<{ symbol: string; status: string; signals?: number }> = [];

    for (const h of holdings) {
      try {
        // Fetch recent corporate announcements from NSE
        const nseRes = await fetch(
          `https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=${encodeURIComponent(h.symbol)}`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept: 'application/json',
              'Accept-Language': 'en-US,en;q=0.9',
            },
          },
        );

        if (!nseRes.ok) {
          results.push({ symbol: h.symbol, status: 'nse_fetch_failed' });
          continue;
        }

        const announcements = await nseRes.json();
        if (!Array.isArray(announcements) || announcements.length === 0) {
          results.push({ symbol: h.symbol, status: 'no_announcements' });
          continue;
        }

        // Filter new announcements since last check
        const lastCheck = h.last_signal_check ? new Date(h.last_signal_check) : new Date(0);
        const newAnnouncements = announcements.filter((a: { an_dt?: string }) => {
          if (!a.an_dt) return false;
          return new Date(a.an_dt) > lastCheck;
        });

        if (newAnnouncements.length === 0) {
          results.push({ symbol: h.symbol, status: 'no_new_announcements' });
          continue;
        }

        // Combine announcement text for analysis
        const combinedText = newAnnouncements
          .slice(0, 5) // limit to 5 most recent
          .map((a: { desc?: string; attchmntText?: string; smIndustry?: string }) =>
            `${a.desc ?? ''}\n${a.attchmntText ?? ''}`.trim(),
          )
          .filter(Boolean)
          .join('\n\n---\n\n');

        if (!combinedText) {
          results.push({ symbol: h.symbol, status: 'no_text_content' });
          continue;
        }

        // Analyze
        const analysis = await analyzeFilingText(
          h.symbol,
          h.company_name,
          'corporate_announcement',
          'auto-scan',
          combinedText,
        );

        // Save filing
        await supabaseAdmin.from('stock_filings').insert({
          symbol: h.symbol,
          filing_type: 'corporate_announcement',
          title: `Auto-scan: ${newAnnouncements.length} announcements`,
          period: 'auto-scan',
          raw_text: combinedText.slice(0, 50000),
          ai_analysis: analysis,
          signals_generated: analysis.signals.length,
          analyzed_at: new Date().toISOString(),
        });

        // Save signals
        if (analysis.signals.length > 0) {
          await supabaseAdmin.from('stock_signals').insert(
            analysis.signals.map((s) => ({
              symbol: h.symbol,
              signal_type: s.type,
              severity: s.severity,
              title: s.title,
              description: s.description,
              source: 'corporate_announcement',
              source_period: 'auto-scan',
              evidence: s.evidence,
              ai_confidence: s.confidence,
            })),
          );
        }

        // Save claims
        if (analysis.claims.length > 0) {
          await supabaseAdmin.from('stock_claims').insert(
            analysis.claims.map((c) => ({
              symbol: h.symbol,
              claim: c.claim,
              source: c.source,
              target_date: c.target_date || null,
            })),
          );
        }

        // Update last check
        await supabaseAdmin
          .from('demat_holdings')
          .update({ last_signal_check: new Date().toISOString() })
          .eq('symbol', h.symbol);

        results.push({ symbol: h.symbol, status: 'analyzed', signals: analysis.signals.length });
      } catch (err) {
        results.push({ symbol: h.symbol, status: `error: ${err instanceof Error ? err.message : 'unknown'}` });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error('Stock analysis cron error:', err);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
