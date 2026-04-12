import { supabaseAdmin } from '@/lib/supabaseAdmin';
import AddExpenseForm from './AddExpenseForm';
import ExpenseRow from './ExpenseRow';
import { Suspense } from 'react';
import ExpensesFilterBar from './ExpensesFilterBar';
import Pagination from '../Pagination';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

const TYPE_LABEL: Record<string, string> = {
  salary: 'Salary', purchase: 'Purchase', tds_paid: 'TDS Paid',
  advance_tax: 'Advance Tax', gst_paid: 'GST Paid', other: 'Other',
};

const TYPE_COLOR: Record<string, string> = {
  salary: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  purchase: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  tds_paid: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  advance_tax: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  gst_paid: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  other: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const PAGE_SIZE = 25;

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : '';
  const typeFilter = typeof sp.type === 'string' ? sp.type : 'all';
  const page = Math.max(1, parseInt(typeof sp.page === 'string' ? sp.page : '1', 10) || 1);

  // Build query
  let query = supabaseAdmin
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false });

  if (typeFilter !== 'all') {
    query = query.eq('expense_type', typeFilter);
  }

  if (q) {
    query = query.or(`description.ilike.%${q}%,vendor_name.ilike.%${q}%`);
  }

  const { data: expenses } = await query;
  const allFiltered = expenses ?? [];

  // Pagination
  const total = allFiltered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const fromIdx = (safePage - 1) * PAGE_SIZE;
  const list = allFiltered.slice(fromIdx, fromIdx + PAGE_SIZE);

  // Totals by type (from all filtered)
  const byType = allFiltered.reduce((acc, e) => {
    acc[e.expense_type] = (acc[e.expense_type] ?? 0) + (e.amount ?? 0);
    return acc;
  }, {} as Record<string, number>);

  const grandTotal = allFiltered.reduce((s, e) => s + (e.amount ?? 0), 0);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Expenses</h1>
        <p className="mt-1 text-sm text-zinc-400">{total} records — Total: {fmt(grandTotal)}</p>
      </div>

      {/* Summary by type */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(TYPE_LABEL).map(([key, label]) => (
          <div key={key} className={`${glass} p-4`}>
            <p className="text-xs text-zinc-500">{label}</p>
            <p className={`text-sm font-bold mt-1 ${TYPE_COLOR[key].split(' ')[1]}`}>
              {fmt(byType[key] ?? 0)}
            </p>
          </div>
        ))}
      </div>

      {/* Add expense form */}
      <div className={`${glass} p-6`}>
        <h2 className="text-sm font-semibold text-zinc-300 mb-5">Add Expense</h2>
        <AddExpenseForm />
      </div>

      {/* Filter bar */}
      <Suspense fallback={null}>
        <ExpensesFilterBar />
      </Suspense>

      {/* Expenses table */}
      <div className={glass}>
        {!list.length ? (
          <p className="p-12 text-center text-sm text-zinc-600">No expenses found.</p>
        ) : (
          <>
            <div className="hidden lg:grid grid-cols-[1fr_120px_120px_1fr_1fr_80px_80px] gap-4 px-6 py-3 border-b border-zinc-800/60 text-[11px] font-medium uppercase tracking-wider text-zinc-600">
              <span>Description</span><span>Type</span><span className="text-right">Amount</span>
              <span>Vendor</span><span>Date</span><span>Ref</span><span></span>
            </div>
            <div className="divide-y divide-zinc-800/60">
              {list.map(e => (
                <ExpenseRow key={e.id} expense={e} />
              ))}
            </div>

            {/* Pagination */}
            <Suspense fallback={null}>
              <Pagination page={safePage} totalPages={totalPages} basePath="/dashboard/accounts/expenses" />
            </Suspense>
          </>
        )}
      </div>
    </div>
  );
}
