import { supabaseAdmin } from '@/lib/supabaseAdmin';
import FYSelector from './FYSelector';
import { BadgePercent } from 'lucide-react';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

function parseFY(fy: string) {
  const [startYear] = fy.split('-').map(Number);
  const endYear = startYear + 1;
  return {
    from:      `${startYear}-04-01`,
    to:        `${endYear}-03-31`,
    full:      `1 April ${startYear} to 31 March ${endYear}`,
    startYear,
    endYear,
  };
}

function fyMonths(startYear: number, endYear: number) {
  const months: { year: number; month: number }[] = [];
  for (let m = 4; m <= 12; m++) months.push({ year: startYear, month: m });
  for (let m = 1; m <= 3; m++)  months.push({ year: endYear,   month: m });
  return months;
}

export default async function GSTPage({ searchParams }: { searchParams: Promise<{ fy?: string }> }) {
  const { fy: fyParam } = await searchParams;
  const fy = fyParam ?? '2025-26';
  const { from, to, full, startYear, endYear } = parseFY(fy);

  const [ordersRes, expensesRes] = await Promise.all([
    supabaseAdmin
      .from('orders')
      .select('order_date, cgst_amount, sgst_amount, igst_amount, status')
      .gte('order_date', from)
      .lte('order_date', to)
      .neq('status', 'cancelled'),
    supabaseAdmin
      .from('expenses')
      .select('expense_date, gst_input_credit')
      .gte('expense_date', from)
      .lte('expense_date', to),
  ]);

  const orders   = ordersRes.data   ?? [];
  const expenses = expensesRes.data ?? [];

  // ── Monthly aggregates ────────────────────────────────────────
  const outputByMonth: Record<string, { cgst: number; sgst: number; igst: number }> = {};
  const itcByMonth:    Record<string, number> = {};

  for (const o of orders) {
    const key = o.order_date.slice(0, 7);
    if (!outputByMonth[key]) outputByMonth[key] = { cgst: 0, sgst: 0, igst: 0 };
    outputByMonth[key].cgst += o.cgst_amount ?? 0;
    outputByMonth[key].sgst += o.sgst_amount ?? 0;
    outputByMonth[key].igst += o.igst_amount ?? 0;
  }
  for (const e of expenses) {
    const key = e.expense_date.slice(0, 7);
    itcByMonth[key] = (itcByMonth[key] ?? 0) + (e.gst_input_credit ?? 0);
  }

  // ── FY totals ─────────────────────────────────────────────────
  const totalCGST   = orders.reduce((s, o) => s + (o.cgst_amount ?? 0), 0);
  const totalSGST   = orders.reduce((s, o) => s + (o.sgst_amount ?? 0), 0);
  const totalIGST   = orders.reduce((s, o) => s + (o.igst_amount ?? 0), 0);
  const totalOutput = totalCGST + totalSGST + totalIGST;
  const totalITC    = expenses.reduce((s, e) => s + (e.gst_input_credit ?? 0), 0);
  const netPayable  = totalOutput - totalITC;

  const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
  const months = fyMonths(startYear, endYear);

  return (
    <div className="p-8 space-y-6 print:p-0 print:space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BadgePercent className="h-6 w-6 text-amber-400" />
            GST Report
          </h1>
          <p className="mt-1 text-sm text-zinc-400">{full}</p>
        </div>
        <FYSelector current={fy} />
      </div>

      <div className="hidden print:block mb-6">
        <p className="text-lg font-bold text-black">Rotehügels</p>
        <p className="text-base font-semibold text-black">GST Report</p>
        <p className="text-sm text-gray-600">{full}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

        <div className={`${glass} p-6`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Output GST (Liability)</p>
          <p className="text-xs text-zinc-600 mt-0.5 mb-4">Collected from customers on invoices</p>
          <p className="text-2xl font-black text-amber-400">{fmt(totalOutput)}</p>
          <div className="mt-3 space-y-1.5 border-t border-zinc-800 pt-3">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">CGST (9%)</span>
              <span className="font-mono text-zinc-300">{fmt(totalCGST)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">SGST (9%)</span>
              <span className="font-mono text-zinc-300">{fmt(totalSGST)}</span>
            </div>
            {totalIGST > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">IGST (18%)</span>
                <span className="font-mono text-zinc-300">{fmt(totalIGST)}</span>
              </div>
            )}
          </div>
        </div>

        <div className={`${glass} p-6`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Input Tax Credit (ITC)</p>
          <p className="text-xs text-zinc-600 mt-0.5 mb-4">GST paid on purchases — claimable</p>
          <p className="text-2xl font-black text-emerald-400">{fmt(totalITC)}</p>
          <p className="text-xs text-zinc-600 mt-3 border-t border-zinc-800 pt-3">
            Offset against output GST liability
          </p>
        </div>

        <div className={`${glass} p-6`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Net GST Payable</p>
          <p className="text-xs text-zinc-600 mt-0.5 mb-4">Output GST − ITC</p>
          <p className={`text-2xl font-black ${netPayable > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {fmt(Math.abs(netPayable))}
          </p>
          <p className={`text-xs mt-3 border-t border-zinc-800 pt-3 ${netPayable > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {netPayable > 0 ? 'Payable to government' : 'ITC surplus / carry forward'}
          </p>
        </div>

      </div>

      {/* Monthly breakdown */}
      <div className={`${glass} overflow-hidden`}>
        <div className="px-6 pt-5 pb-3">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-400">Monthly Breakdown</p>
          <p className="text-xs text-zinc-600 mt-0.5">Output GST by order date · ITC by expense date</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-zinc-800 text-zinc-500 text-xs">
                <th className="text-left px-6 py-3 font-medium w-28">Month</th>
                <th className="text-right px-4 py-3 font-medium">CGST</th>
                <th className="text-right px-4 py-3 font-medium">SGST</th>
                <th className="text-right px-4 py-3 font-medium">IGST</th>
                <th className="text-right px-4 py-3 font-medium">Total Output</th>
                <th className="text-right px-4 py-3 font-medium">ITC</th>
                <th className="text-right px-6 py-3 font-medium">Net Payable</th>
              </tr>
            </thead>
            <tbody>
              {months.map(({ year, month }) => {
                const key = `${year}-${String(month).padStart(2, '0')}`;
                const out = outputByMonth[key] ?? { cgst: 0, sgst: 0, igst: 0 };
                const itc = itcByMonth[key] ?? 0;
                const totalOut = out.cgst + out.sgst + out.igst;
                const net = totalOut - itc;
                const hasActivity = totalOut > 0 || itc > 0;
                const monthLabel = new Date(year, month - 1, 1)
                  .toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

                return (
                  <tr key={key} className={`border-t border-zinc-800/60 ${!hasActivity ? 'opacity-30' : ''}`}>
                    <td className="px-6 py-3 text-zinc-300 font-medium text-xs">{monthLabel}</td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-400 text-xs">
                      {out.cgst > 0 ? fmt(out.cgst) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-400 text-xs">
                      {out.sgst > 0 ? fmt(out.sgst) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-400 text-xs">
                      {out.igst > 0 ? fmt(out.igst) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-amber-400">
                      {totalOut > 0 ? fmt(totalOut) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-emerald-400">
                      {itc > 0 ? fmt(itc) : '—'}
                    </td>
                    <td className={`px-6 py-3 text-right font-mono text-xs font-bold ${
                      !hasActivity ? 'text-zinc-700'
                      : net > 0   ? 'text-rose-400'
                      : net < 0   ? 'text-emerald-400'
                      : 'text-zinc-500'
                    }`}>
                      {!hasActivity ? '—'
                        : net > 0 ? fmt(net)
                        : net < 0 ? `(${fmt(Math.abs(net))})`
                        : '₹0'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-zinc-600">
                <td className="px-6 py-3.5 text-white font-bold text-sm">Total</td>
                <td className="px-4 py-3.5 text-right font-mono text-zinc-200 text-xs font-bold">{fmt(totalCGST)}</td>
                <td className="px-4 py-3.5 text-right font-mono text-zinc-200 text-xs font-bold">{fmt(totalSGST)}</td>
                <td className="px-4 py-3.5 text-right font-mono text-zinc-200 text-xs font-bold">
                  {totalIGST > 0 ? fmt(totalIGST) : '—'}
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-amber-400 text-xs font-black">{fmt(totalOutput)}</td>
                <td className="px-4 py-3.5 text-right font-mono text-emerald-400 text-xs font-black">{fmt(totalITC)}</td>
                <td className={`px-6 py-3.5 text-right font-mono text-xs font-black ${netPayable > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {netPayable > 0 ? fmt(netPayable) : `(${fmt(Math.abs(netPayable))})`}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
}
