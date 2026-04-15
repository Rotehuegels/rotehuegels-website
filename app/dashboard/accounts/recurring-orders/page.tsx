import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { RefreshCw, Plus, CheckCircle2, PauseCircle, Calendar, Clock } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const FREQ_LABEL: Record<string, string> = { weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' };
const FREQ_COLOR: Record<string, string> = { weekly: 'text-sky-400', monthly: 'text-emerald-400', quarterly: 'text-amber-400', yearly: 'text-indigo-400' };

export default async function RecurringOrdersPage() {
  const { data: templates } = await supabaseAdmin
    .from('recurring_order_templates')
    .select('*, customers(name, customer_id)')
    .order('next_run_date', { ascending: true });

  const list = templates ?? [];
  const active = list.filter(t => t.is_active);
  const paused = list.filter(t => !t.is_active);
  const totalMonthly = active
    .filter(t => t.frequency === 'monthly')
    .reduce((s, t) => s + (t.total_value ?? 0), 0);
  const dueThisWeek = active.filter(t => {
    const diff = (new Date(t.next_run_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });

  return (
    <div className="p-5 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-6 w-6 text-indigo-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Recurring Orders</h1>
            <p className="mt-0.5 text-sm text-zinc-500">{active.length} active templates</p>
          </div>
        </div>
        <Link href="/d/orders/new" className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-500 transition-colors">
          <Plus className="h-4 w-4" /> New Template
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`${glass} p-4`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Active</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{active.length}</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Paused</p>
          <p className="text-2xl font-black text-zinc-500 mt-1">{paused.length}</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Monthly Value</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{fmt(totalMonthly)}</p>
        </div>
        <div className={`${glass} p-4`}>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-rose-400" />
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Due This Week</p>
          </div>
          <p className={`text-2xl font-black mt-1 ${dueThisWeek.length > 0 ? 'text-rose-400' : 'text-zinc-600'}`}>{dueThisWeek.length}</p>
        </div>
      </div>

      {dueThisWeek.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl bg-rose-500/5 border border-rose-500/20 px-4 py-3">
          <Clock className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-sm text-rose-400">
            {dueThisWeek.length} order{dueThisWeek.length > 1 ? 's' : ''} due this week: {dueThisWeek.map(t => `${t.template_name} (${fmtDate(t.next_run_date)})`).join(', ')}
          </div>
        </div>
      )}

      <div className={glass}>
        {list.length === 0 ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No recurring order templates yet.</p>
            <p className="text-xs text-zinc-600 mt-1">Create templates for orders that repeat on a schedule.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {list.map((t: any) => {
              const customer = t.customers as { name: string; customer_id: string } | null;
              const daysUntil = Math.ceil((new Date(t.next_run_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const overdue = daysUntil < 0;
              return (
                <div key={t.id} className="px-6 py-4 hover:bg-zinc-800/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {t.is_active ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <PauseCircle className="h-4 w-4 text-zinc-600 shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-white">{t.template_name}</p>
                        <p className="text-xs text-zinc-500">
                          {customer?.name ?? t.client_name} &middot; {t.order_type} &middot; {fmt(t.total_value)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${FREQ_COLOR[t.frequency] ?? 'text-zinc-400'}`}>
                        {FREQ_LABEL[t.frequency] ?? t.frequency}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3 text-zinc-600" />
                        <p className={`text-xs ${overdue ? 'text-rose-400 font-bold' : 'text-zinc-500'}`}>
                          {overdue ? `Overdue by ${Math.abs(daysUntil)}d` : daysUntil === 0 ? 'Due today' : `In ${daysUntil}d`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
