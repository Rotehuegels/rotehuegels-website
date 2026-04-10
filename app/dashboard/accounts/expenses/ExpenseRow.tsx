'use client';

import { useState } from 'react';
import { Pencil, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import EditExpenseModal from './EditExpenseModal';

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

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

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

export default function ExpenseRow({ expense }: { expense: Expense }) {
  const [editing, setEditing] = useState(false);
  const e = expense;

  return (
    <>
      <div
        className="flex flex-col lg:grid lg:grid-cols-[1fr_120px_120px_1fr_1fr_80px_80px] gap-2 lg:gap-4 px-6 py-4 items-start lg:items-center hover:bg-zinc-800/20 transition-colors">
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
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg border border-zinc-700 bg-zinc-800/60 p-1.5 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
            title="Edit expense"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <Link href={`/dashboard/accounts/expenses/${e.id}`}
            className="rounded-lg border border-zinc-700 bg-zinc-800/60 p-1.5 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
            title="View details">
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
      {editing && <EditExpenseModal expense={e} onClose={() => setEditing(false)} />}
    </>
  );
}
