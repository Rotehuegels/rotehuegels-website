'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';

const input = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none transition-colors';
const label = 'block text-xs font-medium text-zinc-400 mb-1.5';
const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm p-6';

const OUR_STATE_CODE = '33'; // Tamil Nadu

interface Supplier {
  id: string;
  legal_name: string;
  gstin?: string;
  state?: string;
  state_code?: string;
}
interface Order {
  id: string;
  order_no: string;
  client_name: string;
}
interface LineItem {
  id?: string;
  sl_no: number;
  description: string;
  hsn_code: string;
  unit: string;
  quantity: number;
  unit_price: number;
  taxable_amount: number;
  gst_rate: number;
  igst_rate: number;
  cgst_rate: number;
  sgst_rate: number;
  gst_amount: number;
  total: number;
  notes: string;
}

function calcLine(line: LineItem, isInter: boolean): LineItem {
  const taxable_amount = parseFloat((line.quantity * line.unit_price).toFixed(2));
  const igst_rate  = isInter ? line.gst_rate : 0;
  const cgst_rate  = isInter ? 0 : line.gst_rate / 2;
  const sgst_rate  = isInter ? 0 : line.gst_rate / 2;
  const gst_amount = parseFloat(((taxable_amount * line.gst_rate) / 100).toFixed(2));
  const total      = parseFloat((taxable_amount + gst_amount).toFixed(2));
  return { ...line, taxable_amount, igst_rate, cgst_rate, sgst_rate, gst_amount, total };
}

const emptyLine = (sl_no: number): LineItem => ({
  sl_no, description: '', hsn_code: '', unit: 'pcs',
  quantity: 1, unit_price: 0,
  taxable_amount: 0, gst_rate: 18,
  igst_rate: 18, cgst_rate: 0, sgst_rate: 0,
  gst_amount: 0, total: 0, notes: '',
});

export default function EditPOPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [poStatus, setPoStatus] = useState('draft');

  const [form, setForm] = useState({
    supplier_id: '',
    po_date: '',
    expected_delivery: '',
    status: 'draft',
    supplier_ref: '',
    linked_order_id: '',
    notes: '',
    terms: '',
  });
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [lines, setLines] = useState<LineItem[]>([emptyLine(1)]);

  const load = useCallback(async () => {
    const [poRes, suppRes, ordersRes] = await Promise.all([
      fetch(`/api/accounts/purchase-orders/${id}`),
      fetch('/api/accounts/suppliers'),
      fetch('/api/accounts/orders'),
    ]);

    if (!poRes.ok) { router.push('/dashboard/accounts/purchase-orders'); return; }

    const { data: po } = await poRes.json();
    const { suppliers: suppList } = await suppRes.json();
    const { data: orderList } = await ordersRes.json();

    setSuppliers(suppList ?? []);
    setOrders(orderList ?? []);
    setPoStatus(po.status);

    setForm({
      supplier_id:       po.supplier_id ?? '',
      po_date:           po.po_date ?? '',
      expected_delivery: po.expected_delivery ?? '',
      status:            po.status ?? 'draft',
      supplier_ref:      po.supplier_ref ?? '',
      linked_order_id:   po.linked_order_id ?? '',
      notes:             po.notes ?? '',
      terms:             po.terms ?? '',
    });

    const sup = (suppList ?? []).find((s: Supplier) => s.id === po.supplier_id) ?? null;
    setSelectedSupplier(sup);

    const inter = sup ? ((sup.state_code ?? '') !== OUR_STATE_CODE && (sup.state_code ?? '') !== '') : false;
    const mappedItems: LineItem[] = (po.items ?? []).map((item: LineItem) => ({
      id:             item.id,
      sl_no:          item.sl_no,
      description:    item.description,
      hsn_code:       item.hsn_code ?? '',
      unit:           item.unit,
      quantity:       item.quantity,
      unit_price:     item.unit_price,
      taxable_amount: item.taxable_amount,
      gst_rate:       item.gst_rate,
      igst_rate:      item.igst_rate,
      cgst_rate:      item.cgst_rate,
      sgst_rate:      item.sgst_rate,
      gst_amount:     item.gst_amount,
      total:          item.total,
      notes:          item.notes ?? '',
    }));
    setLines(mappedItems.length ? mappedItems.map(l => calcLine(l, inter)) : [emptyLine(1)]);
    setPageLoading(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  const isInter = () => {
    if (!selectedSupplier) return false;
    const sc = selectedSupplier.state_code ?? '';
    return sc !== OUR_STATE_CODE && sc !== '';
  };

  function selectSupplier(sid: string) {
    const s = suppliers.find(x => x.id === sid) ?? null;
    setSelectedSupplier(s);
    setForm(f => ({ ...f, supplier_id: sid }));
    const inter = s ? ((s.state_code ?? '') !== OUR_STATE_CODE && (s.state_code ?? '') !== '') : false;
    setLines(ls => ls.map(l => calcLine(l, inter)));
  }

  function updateLine(idx: number, field: string, value: string | number) {
    const inter = isInter();
    setLines(ls => ls.map((l, i) => {
      if (i !== idx) return l;
      const updated = { ...l, [field]: value };
      return calcLine(updated, inter);
    }));
  }

  function addLine() {
    setLines(ls => [...ls, emptyLine(ls.length + 1)]);
  }

  function removeLine(idx: number) {
    setLines(ls => ls.filter((_, i) => i !== idx).map((l, i) => ({ ...l, sl_no: i + 1 })));
  }

  const subtotal      = parseFloat(lines.reduce((s, l) => s + l.quantity * l.unit_price, 0).toFixed(2));
  const taxable_total = parseFloat(lines.reduce((s, l) => s + l.taxable_amount, 0).toFixed(2));
  const inter         = isInter();
  const igst_total    = parseFloat(lines.reduce((s, l) => s + (inter ? l.gst_amount : 0), 0).toFixed(2));
  const cgst_total    = parseFloat(lines.reduce((s, l) => s + (inter ? 0 : l.gst_amount / 2), 0).toFixed(2));
  const sgst_total    = parseFloat(lines.reduce((s, l) => s + (inter ? 0 : l.gst_amount / 2), 0).toFixed(2));
  const grand_total   = parseFloat(lines.reduce((s, l) => s + l.total, 0).toFixed(2));

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.supplier_id) { setError('Please select a supplier.'); return; }
    if (lines.some(l => !l.description)) { setError('All line items need a description.'); return; }
    setLoading(true);

    const body = {
      supplier_id:       form.supplier_id,
      po_date:           form.po_date,
      expected_delivery: form.expected_delivery || null,
      status:            form.status,
      supplier_ref:      form.supplier_ref || null,
      linked_order_id:   form.linked_order_id || null,
      items:             lines,
      subtotal,
      taxable_value:     taxable_total,
      igst_amount:       igst_total,
      cgst_amount:       cgst_total,
      sgst_amount:       sgst_total,
      total_amount:      grand_total,
      notes:             form.notes || null,
      terms:             form.terms || null,
    };

    try {
      const res = await fetch(`/api/accounts/purchase-orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data.error));
      router.push(`/d/purchase-orders/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update PO.');
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isCompleted = poStatus === 'completed';

  if (isCompleted) {
    return (
      <div className="p-6 max-w-xl">
        <Link href={`/d/purchase-orders/${id}`}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-4 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to PO
        </Link>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
          <p className="text-zinc-300 font-medium">This PO is completed and cannot be edited.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1800px]">
      <div className="mb-6">
        <Link href={`/d/purchase-orders/${id}`}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-2 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to PO
        </Link>
        <h1 className="text-xl font-bold text-white">Edit Purchase Order</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Changes will be saved to the existing PO</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className={glass}>
          <h2 className="text-sm font-semibold text-zinc-300 mb-5">PO Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="lg:col-span-2">
              <label className={label}>Supplier *</label>
              <select value={form.supplier_id} onChange={e => selectSupplier(e.target.value)} required className={input}>
                <option value="">— Select Supplier —</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.legal_name}{s.gstin ? ` (${s.gstin})` : ''}</option>
                ))}
              </select>
              {selectedSupplier && (
                <p className="mt-1.5 text-xs text-zinc-500">
                  {selectedSupplier.state} · {inter ? 'Inter-state → IGST' : 'Intra-state → CGST+SGST'}
                </p>
              )}
            </div>
            <div>
              <label className={label}>PO Date *</label>
              <input type="date" value={form.po_date}
                onChange={e => setForm(f => ({ ...f, po_date: e.target.value }))}
                required className={input} />
            </div>
            <div>
              <label className={label}>Expected Delivery</label>
              <input type="date" value={form.expected_delivery}
                onChange={e => setForm(f => ({ ...f, expected_delivery: e.target.value }))}
                className={input} />
            </div>
            <div>
              <label className={label}>Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={input}>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="partial">Partial Delivery</option>
                <option value="received">Received</option>
                <option value="closed">Closed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className={label}>Supplier Ref / Invoice No</label>
              <input type="text" value={form.supplier_ref}
                onChange={e => setForm(f => ({ ...f, supplier_ref: e.target.value }))}
                placeholder="Supplier's quote or invoice no." className={input} />
            </div>
            <div className="lg:col-span-2">
              <label className={label}>Linked Sales Order</label>
              <select value={form.linked_order_id} onChange={e => setForm(f => ({ ...f, linked_order_id: e.target.value }))} className={input}>
                <option value="">— None —</option>
                {orders.map(o => (
                  <option key={o.id} value={o.id}>{o.order_no} — {o.client_name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className={glass}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-300">Line Items</h2>
            <button type="button" onClick={addLine}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-600 transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add Line
            </button>
          </div>

          <div className="space-y-4">
            {lines.map((line, idx) => (
              <div key={idx} className="rounded-xl border border-zinc-800 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400">Line {idx + 1}</span>
                  {lines.length > 1 && (
                    <button type="button" onClick={() => removeLine(idx)}
                      className="p-1 text-zinc-600 hover:text-red-400 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  <div className="col-span-2 sm:col-span-4 lg:col-span-3">
                    <label className={label}>Description *</label>
                    <input type="text" value={line.description}
                      onChange={e => updateLine(idx, 'description', e.target.value)}
                      required placeholder="Item description" className={input} />
                  </div>
                  <div>
                    <label className={label}>HSN Code</label>
                    <input type="text" value={line.hsn_code}
                      onChange={e => updateLine(idx, 'hsn_code', e.target.value)}
                      placeholder="e.g. 7407" className={input} />
                  </div>
                  <div>
                    <label className={label}>Unit</label>
                    <input type="text" value={line.unit}
                      onChange={e => updateLine(idx, 'unit', e.target.value)}
                      placeholder="kg / nos / ls" className={input} />
                  </div>
                  <div>
                    <label className={label}>GST Rate %</label>
                    <select value={line.gst_rate}
                      onChange={e => updateLine(idx, 'gst_rate', parseFloat(e.target.value))}
                      className={input}>
                      {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={label}>Qty *</label>
                    <input type="number" value={line.quantity}
                      onChange={e => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      min="0" step="0.001" className={input} />
                  </div>
                  <div>
                    <label className={label}>Unit Price (₹) *</label>
                    <input type="number" value={line.unit_price}
                      onChange={e => updateLine(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                      required min="0" step="0.01" placeholder="0.00" className={input} />
                  </div>
                  <div>
                    <label className={label}>Taxable Amt</label>
                    <div className="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-300 font-mono">
                      {fmt(line.taxable_amount)}
                    </div>
                  </div>
                  <div>
                    <label className={label}>GST Amt</label>
                    <div className="rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-300 font-mono">
                      {fmt(line.gst_amount)}
                    </div>
                  </div>
                  <div>
                    <label className={label}>Line Total</label>
                    <div className="rounded-xl border border-amber-600/30 bg-amber-500/5 px-4 py-2.5 text-sm text-amber-300 font-mono font-semibold">
                      {fmt(line.total)}
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-4 lg:col-span-3">
                    <label className={label}>Notes</label>
                    <input type="text" value={line.notes}
                      onChange={e => updateLine(idx, 'notes', e.target.value)}
                      placeholder="Spec, grade, remarks…" className={input} />
                  </div>
                </div>

                <p className="text-xs text-zinc-600">
                  {inter
                    ? `IGST ${line.gst_rate}% = ${fmt(line.gst_amount)}`
                    : `CGST ${line.gst_rate / 2}% + SGST ${line.gst_rate / 2}% = ${fmt(line.gst_amount)}`}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="flex justify-end mt-6">
            <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-4 space-y-2 min-w-[260px] text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span className="font-mono">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Taxable Value</span>
                <span className="font-mono">{fmt(taxable_total)}</span>
              </div>
              {inter ? (
                <div className="flex justify-between text-zinc-500 text-xs">
                  <span>IGST</span><span className="font-mono">{fmt(igst_total)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-zinc-500 text-xs">
                    <span>CGST</span><span className="font-mono">{fmt(cgst_total)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-500 text-xs">
                    <span>SGST</span><span className="font-mono">{fmt(sgst_total)}</span>
                  </div>
                </>
              )}
              <div className="border-t border-zinc-700 pt-2 flex justify-between text-white font-bold text-base">
                <span>Grand Total</span>
                <span className="font-mono text-amber-400">{fmt(grand_total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        <div className={glass}>
          <h2 className="text-sm font-semibold text-zinc-300 mb-5">Notes & Terms</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={label}>Notes</label>
              <textarea value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3} placeholder="Any additional notes…" className={`${input} resize-none`} />
            </div>
            <div>
              <label className={label}>Terms & Conditions</label>
              <textarea value={form.terms}
                onChange={e => setForm(f => ({ ...f, terms: e.target.value }))}
                rows={3} placeholder="Delivery terms, payment schedule…" className={`${input} resize-none`} />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading}
            className="rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50 transition-colors">
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
          <Link href={`/d/purchase-orders/${id}`}
            className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-6 py-2.5 text-sm font-semibold text-zinc-300 hover:border-zinc-600 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
