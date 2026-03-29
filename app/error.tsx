'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console in dev; swap for Sentry/Datadog in production
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      {/* Radial glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_400px_at_50%_30%,rgba(244,63,94,0.06),transparent_70%)]" />

      <p className="text-8xl font-black text-rose-500/20 select-none">500</p>

      <h1 className="mt-2 text-2xl font-bold text-white">Something went wrong</h1>
      <p className="mt-3 max-w-sm text-sm text-zinc-400">
        An unexpected error occurred. Our team has been notified. Please try again
        or come back shortly.
      </p>

      {error.digest && (
        <p className="mt-2 font-mono text-xs text-zinc-600">
          Error ID: {error.digest}
        </p>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:text-white"
        >
          Go home
        </Link>
      </div>

      <p className="mt-8 text-xs text-zinc-500">
        Still having trouble?{' '}
        <Link href="/contact" className="text-rose-400 hover:underline">
          Contact us
        </Link>
      </p>
    </div>
  );
}
