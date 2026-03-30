import { supabaseAdmin } from '@/lib/supabaseAdmin';
import AddExpenseForm from './AddExpenseForm';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

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

export default async function ExpensesPage() {
  const { data: expenses } = await supabaseAdmin
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false });

  const list = expenses ?? [];

  // Totals by type
  const byType = list.reduce((acc, e) => {
    acc[e.expense_type] = (acc[e.expense_type] ?? 0) + (e.amount ?? 0);
    return acc;
  }, {} as Record<string, number>);

  const grandTotal = list.reduce((s, e) => s + (e.amount ?? 0), 0);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Expenses</h1>
        <p className="mt-1 text-sm text-zinc-400">{list.length} records — Total: {fmt(grandTotal)}</p>
      </div>

      {/* Summary by type */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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

      {/* Expenses table */}
      <div className={glass}>
        {!list.length ? (
          <p className="p-12 text-center text-sm text-zinc-600">No expenses recorded yet.</p>
        ) : (
          <>
            <div className="hidden lg:grid grid-cols-[1fr_120px_120px_1fr_1fr_80px] gap-4 px-6 py-3 border-b border-zinc-800/60 text-[11px] font-medium uppercase tracking-wider text-zinc-600">
              <span>Description</span><span>Type</span><span className="text-right">Amount</span>
              <span>Vendor</span><span>Date</span><span>Ref</span>
            </div>
            <div className="divide-y divide-zinc-800/60">
              {list.map(e => (
                <div key={e.id}
                  className="flex flex-col lg:grid lg:grid-cols-[1fr_120px_120px_1fr_1fr_80px] gap-2 lg:gap-4 px-6 py-4 items-start lg:items-center hover:bg-zinc-800/20 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{e.description}</p>
                    {e.category && <p className="text-xs text-zinc-600">{e.category}</p>}
                    {e.notes && <p className="text-xs text-zinc-600 truncate">{e.notes}</p>}
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${TYPE_COLOR[e.expense_type] ?? TYPE_COLOR.other}`}>
                    {TYPE_LABEL[e.expense_type] ?? e.expense_type}
                  </span>
                  <p className="text-sm font-semibold text-right text-rose-400">{fmt(e.amount)}</p>
                  <div className="min-w-0">
                    {e.vendor_name && <p className="text-sm text-zinc-400 truncate">{e.vendor_name}</p>}
                    {e.vendor_gstin && <p className="text-xs text-zinc-600 font-mono">{e.vendor_gstin}</p>}
                  </div>
                  <p className="text-sm text-zinc-400">{fmtDate(e.expense_date)}</p>
                  <p className="text-xs text-zinc-600 font-mono truncate">{e.reference_no ?? '—'}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
