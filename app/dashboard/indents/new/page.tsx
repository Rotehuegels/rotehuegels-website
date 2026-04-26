'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, X, Trash2, Loader2 } from 'lucide-react';

type Item = {
  item_name: string;
  description: string;
  uom: string;
  qty: string;
  estimated_unit_cost: string;
  notes: string;
  stock_item_id?: string;
};

type StockItem = {
  id: string;
  item_code: string;
  item_name: string;
  unit: string;
  quantity: number;
  reorder_level: number | null;
};

type Supplier = { id: string; legal_name: string; trade_name: string | null; vendor_code: string | null };

const empty: Item = { item_name: '', description: '', uom: 'pcs', qty: '1', estimated_unit_cost: '', notes: '' };

const input = 'w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600';

export default function NewIndentPage() {
  const router = useRouter();
  const [stock, setStock]       = useState<StockItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [saving, setSaving]     = useState<'idle' | 'saving' | 'submitting'>('idle');
  const [err, setErr]           = useState('');

  const [department, setDepartment] = useState('');
  const [requiredBy, setRequiredBy] = useState('');
  const [priority, setPriority]     = useState<'low'|'normal'|'high'|'urgent'>('normal');
  const [justification, setJustification] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes]           = useState('');
  const [items, setItems]           = useState<Item[]>([{ ...empty }]);

  useEffect(() => {
    fetch('/api/accounts/stock').then(r => r.ok ? r.json() : Promise.reject()).then(d => setStock(d.data ?? d ?? [])).catch(() => {});
    fetch('/api/accounts/suppliers').then(r => r.ok ? r.json() : Promise.reject()).then(d => setSuppliers(d.data ?? d ?? [])).catch(() => {});
  }, []);

  const updateItem = (idx: number, patch: Partial<Item>) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));

  const addItem    = () => setItems(prev => [...prev, { ...empty }]);
  const removeItem = (idx: number) => setItems(prev => prev.length === 1 ? prev : prev.filter((_, i) => i !== idx));

  const onPickStock = (idx: number, stockId: string) => {
    if (!stockId) { updateItem(idx, { stock_item_id: undefined }); return; }
    const s = stock.find(x => x.id === stockId);
    if (!s) return;
    updateItem(idx, {
      stock_item_id: s.id,
      item_name: s.item_name,
      uom: s.unit ?? 'pcs',
    });
  };

  async function save(action: 'draft' | 'submit') {
    setErr('');
    if (items.some(it => !it.item_name.trim() || !Number(it.qty))) {
      setErr('Each item needs a name and quantity > 0.'); return;
    }
    setSaving(action === 'draft' ? 'saving' : 'submitting');

    const body = {
      department: department || undefined,
      required_by: requiredBy || undefined,
      priority,
      justification: justification || undefined,
      preferred_supplier_id: supplierId || undefined,
      notes: notes || undefined,
      items: items.map(it => ({
        stock_item_id: it.stock_item_id || undefined,
        item_name: it.item_name.trim(),
        description: it.description || undefined,
        uom: it.uom || undefined,
        qty: Number(it.qty),
        estimated_unit_cost: it.estimated_unit_cost ? Number(it.estimated_unit_cost) : undefined,
        notes: it.notes || undefined,
      })),
    };

    const res = await fetch('/api/indents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) { setErr(typeof json.error === 'string' ? json.error : JSON.stringify(json.error)); setSaving('idle'); return; }

    if (action === 'submit') {
      // Move from draft → submitted on the same flow
      await fetch(`/api/indents/${json.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit' }),
      });
    }

    router.push(`/d/indents/${json.id}`);
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl">
      <Link href="/d/indents" className="text-sm text-zinc-500 hover:text-zinc-300">← Back to Indents</Link>
      <h1 className="text-xl md:text-2xl font-bold text-white">New Indent</h1>

      {err && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{err}</div>}

      {/* Header fields */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Department</label>
            <input className={input} value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Operations, Lab, Stores" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Required by</label>
            <input className={input} type="date" value={requiredBy} onChange={e => setRequiredBy(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Priority</label>
            <select className={input} value={priority} onChange={e => setPriority(e.target.value as 'low' | 'normal' | 'high' | 'urgent')}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Preferred supplier (optional)</label>
            <select className={input} value={supplierId} onChange={e => setSupplierId(e.target.value)}>
              <option value="">— Choose later at PO conversion —</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.legal_name}{s.vendor_code ? ` (${s.vendor_code})` : ''}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Justification</label>
          <textarea className={input} rows={2} value={justification} onChange={e => setJustification(e.target.value)} placeholder="Why is this needed? Used for approval." />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Notes</label>
          <textarea className={input} rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
      </div>

      {/* Items */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-200">Items</h2>
          <button onClick={addItem} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 text-xs text-zinc-300">
            <Plus className="h-3.5 w-3.5" /> Add line
          </button>
        </div>
        <div className="overflow-x-auto">
        <div className="space-y-3 min-w-[860px]">
          {items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-[1.4fr_1fr_70px_70px_110px_30px] gap-2 items-start">
              <div>
                {idx === 0 && <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Item</label>}
                <select className={input + ' mb-1'} value={it.stock_item_id ?? ''} onChange={e => onPickStock(idx, e.target.value)}>
                  <option value="">— Custom item / type below —</option>
                  {stock.map(s => (
                    <option key={s.id} value={s.id}>{s.item_code ? s.item_code + ' · ' : ''}{s.item_name}{s.reorder_level && s.quantity <= s.reorder_level ? ' ⚠' : ''}</option>
                  ))}
                </select>
                <input className={input} value={it.item_name} onChange={e => updateItem(idx, { item_name: e.target.value })} placeholder="Item name" />
              </div>
              <div>
                {idx === 0 && <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Description</label>}
                <textarea className={input} rows={2} value={it.description} onChange={e => updateItem(idx, { description: e.target.value })} placeholder="Specs / part number / vendor model" />
              </div>
              <div>
                {idx === 0 && <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">UoM</label>}
                <input className={input} value={it.uom} onChange={e => updateItem(idx, { uom: e.target.value })} placeholder="pcs" />
              </div>
              <div>
                {idx === 0 && <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Qty</label>}
                <input className={input} type="number" step="0.01" min="0" value={it.qty} onChange={e => updateItem(idx, { qty: e.target.value })} />
              </div>
              <div>
                {idx === 0 && <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Est. unit ₹</label>}
                <input className={input} type="number" step="0.01" min="0" value={it.estimated_unit_cost} onChange={e => updateItem(idx, { estimated_unit_cost: e.target.value })} placeholder="optional" />
              </div>
              <div className="pt-1">
                {idx === 0 && <div className="text-[10px] mb-1">&nbsp;</div>}
                <button type="button" onClick={() => removeItem(idx)} disabled={items.length === 1} className="text-zinc-500 hover:text-rose-400 disabled:opacity-30 disabled:cursor-not-allowed p-1.5">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => save('draft')}
          disabled={saving !== 'idle'}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 hover:border-zinc-500 px-5 py-2.5 text-sm text-zinc-300 disabled:opacity-50"
        >
          {saving === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save as Draft
        </button>
        <button
          onClick={() => save('submit')}
          disabled={saving !== 'idle'}
          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving === 'submitting' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Submit for Approval
        </button>
        <Link href="/d/indents" className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm text-zinc-500 hover:text-zinc-300">
          <X className="h-4 w-4" /> Cancel
        </Link>
      </div>
    </div>
  );
}
