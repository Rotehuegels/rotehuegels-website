'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FileText, Search, Filter } from 'lucide-react';
import { ALL_SOPS, DEPARTMENTS } from '@/lib/sops';
import { useState, useMemo } from 'react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const DEPT_COLORS: Record<string, string> = {
  Accounts:           'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Human Resources':  'bg-violet-500/10 text-violet-400 border-violet-500/20',
  Recruitment:        'bg-pink-500/10 text-pink-400 border-pink-500/20',
  Operations:         'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Sales:              'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Procurement:        'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Finance:            'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Projects:           'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  IT:                 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  Quality:            'bg-teal-500/10 text-teal-400 border-teal-500/20',
  Network:            'bg-lime-500/10 text-lime-400 border-lime-500/20',
};

export default function SOPListPage() {
  const searchParams = useSearchParams();
  const initialDept = searchParams.get('dept') ?? 'all';

  const [query, setQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState(initialDept);

  const filtered = useMemo(() => {
    let results = ALL_SOPS;
    if (deptFilter !== 'all') results = results.filter(s => s.department === deptFilter);
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(
        s => s.id.toLowerCase().includes(q) || s.title.toLowerCase().includes(q) || s.category.toLowerCase().includes(q),
      );
    }
    return results;
  }, [query, deptFilter]);

  // Group by department
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const sop of filtered) {
      const arr = map.get(sop.department) ?? [];
      arr.push(sop);
      map.set(sop.department, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="p-5 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-emerald-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Standard Operating Procedures</h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              {ALL_SOPS.length} SOPs across all ERP functions
            </p>
          </div>
        </div>
        <Link
          href="/d/ims"
          className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-600 transition-colors"
        >
          Back to IMS
        </Link>
      </div>

      {/* Filters */}
      <div className={`${glass} p-4 flex flex-col md:flex-row gap-3`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search SOPs by ID, title, or category..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/60 pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800/60 pl-10 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer"
          >
            <option value="all">All Departments</option>
            {DEPARTMENTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-zinc-500">
        Showing {filtered.length} of {ALL_SOPS.length} SOPs
        {deptFilter !== 'all' ? ` in ${deptFilter}` : ''}
      </p>

      {/* SOP List grouped by department */}
      {filtered.length === 0 ? (
        <div className={`${glass} p-12 text-center`}>
          <Search className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No SOPs match your search.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([dept, sops]) => (
            <div key={dept}>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3 px-1">
                {dept} <span className="text-zinc-600">({sops.length})</span>
              </h2>
              <div className={glass}>
                <div className="divide-y divide-zinc-800/60">
                  {sops.map(sop => (
                    <Link
                      key={sop.id}
                      href={`/d/ims/sops/${sop.id}`}
                      className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 px-6 py-4 hover:bg-zinc-800/20 transition-colors"
                    >
                      <div className="md:w-32 shrink-0">
                        <span className="text-sm font-mono font-semibold text-amber-400">{sop.id}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{sop.title}</p>
                        <p className="text-xs text-zinc-500 mt-0.5 truncate">{sop.purpose.slice(0, 120)}...</p>
                      </div>
                      <div className="shrink-0">
                        <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${DEPT_COLORS[sop.department] ?? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                          {sop.category}
                        </span>
                      </div>
                      <div className="shrink-0 text-right md:w-20">
                        <span className="text-xs font-mono text-zinc-500">v{sop.version}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
