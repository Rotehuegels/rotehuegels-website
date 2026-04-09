'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, ChevronDown } from 'lucide-react';
import WebLLMAssistant from './WebLLMAssistant';

const IDLE_MS = 45_000; // show nudge after 45s of no interaction

export default function AssistNudge() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    if (dismissed || visible) return;
    timer.current = setTimeout(() => setVisible(true), IDLE_MS);
  };

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timer.current) clearTimeout(timer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissed, visible]);

  if (!visible || dismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full">
      {expanded ? (
        <div className="rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/80">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-rose-400" />
              <span className="text-sm font-semibold text-white">Rotehügels Assist</span>
              <span className="text-[10px] text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 rounded-full px-2 py-0.5">24/7</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setExpanded(false)}
                className="rounded-lg p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label="Minimise"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                onClick={() => { setDismissed(true); setExpanded(false); }}
                className="rounded-lg p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="p-4 max-h-[420px] overflow-y-auto">
            <WebLLMAssistant />
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl border border-zinc-700 bg-zinc-900/95 shadow-2xl p-4">
          <div className="shrink-0 rounded-xl bg-rose-500/10 border border-rose-500/20 p-2">
            <MessageCircle className="h-5 w-5 text-rose-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">Need help exploring?</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Rotehügels Assist is available 24/7 to answer your questions.
            </p>
            <button
              onClick={() => setExpanded(true)}
              className="mt-2 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 transition-colors"
            >
              Ask a question
            </button>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 rounded-lg p-1 text-zinc-600 hover:text-zinc-400 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
