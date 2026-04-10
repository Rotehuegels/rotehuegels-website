'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, Circle, Search, X, Loader2, Wand2,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function isoToDisplay(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${parseInt(d)} ${MONTHS[parseInt(m) - 1]} ${y}`;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

type Tab = 'all' | 'unreconciled' | 'reconciled';

interface BankTxn {
  id:                  string;
  account_no:          string | null;
  statement_from:      string | null;
  statement_to:        string | null;
  txn_date:            string;
  value_date:          string;
  description:         string;
  ref_no:              string | null;
  branch_code:         string | null;
  debit:               number;
  credit:              number;
  balance:             number | null;
  reconciled:          boolean | null;
  reconciled_at:       string | null;
  matched_entity_type: string | null;
  matched_entity_id:   string | null;
  match_notes:         string | null;
}

interface OrderPaymentResult {
  id: string;
  order_id: string;
  payment_date: string;
  amount_received: number;
  net_received: number | null;
  tds_deducted: number | null;
  reference_no: string | null;
  notes: string | null;
  orders: { order_no: string; client_name: string };
}

interface ExpenseResult {
  id: string;
  expense_date: string;
  amount: number;
  description: string;
  vendor_name: string | null;
  reference_no: string | null;
  expense_type: string;
}

interface Props {
  txns: BankTxn[];
}

export default function BankReconcileClient({ txns }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('all');
  const [matchingTxnId, setMatchingTxnId] = useState<string | null>(null);
  const [entityType, setEntityType] = useState<'order_payment' | 'expense' | 'other'>('order_payment');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(OrderPaymentResult | ExpenseResult)[]>([]);
  const [searching, setSearching] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [autoReconciling, setAutoReconciling] = useState(false);
  const [autoResult, setAutoResult] = useState<string | null>(null);
  const [otherNotes, setOtherNotes] = useState('');

  const reconciledCount   = txns.filter(t => t.reconciled).length;
  const unreconciledCount = txns.length - reconciledCount;
  const reconciledPct     = txns.length > 0 ? Math.round((reconciledCount / txns.length) * 100) : 0;

  const filtered = tab === 'all'
    ? txns
    : tab === 'reconciled'
    ? txns.filter(t => t.reconciled)
    : txns.filter(t => !t.reconciled);

  const totalCredits     = txns.reduce((s, t) => s + (t.credit ?? 0), 0);
  const totalDebits      = txns.reduce((s, t) => s + (t.debit ?? 0), 0);
  const unreconCredits   = txns.filter(t => !t.reconciled && t.credit > 0).reduce((s, t) => s + t.credit, 0);
  const unreconDebits    = txns.filter(t => !t.reconciled && t.debit > 0).reduce((s, t) => s + t.debit, 0);

  const doSearch = useCallback(async (type: string, q: string) => {
    if (type === 'other') { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/accounts/bank/search-entities?type=${type}&q=${encodeURIComponent(q)}`);
      const json = await res.json();
      setSearchResults(json.data ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  function openMatchDialog(txnId: string, isCredit: boolean) {
    setMatchingTxnId(txnId);
    const defaultType = isCredit ? 'order_payment' : 'expense';
    setEntityType(defaultType);
    setSearchQuery('');
    setSearchResults([]);
    setOtherNotes('');
    doSearch(defaultType, '');
  }

  async function handleReconcile(entityId?: string, notes?: string) {
    if (!matchingTxnId) return;
    setReconciling(true);
    try {
      const res = await fetch('/api/accounts/bank/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: matchingTxnId,
          entityType,
          entityId: entityId || undefined,
          notes: notes || undefined,
        }),
      });
      if (res.ok) {
        setMatchingTxnId(null);
        router.refresh();
      }
    } finally {
      setReconciling(false);
    }
  }

  async function handleUnreconcile(txnId: string) {
    const res = await fetch(`/api/accounts/bank/reconcile?transactionId=${txnId}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
  }

  async function handleAutoReconcile() {
    setAutoReconciling(true);
    setAutoResult(null);
    try {
      const res = await fetch('/api/accounts/bank/auto-reconcile', { method: 'POST' });
      const json = await res.json();
      setAutoResult(`Auto-matched ${json.matched} transaction${json.matched === 1 ? '' : 's'}.`);
      if (json.matched > 0) router.refresh();
    } catch {
      setAutoResult('Auto-reconcile failed.');
    } finally {
      setAutoReconciling(false);
    }
  }

  const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

  return (
    <>
      {/* Reconciliation summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Total Transactions', value: String(txns.length), color: 'text-zinc-200', sub: null },
          { label: 'Reconciled',   value: String(reconciledCount),   color: 'text-emerald-400', sub: null },
          { label: 'Unreconciled', value: String(unreconciledCount), color: 'text-amber-400',   sub: null },
          { label: 'Reconciliation %', value: `${reconciledPct}%`,   color: reconciledPct >= 80 ? 'text-emerald-400' : reconciledPct >= 50 ? 'text-amber-400' : 'text-rose-400', sub: null },
          { label: 'Unreconciled Amt', value: fmt(unreconCredits + unreconDebits), color: 'text-rose-400', sub: `Cr ${fmt(unreconCredits)} / Dr ${fmt(unreconDebits)}` },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className={`${glass} p-4`}>
            <p className="text-xs text-zinc-500">{label}</p>
            <p className={`text-lg font-black mt-1 ${color}`}>{value}</p>
            {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Toolbar: tabs + auto-reconcile */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1">
          {(['all', 'unreconciled', 'reconciled'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t}
              <span className="ml-1.5 text-xs opacity-60">
                {t === 'all' ? txns.length : t === 'reconciled' ? reconciledCount : unreconciledCount}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {autoResult && (
            <span className={`text-sm ${autoResult.includes('0 ') ? 'text-zinc-400' : 'text-emerald-400'}`}>
              {autoResult}
            </span>
          )}
          <button
            onClick={handleAutoReconcile}
            disabled={autoReconciling || unreconciledCount === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700/60 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {autoReconciling ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Auto-matching...</>
            ) : (
              <><Wand2 className="h-4 w-4 text-violet-400" /> Auto-Reconcile</>
            )}
          </button>
        </div>
      </div>

      {/* Transactions table */}
      <div className={`${glass} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap">Date</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Description</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap">Ref No</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 text-right whitespace-nowrap">Debit</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 text-right whitespace-nowrap">Credit</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 text-right whitespace-nowrap">Balance</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 text-center whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500 text-sm">
                    No transactions in this view.
                  </td>
                </tr>
              )}
              {filtered.map((t) => {
                const isDebit  = t.debit > 0;
                const isCredit = t.credit > 0;
                const isRecon  = !!t.reconciled;
                return (
                  <tr
                    key={t.id}
                    className={[
                      'border-b border-zinc-800/60 transition-colors',
                      isDebit  ? 'hover:bg-rose-500/5'    : '',
                      isCredit ? 'hover:bg-emerald-500/5' : '',
                      !isDebit && !isCredit ? 'hover:bg-zinc-800/30' : '',
                    ].join(' ')}
                  >
                    <td className="px-4 py-3 font-mono text-zinc-400 whitespace-nowrap text-xs">
                      {isoToDisplay(t.txn_date)}
                    </td>
                    <td className="px-4 py-3 text-zinc-300 max-w-xs">
                      <p className="line-clamp-2 leading-snug">{t.description}</p>
                      {isRecon && t.matched_entity_type && (
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Matched: {t.matched_entity_type.replace('_', ' ')}
                          {t.match_notes && ` — ${t.match_notes}`}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-500 text-xs whitespace-nowrap max-w-[160px] truncate">
                      {t.ref_no ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-right whitespace-nowrap tabular-nums">
                      {isDebit
                        ? <span className="text-rose-400">{fmt(t.debit)}</span>
                        : <span className="text-zinc-700">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 font-mono text-right whitespace-nowrap tabular-nums">
                      {isCredit
                        ? <span className="text-emerald-400">{fmt(t.credit)}</span>
                        : <span className="text-zinc-700">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 font-mono text-right text-zinc-300 whitespace-nowrap tabular-nums">
                      {t.balance != null ? fmt(t.balance) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {isRecon ? (
                        <button
                          onClick={() => handleUnreconcile(t.id)}
                          title="Click to un-reconcile"
                          className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-xs">Matched</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => openMatchDialog(t.id, isCredit)}
                          className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          <Circle className="h-4 w-4" />
                          <span className="text-xs">Match</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Match Dialog */}
      {matchingTxnId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Match Transaction</h3>
              <button onClick={() => setMatchingTxnId(null)} className="text-zinc-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Show transaction being matched */}
            {(() => {
              const txn = txns.find(t => t.id === matchingTxnId);
              if (!txn) return null;
              return (
                <div className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-3 mb-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">{isoToDisplay(txn.txn_date)}</span>
                    <span className={txn.credit > 0 ? 'text-emerald-400 font-mono font-bold' : 'text-rose-400 font-mono font-bold'}>
                      {txn.credit > 0 ? (
                        <span className="inline-flex items-center gap-1"><ArrowDownRight className="h-3.5 w-3.5" />{fmt(txn.credit)}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1"><ArrowUpRight className="h-3.5 w-3.5" />{fmt(txn.debit)}</span>
                      )}
                    </span>
                  </div>
                  <p className="text-zinc-300 mt-1 line-clamp-2">{txn.description}</p>
                </div>
              );
            })()}

            {/* Entity type selector */}
            <div className="flex gap-2 mb-4">
              {([
                { value: 'order_payment' as const, label: 'Order Payment' },
                { value: 'expense' as const,       label: 'Expense' },
                { value: 'other' as const,         label: 'Other' },
              ]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setEntityType(opt.value); setSearchQuery(''); setSearchResults([]); doSearch(opt.value, ''); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    entityType === opt.value
                      ? 'bg-zinc-700 text-white'
                      : 'text-zinc-400 hover:text-zinc-200 border border-zinc-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {entityType !== 'other' ? (
              <>
                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); doSearch(entityType, e.target.value); }}
                    placeholder={entityType === 'order_payment' ? 'Search by amount or order no...' : 'Search by amount or description...'}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800/60 pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                {/* Results */}
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {searching && (
                    <div className="flex items-center justify-center py-6 text-zinc-400">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Searching...
                    </div>
                  )}
                  {!searching && searchResults.length === 0 && (
                    <p className="py-6 text-center text-sm text-zinc-500">
                      {searchQuery ? 'No matches found.' : 'All recent entries shown below.'}
                    </p>
                  )}
                  {!searching && searchResults.map((r) => {
                    if (entityType === 'order_payment') {
                      const p = r as OrderPaymentResult;
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleReconcile(p.id)}
                          disabled={reconciling}
                          className="w-full text-left rounded-xl border border-zinc-800 bg-zinc-800/30 hover:bg-zinc-700/40 p-3 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-200 font-medium">
                              {p.orders?.order_no} — {p.orders?.client_name}
                            </span>
                            <span className="text-emerald-400 font-mono text-sm font-bold">
                              {fmt(p.net_received ?? p.amount_received)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                            <span>{isoToDisplay(p.payment_date)}</span>
                            {p.reference_no && <span>Ref: {p.reference_no}</span>}
                            {(p.tds_deducted ?? 0) > 0 && <span>TDS: {fmt(p.tds_deducted!)}</span>}
                          </div>
                        </button>
                      );
                    } else {
                      const e = r as ExpenseResult;
                      return (
                        <button
                          key={e.id}
                          onClick={() => handleReconcile(e.id)}
                          disabled={reconciling}
                          className="w-full text-left rounded-xl border border-zinc-800 bg-zinc-800/30 hover:bg-zinc-700/40 p-3 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-200 font-medium">{e.description}</span>
                            <span className="text-rose-400 font-mono text-sm font-bold">{fmt(e.amount)}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                            <span>{isoToDisplay(e.expense_date)}</span>
                            <span className="capitalize">{e.expense_type.replace('_', ' ')}</span>
                            {e.vendor_name && <span>{e.vendor_name}</span>}
                          </div>
                        </button>
                      );
                    }
                  })}
                </div>
              </>
            ) : (
              /* Other — just notes */
              <div className="space-y-3">
                <textarea
                  value={otherNotes}
                  onChange={e => setOtherNotes(e.target.value)}
                  placeholder="Add notes for this reconciliation..."
                  rows={3}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
                />
                <button
                  onClick={() => handleReconcile(undefined, otherNotes)}
                  disabled={reconciling || !otherNotes.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {reconciling ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Mark as Reconciled
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
