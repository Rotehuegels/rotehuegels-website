'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchResult {
  type: string;
  id: string;
  label: string;
  sublabel?: string;
  href: string;
}

const TYPE_COLORS: Record<string, string> = {
  Order:    'bg-sky-500/15 text-sky-400',
  Customer: 'bg-emerald-500/15 text-emerald-400',
  Quote:    'bg-amber-500/15 text-amber-400',
  Supplier: 'bg-violet-500/15 text-violet-400',
  Expense:  'bg-rose-500/15 text-rose-400',
  Employee: 'bg-orange-500/15 text-orange-400',
};

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item);
    (acc[k] ??= []).push(item);
    return acc;
  }, {});
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // Click-outside close
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const json = await res.json() as { results: SearchResult[] };
        setResults(json.results ?? []);
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 300);
  }

  function handleClear() {
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  function handleResultClick() {
    setOpen(false);
    setQuery('');
    setResults([]);
  }

  const grouped = groupBy(results, r => r.type);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => { if (query.length >= 2) setOpen(true); }}
          placeholder="Search… (⌘K)"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-2 pl-9 pr-8 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700 transition-colors"
        />
        {loading && (
          <Loader2 className="absolute right-3 h-3.5 w-3.5 text-zinc-500 animate-spin" />
        )}
        {!loading && query && (
          <button onClick={handleClear} className="absolute right-3 text-zinc-600 hover:text-zinc-400 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && query.length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 max-h-[420px] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
          {!loading && results.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-zinc-600">No results for &ldquo;{query}&rdquo;</p>
          )}

          {Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              <p className="sticky top-0 bg-zinc-950 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 border-b border-zinc-800/60">
                {type}
              </p>
              {items.map(result => (
                <Link
                  key={result.id}
                  href={result.href}
                  onClick={handleResultClick}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/60 transition-colors group"
                >
                  <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${TYPE_COLORS[type] ?? 'bg-zinc-800 text-zinc-400'}`}>
                    {type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-200 group-hover:text-white">
                      {result.label}
                    </p>
                    {result.sublabel && (
                      <p className="truncate text-xs text-zinc-500">{result.sublabel}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
