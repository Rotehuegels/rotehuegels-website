'use client';

import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

interface Budget {
  id: string;
  fiscal_year: string;
  department: string;
  category: string;
  budget_amount: number;
  actual_amount: number;
  variance: number;
  utilization_pct: number;
  notes?: string;
}

export default function BudgetsPage() {
  const [fy, setFY] = useState('2025-26');
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/accounts/budgets?fy=${fy}`)
      .then(r => r.json())
      .then(d => setBudgets(d.data ?? []))
      .finally(() => setLoading(false));
  }, [fy]);

  const totalBudget = budgets.reduce((s, b) => s + b.budget_amount, 0);
  const totalActual = budgets.reduce((s, b) => s + b.actual_amount, 0);
  const totalVariance = totalBudget - totalActual;
  const overBudget = budgets.filter(b => b.utilization_pct > 100);

  return (
    <div className="p-5 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet className="h-6 w-6 text-indigo-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Budget Tracking</h1>
            <p className="mt-0.5 text-sm text-zinc-500">Department budgets vs actual spend</p>
          </div>
        </div>
        <select
          value={fy}
          onChange={e => setFY(e.target.value)}
          className="rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2 text-sm text-white"
        >
          <option value="2025-26">FY 2025-26</option>
          <option value="2024-25">FY 2024-25</option>
          <option value="2026-27">FY 2026-27</option>
        </select>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`${glass} p-4`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Total Budget</p>
          <p className="text-2xl font-black text-white mt-1">{fmt(totalBudget)}</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Actual Spend</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{fmt(totalActual)}</p>
        </div>
        <div className={`${glass} p-4`}>
          <div className="flex items-center gap-1.5">
            {totalVariance >= 0 ? <TrendingDown className="h-3 w-3 text-emerald-400" /> : <TrendingUp className="h-3 w-3 text-red-400" />}
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Variance</p>
          </div>
          <p className={`text-2xl font-black mt-1 ${totalVariance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(Math.abs(totalVariance))}</p>
          <p className="text-[10px] text-zinc-600">{totalVariance >= 0 ? 'Under budget' : 'Over budget'}</p>
        </div>
        <div className={`${glass} p-4`}>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 text-red-400" />
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Over Budget</p>
          </div>
          <p className={`text-2xl font-black mt-1 ${overBudget.length > 0 ? 'text-red-400' : 'text-zinc-600'}`}>{overBudget.length}</p>
          <p className="text-[10px] text-zinc-600">departments</p>
        </div>
      </div>

      {/* Budget table */}
      <div className={glass}>
        <div className="px-6 py-3 border-b border-zinc-800/60">
          <h2 className="text-sm font-semibold text-white">Department Budgets</h2>
        </div>
        {loading ? (
          <div className="p-12 text-center text-zinc-500 text-sm">Loading...</div>
        ) : budgets.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No budgets configured for {fy}.</p>
            <p className="text-xs text-zinc-600 mt-1">Budgets can be added via the API.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider">
                  <th className="px-6 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-right">Budget</th>
                  <th className="px-4 py-3 text-right">Actual</th>
                  <th className="px-4 py-3 text-right">Variance</th>
                  <th className="px-4 py-3 text-center">Utilization</th>
                  <th className="px-6 py-3">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {budgets.map(b => (
                  <tr key={b.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-3 font-medium text-white">{b.department}</td>
                    <td className="px-4 py-3 text-zinc-400 capitalize">{b.category}</td>
                    <td className="px-4 py-3 text-right text-zinc-300 font-mono">{fmt(b.budget_amount)}</td>
                    <td className="px-4 py-3 text-right text-amber-400 font-mono">{fmt(b.actual_amount)}</td>
                    <td className={`px-4 py-3 text-right font-mono font-medium ${b.variance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {b.variance >= 0 ? fmt(b.variance) : `(${fmt(Math.abs(b.variance))})`}
                    </td>
                    <td className={`px-4 py-3 text-center font-bold ${b.utilization_pct > 100 ? 'text-red-400' : b.utilization_pct > 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {b.utilization_pct}%
                    </td>
                    <td className="px-6 py-3">
                      <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${b.utilization_pct > 100 ? 'bg-red-500' : b.utilization_pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(b.utilization_pct, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
