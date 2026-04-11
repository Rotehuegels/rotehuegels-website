'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Search } from 'lucide-react';

const input = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none transition-colors';

const STATUSES = ['all', 'draft', 'under_review', 'approved', 'obsolete'] as const;
const TYPES = ['all', 'invoice', 'quote', 'purchase_order', 'proforma', 'pl_statement', 'gst_report', 'customer_statement', 'policy', 'procedure', 'form', 'record'] as const;
const DEPARTMENTS = ['all', 'accounts', 'hr', 'procurement', 'quality', 'management'] as const;

const TYPE_LABELS: Record<string, string> = {
  invoice: 'Invoice',
  quote: 'Quote',
  purchase_order: 'Purchase Order',
  proforma: 'Proforma',
  pl_statement: 'P&L Statement',
  gst_report: 'GST Report',
  customer_statement: 'Customer Statement',
  policy: 'Policy',
  procedure: 'SOP',
  form: 'Form',
  record: 'Record',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  under_review: 'Under Review',
  approved: 'Approved',
  obsolete: 'Obsolete',
};

export default function DocumentsFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get('q') ?? '';
  const status = searchParams.get('status') ?? 'all';
  const type = searchParams.get('type') ?? 'all';
  const department = searchParams.get('department') ?? 'all';

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/dashboard/documents?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
        <input
          type="text"
          placeholder="Search by doc number or title..."
          defaultValue={q}
          onKeyDown={e => { if (e.key === 'Enter') update('q', (e.target as HTMLInputElement).value); }}
          onBlur={e => update('q', e.target.value)}
          className={`${input} pl-10`}
        />
      </div>
      <select
        value={type}
        onChange={e => update('type', e.target.value)}
        className={`${input} w-auto min-w-[160px]`}
      >
        {TYPES.map(t => (
          <option key={t} value={t}>{t === 'all' ? 'All Types' : TYPE_LABELS[t] ?? t}</option>
        ))}
      </select>
      <select
        value={status}
        onChange={e => update('status', e.target.value)}
        className={`${input} w-auto min-w-[150px]`}
      >
        {STATUSES.map(s => (
          <option key={s} value={s}>{s === 'all' ? 'All Statuses' : STATUS_LABELS[s] ?? s}</option>
        ))}
      </select>
      <select
        value={department}
        onChange={e => update('department', e.target.value)}
        className={`${input} w-auto min-w-[150px]`}
      >
        {DEPARTMENTS.map(d => (
          <option key={d} value={d}>{d === 'all' ? 'All Departments' : d.charAt(0).toUpperCase() + d.slice(1)}</option>
        ))}
      </select>
    </div>
  );
}
