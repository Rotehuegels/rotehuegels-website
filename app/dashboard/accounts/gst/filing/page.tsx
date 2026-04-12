'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BadgePercent, Download, Loader2 } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const inputCls = 'rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-sm text-white focus:border-rose-500 outline-none';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

function TaxRow({ label, cgst, sgst, igst, bold = false }: { label: string; cgst: number; sgst: number; igst: number; bold?: boolean }) {
  return (
    <tr className={bold ? 'border-t-2 border-zinc-600 font-bold' : 'border-t border-zinc-800/50'}>
      <td className="py-2 pr-4 text-zinc-300">{label}</td>
      <td className="py-2 text-right text-zinc-400 font-mono">{fmt(cgst)}</td>
      <td className="py-2 text-right text-zinc-400 font-mono">{fmt(sgst)}</td>
      <td className="py-2 text-right text-zinc-400 font-mono">{fmt(igst)}</td>
      <td className="py-2 text-right text-white font-mono font-medium">{fmt(cgst + sgst + igst)}</td>
    </tr>
  );
}

export default function GSTFilingPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [tab, setTab] = useState<'gstr1' | 'gstr3b'>('gstr3b');
  const [gstr1, setGstr1] = useState<AnyObj | null>(null);
  const [gstr3b, setGstr3b] = useState<AnyObj | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch(`/api/gst/gstr1?month=${month}&year=${year}`).then(r => r.json()),
      fetch(`/api/gst/gstr3b?month=${month}&year=${year}`).then(r => r.json()),
    ]).then(([r1, r3b]) => {
      setGstr1(r1);
      setGstr3b(r3b);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [month, year]);

  const exportCSV = () => {
    if (!gstr1) return;
    const rows = [
      ['Invoice No', 'Date', 'Client', 'GSTIN', 'Place of Supply', 'HSN/SAC', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total'],
      ...[...gstr1.b2b, ...gstr1.b2cLarge, ...gstr1.b2c].map((o: AnyObj) => [
        o.order_no, o.order_date, o.client_name, o.client_gstin || 'Unregistered',
        o.place_of_supply || 'Tamil Nadu (33)', o.hsn_sac_code || '',
        o.base_value, o.cgst_amount, o.sgst_amount, o.igst_amount, o.total_value_incl_gst,
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `GSTR1-${MONTHS[month-1]}-${year}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const periodLabel = `${MONTHS[month - 1]} ${year}`;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link href="/d/gst" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white mb-4">
        <ArrowLeft className="h-4 w-4" /> GST Report
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BadgePercent className="h-5 w-5 text-amber-400" />
          <h1 className="text-xl font-bold text-white">GST Filing Preparation</h1>
        </div>
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className={inputCls}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))} className={inputCls}>
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={exportCSV} className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800 mb-6">
        {(['gstr3b', 'gstr1'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t ? 'text-rose-400 border-b-2 border-rose-400' : 'text-zinc-500 hover:text-white'
            }`}
          >
            {t === 'gstr3b' ? 'GSTR-3B (Monthly Summary)' : 'GSTR-1 (Outward Supplies)'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>
      ) : (
        <>
          {/* GSTR-3B Tab */}
          {tab === 'gstr3b' && gstr3b && (
            <div className="space-y-6">
              <p className="text-sm text-zinc-500">GSTR-3B summary for <strong className="text-white">{periodLabel}</strong></p>

              {/* 3.1 Outward Supplies */}
              <div className={`${glass} p-5`}>
                <h2 className="text-sm font-semibold text-white mb-3">3.1 — Outward Supplies</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-zinc-500 uppercase tracking-wide">
                      <th className="text-left py-2">Description</th>
                      <th className="text-right py-2">Taxable Value</th>
                      <th className="text-right py-2">Tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-zinc-800/50">
                      <td className="py-2 text-zinc-300">Intra-State supplies</td>
                      <td className="py-2 text-right font-mono text-zinc-400">{fmt(gstr3b.section_3_1.taxable_intra)}</td>
                      <td className="py-2 text-right font-mono text-zinc-400">{fmt(gstr3b.section_3_1.cgst + gstr3b.section_3_1.sgst)}</td>
                    </tr>
                    <tr className="border-t border-zinc-800/50">
                      <td className="py-2 text-zinc-300">Inter-State supplies</td>
                      <td className="py-2 text-right font-mono text-zinc-400">{fmt(gstr3b.section_3_1.taxable_inter)}</td>
                      <td className="py-2 text-right font-mono text-zinc-400">{fmt(gstr3b.section_3_1.igst)}</td>
                    </tr>
                    {gstr3b.section_3_1.zero_rated > 0 && (
                      <tr className="border-t border-zinc-800/50">
                        <td className="py-2 text-zinc-300">Zero-rated / Exempt</td>
                        <td className="py-2 text-right font-mono text-zinc-400">{fmt(gstr3b.section_3_1.zero_rated)}</td>
                        <td className="py-2 text-right font-mono text-zinc-500">—</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 4. ITC */}
              <div className={`${glass} p-5`}>
                <h2 className="text-sm font-semibold text-white mb-3">4 — Input Tax Credit (ITC)</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-zinc-500 uppercase tracking-wide">
                      <th className="text-left py-2">Description</th>
                      <th className="text-right py-2">CGST</th>
                      <th className="text-right py-2">SGST</th>
                      <th className="text-right py-2">IGST</th>
                      <th className="text-right py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <TaxRow label="ITC Available" cgst={gstr3b.section_4.cgst} sgst={gstr3b.section_4.sgst} igst={gstr3b.section_4.igst} />
                  </tbody>
                </table>
              </div>

              {/* 6. Payment */}
              <div className={`${glass} p-5`}>
                <h2 className="text-sm font-semibold text-white mb-3">6 — Payment of Tax</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-zinc-500 uppercase tracking-wide">
                      <th className="text-left py-2">Description</th>
                      <th className="text-right py-2">CGST</th>
                      <th className="text-right py-2">SGST</th>
                      <th className="text-right py-2">IGST</th>
                      <th className="text-right py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <TaxRow label="Output Tax" cgst={gstr3b.section_3_1.cgst} sgst={gstr3b.section_3_1.sgst} igst={gstr3b.section_3_1.igst} />
                    <TaxRow label="Less: ITC" cgst={gstr3b.section_4.cgst} sgst={gstr3b.section_4.sgst} igst={gstr3b.section_4.igst} />
                    <TaxRow label="Net Tax Payable" cgst={gstr3b.section_6.cgst} sgst={gstr3b.section_6.sgst} igst={gstr3b.section_6.igst} bold />
                  </tbody>
                </table>

                {gstr3b.section_6.total > 0 ? (
                  <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                    <p className="text-sm font-medium text-amber-400">GST Payable: {fmt(gstr3b.section_6.total)}</p>
                    <p className="text-xs text-amber-400/70 mt-0.5">Pay via GST portal before 20th of next month</p>
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                    <p className="text-sm font-medium text-emerald-400">No GST payable — ITC surplus carries forward</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GSTR-1 Tab */}
          {tab === 'gstr1' && gstr1 && (
            <div className="space-y-6">
              <p className="text-sm text-zinc-500">Outward supply details for <strong className="text-white">{periodLabel}</strong> — {gstr1.totals.invoices} invoice(s)</p>

              {/* B2B */}
              {gstr1.b2b.length > 0 && (
                <div className={`${glass} p-5`}>
                  <h2 className="text-sm font-semibold text-white mb-3">B2B — Supplies to Registered Persons ({gstr1.b2b.length})</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-zinc-500 uppercase tracking-wide border-b border-zinc-700">
                          <th className="text-left py-2 pr-2">Invoice</th>
                          <th className="text-left py-2 pr-2">Date</th>
                          <th className="text-left py-2 pr-2">Client</th>
                          <th className="text-left py-2 pr-2">GSTIN</th>
                          <th className="text-right py-2 pr-2">Taxable</th>
                          <th className="text-right py-2 pr-2">CGST</th>
                          <th className="text-right py-2 pr-2">SGST</th>
                          <th className="text-right py-2 pr-2">IGST</th>
                          <th className="text-right py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gstr1.b2b.map((o: AnyObj) => (
                          <tr key={o.id} className="border-t border-zinc-800/30">
                            <td className="py-2 pr-2 font-mono text-rose-400">{o.order_no}</td>
                            <td className="py-2 pr-2 text-zinc-400">{o.order_date}</td>
                            <td className="py-2 pr-2 text-zinc-300 truncate max-w-[120px]">{o.client_name}</td>
                            <td className="py-2 pr-2 font-mono text-zinc-500">{o.client_gstin}</td>
                            <td className="py-2 pr-2 text-right font-mono text-zinc-400">{fmt(o.base_value)}</td>
                            <td className="py-2 pr-2 text-right font-mono text-zinc-500">{fmt(o.cgst_amount)}</td>
                            <td className="py-2 pr-2 text-right font-mono text-zinc-500">{fmt(o.sgst_amount)}</td>
                            <td className="py-2 pr-2 text-right font-mono text-zinc-500">{fmt(o.igst_amount)}</td>
                            <td className="py-2 text-right font-mono text-white font-medium">{fmt(o.total_value_incl_gst)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* B2C Large */}
              {gstr1.b2cLarge.length > 0 && (
                <div className={`${glass} p-5`}>
                  <h2 className="text-sm font-semibold text-white mb-3">B2C Large — Unregistered ({'>'}2.5L) ({gstr1.b2cLarge.length})</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-zinc-500 uppercase tracking-wide border-b border-zinc-700">
                          <th className="text-left py-2 pr-2">Invoice</th>
                          <th className="text-left py-2 pr-2">Client</th>
                          <th className="text-left py-2 pr-2">Place of Supply</th>
                          <th className="text-right py-2 pr-2">Taxable</th>
                          <th className="text-right py-2">Tax</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gstr1.b2cLarge.map((o: AnyObj) => (
                          <tr key={o.id} className="border-t border-zinc-800/30">
                            <td className="py-2 pr-2 font-mono text-rose-400">{o.order_no}</td>
                            <td className="py-2 pr-2 text-zinc-300">{o.client_name}</td>
                            <td className="py-2 pr-2 text-zinc-400">{o.place_of_supply || 'Tamil Nadu (33)'}</td>
                            <td className="py-2 pr-2 text-right font-mono text-zinc-400">{fmt(o.base_value)}</td>
                            <td className="py-2 text-right font-mono text-white">{fmt((o.cgst_amount ?? 0) + (o.sgst_amount ?? 0) + (o.igst_amount ?? 0))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* B2C Small */}
              {gstr1.b2c.length > 0 && (
                <div className={`${glass} p-5`}>
                  <h2 className="text-sm font-semibold text-white mb-3">B2C Small — Unregistered ({'<'}2.5L) ({gstr1.b2c.length})</h2>
                  <p className="text-xs text-zinc-500 mb-2">Reported as aggregate — no invoice-level detail required in GSTR-1</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg bg-zinc-800/60 px-3 py-2">
                      <p className="text-xs text-zinc-500">Taxable</p>
                      <p className="text-sm font-mono text-white">{fmt(gstr1.b2c.reduce((s: number, o: AnyObj) => s + (o.base_value ?? 0), 0))}</p>
                    </div>
                    <div className="rounded-lg bg-zinc-800/60 px-3 py-2">
                      <p className="text-xs text-zinc-500">Tax</p>
                      <p className="text-sm font-mono text-white">{fmt(gstr1.b2c.reduce((s: number, o: AnyObj) => s + (o.cgst_amount ?? 0) + (o.sgst_amount ?? 0) + (o.igst_amount ?? 0), 0))}</p>
                    </div>
                    <div className="rounded-lg bg-zinc-800/60 px-3 py-2">
                      <p className="text-xs text-zinc-500">Invoices</p>
                      <p className="text-sm font-mono text-white">{gstr1.b2c.length}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* HSN Summary */}
              {gstr1.hsnSummary.length > 0 && (
                <div className={`${glass} p-5`}>
                  <h2 className="text-sm font-semibold text-white mb-3">HSN/SAC Summary</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-zinc-500 uppercase tracking-wide border-b border-zinc-700">
                          <th className="text-left py-2 pr-2">HSN/SAC</th>
                          <th className="text-left py-2 pr-2">Description</th>
                          <th className="text-right py-2 pr-2">Qty</th>
                          <th className="text-right py-2 pr-2">Taxable</th>
                          <th className="text-right py-2 pr-2">CGST</th>
                          <th className="text-right py-2 pr-2">SGST</th>
                          <th className="text-right py-2 pr-2">IGST</th>
                          <th className="text-right py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gstr1.hsnSummary.map((h: AnyObj) => (
                          <tr key={h.hsn} className="border-t border-zinc-800/30">
                            <td className="py-2 pr-2 font-mono text-rose-400">{h.hsn}</td>
                            <td className="py-2 pr-2 text-zinc-400">{h.description}</td>
                            <td className="py-2 pr-2 text-right text-zinc-400">{h.qty}</td>
                            <td className="py-2 pr-2 text-right font-mono text-zinc-400">{fmt(h.taxable)}</td>
                            <td className="py-2 pr-2 text-right font-mono text-zinc-500">{fmt(h.cgst)}</td>
                            <td className="py-2 pr-2 text-right font-mono text-zinc-500">{fmt(h.sgst)}</td>
                            <td className="py-2 pr-2 text-right font-mono text-zinc-500">{fmt(h.igst)}</td>
                            <td className="py-2 text-right font-mono text-white font-medium">{fmt(h.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {gstr1.totals.invoices === 0 && (
                <div className={`${glass} p-12 text-center`}>
                  <p className="text-zinc-500">No outward supplies for {periodLabel}.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
