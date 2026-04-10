'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Check, X } from 'lucide-react';

interface AIAssistButtonProps {
  description: string;
  field: 'hsn' | 'description' | 'notes';
  onAccept: (result: Record<string, unknown>) => void;
  disabled?: boolean;
}

export default function AIAssistButton({ description, field, onAccept, disabled }: AIAssistButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');

  async function suggest() {
    if (!description.trim() || loading) return;
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/assist-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, field }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  function accept() {
    if (result) {
      onAccept(result);
      setResult(null);
    }
  }

  function dismiss() {
    setResult(null);
    setError('');
  }

  if (result) {
    return (
      <div className="mt-1.5 rounded-lg border border-amber-600/30 bg-amber-500/5 px-3 py-2">
        {field === 'hsn' && (
          <div className="text-xs space-y-1">
            <p className="text-amber-300 font-mono font-bold">{String(result.code)} ({String(result.type)})</p>
            <p className="text-zinc-400">{String(result.description)}</p>
            <p className="text-zinc-500">GST: {String(result.gst_rate)}%</p>
          </div>
        )}
        {(field === 'description' || field === 'notes') && (
          <div className="text-xs space-y-1">
            <p className="text-zinc-200">{String(result.corrected)}</p>
            {Array.isArray(result.changes) && result.changes.length > 0 && (
              <p className="text-zinc-500">Changes: {(result.changes as string[]).join(', ')}</p>
            )}
          </div>
        )}
        <div className="flex gap-2 mt-2">
          <button type="button" onClick={accept}
            className="flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-emerald-500 transition-colors">
            <Check className="h-3 w-3" /> Accept
          </button>
          <button type="button" onClick={dismiss}
            className="flex items-center gap-1 rounded-md border border-zinc-700 px-2.5 py-1 text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors">
            <X className="h-3 w-3" /> Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={suggest}
        disabled={disabled || loading || !description.trim()}
        title={field === 'hsn' ? 'Suggest HSN/SAC code' : 'Fix spelling & improve'}
        className="mt-1 flex items-center gap-1 text-[10px] text-amber-500/70 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
        {loading ? 'Thinking...' : field === 'hsn' ? 'AI: Suggest HSN/SAC' : 'AI: Fix & Improve'}
      </button>
      {error && <p className="text-[10px] text-red-400 mt-0.5">{error}</p>}
    </div>
  );
}
