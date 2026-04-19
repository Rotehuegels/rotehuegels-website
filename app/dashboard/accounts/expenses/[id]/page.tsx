'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import DeleteButton from '@/components/DeleteButton';
import EditExpenseModal from '../EditExpenseModal';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const TYPE_LABEL: Record<string, string> = {
  salary: 'Salary', purchase: 'Purchase', tds_paid: 'TDS Paid',
  advance_tax: 'Advance Tax', gst_paid: 'GST Paid', other: 'Other',
};

const TYPE_COLOR: Record<string, string> = {
  salary:       'bg-sky-500/10 text-sky-400 border-sky-500/20',
  purchase:     'bg-violet-500/10 text-violet-400 border-violet-500/20',
  tds_paid:     'bg-amber-500/10 text-amber-400 border-amber-500/20',
  advance_tax:  'bg-orange-500/10 text-orange-400 border-orange-500/20',
  gst_paid:     'bg-rose-500/10 text-rose-400 border-rose-500/20',
  other:        'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

interface Expense {
  id: string;
  expense_type: string;
  category: string | null;
  description: string;
  vendor_name: string | null;
  vendor_gstin: string | null;
  amount: number;
  gst_input_credit: number;
  expense_date: string;
  reference_no: string | null;
  payment_mode: string | null;
  notes: string | null;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-zinc-200">{value ?? <span className="text-zinc-600">—</span>}</p>
    </div>
  );
}

export default function ExpenseDetailPage() {
  const { id }     = useParams<{ id: string }>();
  const router     = useRouter();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/accounts/expenses/${id}`);
    if (!res.ok) { router.push('/dashboard/accounts/expenses'); return; }
    const { data } = await res.json();
    setExpense(data);
    setLoading(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!expense) return null;

  return (
    <div className="p-6 max-w-[1800px] space-y-6">
      {/* Back + Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/d/expenses"
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-2 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> All Expenses
          </Link>
          <h1 className="text-xl font-bold text-white">{expense.description}</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{fmtDate(expense.expense_date)}</p>
        </div>
        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium border ${TYPE_COLOR[expense.expense_type] ?? TYPE_COLOR.other}`}>
          {TYPE_LABEL[expense.expense_type] ?? expense.expense_type}
        </span>
      </div>

      {/* Main details */}
      <div className={`${glass} p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`}>
        <Field label="Amount" value={
          <span className="text-lg font-bold text-rose-400">{fmt(expense.amount)}</span>
        } />
        <Field label="GST Input Credit" value={
          expense.gst_input_credit > 0
            ? <span className="text-emerald-400 font-semibold">{fmt(expense.gst_input_credit)}</span>
            : <span className="text-zinc-600">—</span>
        } />
        <Field label="Expense Date" value={fmtDate(expense.expense_date)} />
        <Field label="Category" value={expense.category} />
        <Field label="Vendor / Payee" value={expense.vendor_name} />
        <Field label="Vendor GSTIN" value={
          expense.vendor_gstin
            ? <span className="font-mono text-amber-400">{expense.vendor_gstin}</span>
            : null
        } />
        <Field label="Payment Mode" value={expense.payment_mode} />
        <Field label="Reference No." value={
          expense.reference_no
            ? <span className="font-mono">{expense.reference_no}</span>
            : null
        } />
        {expense.notes && (
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-zinc-300 whitespace-pre-line">{expense.notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-600 transition-colors"
        >
          Edit Expense
        </button>
        <DeleteButton
          entityName="expense"
          entityLabel={expense.description}
          deleteUrl={`/api/accounts/expenses/${id}`}
          redirectUrl="/dashboard/accounts/expenses"
        />
      </div>

      {editing && (
        <EditExpenseModal
          expense={expense}
          onClose={() => { setEditing(false); load(); }}
        />
      )}
    </div>
  );
}
