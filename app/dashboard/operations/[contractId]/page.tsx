'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, Plus, Factory, FlaskConical,
  Save, BarChart3,
} from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const inputCls = 'w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-colors';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const fmtKg = (n: number) => `${n.toFixed(1)} kg`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

export default function OperationsDetailPage() {
  const { contractId } = useParams();
  const [data, setData] = useState<AnyObj | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'production' | 'lab'>('production');

  // Production form
  const [pForm, setPForm] = useState({ log_date: new Date().toISOString().split('T')[0], dross_input_kg: '', zinc_recovered_kg: '', power_kwh: '', zinc_price_per_kg: '280', operator: '', notes: '' });
  const [pSaving, setPSaving] = useState(false);
  const [pMsg, setPMsg] = useState('');

  // Lab sample form
  const [sForm, setSForm] = useState({ sample_type: 'zinc', collected_by: '' });
  const [sSaving, setSSaving] = useState(false);
  const [sMsg, setSMsg] = useState('');

  const load = () => {
    fetch(`/api/operations/contracts/${contractId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  };

  useEffect(() => { load(); }, [contractId]);

  const addProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    setPSaving(true); setPMsg('');
    const res = await fetch(`/api/operations/contracts/${contractId}/production`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...pForm,
        dross_input_kg: parseFloat(pForm.dross_input_kg) || 0,
        zinc_recovered_kg: parseFloat(pForm.zinc_recovered_kg) || 0,
        power_kwh: parseFloat(pForm.power_kwh) || 0,
        zinc_price_per_kg: parseFloat(pForm.zinc_price_per_kg) || 0,
      }),
    });
    setPSaving(false);
    if (res.ok) {
      setPMsg('Production log added.');
      setPForm(f => ({ ...f, dross_input_kg: '', zinc_recovered_kg: '', power_kwh: '', notes: '' }));
      load();
    } else {
      const d = await res.json();
      setPMsg(`Error: ${d.error}`);
    }
  };

  const addSample = async () => {
    setSSaving(true); setSMsg('');
    const res = await fetch(`/api/operations/contracts/${contractId}/lab/samples`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sForm),
    });
    setSSaving(false);
    if (res.ok) {
      setSMsg('Sample registered.');
      load();
    } else {
      const d = await res.json();
      setSMsg(`Error: ${d.error}`);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>;
  if (!data?.contract) return <div className="p-6 text-zinc-500">Contract not found.</div>;

  const { contract, logs, samples, stats } = data;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <Link href="/d/operations" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> All Contracts
      </Link>

      {/* Header */}
      <div>
        <span className="text-xs font-mono text-zinc-600">{contract.contract_code}</span>
        <h1 className="text-xl font-bold text-white">{contract.projects?.name}</h1>
        <p className="text-sm text-zinc-500">{contract.projects?.customers?.name} — Investment: {fmt(contract.investment_amount)}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={`${glass} p-4`}>
          <p className="text-xs text-zinc-500">Total Zinc</p>
          <p className="text-lg font-bold text-white">{fmtKg(stats.totalZinc)}</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-xs text-zinc-500">Total Revenue</p>
          <p className="text-lg font-bold text-emerald-400">{fmt(stats.totalRevenue)}</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-xs text-zinc-500">Avg Recovery</p>
          <p className="text-lg font-bold text-amber-400">{stats.avgRecovery.toFixed(1)}%</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-xs text-zinc-500">ROI Recovery</p>
          <p className={`text-lg font-bold ${stats.totalRevenue >= contract.investment_amount ? 'text-emerald-400' : 'text-rose-400'}`}>
            {contract.investment_amount > 0 ? ((stats.totalRevenue / contract.investment_amount) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800">
        {(['production', 'lab'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
              tab === t ? 'text-rose-400 border-b-2 border-rose-400' : 'text-zinc-500 hover:text-white'
            }`}>
            {t === 'production' ? <BarChart3 className="h-3.5 w-3.5" /> : <FlaskConical className="h-3.5 w-3.5" />}
            {t === 'production' ? 'Production' : 'LabREX'}
          </button>
        ))}
      </div>

      {/* Production Tab */}
      {tab === 'production' && (
        <div className="space-y-4">
          {/* Add production form */}
          <form onSubmit={addProduction} className={`${glass} p-5`}>
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Plus className="h-4 w-4" /> Log Daily Production</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div><label className="block text-xs text-zinc-400 mb-1">Date</label><input type="date" value={pForm.log_date} onChange={e => setPForm(f => ({ ...f, log_date: e.target.value }))} className={inputCls} /></div>
              <div><label className="block text-xs text-zinc-400 mb-1">Dross Input (kg)</label><input type="number" step="0.1" value={pForm.dross_input_kg} onChange={e => setPForm(f => ({ ...f, dross_input_kg: e.target.value }))} className={inputCls} /></div>
              <div><label className="block text-xs text-zinc-400 mb-1">Zinc Recovered (kg)</label><input type="number" step="0.1" value={pForm.zinc_recovered_kg} onChange={e => setPForm(f => ({ ...f, zinc_recovered_kg: e.target.value }))} className={inputCls} /></div>
              <div><label className="block text-xs text-zinc-400 mb-1">Power (kWh)</label><input type="number" step="0.1" value={pForm.power_kwh} onChange={e => setPForm(f => ({ ...f, power_kwh: e.target.value }))} className={inputCls} /></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div><label className="block text-xs text-zinc-400 mb-1">Zn Price (₹/kg)</label><input type="number" step="0.1" value={pForm.zinc_price_per_kg} onChange={e => setPForm(f => ({ ...f, zinc_price_per_kg: e.target.value }))} className={inputCls} /></div>
              <div><label className="block text-xs text-zinc-400 mb-1">Operator</label><input value={pForm.operator} onChange={e => setPForm(f => ({ ...f, operator: e.target.value }))} className={inputCls} /></div>
              <div className="col-span-2"><label className="block text-xs text-zinc-400 mb-1">Notes</label><input value={pForm.notes} onChange={e => setPForm(f => ({ ...f, notes: e.target.value }))} className={inputCls} /></div>
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={pSaving} className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-500 disabled:opacity-50">
                {pSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Add Entry
              </button>
              {pMsg && <span className="text-xs text-zinc-400">{pMsg}</span>}
            </div>
          </form>

          {/* Production logs table */}
          <div className={`${glass} p-5`}>
            <h2 className="text-sm font-semibold text-white mb-3">Production Log ({logs.length} entries)</h2>
            {logs.length === 0 ? <p className="text-sm text-zinc-500">No entries yet.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[700px]">
                  <thead>
                    <tr className="text-zinc-500 uppercase tracking-wide border-b border-zinc-700">
                      <th className="text-left py-2 pr-2">Date</th>
                      <th className="text-right py-2 pr-2">Dross In</th>
                      <th className="text-right py-2 pr-2">Zinc Out</th>
                      <th className="text-right py-2 pr-2">Recovery</th>
                      <th className="text-right py-2 pr-2">Power</th>
                      <th className="text-right py-2 pr-2">kWh/kg</th>
                      <th className="text-right py-2 pr-2">Price</th>
                      <th className="text-right py-2">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l: AnyObj) => (
                      <tr key={l.id} className="border-t border-zinc-800/30">
                        <td className="py-2 pr-2 text-zinc-300">{fmtDate(l.log_date)}</td>
                        <td className="py-2 pr-2 text-right font-mono text-zinc-400">{fmtKg(l.dross_input_kg)}</td>
                        <td className="py-2 pr-2 text-right font-mono text-white font-medium">{fmtKg(l.zinc_recovered_kg)}</td>
                        <td className="py-2 pr-2 text-right font-mono text-amber-400">{l.recovery_rate}%</td>
                        <td className="py-2 pr-2 text-right font-mono text-zinc-400">{l.power_kwh}</td>
                        <td className="py-2 pr-2 text-right font-mono text-zinc-500">{l.power_per_kg}</td>
                        <td className="py-2 pr-2 text-right font-mono text-zinc-400">₹{l.zinc_price_per_kg}</td>
                        <td className="py-2 text-right font-mono text-emerald-400 font-medium">{fmt(l.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lab Tab */}
      {tab === 'lab' && (
        <div className="space-y-4">
          {/* Add sample */}
          <div className={`${glass} p-5`}>
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><FlaskConical className="h-4 w-4" /> Register Lab Sample</h2>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Sample Type</label>
                <select value={sForm.sample_type} onChange={e => setSForm(f => ({ ...f, sample_type: e.target.value }))} className={inputCls}>
                  <option value="zinc">Zinc (Recovered)</option>
                  <option value="electrolyte">Electrolyte</option>
                  <option value="dross">Dross (Input)</option>
                  <option value="water">Water (Effluent)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Collected By</label>
                <input value={sForm.collected_by} onChange={e => setSForm(f => ({ ...f, collected_by: e.target.value }))} placeholder="Lab technician name" className={inputCls} />
              </div>
              <button onClick={addSample} disabled={sSaving} className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-500 disabled:opacity-50">
                {sSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Register
              </button>
              {sMsg && <span className="text-xs text-zinc-400">{sMsg}</span>}
            </div>
          </div>

          {/* Samples list */}
          <div className={`${glass} p-5`}>
            <h2 className="text-sm font-semibold text-white mb-3">Lab Samples ({samples.length})</h2>
            {samples.length === 0 ? <p className="text-sm text-zinc-500">No samples registered yet.</p> : (
              <div className="space-y-2">
                {samples.map((s: AnyObj) => {
                  const results = s.lab_results ?? [];
                  const outOfSpec = results.filter((r: AnyObj) => !r.is_within_spec).length;
                  return (
                    <div key={s.id} className="flex items-center justify-between rounded-xl bg-zinc-800/40 px-4 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-rose-400">{s.sample_code}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            s.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                            s.status === 'in_testing' ? 'bg-blue-500/10 text-blue-400' :
                            'bg-zinc-500/10 text-zinc-400'
                          }`}>{s.status}</span>
                          <span className="text-xs text-zinc-500">{s.sample_type}</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {fmtDate(s.collected_at)} {s.collected_by && `· ${s.collected_by}`}
                          {results.length > 0 && ` · ${results.length} results`}
                          {outOfSpec > 0 && <span className="text-red-400 ml-1">({outOfSpec} out of spec)</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
