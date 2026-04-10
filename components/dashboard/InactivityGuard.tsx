'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabaseClient';

// ── Timeouts ──────────────────────────────────────────────────────────────────
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of inactivity → logout
const WARN_BEFORE_MS  =  2 * 60 * 1000; // show warning 2 minutes before logout
const WARN_AT_MS      = IDLE_TIMEOUT_MS - WARN_BEFORE_MS;

// ── Activity events that reset the idle timer ─────────────────────────────────
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'pointerdown'] as const;

// ── Countdown display helper ──────────────────────────────────────────────────
function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
}

export default function InactivityGuard({ children }: { children: React.ReactNode }) {
  const [warningVisible, setWarningVisible] = useState(false);
  const [secondsLeft,    setSecondsLeft]    = useState(WARN_BEFORE_MS / 1000);
  const [stayingIn,      setStayingIn]      = useState(false);

  // Use a ref so activity-event handlers always read the latest value without
  // being re-registered on every render.
  const warningActiveRef = useRef(false);
  const warnTimerRef     = useRef<ReturnType<typeof setTimeout>>();
  const logoutTimerRef   = useRef<ReturnType<typeof setTimeout>>();
  const countdownRef     = useRef<ReturnType<typeof setInterval>>();

  // ── Sign out — full browser navigation to the API route so cookies are
  // cleared server-side before the browser sees any new page. ──────────────────
  const doLogout = useCallback((reason: 'timeout' | 'manual' = 'timeout') => {
    clearTimeout(warnTimerRef.current);
    clearTimeout(logoutTimerRef.current);
    clearInterval(countdownRef.current);
    window.location.href = reason === 'timeout'
      ? '/api/auth/signout?reason=timeout'
      : '/api/auth/signout';
  }, []);

  // ── Schedule warn + logout timers from now ─────────────────────────────────
  const scheduleTimers = useCallback(() => {
    clearTimeout(warnTimerRef.current);
    clearTimeout(logoutTimerRef.current);

    warnTimerRef.current = setTimeout(() => {
      warningActiveRef.current = true;
      setWarningVisible(true);
      setSecondsLeft(WARN_BEFORE_MS / 1000);
    }, WARN_AT_MS);

    logoutTimerRef.current = setTimeout(() => doLogout('timeout'), IDLE_TIMEOUT_MS);
  }, [doLogout]);

  // ── Activity handler — ignores events once warning is showing ──────────────
  const handleActivity = useCallback(() => {
    if (warningActiveRef.current) return;
    scheduleTimers();
  }, [scheduleTimers]);

  // ── Mount: attach listeners and start timers ───────────────────────────────
  useEffect(() => {
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));
    scheduleTimers();
    return () => {
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, handleActivity));
      clearTimeout(warnTimerRef.current);
      clearTimeout(logoutTimerRef.current);
      clearInterval(countdownRef.current);
    };
  }, [handleActivity, scheduleTimers]);

  // ── Countdown tick while warning is visible ────────────────────────────────
  useEffect(() => {
    if (!warningVisible) return;
    setSecondsLeft(WARN_BEFORE_MS / 1000);
    countdownRef.current = setInterval(() => {
      setSecondsLeft(s => Math.max(0, s - 1));
    }, 1_000);
    return () => clearInterval(countdownRef.current);
  }, [warningVisible]);

  // ── "Stay logged in" ───────────────────────────────────────────────────────
  const handleStayLoggedIn = async () => {
    setStayingIn(true);
    await supabaseBrowser().auth.refreshSession();
    warningActiveRef.current = false;
    setWarningVisible(false);
    setStayingIn(false);
    scheduleTimers();
  };

  return (
    <>
      {children}

      {/* ── Inactivity warning modal ── */}
      {warningVisible && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/60 p-8 text-center">

            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="rounded-full bg-amber-500/10 border border-amber-500/20 p-4">
                <Clock className="h-7 w-7 text-amber-400" />
              </div>
            </div>

            {/* Copy */}
            <h2 className="text-lg font-bold text-white mb-2">Session expiring</h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-1">
              You've been inactive for a while. You'll be signed out automatically in:
            </p>

            {/* Countdown */}
            <div className="my-5 rounded-xl bg-zinc-800/70 border border-zinc-700 py-4">
              <span className="text-4xl font-black text-amber-400 tabular-nums">
                {formatCountdown(secondsLeft)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => doLogout('manual')}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-sm font-semibold text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
              <button
                onClick={handleStayLoggedIn}
                disabled={stayingIn}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${stayingIn ? 'animate-spin' : ''}`} />
                {stayingIn ? 'Refreshing…' : 'Stay logged in'}
              </button>
            </div>

            <p className="mt-4 text-xs text-zinc-600">
              Any activity (mouse, keyboard) does not dismiss this once it appears.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
