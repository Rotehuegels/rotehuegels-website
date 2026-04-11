import { supabaseAdmin } from '@/lib/supabaseAdmin';
import FYSelector from './FYSelector';
import { BadgePercent } from 'lucide-react';
import PrintButton from '../pl/PrintButton';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

const CO = {
  name:  'Rotehuegel Research Business Consultancy Private Limited',
  cin:   'U70200TN2025PTC184573',
  gstin: '33AAPCR0554G1ZE',
  pan:   'AAPCR0554G',
};

function parseFY(fy: string) {
  const [startYear] = fy.split('-').map(Number);
  const endYear = startYear + 1;
  return {
    from:      `${startYear}-04-01`,
    to:        `${endYear}-03-31`,
    full:      `1 April ${startYear} to 31 March ${endYear}`,
    label:     `FY ${startYear}–${endYear}`,
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

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-5 pb-1">
      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-amber-700 border-b border-amber-200 pb-1">{children}</p>
    </div>
  );
}

export default async function GSTPage({ searchParams }: { searchParams: Promise<{ fy?: string }> }) {
  const { fy: fyParam } = await searchParams;
  const fy = fyParam ?? '2025-26';
  const { from, to, full, label, startYear, endYear } = parseFY(fy);

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

  const months = fyMonths(startYear, endYear);
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="p-6 print:p-0">

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 no-print">
        <div className="flex items-center gap-3">
          <BadgePercent className="h-5 w-5 text-amber-400" />
          <h1 className="text-lg font-bold text-white">GST Report</h1>
        </div>
        <div className="flex items-center gap-3">
          <FYSelector current={fy} />
          <SavePDFButton targetId="gst-report" filename="GST-Report" />
        </div>
      </div>

      {/* A4 Document */}
      <div className="mx-auto max-w-[800px] bg-white rounded-xl shadow-2xl shadow-black/30 overflow-hidden print:shadow-none print:rounded-none">

        {/* Letterhead */}
        <div className="bg-gray-900 px-8 py-5 flex items-center justify-between">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/Logo.png" alt="Rotehügels" className="h-8 mb-2" />
            <p className="text-[10px] text-gray-400">{CO.name}</p>
            <p className="text-[9px] text-gray-500">CIN: {CO.cin} &nbsp;|&nbsp; GSTIN: {CO.gstin} &nbsp;|&nbsp; PAN: {CO.pan}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-amber-400 uppercase tracking-widest">GST Summary</p>
            <p className="text-sm font-black text-amber-400 uppercase tracking-widest">Report</p>
            <p className="text-[11px] text-gray-300 mt-1 font-mono">{label}</p>
          </div>
        </div>

        {/* Period bar */}
        <div className="bg-gray-50 px-8 py-2 border-b border-gray-200 flex items-center justify-between">
          <p className="text-[11px] text-gray-600">
            For the period <strong>{full}</strong>
          </p>
          <p className="text-[10px] text-gray-400">
            GSTIN: {CO.gstin} · All amounts in INR
          </p>
        </div>

        {/* Summary section */}
        <div className="px-8 py-4">

          <div className="grid grid-cols-3 divide-x divide-gray-200 border border-gray-200 rounded-lg mb-4">
            <div className="px-5 py-4">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Output GST (Liability)</p>
              <p className="text-[10px] text-gray-400 mt-0.5 mb-2">Collected from customers on invoices</p>
              <p className="text-xl font-black text-amber-700">{fmt(totalOutput)}</p>
              <div className="mt-2 space-y-1 border-t border-gray-100 pt-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-500">CGST (9%)</span>
                  <span className="font-mono text-gray-700">{fmt(totalCGST)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-500">SGST (9%)</span>
                  <span className="font-mono text-gray-700">{fmt(totalSGST)}</span>
                </div>
                {totalIGST > 0 && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">IGST (18%)</span>
                    <span className="font-mono text-gray-700">{fmt(totalIGST)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-4">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Input Tax Credit (ITC)</p>
              <p className="text-[10px] text-gray-400 mt-0.5 mb-2">GST paid on purchases — claimable</p>
              <p className="text-xl font-black text-green-700">{fmt(totalITC)}</p>
              <p className="text-[11px] text-gray-400 mt-2 border-t border-gray-100 pt-2">
                Offset against output GST liability
              </p>
            </div>

            <div className="px-5 py-4">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Net GST Payable</p>
              <p className="text-[10px] text-gray-400 mt-0.5 mb-2">Output GST − ITC</p>
              <p className={`text-xl font-black ${netPayable > 0 ? 'text-red-700' : 'text-green-700'}`}>
                {fmt(Math.abs(netPayable))}
              </p>
              <p className={`text-[11px] mt-2 border-t border-gray-100 pt-2 ${netPayable > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                {netPayable > 0 ? '⚠ Payable to government' : '✓ ITC surplus / carry forward'}
              </p>
            </div>
          </div>

          {/* Monthly breakdown */}
          <SectionHead>Monthly Breakdown</SectionHead>
          <p className="text-[10px] text-gray-400 mb-2">Output GST by order date · ITC by expense date</p>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="text-left px-4 py-2.5 font-semibold w-24">Month</th>
                  <th className="text-right px-3 py-2.5 font-semibold">CGST</th>
                  <th className="text-right px-3 py-2.5 font-semibold">SGST</th>
                  <th className="text-right px-3 py-2.5 font-semibold">IGST</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Total Output</th>
                  <th className="text-right px-3 py-2.5 font-semibold">ITC</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Net Payable</th>
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
                    <tr key={key} className={`border-t border-gray-100 ${!hasActivity ? 'opacity-40' : ''}`}>
                      <td className="px-4 py-2 text-gray-700 font-medium">{monthLabel}</td>
                      <td className="px-3 py-2 text-right font-mono text-gray-600">
                        {out.cgst > 0 ? fmt(out.cgst) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-gray-600">
                        {out.sgst > 0 ? fmt(out.sgst) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-gray-600">
                        {out.igst > 0 ? fmt(out.igst) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-amber-700">
                        {totalOut > 0 ? fmt(totalOut) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-green-700">
                        {itc > 0 ? fmt(itc) : '—'}
                      </td>
                      <td className={`px-4 py-2 text-right font-mono font-bold ${
                        !hasActivity ? 'text-gray-400'
                        : net > 0   ? 'text-red-700'
                        : net < 0   ? 'text-green-700'
                        : 'text-gray-500'
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
                <tr className="border-t-2 border-gray-800 bg-gray-50">
                  <td className="px-4 py-3 text-gray-900 font-bold text-[12px]">Total</td>
                  <td className="px-3 py-3 text-right font-mono text-gray-700 font-bold">{fmt(totalCGST)}</td>
                  <td className="px-3 py-3 text-right font-mono text-gray-700 font-bold">{fmt(totalSGST)}</td>
                  <td className="px-3 py-3 text-right font-mono text-gray-700 font-bold">
                    {totalIGST > 0 ? fmt(totalIGST) : '—'}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-amber-700 font-black text-[12px]">{fmt(totalOutput)}</td>
                  <td className="px-3 py-3 text-right font-mono text-green-700 font-black text-[12px]">{fmt(totalITC)}</td>
                  <td className={`px-4 py-3 text-right font-mono font-black text-[12px] ${netPayable > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    {netPayable > 0 ? fmt(netPayable) : `(${fmt(Math.abs(netPayable))})`}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-3 border-t border-gray-200 flex items-center justify-between text-[9px] text-gray-400">
          <span>Generated on {today} &nbsp;|&nbsp; {CO.name}</span>
          <span>This is an internal management report. Not audited.</span>
        </div>
      </div>

    </div>
  );
}
