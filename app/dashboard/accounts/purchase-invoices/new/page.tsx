'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Receipt } from 'lucide-react';

type Supplier = { id: string; legal_name: string; vendor_code: string | null };
type PO       = { id: string; po_no: string; supplier_id: string; po_date: string; total_amount: number };

type POItem = {
  id: string;
  sl_no: number;
  description: string;
  hsn_code: string | null;
  quantity: number;
  unit: string | null;
  unit_price: number;
  gst_rate: number;
};

type Line = {
  po_item_id: string | null;
  description: string;
  hsn_code: string;
  quantity: string;
  unit: string;
  unit_price: string;
  gst_rate: string;
};

const input = 'w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600';

export default function NewPurchaseInvoicePage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pos,       setPos]       = useState<PO[]>([]);
  const [poItems,   setPoItems]   = useState<POItem[]>([]);
  const [saving,    setSaving]    = useState(false);
  const [err,       setErr]       = useState('');

  const [supplierId,   setSupplierId]   = useState('');
  const [poId,         setPoId]         = useState('');
  const [invoiceNo,    setInvoiceNo]    = useState('');
  const [invoiceDate,  setInvoiceDate]  = useState(new Date().toISOString().slice(0, 10));
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate,      setDueDate]      = useState('');
  const [notes,        setNotes]        = useState('');
  const [lines,        setLines]        = useState<Line[]>([]);

  // Load suppliers + POs once
  useEffect(() => {
    fetch('/api/accounts/suppliers').then(r => r.ok ? r.json() : Promise.reject()).then(d => setSuppliers(d.data ?? d ?? [])).catch(() => {});
    fetch('/api/accounts/purchase-orders').then(r => r.ok ? r.json() : Promise.reject()).then(d => setPos((d.data ?? d ?? []).filter((p: PO) => p.id))).catch(() => {});
  }, []);

  // When PO changes, fetch its items and pre-fill
  useEffect(() => {
    if (!poId) { setPoItems([]); setLines([]); return; }
    fetch(`/api/accounts/purchase-orders/${poId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        const items: POItem[] = d.data?.items ?? [];
        setPoItems(items);
        setLines(items.map((it) => ({
          po_item_id:  it.id,
          description: it.description,
          hsn_code:    it.hsn_code ?? '',
          quantity:    String(it.quantity),
          unit:        it.unit ?? 'pcs',
          unit_price:  String(it.unit_price),
          gst_rate:    String(it.gst_rate ?? 18),
        })));
        const po = pos.find(p => p.id === poId);
        if (po) setSupplierId(po.supplier_id);
      })
      .catch(() => setErr('Could not load PO items.'));
  }, [poId, pos]);

  const updateLine = (i: number, patch: Partial<Line>) =>
    setLines((p) => p.map((l, idx) => idx === i ? { ...l, ...patch } : l));

  // Compute totals from lines
  const computed = lines.reduce(
    (acc, l) => {
      const qty   = Number(l.quantity)   || 0;
      const price = Number(l.unit_price) || 0;
      const rate  = Number(l.gst_rate)   || 0;
      const tax   = +(qty * price).toFixed(2);
      const gst   = +(tax * rate / 100).toFixed(2);
      acc.taxable += tax;
      acc.gst     += gst;
      return acc;
    },
    { taxable: 0, gst: 0 },
  );

  async function save() {
    setErr('');
    if (!supplierId || !invoiceNo || !invoiceDate || lines.length === 0) {
      setErr('Supplier, invoice number, date, and at least one line are required.'); return;
    }
    setSaving(true);

    const items = lines.map((l) => {
      const qty   = Number(l.quantity);
      const price = Number(l.unit_price);
      const rate  = Number(l.gst_rate);
      const tax   = +(qty * price).toFixed(2);
      const gst   = +(tax * rate / 100).toFixed(2);
      return {
        po_item_id:     l.po_item_id,
        description:    l.description,
        hsn_code:       l.hsn_code || undefined,
        quantity:       qty,
        unit:           l.unit,
        unit_price:     price,
        taxable_amount: tax,
        gst_rate:       rate,
        gst_amount:     gst,
        total:          +(tax + gst).toFixed(2),
      };
    });

    const body = {
      invoice_no:    invoiceNo,
      supplier_id:   supplierId,
      po_id:         poId || null,
      invoice_date:  invoiceDate,
      received_date: receivedDate || undefined,
      due_date:      dueDate || undefined,
      subtotal:      +computed.taxable.toFixed(2),
      taxable_value: +computed.taxable.toFixed(2),
      igst_amount:   +computed.gst.toFixed(2),
      cgst_amount:   0,
      sgst_amount:   0,
      total_amount:  +(computed.taxable + computed.gst).toFixed(2),
      notes:         notes || undefined,
      items,
    };

    const res = await fetch('/api/accounts/purchase-invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setErr(typeof json.error === 'string' ? json.error : JSON.stringify(json.error)); return; }

    router.push(`/d/purchase-invoices/${json.id}`);
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl">
      <Link href="/d/purchase-invoices" className="text-sm text-zinc-500 hover:text-zinc-300">← Back to Purchase Invoices</Link>

      <div className="flex items-center gap-3">
        <Receipt className="h-6 w-6 text-rose-400" />
        <h1 className="text-xl md:text-2xl font-bold text-white">Book Purchase Invoice</h1>
      </div>

      {err && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{err}</div>}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Link to PO (recommended)</label>
            <select className={input} value={poId} onChange={e => setPoId(e.target.value)}>
              <option value="">— No PO (off-PO purchase) —</option>
              {pos.map(p => <option key={p.id} value={p.id}>{p.po_no} — ₹{Number(p.total_amount).toLocaleString('en-IN')}</option>)}
            </select>
            <p className="mt-1 text-[10px] text-zinc-600">Picking a PO pre-fills lines and runs the 3-way match.</p>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Supplier</label>
            <select className={input} value={supplierId} onChange={e => setSupplierId(e.target.value)} disabled={!!poId}>
              <option value="">— Select —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.legal_name}{s.vendor_code ? ' (' + s.vendor_code + ')' : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Supplier invoice no.</label>
            <input className={input} value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} placeholder="e.g. INV/2026/0142" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Invoice date</label>
            <input className={input} type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Received date</label>
            <input className={input} type="date" value={receivedDate} onChange={e => setReceivedDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Due date</label>
            <input className={input} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Notes</label>
          <textarea className={input} rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
      </div>

      {/* Items */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-200">Invoice lines {poItems.length > 0 && <span className="text-xs text-zinc-500 font-normal">(pre-filled from PO; edit qty / price to match the supplier invoice)</span>}</h2>
        </div>

        {lines.length === 0 ? (
          <p className="text-sm text-zinc-500 italic">Pick a PO above to load lines, or this is an off-PO invoice (not recommended).</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-zinc-500">
                <th className="text-left py-2">Description</th>
                <th className="text-right py-2 w-24">Qty</th>
                <th className="text-left py-2 w-20">Unit</th>
                <th className="text-right py-2 w-28">Unit ₹</th>
                <th className="text-right py-2 w-20">GST %</th>
                <th className="text-right py-2 w-28">Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const qty = Number(l.quantity) || 0;
                const price = Number(l.unit_price) || 0;
                const rate = Number(l.gst_rate) || 0;
                const tax = qty * price;
                const total = tax + (tax * rate / 100);
                return (
                  <tr key={i} className="border-t border-zinc-800/60">
                    <td className="py-2 pr-2"><input className={input + ' text-xs'} value={l.description} onChange={e => updateLine(i, { description: e.target.value })} /></td>
                    <td className="py-2 px-2"><input className={input + ' text-right text-xs'} type="number" step="0.001" value={l.quantity} onChange={e => updateLine(i, { quantity: e.target.value })} /></td>
                    <td className="py-2 px-2"><input className={input + ' text-xs'} value={l.unit} onChange={e => updateLine(i, { unit: e.target.value })} /></td>
                    <td className="py-2 px-2"><input className={input + ' text-right text-xs'} type="number" step="0.01" value={l.unit_price} onChange={e => updateLine(i, { unit_price: e.target.value })} /></td>
                    <td className="py-2 px-2"><input className={input + ' text-right text-xs'} type="number" step="0.01" value={l.gst_rate} onChange={e => updateLine(i, { gst_rate: e.target.value })} /></td>
                    <td className="py-2 pl-2 text-right tabular-nums">₹ {total.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-zinc-700">
                <td colSpan={4} className="py-2 text-right text-xs text-zinc-500">Taxable</td>
                <td className="py-2 text-right text-xs text-zinc-500">+ GST</td>
                <td className="py-2 pl-2 text-right font-semibold tabular-nums">₹ {(computed.taxable + computed.gst).toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan={4}></td>
                <td className="py-1 text-right text-xs tabular-nums text-zinc-400">₹ {computed.taxable.toFixed(2)}</td>
                <td className="py-1 pl-2 text-right text-xs tabular-nums text-zinc-400">₹ {computed.gst.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={save} disabled={saving || lines.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Book invoice & run match
        </button>
        <Link href="/d/purchase-invoices" className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm text-zinc-500 hover:text-zinc-300">
          Cancel
        </Link>
      </div>
    </div>
  );
}
