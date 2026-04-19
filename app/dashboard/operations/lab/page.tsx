'use client';

import { useEffect, useState } from 'react';
import {
  FlaskConical, Plus, Loader2, Settings2, Beaker, Factory, Trash2,
} from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const inputCls = 'w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-colors';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

export default function LabConfigPage() {
  const [tab, setTab] = useState<'instruments' | 'industries' | 'sample_types' | 'parameters'>('instruments');
  const [instruments, setInstruments] = useState<AnyObj[]>([]);
  const [industries, setIndustries] = useState<AnyObj[]>([]);
  const [sampleTypes, setSampleTypes] = useState<AnyObj[]>([]);
  const [parameters, setParameters] = useState<AnyObj[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [industryFilter, setIndustryFilter] = useState('all');
  const [sampleTypeFilter, setSampleTypeFilter] = useState('all');
  const [addMsg, setAddMsg] = useState('');
  const [adding, setAdding] = useState(false);

  const addItem = async (endpoint: string, body: Record<string, unknown>) => {
    setAdding(true); setAddMsg('');
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setAdding(false);
    if (res.ok) { setAddMsg('Added!'); load(); setTimeout(() => setAddMsg(''), 2000); return true; }
    const d = await res.json(); setAddMsg(`Error: ${d.error}`); return false;
  };

  const load = async () => {
    const [inst, ind, st, params] = await Promise.all([
      fetch('/api/lab/instruments').then(r => r.json()),
      fetch('/api/lab/industries').then(r => r.json()),
      fetch('/api/lab/sample-types').then(r => r.json()),
      fetch('/api/lab/parameters').then(r => r.json()),
    ]);
    if (Array.isArray(inst)) setInstruments(inst);
    if (Array.isArray(ind)) setIndustries(ind);
    if (Array.isArray(st)) setSampleTypes(st);
    if (Array.isArray(params)) setParameters(params);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredParams = parameters.filter(p => {
    if (industryFilter !== 'all' && p.industry_id !== industryFilter) return false;
    if (sampleTypeFilter !== 'all' && p.sample_type !== sampleTypeFilter) return false;
    return true;
  });

  const filteredSampleTypes = sampleTypes.filter(st => {
    if (industryFilter !== 'all' && st.industry_id !== industryFilter) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>;

  return (
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <FlaskConical className="h-5 w-5 text-rose-400" />
        <div>
          <h1 className="text-xl font-bold text-white">LabREX Configuration</h1>
          <p className="text-sm text-zinc-500">Manage instruments, industries, sample types, and test parameters</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Instruments', count: instruments.length, icon: Settings2 },
          { label: 'Industries', count: industries.length, icon: Factory },
          { label: 'Sample Types', count: sampleTypes.length, icon: Beaker },
          { label: 'Parameters', count: parameters.length, icon: FlaskConical },
        ].map(c => (
          <div key={c.label} className={`${glass} p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <c.icon className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-xs text-zinc-500">{c.label}</span>
            </div>
            <p className="text-lg font-bold text-white">{c.count}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800 mb-6 overflow-x-auto">
        {(['instruments', 'industries', 'sample_types', 'parameters'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t ? 'text-rose-400 border-b-2 border-rose-400' : 'text-zinc-500 hover:text-white'
            }`}>
            {t === 'sample_types' ? 'Sample Types' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {addMsg && <p className="text-xs text-zinc-400 bg-zinc-800 rounded-lg px-3 py-2 mb-4">{addMsg}</p>}

      {/* Instruments Tab */}
      {tab === 'instruments' && (
        <div className="space-y-4">
        <form onSubmit={e => { e.preventDefault(); const fd = new FormData(e.currentTarget);
          addItem('/api/lab/instruments', { code: fd.get('code'), name: fd.get('name'), category: fd.get('category'), description: fd.get('desc') })
            .then(ok => { if (ok) (e.target as HTMLFormElement).reset(); });
        }} className={`${glass} p-4`}>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Add Instrument</h2>
          <div className="flex flex-wrap gap-2 items-end">
            <input name="code" required placeholder="Code (e.g. ICP-MS)" className={inputCls + ' w-28'} />
            <input name="name" required placeholder="Full name" className={inputCls + ' flex-1 min-w-[150px]'} />
            <select name="category" required className={inputCls + ' w-40'}>
              <option value="spectroscopy">Spectroscopy</option><option value="wet_chemistry">Wet Chemistry</option>
              <option value="thermal">Thermal</option><option value="mineral_processing">Mineral Processing</option><option value="other">Other</option>
            </select>
            <input name="desc" placeholder="Description" className={inputCls + ' flex-1 min-w-[150px]'} />
            <button type="submit" disabled={adding} className="rounded-lg bg-rose-600 px-3 py-2 text-xs text-white hover:bg-rose-500 disabled:opacity-50">Add</button>
          </div>
        </form>
        <div className={`${glass} p-5`}>
          <h2 className="text-sm font-semibold text-white mb-4">Analytical Instruments ({instruments.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="text-xs text-zinc-500 uppercase tracking-wide border-b border-zinc-700">
                  <th className="text-left py-2 pr-3">Code</th>
                  <th className="text-left py-2 pr-3">Name</th>
                  <th className="text-left py-2 pr-3">Category</th>
                  <th className="text-left py-2">Description</th>
                </tr>
              </thead>
              <tbody>
                {instruments.map(i => (
                  <tr key={i.id} className="border-t border-zinc-800/30">
                    <td className="py-2.5 pr-3 font-mono text-rose-400 text-xs">{i.code}</td>
                    <td className="py-2.5 pr-3 text-white font-medium">{i.name}</td>
                    <td className="py-2.5 pr-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{i.category}</span>
                    </td>
                    <td className="py-2.5 text-xs text-zinc-500 max-w-[300px] truncate">{i.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      {/* Industries Tab */}
      {tab === 'industries' && (
        <div className={`${glass} p-5`}>
          <h2 className="text-sm font-semibold text-white mb-4">Industries ({industries.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {industries.map(i => {
              const stCount = sampleTypes.filter(st => st.industry_id === i.id).length;
              const pCount = parameters.filter(p => p.industry_id === i.id).length;
              return (
                <div key={i.id} className="rounded-xl bg-zinc-800/40 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-rose-400">{i.code}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${i.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-500'}`}>
                      {i.is_active ? 'active' : 'inactive'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white">{i.name}</p>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{i.description}</p>
                  <div className="flex gap-3 mt-2 text-xs text-zinc-600">
                    <span>{stCount} sample types</span>
                    <span>{pCount} parameters</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sample Types Tab */}
      {tab === 'sample_types' && (
        <div>
          <form onSubmit={e => { e.preventDefault(); const fd = new FormData(e.currentTarget);
            addItem('/api/lab/sample-types', { code: fd.get('code'), name: fd.get('name'), industry_id: fd.get('industry_id') || null, description: fd.get('desc') })
              .then(ok => { if (ok) (e.target as HTMLFormElement).reset(); });
          }} className={`${glass} p-4 mb-4`}>
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Add Sample Type</h2>
            <div className="flex flex-wrap gap-2 items-end">
              <input name="code" required placeholder="Code (e.g. cu-ore)" className={inputCls + ' w-28'} />
              <input name="name" required placeholder="Name" className={inputCls + ' flex-1 min-w-[120px]'} />
              <select name="industry_id" className={inputCls + ' w-44'}>
                <option value="">No industry</option>
                {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
              <input name="desc" placeholder="Description" className={inputCls + ' flex-1 min-w-[120px]'} />
              <button type="submit" disabled={adding} className="rounded-lg bg-rose-600 px-3 py-2 text-xs text-white hover:bg-rose-500 disabled:opacity-50">Add</button>
            </div>
          </form>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-zinc-500">Industry:</span>
            <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs text-white">
              <option value="all">All ({sampleTypes.length})</option>
              {industries.map(i => (
                <option key={i.id} value={i.id}>{i.name} ({sampleTypes.filter(st => st.industry_id === i.id).length})</option>
              ))}
            </select>
          </div>
          <div className={`${glass} p-5`}>
            <h2 className="text-sm font-semibold text-white mb-4">Sample Types ({filteredSampleTypes.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="text-xs text-zinc-500 uppercase tracking-wide border-b border-zinc-700">
                    <th className="text-left py-2 pr-3">Code</th>
                    <th className="text-left py-2 pr-3">Name</th>
                    <th className="text-left py-2 pr-3">Industry</th>
                    <th className="text-left py-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSampleTypes.map(st => (
                    <tr key={st.id} className="border-t border-zinc-800/30">
                      <td className="py-2.5 pr-3 font-mono text-rose-400 text-xs">{st.code}</td>
                      <td className="py-2.5 pr-3 text-white font-medium">{st.name}</td>
                      <td className="py-2.5 pr-3 text-xs text-zinc-400">{st.lab_industries?.name ?? '—'}</td>
                      <td className="py-2.5 text-xs text-zinc-500 max-w-[250px] truncate">{st.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Parameters Tab */}
      {tab === 'parameters' && (
        <div>
          <form onSubmit={e => { e.preventDefault(); const fd = new FormData(e.currentTarget);
            addItem('/api/lab/parameters', {
              name: fd.get('name'), unit: fd.get('unit'), category: fd.get('category'),
              sample_type: fd.get('sample_type') || null, industry_id: fd.get('industry_id') || null,
              element_symbol: fd.get('element') || null,
              default_min: fd.get('min') ? Number(fd.get('min')) : null,
              default_max: fd.get('max') ? Number(fd.get('max')) : null,
            }).then(ok => { if (ok) (e.target as HTMLFormElement).reset(); });
          }} className={`${glass} p-4 mb-4`}>
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Add Parameter</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
              <input name="name" required placeholder="Name *" className={inputCls} />
              <input name="unit" required placeholder="Unit (%, ppm, g/L)" className={inputCls} />
              <input name="element" placeholder="Element (Cu, Zn...)" className={inputCls} />
              <select name="category" required className={inputCls}>
                <option value="composition">Composition</option><option value="purity">Purity</option>
                <option value="water">Water</option><option value="other">Other</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2 items-end">
              <input name="sample_type" placeholder="Sample type code" className={inputCls + ' w-36'} />
              <select name="industry_id" className={inputCls + ' w-44'}>
                <option value="">No industry</option>
                {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
              <input name="min" type="number" step="any" placeholder="Min spec" className={inputCls + ' w-24'} />
              <input name="max" type="number" step="any" placeholder="Max spec" className={inputCls + ' w-24'} />
              <button type="submit" disabled={adding} className="rounded-lg bg-rose-600 px-3 py-2 text-xs text-white hover:bg-rose-500 disabled:opacity-50">Add</button>
            </div>
          </form>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs text-zinc-500">Industry:</span>
            <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs text-white">
              <option value="all">All</option>
              {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <span className="text-xs text-zinc-500 ml-2">Sample type:</span>
            <select value={sampleTypeFilter} onChange={e => setSampleTypeFilter(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs text-white">
              <option value="all">All</option>
              {[...new Set(parameters.map(p => p.sample_type))].filter(Boolean).sort().map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
            <span className="text-xs text-zinc-600 ml-auto">{filteredParams.length} parameters</span>
          </div>
          <div className={`${glass} p-5`}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[700px]">
                <thead>
                  <tr className="text-zinc-500 uppercase tracking-wide border-b border-zinc-700">
                    <th className="text-left py-2 pr-2">Parameter</th>
                    <th className="text-left py-2 pr-2">Unit</th>
                    <th className="text-left py-2 pr-2">Element</th>
                    <th className="text-left py-2 pr-2">Category</th>
                    <th className="text-left py-2 pr-2">Sample Type</th>
                    <th className="text-right py-2 pr-2">Min Spec</th>
                    <th className="text-right py-2 pr-2">Max Spec</th>
                    <th className="text-left py-2">Industry</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParams.map(p => (
                    <tr key={p.id} className="border-t border-zinc-800/30">
                      <td className="py-2 pr-2 text-white font-medium">{p.name}</td>
                      <td className="py-2 pr-2 text-zinc-400">{p.unit}</td>
                      <td className="py-2 pr-2 font-mono text-rose-400">{p.element_symbol || '—'}</td>
                      <td className="py-2 pr-2"><span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{p.category}</span></td>
                      <td className="py-2 pr-2 text-zinc-400">{p.sample_type}</td>
                      <td className="py-2 pr-2 text-right font-mono text-zinc-500">{p.default_min ?? '—'}</td>
                      <td className="py-2 pr-2 text-right font-mono text-zinc-500">{p.default_max ?? '—'}</td>
                      <td className="py-2 text-zinc-500">{p.lab_industries?.name ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
