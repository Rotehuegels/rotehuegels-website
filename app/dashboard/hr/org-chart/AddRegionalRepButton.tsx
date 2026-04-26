'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Loader2 } from 'lucide-react';

const input = 'w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600';

const flag = (cc: string) =>
  cc.length === 2
    ? String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)))
    : '';

export default function AddRegionalRepButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState('');

  const [country, setCountry] = useState('');
  const [code, setCode]       = useState('');

  async function save() {
    setErr('');
    if (!country.trim() || code.length !== 2) {
      setErr('Country name and 2-letter ISO code are both required.'); return;
    }
    setBusy(true);
    const cc = code.toUpperCase();
    const res = await fetch('/api/positions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id:            `sm-rep-${cc.toLowerCase()}`,
        title:         `${country.trim()} Sales Representative`,
        short_title:   `${country.trim()} Rep`,
        department_id: 'sales-marketing',
        reports_to_id: 'sm-head',
        level:         3,
        is_head:       false,
        sort_order:    420,
        country_code:  cc,
        is_external:   true,
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(typeof json.error === 'string' ? json.error : JSON.stringify(json.error)); return; }
    setOpen(false); setCountry(''); setCode('');
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-300">
        <Plus className="h-3.5 w-3.5" /> Add regional rep
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Add regional sales representative</h3>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white"><X className="h-4 w-4" /></button>
            </div>

            <p className="text-xs text-zinc-500 mb-3">
              Creates a new position under <strong className="text-zinc-300">Head of Sales &amp; Marketing</strong>, tagged as
              consultant / commission. Assign an employee record after saving.
            </p>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Country name</label>
                <input className={input} value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Vietnam" autoFocus />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">ISO code</label>
                <input className={input} value={code} maxLength={2} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="VN" />
                {code.length === 2 && <p className="mt-1 text-base text-center">{flag(code)}</p>}
              </div>
            </div>

            {err && <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{err}</div>}

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setOpen(false)}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-500">
                Cancel
              </button>
              <button onClick={save} disabled={busy || !country.trim() || code.length !== 2}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                {busy && <Loader2 className="h-3 w-3 animate-spin" />}
                Add position
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
