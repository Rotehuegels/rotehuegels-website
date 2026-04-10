'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const btn = 'rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

export default function Pagination({ page, totalPages, basePath }: { page: number; totalPages: number; basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goTo = useCallback((p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) {
      params.delete('page');
    } else {
      params.set('page', String(p));
    }
    router.push(`${basePath}?${params.toString()}`);
  }, [router, searchParams, basePath]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800/60">
      <button
        disabled={page <= 1}
        onClick={() => goTo(page - 1)}
        className={btn}
      >
        <span className="flex items-center gap-1"><ChevronLeft className="h-3.5 w-3.5" /> Previous</span>
      </button>
      <span className="text-xs text-zinc-500">
        Page {page} of {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => goTo(page + 1)}
        className={btn}
      >
        <span className="flex items-center gap-1">Next <ChevronRight className="h-3.5 w-3.5" /></span>
      </button>
    </div>
  );
}
