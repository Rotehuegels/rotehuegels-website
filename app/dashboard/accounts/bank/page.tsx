import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Landmark } from 'lucide-react';
import BankImportPanel from './BankImportPanel';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function isoToDisplay(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${parseInt(d)} ${MONTHS[parseInt(m) - 1]} ${y}`;
}

interface BankTxn {
  id:            string;
  account_no:    string | null;
  statement_from: string | null;
  statement_to:  string | null;
  txn_date:      string;
  value_date:    string;
  description:   string;
  ref_no:        string | null;
  branch_code:   string | null;
  debit:         number;
  credit:        number;
  balance:       number | null;
}

export default async function BankPage() {
  const { data, error } = await supabaseAdmin
    .from('bank_transactions')
    .select('*')
    .order('txn_date', { ascending: false });

  const txns: BankTxn[] = data ?? [];

  const totalCredits = txns.reduce((s, t) => s + (t.credit ?? 0), 0);
  const totalDebits  = txns.reduce((s, t) => s + (t.debit  ?? 0), 0);
  const net          = totalCredits - totalDebits;
  const closing      = txns[0]?.balance ?? 0;

  const latest = txns[0];
  const accountNo    = latest?.account_no    ?? null;
  const stmtFrom     = latest?.statement_from ?? null;
  const stmtTo       = latest?.statement_to   ?? null;

  return (
    <div className="p-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Landmark className="h-6 w-6 text-amber-400" />
            Bank Statement
          </h1>
          <p className="mt-1 text-sm text-zinc-400">SBI — imported transactions</p>
        </div>
        <BankImportPanel />
      </div>

      {error && (
        <div className={`${glass} p-4 text-rose-400 text-sm`}>
          Failed to load transactions: {error.message}
        </div>
      )}

      {/* Account banner */}
      {(accountNo || stmtFrom) && (
        <div className="flex flex-wrap gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-3 text-sm">
          {accountNo && (
            <span className="text-zinc-400">
              Account: <span className="font-mono text-zinc-200">{accountNo}</span>
            </span>
          )}
          {stmtFrom && stmtTo && (
            <span className="text-zinc-400">
              Period: <span className="text-zinc-200">{isoToDisplay(stmtFrom)} – {isoToDisplay(stmtTo)}</span>
            </span>
          )}
        </div>
      )}

      {txns.length === 0 && !error ? (
        <div className={`${glass} p-16 text-center`}>
          <Landmark className="h-10 w-10 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 text-sm font-medium">No transactions imported yet.</p>
          <p className="text-zinc-600 text-xs mt-1">
            Export your SBI statement as CSV and use the import button above.
          </p>
        </div>
      ) : txns.length > 0 ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Credits',   value: totalCredits, color: 'text-emerald-400' },
              { label: 'Total Debits',    value: totalDebits,  color: 'text-rose-400'    },
              { label: 'Net Flow',        value: net,          color: net >= 0 ? 'text-emerald-400' : 'text-rose-400' },
              { label: 'Closing Balance', value: closing,      color: 'text-amber-400'   },
            ].map(({ label, value, color }) => (
              <div key={label} className={`${glass} p-4`}>
                <p className="text-xs text-zinc-500">{label}</p>
                <p className={`text-lg font-black mt-1 ${color}`}>{fmt(value)}</p>
              </div>
            ))}
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
                  </tr>
                </thead>
                <tbody>
                  {txns.map((t) => {
                    const isDebit  = t.debit  > 0;
                    const isCredit = t.credit > 0;
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
