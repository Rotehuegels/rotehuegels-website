import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, FileText } from 'lucide-react';
import IfCan from '@/components/IfCan';
import { Suspense } from 'react';
import QuotesFilterBar from './QuotesFilterBar';
import Pagination from '../Pagination';

export const dynamic = 'force-dynamic';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_COLORS: Record<string, string> = {
  draft:     'bg-zinc-800 text-zinc-400',
  sent:      'bg-blue-500/10 text-blue-400',
  accepted:  'bg-green-500/10 text-green-400',
  rejected:  'bg-red-500/10 text-red-400',
  expired:   'bg-orange-500/10 text-orange-400',
  converted: 'bg-amber-500/10 text-amber-400',
};

const PAGE_SIZE = 25;

export default async function QuotesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard/accounts/quotes');

  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : '';
  const statusFilter = typeof sp.status === 'string' ? sp.status : 'all';
  const page = Math.max(1, parseInt(typeof sp.page === 'string' ? sp.page : '1', 10) || 1);

  // Count query
  let countQuery = supabaseAdmin
    .from('quotes')
    .select('id', { count: 'exact', head: true });

  if (statusFilter !== 'all') {
    countQuery = countQuery.eq('status', statusFilter);
  }

  // For search, we need to filter by quote_no or customer name
  // Since customer name is in a joined table, we filter after fetch for search
  // But we can filter quote_no directly
  if (q) {
    countQuery = countQuery.or(`quote_no.ilike.%${q}%`);
  }

  const { count: totalCount } = await countQuery;
  const total = totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const from = (safePage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Data query
  let dataQuery = supabaseAdmin
    .from('quotes')
    .select(`
      id, quote_no, quote_date, valid_until, total_amount, status, created_at,
      customers(customer_id, name, state)
    `);

  if (statusFilter !== 'all') {
    dataQuery = dataQuery.eq('status', statusFilter);
  }

  if (q) {
    dataQuery = dataQuery.or(`quote_no.ilike.%${q}%`);
  }

  const { data: allQuotes } = await dataQuery
    .order('created_at', { ascending: false });

  // Client-side filter for customer name search (Supabase doesn't support ilike on joined columns in .or())
  let filtered = allQuotes ?? [];
  if (q) {
    const lower = q.toLowerCase();
    filtered = filtered.filter(qItem => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const customer = qItem.customers as any;
      return (
        qItem.quote_no?.toLowerCase().includes(lower) ||
        customer?.name?.toLowerCase().includes(lower)
      );
    });
  }

  const filteredTotal = filtered.length;
  const filteredTotalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));
  const filteredSafePage = Math.min(safePage, filteredTotalPages);
  const sliceFrom = (filteredSafePage - 1) * PAGE_SIZE;
  const quotes = filtered.slice(sliceFrom, sliceFrom + PAGE_SIZE);

  return (
    <div className="p-6 max-w-[1800px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Quotations</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{filteredTotal} total</p>
        </div>
        <IfCan permission="sales.create">
          <Link
            href="/d/quotes/new"
            className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 transition-colors"
          >
            <Plus className="h-4 w-4" /> New Quote
          </Link>
        </IfCan>
      </div>

      {/* Filter bar */}
      <div className="mb-4">
        <Suspense fallback={null}>
          <QuotesFilterBar />
        </Suspense>
      </div>

      {!quotes?.length ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-zinc-700 mb-3" />
          <p className="text-zinc-500 text-sm">{q || statusFilter !== 'all' ? 'No quotations match your filters.' : 'No quotations yet.'}</p>
          {!q && statusFilter === 'all' && (
            <Link href="/d/quotes/new" className="mt-3 inline-block text-amber-400 text-sm hover:underline">
              Create your first quote →
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60">
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Quote No</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Customer</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Valid Until</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {quotes.map(q => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const customer = q.customers as any;
                return (
                  <tr key={q.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-amber-400 font-semibold">{q.quote_no}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-white text-sm">{customer?.name ?? '—'}</div>
                      {customer?.state && (
                        <div className="text-xs text-zinc-500">{customer.state}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400 text-xs">{fmtDate(q.quote_date)}</td>
                    <td className="px-5 py-3.5 text-zinc-400 text-xs">
                      {q.valid_until ? fmtDate(q.valid_until) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-sm text-white">
                      {fmt(q.total_amount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[q.status] ?? ''}`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href={`/d/quotes/${q.id}`} className="text-xs text-amber-400 hover:underline">
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <Suspense fallback={null}>
            <Pagination page={filteredSafePage} totalPages={filteredTotalPages} basePath="/dashboard/accounts/quotes" />
          </Suspense>
        </div>
      )}
    </div>
  );
}
