'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle, Shield, UserCheck, TrendingUp, GitBranch, CheckCircle,
  Loader2, Upload, FileText,
} from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const severityStyle: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high:     'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  low:      'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  positive: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const typeIcon: Record<string, React.ElementType> = {
  accounting_red_flag:    AlertTriangle,
  governance:             Shield,
  management_credibility: UserCheck,
  capital_allocation:     TrendingUp,
  divergence:             GitBranch,
  positive:               CheckCircle,
};

interface AnalysisResult {
  signals: Array<{
    type: string;
    severity: string;
    title: string;
    description: string;
    evidence: string;
    confidence: number;
  }>;
  claims: Array<{
    claim: string;
    source: string;
    target_date?: string;
  }>;
  summary: string;
  risk_score: number;
}

export default function AnalyzeForm({ symbol, companyName }: { symbol: string; companyName: string }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [filingType, setFilingType] = useState('quarterly_result');
  const [period, setPeriod] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setText(content);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !period.trim()) {
      setError('Please provide filing text and period.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/investments/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, filingType, period, text }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed');

      setResult(data.result);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className={`${glass} p-6 space-y-4`}>
        <h3 className="text-lg font-semibold text-white">Analyze Filing</h3>
        <p className="text-xs text-zinc-500">Paste filing text (annual report, quarterly results, earnings call transcript) for AI forensic analysis.</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Filing Type</label>
            <select
              value={filingType}
              onChange={(e) => setFilingType(e.target.value)}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
            >
              <option value="annual_report">Annual Report</option>
              <option value="quarterly_result">Quarterly Result</option>
              <option value="board_meeting">Board Meeting</option>
              <option value="investor_presentation">Investor Presentation</option>
              <option value="earnings_call">Earnings Call</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Period</label>
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="Q3FY26, FY25-26"
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-zinc-400">Filing Text</label>
            <label className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white cursor-pointer transition-colors">
              <Upload className="h-3 w-3" />
              Upload .txt
              <input type="file" accept=".txt,.csv,.md" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            placeholder="Paste filing text, annual report extract, or earnings call transcript here..."
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono resize-y"
          />
          <p className="text-[10px] text-zinc-600 mt-1">{text.length.toLocaleString()} characters</p>
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          {loading ? 'Analyzing...' : 'Analyze Filing'}
        </button>
      </form>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <div className={`${glass} p-6`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Analysis Results</h3>
              <span className={`text-sm font-mono font-bold px-3 py-1 rounded-lg ${
                result.risk_score >= 70 ? 'bg-red-500/10 text-red-400' :
                result.risk_score >= 40 ? 'bg-amber-500/10 text-amber-400' :
                'bg-emerald-500/10 text-emerald-400'
              }`}>
                Risk: {result.risk_score}/100
              </span>
            </div>
            <p className="text-sm text-zinc-300">{result.summary}</p>
          </div>

          {result.signals.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-zinc-300">Signals ({result.signals.length})</h4>
              {result.signals.map((s, i) => {
                const Icon = typeIcon[s.type] ?? AlertTriangle;
                const style = severityStyle[s.severity] ?? severityStyle.medium;
                return (
                  <div key={i} className={`${glass} p-4`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-lg border ${style} shrink-0`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded border ${style}`}>
                            {s.severity}
                          </span>
                          <span className="text-xs text-zinc-600">{s.confidence}% confidence</span>
                        </div>
                        <p className="text-sm font-medium text-white mt-1">{s.title}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{s.description}</p>
                        {s.evidence && (
                          <p className="text-xs text-zinc-500 mt-2 p-2 rounded bg-zinc-800/60">{s.evidence}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {result.claims.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-zinc-300">Claims to Track ({result.claims.length})</h4>
              {result.claims.map((c, i) => (
                <div key={i} className={`${glass} p-3`}>
                  <p className="text-sm text-white">{c.claim}</p>
                  <p className="text-xs text-zinc-500 mt-1">{c.source}{c.target_date ? ` — Target: ${c.target_date}` : ''}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
