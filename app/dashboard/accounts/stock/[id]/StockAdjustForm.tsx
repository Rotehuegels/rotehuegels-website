'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Minus, Equal } from 'lucide-react';

const input = 'w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600';

type MovementType = 'receipt' | 'issue' | 'adjustment';

export default function StockAdjustForm({
  stockItemId, itemUnit, currentQty,
}: {
  stockItemId: string;
  itemUnit: string;
  currentQty: number;
}) {
  const router = useRouter();
  const [type, setType]       = useState<MovementType>('receipt');
  const [qty, setQty]         = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [notes, setNotes]     = useState('');
  const [busy, setBusy]       = useState(false);
  const [err, setErr]         = useState('');
  const [ok, setOk]           = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setOk(false);
    const n = Number(qty);
    if (!n || !notes.trim()) {
      setErr('Quantity (non-zero) and notes are required.'); return;
    }
    setBusy(true);
    const res = await fetch('/api/accounts/stock/movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stock_item_id: stockItemId,
        movement_type: type,
        quantity:      n,
        unit_cost:     unitCost ? Number(unitCost) : undefined,
        notes,
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(typeof json.error === 'string' ? json.error : JSON.stringify(json.error)); return; }
    setOk(true);
    setQty(''); setUnitCost(''); setNotes('');
    router.refresh();
  }

  // Effective sign preview
  const signed = (() => {
    const n = Number(qty) || 0;
    if (type === 'receipt') return Math.abs(n);
    if (type === 'issue')   return -Math.abs(n);
    return n; // adjustment trusts caller's sign
  })();
  const after = currentQty + signed;

  return (
    <form onSubmit={submit} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-300">Adjust stock</h2>
        <span className="text-[10px] text-zinc-500">All movements are auditable in the history below.</span>
      </div>

      {/* Type pills */}
      <div className="flex flex-wrap gap-2">
        <TypeBtn icon={Plus}  label="Receipt"     value="receipt"    current={type} onClick={setType} />
        <TypeBtn icon={Minus} label="Issue"       value="issue"      current={type} onClick={setType} />
        <TypeBtn icon={Equal} label="Adjustment"  value="adjustment" current={type} onClick={setType} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">
            Quantity {type === 'adjustment' ? '(use ± sign)' : `(${itemUnit || 'pcs'})`}
          </label>
          <input className={input} type="number" step="0.001" value={qty} onChange={e => setQty(e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Unit cost (optional)</label>
          <input className={input} type="number" step="0.01" min="0" value={unitCost} onChange={e => setUnitCost(e.target.value)} placeholder="₹ per unit" />
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">After this</p>
          <p className="text-sm font-semibold tabular-nums">
            {currentQty.toFixed(3)} {signed >= 0 ? '+' : '−'} {Math.abs(signed).toFixed(3)} = <span className={after < 0 ? 'text-rose-400' : 'text-zinc-200'}>{after.toFixed(3)}</span>
          </p>
        </div>
      </div>

      <div>
        <label className="text-xs text-zinc-500 mb-1 block">Notes (required)</label>
        <input className={input} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason for the movement — kept on the audit trail" />
      </div>

      {err && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">{err}</div>}
      {ok  && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">Movement recorded.</div>}

      <button type="submit" disabled={busy}
        className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Record movement
      </button>
    </form>
  );
}

function TypeBtn({
  icon: Icon, label, value, current, onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: MovementType;
  current: MovementType;
  onClick: (v: MovementType) => void;
}) {
  const active = current === value;
  return (
    <button type="button" onClick={() => onClick(value)}
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors',
        active
          ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
          : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700',
      ].join(' ')}>
      <Icon className="h-3 w-3" /> {label}
    </button>
  );
}
