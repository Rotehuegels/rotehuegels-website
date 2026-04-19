'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClipboardCheck, ArrowLeft, Plus, Trash2, Save, AlertCircle } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const input = 'w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50';

interface POItem {
  id: string;
  description: string;
  hsn_code: string | null;
  quantity: number;
  unit: string | null;
  unit_price: number;
}

interface PO {
  id: string;
  po_no: string;
  po_date: string;
  supplier_ref: string | null;
  total_amount: number;
  status: string;
  notes: string | null;
  supplier: { id: string; legal_name: string; gstin: string; state: string } | null;
  items: POItem[];
  existing_grn_no: string | null;
}

interface LineItem {
  po_item_id: string | null;
  description: string;
  hsn_code: string;
  ordered_qty: number;
  received_qty: number;
  accepted_qty: number;
  rejected_qty: number;
  unit: string;
  unit_price: number;
  remarks: string;
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

export default function NewGRNForm({ poList }: { poList: PO[] }) {
  const router = useRouter();
  const [selectedPoId, setSelectedPoId] = useState<string>('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [receivedBy, setReceivedBy] = useState('');
  const [warehouse, setWarehouse] = useState('Main Store');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [transporter, setTransporter] = useState('');
  const [notes, setNotes] = useState('');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [status, setStatus] = useState<'pending' | 'accepted' | 'partial' | 'rejected'>('accepted');
  const [items, setItems] = useState<LineItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPo = useMemo(() => poList.find(p => p.id === selectedPoId) ?? null, [poList, selectedPoId]);

  function onPoSelect(id: string) {
    setSelectedPoId(id);
    const po = poList.find(p => p.id === id);
    if (!po) { setItems([]); return; }
    // Pre-fill supplier ref + seed items from PO at full ordered qty
    if (!deliveryNote && po.supplier_ref) setDeliveryNote(po.supplier_ref);
    setItems(po.items.map(it => ({
      po_item_id: it.id,
      description: it.description,
      hsn_code: it.hsn_code ?? '',
      ordered_qty: Number(it.quantity),
      received_qty: Number(it.quantity),
      accepted_qty: Number(it.quantity),
      rejected_qty: 0,
      unit: it.unit ?? 'NOS',
      unit_price: Number(it.unit_price),
      remarks: '',
    })));
  }

  function updateItem(idx: number, patch: Partial<LineItem>) {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const next = { ...it, ...patch };
      // Keep accepted + rejected ≤ received
      if (patch.received_qty != null && next.accepted_qty > next.received_qty) {
        next.accepted_qty = next.received_qty;
      }
      next.rejected_qty = Math.max(0, next.received_qty - next.accepted_qty);
      return next;
    }));
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  function addBlankItem() {
    setItems(prev => [...prev, {
      po_item_id: null, description: '', hsn_code: '',
      ordered_qty: 0, received_qty: 0, accepted_qty: 0, rejected_qty: 0,
      unit: 'NOS', unit_price: 0, remarks: '',
    }]);
  }

  async function submit() {
    setError(null);
    if (items.length === 0) { setError('Add at least one item'); return; }
    if (items.some(it => !it.description.trim())) { setError('Every item needs a description'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/accounts/grn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          po_id: selectedPoId || null,
          supplier_id: selectedPo?.supplier?.id ?? null,
          receipt_date: receiptDate,
          received_by: receivedBy || undefined,
          warehouse_location: warehouse,
          delivery_note_no: deliveryNote || undefined,
          vehicle_no: vehicleNo || undefined,
          transporter: transporter || undefined,
          notes: [inspectionNotes && `Inspection: ${inspectionNotes}`, notes].filter(Boolean).join('\n\n') || undefined,
          items: items.map(it => ({
            po_item_id: it.po_item_id || undefined,
            description: it.description,
            hsn_code: it.hsn_code || undefined,
            ordered_qty: it.ordered_qty,
            received_qty: it.received_qty,
            accepted_qty: it.accepted_qty,
            rejected_qty: it.rejected_qty,
            unit: it.unit,
            unit_price: it.unit_price,
            remarks: it.remarks || undefined,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(typeof json.error === 'string' ? json.error : JSON.stringify(json.error));
        setSubmitting(false);
        return;
      }
      router.push(`/d/grn/${json.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create GRN');
      setSubmitting(false);
    }
  }

  const totalValue = items.reduce((s, it) => s + it.accepted_qty * it.unit_price, 0);
  const totalAccepted = items.reduce((s, it) => s + it.accepted_qty, 0);
  const totalRejected = items.reduce((s, it) => s + it.rejected_qty, 0);

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-[1800px]">
      <div>
        <Link href="/d/grn" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mb-2">
          <ArrowLeft className="h-3 w-3" /> All GRNs
        </Link>
        <div className="flex items-center gap-3">
          <ClipboardCheck className="h-6 w-6 text-emerald-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">New Goods Receipt Note</h1>
            <p className="text-sm text-zinc-500">Record receipt of goods against a purchase order</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* PO select */}
      <div className={`${glass} p-5`}>
        <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-2">
          Purchase Order <span className="text-zinc-600">(optional — leave blank for a stock-only receipt)</span>
        </label>
        <select
          value={selectedPoId}
          onChange={e => onPoSelect(e.target.value)}
          className={input}
        >
          <option value="">— No PO (blank GRN) —</option>
          {poList.map(p => (
            <option key={p.id} value={p.id}>
              {p.po_no} · {fmtDate(p.po_date)} · {p.supplier?.legal_name ?? '-'} · {fmt(Number(p.total_amount))}
              {p.existing_grn_no ? ` · (already has ${p.existing_grn_no})` : ''}
            </option>
          ))}
        </select>
        {selectedPo && (
          <div className="mt-3 text-xs text-zinc-500 space-y-0.5">
            <div>Supplier: <span className="text-zinc-300">{selectedPo.supplier?.legal_name}</span> · GSTIN <span className="font-mono">{selectedPo.supplier?.gstin}</span></div>
            <div>Status: <span className="text-zinc-300">{selectedPo.status}</span> · Supplier Ref: <span className="font-mono text-zinc-300">{selectedPo.supplier_ref ?? '-'}</span></div>
            {selectedPo.existing_grn_no && (
              <div className="text-amber-400">⚠ A GRN ({selectedPo.existing_grn_no}) already exists for this PO. Adding another will create a duplicate.</div>
            )}
          </div>
        )}
      </div>

      {/* Header fields */}
      <div className={`${glass} p-5 grid grid-cols-1 md:grid-cols-3 gap-4`}>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Receipt Date</label>
          <input type="date" value={receiptDate} onChange={e => setReceiptDate(e.target.value)} className={input} />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Received By</label>
          <input type="text" value={receivedBy} onChange={e => setReceivedBy(e.target.value)} placeholder="e.g. Siva" className={input} />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Warehouse / Location</label>
          <input type="text" value={warehouse} onChange={e => setWarehouse(e.target.value)} className={input} />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Supplier DN / Invoice Ref</label>
          <input type="text" value={deliveryNote} onChange={e => setDeliveryNote(e.target.value)} placeholder="e.g. GMPL_VAP_048" className={input} />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Vehicle No</label>
          <input type="text" value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} placeholder="e.g. TN02AB1234" className={input} />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Transporter</label>
          <input type="text" value={transporter} onChange={e => setTransporter(e.target.value)} className={input} />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Status on receipt</label>
          <select value={status} onChange={e => setStatus(e.target.value as 'pending' | 'accepted' | 'partial' | 'rejected')} className={input}>
            <option value="pending">Pending inspection</option>
            <option value="accepted">Accepted</option>
            <option value="partial">Partial</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Items */}
      <div className={glass}>
        <div className="px-5 py-3 border-b border-zinc-800/60 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Items Received</h2>
          <button onClick={addBlankItem} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300">
            <Plus className="h-3.5 w-3.5" /> Add Row
          </button>
        </div>
        {items.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm">
            {selectedPoId ? 'No items on this PO.' : 'Pick a PO above to auto-fill items, or click "Add Row" to enter manually.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-zinc-500 uppercase tracking-wider border-b border-zinc-800/60">
                  <th className="px-3 py-2 font-medium">Description</th>
                  <th className="px-2 py-2 font-medium">HSN</th>
                  <th className="px-2 py-2 font-medium w-20">Ordered</th>
                  <th className="px-2 py-2 font-medium w-20">Received</th>
                  <th className="px-2 py-2 font-medium w-20">Accepted</th>
                  <th className="px-2 py-2 font-medium w-16">Unit</th>
                  <th className="px-2 py-2 font-medium w-24">Rate</th>
                  <th className="px-2 py-2 font-medium w-24 text-right">Value</th>
                  <th className="px-2 py-2 font-medium">Remarks</th>
                  <th className="px-2 py-2 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {items.map((it, idx) => (
                  <tr key={idx} className="align-top">
                    <td className="px-3 py-2 min-w-[14rem]">
                      <textarea rows={2} value={it.description} onChange={e => updateItem(idx, { description: e.target.value })}
                        className="w-full rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-200 resize-y" />
                    </td>
                    <td className="px-2 py-2"><input value={it.hsn_code} onChange={e => updateItem(idx, { hsn_code: e.target.value })} className="w-24 rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-200 font-mono" /></td>
                    <td className="px-2 py-2"><input type="number" value={it.ordered_qty} onChange={e => updateItem(idx, { ordered_qty: +e.target.value })} className="w-16 rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-400 text-right" /></td>
                    <td className="px-2 py-2"><input type="number" value={it.received_qty} onChange={e => updateItem(idx, { received_qty: +e.target.value })} className="w-16 rounded bg-zinc-900 border border-sky-500/30 px-2 py-1 text-xs text-sky-300 text-right" /></td>
                    <td className="px-2 py-2"><input type="number" value={it.accepted_qty} onChange={e => updateItem(idx, { accepted_qty: +e.target.value })} className="w-16 rounded bg-zinc-900 border border-emerald-500/30 px-2 py-1 text-xs text-emerald-300 text-right" /></td>
                    <td className="px-2 py-2"><input value={it.unit} onChange={e => updateItem(idx, { unit: e.target.value })} className="w-14 rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-300" /></td>
                    <td className="px-2 py-2"><input type="number" step="0.01" value={it.unit_price} onChange={e => updateItem(idx, { unit_price: +e.target.value })} className="w-24 rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-300 text-right" /></td>
                    <td className="px-2 py-2 text-right text-xs text-zinc-200">{fmt(it.accepted_qty * it.unit_price)}</td>
                    <td className="px-2 py-2"><input value={it.remarks} onChange={e => updateItem(idx, { remarks: e.target.value })} className="w-40 rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-400" /></td>
                    <td className="px-2 py-2 text-center">
                      <button onClick={() => removeItem(idx)} className="p-1 text-red-400/60 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-zinc-800/60 bg-zinc-900/40">
                <tr>
                  <td colSpan={4} className="px-3 py-3 text-xs text-zinc-500">
                    {items.length} line{items.length !== 1 ? 's' : ''}
                    {' · '}Accepted: <span className="text-emerald-400 font-medium">{totalAccepted}</span>
                    {totalRejected > 0 && <> · Rejected: <span className="text-red-400 font-medium">{totalRejected}</span></>}
                  </td>
                  <td colSpan={4} className="px-3 py-3 text-sm text-right text-zinc-400">Total accepted value:</td>
                  <td className="px-2 py-3 text-right text-sm font-bold text-white">{fmt(totalValue)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${glass} p-5`}>
          <label className="block text-xs text-zinc-500 mb-2">Inspection Notes</label>
          <textarea rows={5} value={inspectionNotes} onChange={e => setInspectionNotes(e.target.value)}
            placeholder="What did you check? Visual, drawing compliance, weights, CoA, etc."
            className={`${input} resize-y`} />
        </div>
        <div className={`${glass} p-5`}>
          <label className="block text-xs text-zinc-500 mb-2">General Notes</label>
          <textarea rows={5} value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Drop-ship flow, downstream sale reference, anything worth noting for audit."
            className={`${input} resize-y`} />
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Link href="/d/grn" className="px-5 py-2.5 rounded-xl border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
          Cancel
        </Link>
        <button
          onClick={submit}
          disabled={submitting || items.length === 0}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="h-4 w-4" /> {submitting ? 'Creating…' : 'Create GRN'}
        </button>
      </div>
    </div>
  );
}
