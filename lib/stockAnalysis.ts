// lib/stockAnalysis.ts — Forensic intelligence engine for stock portfolio analysis

export interface AnalysisSignal {
  type: string;
  severity: string;
  title: string;
  description: string;
  evidence: string;
  confidence: number;
}

export interface AnalysisClaim {
  claim: string;
  source: string;
  target_date?: string;
}

export interface AnalysisResult {
  signals: AnalysisSignal[];
  claims: AnalysisClaim[];
  summary: string;
  risk_score: number;
}

export interface StockPrice {
  price: number | null;
  change: number | null;
  changePct: number | null;
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ── Filing Analysis ──────────────────────────────────────────────────────────

export async function analyzeFilingText(
  symbol: string,
  companyName: string,
  filingType: string,
  period: string,
  text: string,
): Promise<AnalysisResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  // Truncate text to ~12k chars to stay within context limits
  const truncated = text.slice(0, 12000);

  const systemPrompt = `You are a forensic accountant and equity research analyst. Analyze the following filing and extract forensic intelligence signals.

For each finding, classify it into one of these categories:
- accounting_red_flag: unusual revenue recognition, related party transactions, auditor qualifications, contingent liabilities, off-balance-sheet items
- governance: board independence issues, auditor changes, KMP resignations, shareholder dissent, related party concerns
- management_credibility: guidance accuracy, consistency of narrative across periods, tone changes, vague language
- capital_allocation: buyback timing, dividend policy changes, capex vs guidance, debt management
- divergence: revenue vs receivables mismatch, cash flow vs profit divergence, inventory buildup vs revenue, margin inconsistencies
- positive: consistent execution, improving metrics, strong governance practices, transparent disclosures

Severity levels: critical, high, medium, low

Also extract management claims/guidance that can be tracked over time.

Respond ONLY with valid JSON matching this schema:
{
  "signals": [{ "type": "string", "severity": "string", "title": "string", "description": "string", "evidence": "string", "confidence": 0 }],
  "claims": [{ "claim": "string", "source": "string", "target_date": "string or null" }],
  "summary": "string",
  "risk_score": 0
}

risk_score: 0 = no risk, 100 = extreme risk. Be precise and cite specific numbers from the text.`;

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Company: ${companyName} (${symbol})\nFiling: ${filingType} for ${period}\n\n${truncated}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from Groq');

  const parsed = JSON.parse(content) as AnalysisResult;

  // Validate / default
  return {
    signals: Array.isArray(parsed.signals) ? parsed.signals : [],
    claims: Array.isArray(parsed.claims) ? parsed.claims : [],
    summary: parsed.summary ?? 'No summary generated.',
    risk_score: typeof parsed.risk_score === 'number' ? parsed.risk_score : 50,
  };
}

// ── Yahoo Finance Price Fetch ────────────────────────────────────────────────

export async function fetchStockPrice(yahooSymbol: string): Promise<StockPrice> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 },
    });

    if (!res.ok) return { price: null, change: null, changePct: null };

    const data = await res.json();
    const meta = data.chart?.result?.[0]?.meta;
    if (!meta) return { price: null, change: null, changePct: null };

    const price = meta.regularMarketPrice ?? null;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? null;
    const change = price != null && prevClose != null ? price - prevClose : null;
    const changePct = change != null && prevClose ? (change / prevClose) * 100 : null;

    return { price, change, changePct };
  } catch {
    return { price: null, change: null, changePct: null };
  }
}
