'use client';

import { useState } from 'react';
import { FileText, Printer, Download, Info } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const input = 'w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50';

export default function BalanceSheetPage() {
  const [fy, setFy] = useState('2025-26');
  const [shareCapital, setShareCapital] = useState<number>(100000);
  const [bankBalance, setBankBalance] = useState<number>(0);
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [otherReceivables, setOtherReceivables] = useState<number>(0);

  const qs = new URLSearchParams({
    fy,
    share_capital: String(shareCapital),
    bank_balance: String(bankBalance),
    cash_balance: String(cashBalance),
    other_receivables: String(otherReceivables),
  }).toString();

  const printHref = `/api/accounts/balance-sheet/pdf?${qs}`;
  const downloadHref = `${printHref}&download=1`;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1800px]">
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5 text-emerald-400" />
        <div>
          <h1 className="text-xl font-bold text-white">Provisional Balance Sheet</h1>
          <p className="text-xs text-zinc-500 mt-0.5">For first FY, audit pending. Fill user-only figures below; everything else is computed from ERP data.</p>
        </div>
      </div>

      <div className={`${glass} p-5`}>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
          <Info className="h-4 w-4 text-sky-400" /> Inputs you need to provide
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Financial Year</label>
            <select value={fy} onChange={e => setFy(e.target.value)} className={input}>
              <option value="2025-26">FY 2025-26 (year ending 31 Mar 2026)</option>
              <option value="2026-27">FY 2026-27</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">
              Paid-up Share Capital (₹) <span className="text-zinc-600">· from MCA SH-7 / PAS-3</span>
            </label>
            <input type="number" value={shareCapital} onChange={e => setShareCapital(Number(e.target.value))} className={input} />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">
              Closing Bank Balance (₹) <span className="text-zinc-600">· per bank statement 31-Mar</span>
            </label>
            <input type="number" value={bankBalance} onChange={e => setBankBalance(Number(e.target.value))} className={input} placeholder="e.g. 150000" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">
              Cash in Hand (₹) <span className="text-zinc-600">· physical cash on 31-Mar</span>
            </label>
            <input type="number" value={cashBalance} onChange={e => setCashBalance(Number(e.target.value))} className={input} placeholder="e.g. 5000" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-zinc-500 mb-1">
              Other Receivables / Advances Paid (₹) <span className="text-zinc-600">· optional</span>
            </label>
            <input type="number" value={otherReceivables} onChange={e => setOtherReceivables(Number(e.target.value))} className={input} placeholder="Deposits, advances to suppliers, etc." />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a href={printHref} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors">
            <Printer className="h-4 w-4" /> Preview (new tab)
          </a>
          <a href={downloadHref}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 hover:text-white hover:bg-emerald-500/20 transition-colors">
            <Download className="h-4 w-4" /> Download PDF
          </a>
        </div>
      </div>

      <div className={`${glass} p-5`}>
        <h2 className="text-sm font-semibold text-white mb-3">Fields computed automatically from ERP</h2>
        <ul className="text-xs text-zinc-400 space-y-1.5 list-disc pl-5">
          <li><strong className="text-zinc-200">Reserves & Surplus</strong> — from invoice revenue minus salary + purchases + other expenses on accrual basis for the FY</li>
          <li><strong className="text-zinc-200">Sundry Debtors (AR)</strong> — invoices raised − receipts received</li>
          <li><strong className="text-zinc-200">Sundry Creditors (AP)</strong> — purchase orders issued − supplier payments made</li>
          <li><strong className="text-zinc-200">GST Input Credit Receivable / Output Liability</strong> — netted from recorded ITC vs output GST</li>
          <li><strong className="text-zinc-200">TDS Receivable</strong> — TDS withheld by customers on payments received</li>
          <li><strong className="text-zinc-200">Advances from Customers</strong> — when receipts exceed invoiced amount</li>
          <li><strong className="text-zinc-200">Fixed Assets (Net Block)</strong> — from <code>fixed_assets</code> table, if any</li>
          <li><strong className="text-zinc-200">Inventory</strong> — from <code>stock_items</code> × unit cost</li>
        </ul>
      </div>

      <div className={`${glass} p-5`}>
        <h2 className="text-sm font-semibold text-white mb-3">Use for 80-IAC application</h2>
        <ol className="text-xs text-zinc-400 space-y-1.5 list-decimal pl-5">
          <li>Fill the Share Capital, Bank Balance, and Cash in Hand above (consult your CA)</li>
          <li>Click <strong>Download PDF</strong> to get the signed-ready provisional Balance Sheet</li>
          <li>Also download the P&L from <a href={`/d/pl?fy=${fy}`} className="text-emerald-400 hover:text-emerald-300 underline">/d/pl</a> for the same FY</li>
          <li>Both directors sign the PDFs (one Director + signature block at bottom of each)</li>
          <li>Upload both to the 80-IAC application at startupindia.gov.in under "Financial Statements"</li>
          <li>Mention prominently in the cover that audit is pending; final statements will be filed once audit completes (likely June–July 2026)</li>
        </ol>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
        <strong>Heads up:</strong> The IMB reviewing 80-IAC applications prefers audited statements. A provisional statement gets you the application filed in-cycle,
        but you&apos;ll likely need to submit the final audited version if the IMB queries. Keep the audit on track — target June 2026 for FY25-26 audit completion.
      </div>
    </div>
  );
}
