'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Minimize2 } from 'lucide-react';
import WebLLMAssistant from './WebLLMAssistant';

const IDLE_MS = 5_000;

// Friendly person SVG avatar with a waving arm
function Avatar({ wave }: { wave: boolean }) {
  return (
    <svg viewBox="0 0 40 40" className="w-8 h-8 select-none" fill="none" aria-hidden>
      {/* Hair */}
      <path d="M13 15 Q13 7 20 7 Q27 7 27 15" fill="#7c4f1e" />
      {/* Head */}
      <circle cx="20" cy="15" r="7.5" fill="#fddbb4" />
      {/* Eyes */}
      <circle cx="17.2" cy="14" r="1.1" fill="#333" />
      <circle cx="22.8" cy="14" r="1.1" fill="#333" />
      {/* Smile */}
      <path d="M16.8 17.5 Q20 20.5 23.2 17.5" stroke="#c0785a" strokeWidth="1.1" strokeLinecap="round" fill="none" />
      {/* Neck */}
      <rect x="17.5" y="22.5" width="5" height="4" rx="2" fill="#fddbb4" />
      {/* Body */}
      <path d="M10 40 Q10 27 20 27 Q30 27 30 40Z" fill="#e11d48" />
      {/* Left arm (static) */}
      <path d="M30 30 Q35 32 37 35" stroke="#fddbb4" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Waving right arm */}
      <g className={wave ? 'rh-wave' : ''}>
        <path d="M10 30 Q5 26 3 20" stroke="#fddbb4" strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="3" cy="20" r="2.2" fill="#fddbb4" />
      </g>
    </svg>
  );
}

export default function AssistWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showGreet, setShowGreet] = useState(false);
  const [nudge, setNudge] = useState(false);
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Don't render inside the dashboard
  if (pathname?.startsWith('/dashboard')) return null;

  // Show greeting bubble 1.8s after mount
  useEffect(() => {
    const t = setTimeout(() => setShowGreet(true), 1800);
    return () => clearTimeout(t);
  }, []);

  // Idle nudge: 5s of no activity → wiggle the bubble
  const resetIdle = () => {
    if (idleRef.current) clearTimeout(idleRef.current);
    setNudge(false);
    if (!open) {
      idleRef.current = setTimeout(() => setNudge(true), IDLE_MS);
    }
  };

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, resetIdle, { passive: true }));
    resetIdle();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdle));
      if (idleRef.current) clearTimeout(idleRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Re-show greeting bubble when navigating to a new page (collapsed)
  useEffect(() => {
    if (!open) {
      setShowGreet(false);
      const t = setTimeout(() => setShowGreet(true), 1200);
      return () => clearTimeout(t);
    }
  }, [pathname]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">

      {/* ── Expanded chat panel ── */}
      {open && (
        <div className="rh-panel pointer-events-auto w-[360px] max-h-[560px] rounded-2xl border border-zinc-700/80 bg-zinc-950 shadow-2xl shadow-black/60 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900 shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-700 to-rose-900 flex items-center justify-center">
                  <Avatar wave={false} />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-900" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">Rotehügels Assist</p>
                <p className="text-[11px] text-emerald-400 mt-0.5">Online · Available 24 / 7</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="Minimise chat"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>

          {/* Chat body */}
          <div className="flex-1 overflow-y-auto p-4">
            <WebLLMAssistant />
          </div>
        </div>
      )}

      {/* ── Collapsed state ── */}
      {!open && (
        <div className="flex flex-col items-end gap-2.5">
          {/* Greeting speech bubble */}
          {showGreet && (
            <div className="rh-greet pointer-events-auto max-w-[210px] rounded-2xl rounded-br-none border border-zinc-700/80 bg-zinc-900/95 shadow-xl px-4 py-3">
              <p className="text-sm font-semibold text-white leading-snug">
                👋 Welcome to Rotehügels!
              </p>
              <p className="text-xs text-zinc-400 mt-1 leading-snug">
                How can I assist you today?
              </p>
              <button
                onClick={() => { setOpen(true); setNudge(false); }}
                className="mt-2 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
              >
                Chat now →
              </button>
            </div>
          )}

          {/* Avatar button */}
          <button
            onClick={() => { setOpen(true); setNudge(false); setShowGreet(false); }}
            aria-label="Open Rotehügels Assist"
            className={`rh-pop-in pointer-events-auto relative w-14 h-14 rounded-full bg-gradient-to-br from-rose-600 to-rose-900 shadow-lg shadow-rose-950/60 flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95 ${nudge ? 'rh-nudge' : ''}`}
          >
            {/* Pulsing rings */}
            <span className="rh-pulse  absolute inset-0 rounded-full border-2 border-rose-500/50" />
            <span className="rh-pulse-2 absolute inset-0 rounded-full border   border-rose-400/30" />
            <Avatar wave={nudge} />
          </button>
        </div>
      )}
    </div>
  );
}
