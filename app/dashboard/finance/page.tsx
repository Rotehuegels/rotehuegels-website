import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  Home, CreditCard, Landmark, TrendingUp, TrendingDown,
  Building2, CalendarClock, AlertCircle, CheckCircle2,
} from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const fmtCompact = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 2 }).format(n);

interface Loan {
  id: string;
  lender: string;
  loan_type: string;
  loan_code: string;
  emi_amount: number | null;
  due_day: number | null;
  outstanding: number;
  interest_rate: number | null;
  interest_paid: number | null;
  notes: string | null;
  as_of_date: string;
}

interface CreditCard {
  id: string;
  bank: string;
  card_code: string;
  max_limit: number;
  outstanding: number;
  statement_day: number | null;
  due_day: number | null;
  as_of_date: string;
}

interface Property {
  id: string;
  name: string;
  location: string;
  unit: string | null;
  status: string;
  possession_date: string | null;
  total_paid_builder: number | null;
  paid_via_loan: number | null;
  paid_own: number | null;
  stamp_duty: number | null;
  registration: number | null;
  interest_paid: number | null;
  balance_to_builder: number | null;
  loan_sanctioned: number | null;
  loan_principal_paid: number | null;
  flat_cost_all_in: number | null;
  current_market_value: number | null;
}

interface PropertyPayment {
  id: string;
  sno: number;
  invoice_date: string;
  amount: number;
  description: string | null;
  is_gst: boolean;
}

// Market value projections (from user's sheet, Sep-22 base ₹69L)
const MARKET_PROJECTION = [
  { year: 2022, value: 6900000,   rate: 0 },
  { year: 2023, value: 7176000,   rate: 4 },
  { year: 2024, value: 7463040,   rate: 4 },
  { year: 2025, value: 7761562,   rate: 4 },
  { year: 2026, value: 8072024,   rate: 4 },
  { year: 2027, value: 8394905,   rate: 5 },
  { year: 2028, value: 8730701,   rate: 5 },
  { year: 2029, value: 9079929,   rate: 5 },
  { year: 2030, value: 9443126,   rate: 5 },
  { year: 2032, value: 10213686,  rate: 6 },
  { year: 2035, value: 11489007,  rate: 6 },
  { year: 2037, value: 12426510,  rate: 7 },
  { year: 2040, value: 13978134,  rate: 8 },
  { year: 2045, value: 17006537,  rate: 9 },
  { year: 2047, value: 18394271,  rate: 10 },
];

const LOAN_TYPE_LABEL: Record<string, string> = {
  home_loan:     'Home Loan',
  personal_loan: 'Personal Loan',
  gold_loan:     'Gold Loan',
};

const LOAN_TYPE_COLOR: Record<string, string> = {
  home_loan:     'text-indigo-400 bg-indigo-500/10',
  personal_loan: 'text-sky-400 bg-sky-500/10',
  gold_loan:     'text-yellow-400 bg-yellow-500/10',
};

const BANK_COLOR: Record<string, string> = {
  HDFC:   'text-blue-400',
  ICICI:  'text-orange-400',
  AXIS:   'text-purple-400',
  SBI:    'text-sky-400',
  CRED:   'text-pink-400',
  REPCO:  'text-yellow-400',
  AMAZON: 'text-amber-400',
};

export default async function FinancePage() {
  const [
    { data: loansRaw },
    { data: cardsRaw },
    { data: propertyRaw },
    { data: paymentsRaw },
  ] = await Promise.all([
    supabaseAdmin.from('finance_loans').select('*').order('outstanding', { ascending: false }),
    supabaseAdmin.from('finance_credit_cards').select('*').order('max_limit', { ascending: false }),
    supabaseAdmin.from('finance_property').select('*').limit(1),
    supabaseAdmin.from('finance_property_payments').select('*').order('sno', { ascending: true }),
  ]);

  const loans    = (loansRaw    ?? []) as Loan[];
  const cards    = (cardsRaw    ?? []) as CreditCard[];
  const property = ((propertyRaw ?? [])[0]) as Property | undefined;
  const payments = (paymentsRaw ?? []) as PropertyPayment[];

  // Summary figures
  const totalLoanOutstanding = loans.reduce((s, l) => s + l.outstanding, 0);
  const totalCCOutstanding   = cards.reduce((s, c) => s + Math.max(0, c.outstanding), 0);
  const totalLiabilities     = totalLoanOutstanding + totalCCOutstanding;

  const totalEMI = loans
    .filter((l) => l.loan_type !== 'gold_loan')
    .reduce((s, l) => s + (l.emi_amount ?? 0), 0);

  const repcoMonthlyInterest = loans
    .filter((l) => l.loan_type === 'gold_loan')
    .reduce((s, l) => s + (l.outstanding * (l.interest_rate ?? 0)) / 100 / 12, 0);

  const totalMonthlyCommitment = totalEMI + repcoMonthlyInterest;

  // Net worth components (Mar-26 figures from user's data)
  const assetsLiquid    = 5870436.69;
  const assetsImmovable = property?.current_market_value ?? 7900000;
  const totalAssets     = assetsLiquid + assetsImmovable;
  const netWorth        = totalAssets - totalLiabilities;

  // CC utilization
  const totalCCLimit = cards.filter((c) => c.max_limit > 0).reduce((s, c) => s + c.max_limit, 0);
  const totalCCUsed  = cards.reduce((s, c) => s + Math.max(0, c.outstanding), 0);
  const ccUsagePct   = totalCCLimit > 0 ? (totalCCUsed / totalCCLimit) * 100 : 0;

  // Builder payment progress
  const totalFlat      = (property?.loan_sanctioned ?? 0) + (property?.balance_to_builder ?? 0);
  const paidBuilderPct = totalFlat > 0
    ? ((property?.total_paid_builder ?? 0) / (totalFlat + (property?.total_paid_builder ?? 0))) * 100
    : 0;

  const possessionDate = property?.possession_date
    ? new Date(property.possession_date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'Dec 2026';

  // Current year for projection highlight
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-5 p-5 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Finance</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Loans · Credit Cards · Property · Net Worth — as of Mar 2026</p>
        </div>
      </div>

      {/* Net Worth Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={`${glass} p-4`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Liquid Assets</p>
          <p className="mt-2 text-xl font-bold text-emerald-400">{fmtCompact(assetsLiquid)}</p>
          <p className="mt-0.5 text-xs text-zinc-600">Demat · Bank · Savings</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Immovable Assets</p>
          <p className="mt-2 text-xl font-bold text-indigo-400">{fmtCompact(assetsImmovable)}</p>
          <p className="mt-0.5 text-xs text-zinc-600">Kharghar flat (market)</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Total Liabilities</p>
          <p className="mt-2 text-xl font-bold text-rose-400">{fmtCompact(totalLiabilities)}</p>
          <p className="mt-0.5 text-xs text-zinc-600">Loans + CCs outstanding</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Net Worth</p>
          <div className="mt-2 flex items-center gap-1.5">
            {netWorth >= 0
              ? <TrendingUp className="h-5 w-5 text-emerald-400" />
              : <TrendingDown className="h-5 w-5 text-rose-400" />}
            <p className={`text-xl font-bold ${netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {fmtCompact(netWorth)}
            </p>
          </div>
          <p className="mt-0.5 text-xs text-zinc-600">Assets − Liabilities</p>
        </div>
      </div>

      {/* Property + Monthly Outflow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Property card — 2/3 width */}
        {property && (
          <div className={`${glass} lg:col-span-2`}>
            <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-3">
              <Home className="h-4 w-4 text-indigo-400" />
              <div>
                <p className="font-semibold text-white text-sm">{property.name} · {property.unit}</p>
                <p className="text-xs text-zinc-500">{property.location}</p>
              </div>
              <span className="ml-auto flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                <CalendarClock className="h-3 w-3" />
                Possession {possessionDate}
              </span>
            </div>

            <div className="p-5 space-y-5">
              {/* Key numbers */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Paid to Builder',    value: property.total_paid_builder ?? 0,    color: 'text-sky-400' },
                  { label: 'Balance to Builder', value: property.balance_to_builder ?? 0,    color: 'text-amber-400' },
                  { label: 'HDFC Sanctioned',    value: property.loan_sanctioned ?? 0,       color: 'text-indigo-400' },
                  { label: 'All-In Cost',        value: property.flat_cost_all_in ?? 0,       color: 'text-white' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl bg-zinc-800/40 p-3">
                    <p className="text-xs text-zinc-500">{label}</p>
                    <p className={`text-sm font-bold mt-1 ${color}`}>{fmtCompact(value)}</p>
                  </div>
                ))}
              </div>

              {/* Builder payment progress bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-zinc-400">Builder Payment Progress</p>
                  <p className="text-xs text-zinc-400 font-mono">{fmt(property.total_paid_builder ?? 0)} paid · {fmt(property.balance_to_builder ?? 0)} remaining</p>
                </div>
                <div className="h-2.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400"
                    style={{ width: `${Math.min(paidBuilderPct, 100).toFixed(1)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-zinc-600">Booking Aug 2022</p>
                  <p className="text-xs text-zinc-600">Possession Dec 2026</p>
                </div>
              </div>

              {/* Cost breakdown */}
              <div className="text-xs space-y-1 border-t border-zinc-800 pt-4">
                {[
                  { label: 'Paid to Builder (HDFC Loan)',  value: property.paid_via_loan ?? 0 },
                  { label: 'Paid to Builder (Own Funds)',  value: property.paid_own ?? 0 },
                  { label: 'Stamp Duty @7%',               value: property.stamp_duty ?? 0 },
                  { label: 'Registration',                  value: property.registration ?? 0 },
                  { label: 'HDFC Interest Paid (to date)', value: property.interest_paid ?? 0 },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-zinc-500">{label}</span>
                    <span className="text-zinc-300 font-mono">{fmt(value)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-zinc-800 pt-2 mt-2">
                  <span className="font-semibold text-zinc-300">All-In Cost (incl. interest)</span>
                  <span className="font-bold text-white font-mono">{fmt(property.flat_cost_all_in ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-zinc-400">Current Market Value</span>
                  <span className="font-bold text-emerald-400 font-mono">{fmt(property.current_market_value ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-zinc-500">Unrealised Gain vs All-In</span>
                  <span className={`font-semibold font-mono ${(property.current_market_value ?? 0) > (property.flat_cost_all_in ?? 0) ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {fmt((property.current_market_value ?? 0) - (property.flat_cost_all_in ?? 0))}
                    {' '}{(() => { const g = (((property.current_market_value ?? 0) / (property.flat_cost_all_in ?? 1)) - 1) * 100; return `(${g > 0 ? '+' : ''}${g.toFixed(1)}%)`; })()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly commitment — 1/3 width */}
        <div className={`${glass}`}>
          <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-3">
            <CalendarClock className="h-4 w-4 text-rose-400" />
            <h2 className="font-semibold text-white text-sm">Monthly Outflow</h2>
          </div>
          <div className="p-5 space-y-3">
            {loans.filter((l) => (l.emi_amount ?? 0) > 0 || l.loan_type === 'gold_loan').map((l) => {
              const monthly = l.loan_type === 'gold_loan'
                ? (l.outstanding * (l.interest_rate ?? 0)) / 100 / 12
                : (l.emi_amount ?? 0);
              const isGold = l.loan_type === 'gold_loan';
              return (
                <div key={l.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${BANK_COLOR[l.lender] ?? 'text-zinc-400'}`}>{l.lender}</span>
                    <span className="text-xs text-zinc-600">{l.loan_code}</span>
                    {isGold && <span className="text-xs bg-yellow-500/10 text-yellow-400 rounded px-1">interest</span>}
                  </div>
                  <span className="text-sm font-semibold text-zinc-200 font-mono">{fmt(monthly)}</span>
                </div>
              );
            })}
            <div className="border-t border-zinc-700 pt-3 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">EMIs only</span>
                <span className="font-bold text-rose-400 font-mono">{fmt(totalEMI)}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-zinc-400">REPCO interest</span>
                <span className="font-semibold text-yellow-400 font-mono">{fmt(repcoMonthlyInterest)}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-semibold text-zinc-300">Total Monthly</span>
                <span className="text-lg font-bold text-white font-mono">{fmt(totalMonthlyCommitment)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loans Table */}
      <div className={glass}>
        <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-3">
          <Landmark className="h-4 w-4 text-sky-400" />
          <h2 className="font-semibold text-white text-sm">Loans</h2>
          <span className="ml-auto text-xs text-zinc-500">
            Total outstanding <span className="text-rose-400 font-semibold">{fmtCompact(totalLoanOutstanding)}</span>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider">
                <th className="px-5 py-2 text-left">Lender</th>
                <th className="px-3 py-2 text-left">Code</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-right">EMI / Month</th>
                <th className="px-3 py-2 text-right">Due Day</th>
                <th className="px-3 py-2 text-right">Outstanding</th>
                <th className="px-3 py-2 text-right">Rate</th>
                <th className="px-5 py-2 text-right">Int. Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loans.map((l) => {
                const isGold = l.loan_type === 'gold_loan';
                const monthly = isGold
                  ? (l.outstanding * (l.interest_rate ?? 0)) / 100 / 12
                  : (l.emi_amount ?? 0);
                return (
                  <tr key={l.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className={`px-5 py-2.5 font-bold ${BANK_COLOR[l.lender] ?? 'text-zinc-300'}`}>{l.lender}</td>
                    <td className="px-3 py-2.5 text-zinc-400 font-mono">{l.loan_code}</td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${LOAN_TYPE_COLOR[l.loan_type] ?? 'text-zinc-400 bg-zinc-700'}`}>
                        {LOAN_TYPE_LABEL[l.loan_type]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-zinc-200">
                      {monthly > 0 ? fmt(monthly) : <span className="text-zinc-600">—</span>}
                      {isGold && <span className="text-zinc-500 ml-1">est.</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right text-zinc-400">
                      {l.due_day ? `${l.due_day}th` : <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-rose-300 font-mono">{fmtCompact(l.outstanding)}</td>
                    <td className="px-3 py-2.5 text-right text-zinc-400">
                      {l.interest_rate ? `${l.interest_rate}%` : <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="px-5 py-2.5 text-right text-zinc-500 font-mono">
                      {l.interest_paid ? fmtCompact(l.interest_paid) : <span className="text-zinc-700">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-700 bg-zinc-900/60 font-semibold text-xs">
                <td className="px-5 py-2.5 text-zinc-400" colSpan={3}>Total</td>
                <td className="px-3 py-2.5 text-right text-rose-300 font-mono">{fmt(totalMonthlyCommitment)}</td>
                <td />
                <td className="px-3 py-2.5 text-right text-rose-400 font-mono">{fmtCompact(totalLoanOutstanding)}</td>
                <td />
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Credit Cards */}
      <div className={glass}>
        <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-3">
          <CreditCard className="h-4 w-4 text-purple-400" />
          <h2 className="font-semibold text-white text-sm">Credit Cards</h2>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-zinc-500">
              ₹{(totalCCLimit / 100000).toFixed(1)}L total limit
            </span>
            <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
              ccUsagePct > 30 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              {ccUsagePct.toFixed(0)}% used
            </span>
          </div>
        </div>

        {/* Utilization bar */}
        <div className="px-5 py-3 border-b border-zinc-800/50">
          <div className="flex items-center justify-between mb-1.5 text-xs text-zinc-500">
            <span>Used {fmtCompact(totalCCUsed)}</span>
            <span>Available {fmtCompact(totalCCLimit - totalCCUsed)}</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${ccUsagePct > 30 ? 'bg-rose-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(ccUsagePct, 100).toFixed(1)}%` }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider">
                <th className="px-5 py-2 text-left">Bank</th>
                <th className="px-3 py-2 text-left">Card</th>
                <th className="px-3 py-2 text-right">Limit</th>
                <th className="px-3 py-2 text-right">Outstanding</th>
                <th className="px-3 py-2 text-right">Available</th>
                <th className="px-3 py-2 text-right">Statement</th>
                <th className="px-5 py-2 text-right">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {cards.map((c) => {
                const available  = Math.max(0, c.max_limit - Math.max(0, c.outstanding));
                const usagePct   = c.max_limit > 0 ? (Math.max(0, c.outstanding) / c.max_limit) * 100 : 0;
                const cleared    = c.outstanding <= 0;
                return (
                  <tr key={c.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className={`px-5 py-2 font-bold ${BANK_COLOR[c.bank] ?? 'text-zinc-300'}`}>{c.bank}</td>
                    <td className="px-3 py-2 text-zinc-400 font-mono">{c.card_code}</td>
                    <td className="px-3 py-2 text-right text-zinc-300 font-mono">
                      {c.max_limit > 0 ? fmtCompact(c.max_limit) : <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {cleared
                        ? <span className="flex items-center justify-end gap-1 text-emerald-400"><CheckCircle2 className="h-3 w-3" />Cleared</span>
                        : <span className="font-semibold text-rose-300 font-mono">{fmtCompact(c.outstanding)}</span>
                      }
                    </td>
                    <td className="px-3 py-2 text-right text-zinc-400 font-mono">
                      {c.max_limit > 0 ? fmtCompact(available) : <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="px-3 py-2 text-right text-zinc-500">
                      {c.statement_day ? `${c.statement_day}${c.statement_day === 1 ? 'st' : c.statement_day === 2 ? 'nd' : c.statement_day === 3 ? 'rd' : 'th'}` : '—'}
                    </td>
                    <td className="px-5 py-2 text-right text-zinc-500">
                      {c.due_day ? `${c.due_day}${c.due_day === 1 ? 'st' : c.due_day === 2 ? 'nd' : c.due_day === 3 ? 'rd' : 'th'}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Property Appreciation Projection */}
      <div className={glass}>
        <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-3">
          <Building2 className="h-4 w-4 text-emerald-400" />
          <h2 className="font-semibold text-white text-sm">Market Value Projection — Kharghar A-1206</h2>
          <span className="ml-auto text-xs text-zinc-500">4–10% p.a. appreciation</span>
        </div>
        <div className="p-5">
          {/* Mini timeline bar */}
          <div className="relative mb-4">
            <div className="flex items-end gap-1 h-24">
              {MARKET_PROJECTION.map((p) => {
                const maxVal = MARKET_PROJECTION[MARKET_PROJECTION.length - 1].value;
                const heightPct = (p.value / maxVal) * 100;
                const isCurrent = p.year === currentYear || p.year === currentYear + 1;
                const isCostLine = p.value >= (property?.flat_cost_all_in ?? 0);
                return (
                  <div key={p.year} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-t-sm transition-all ${
                        isCurrent
                          ? 'bg-indigo-400'
                          : p.year < currentYear
                          ? 'bg-zinc-700'
                          : isCostLine
                          ? 'bg-emerald-500/60'
                          : 'bg-zinc-600/60'
                      }`}
                      style={{ height: `${heightPct}%` }}
                      title={`${p.year}: ${fmt(p.value)}`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1 mt-1">
              {MARKET_PROJECTION.map((p) => (
                <div key={p.year} className="flex-1 text-center">
                  <p className="text-zinc-600" style={{ fontSize: '9px' }}>{p.year}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Projection table (compact) */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {MARKET_PROJECTION.filter((_, i) => i < 12).map((p) => {
              const isCurrent = p.year === currentYear;
              const aboveCost = p.value >= (property?.flat_cost_all_in ?? 0);
              return (
                <div key={p.year} className={`rounded-lg px-3 py-2 text-xs ${isCurrent ? 'bg-indigo-500/15 border border-indigo-500/30' : 'bg-zinc-800/40'}`}>
                  <div className="flex items-center justify-between">
                    <p className={`font-semibold ${isCurrent ? 'text-indigo-400' : 'text-zinc-400'}`}>Sep {p.year}</p>
                    {p.rate > 0 && <p className="text-zinc-600" style={{ fontSize: '9px' }}>{p.rate}%</p>}
                  </div>
                  <p className={`font-bold mt-0.5 ${aboveCost ? 'text-emerald-400' : 'text-zinc-300'}`}>
                    {fmtCompact(p.value)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-indigo-400" /> Current year</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-500/60" /> Above all-in cost</span>
            <span className="ml-auto">All-in cost: <span className="text-zinc-300 font-mono">{fmt(property?.flat_cost_all_in ?? 0)}</span></span>
          </div>
        </div>
      </div>

      {/* Builder Payment History */}
      {payments.length > 0 && (
        <div className={glass}>
          <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-3">
            <AlertCircle className="h-4 w-4 text-zinc-400" />
            <h2 className="font-semibold text-white text-sm">Builder Payment History</h2>
            <span className="ml-auto text-xs text-zinc-500">{payments.length} transactions</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider">
                  <th className="px-5 py-2 text-left">S.No.</th>
                  <th className="px-3 py-2 text-left">Invoice Date</th>
                  <th className="px-3 py-2 text-left">Details</th>
                  <th className="px-5 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {payments.map((p) => (
                  <tr key={p.id} className={`hover:bg-zinc-800/20 transition-colors ${p.is_gst ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-1.5 text-zinc-600 font-mono">{p.sno}</td>
                    <td className="px-3 py-1.5 text-zinc-400 font-mono">
                      {new Date(p.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-3 py-1.5 text-zinc-400">
                      {p.is_gst
                        ? <span className="text-zinc-600 italic">GST</span>
                        : <span>{p.description}</span>
                      }
                    </td>
                    <td className={`px-5 py-1.5 text-right font-mono ${p.is_gst ? 'text-zinc-600' : 'text-zinc-200'}`}>
                      {fmt(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-700 bg-zinc-900/60 font-semibold">
                  <td className="px-5 py-2.5 text-zinc-400" colSpan={3}>Total Paid to Builder</td>
                  <td className="px-5 py-2.5 text-right font-bold text-sky-400 font-mono">
                    {fmt(payments.reduce((s, p) => s + p.amount, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
