'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Package, Wrench } from 'lucide-react';
import AIAssistButton from '@/components/AIAssistButton';

const input = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none transition-colors';
const label = 'block text-xs font-medium text-zinc-400 mb-1.5';
const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm p-6';

interface Customer {
  id: string; customer_id: string; name: string; state: string; state_code: string;
}
interface CatalogItem {
  id: string; sku_id: string; name: string; item_type: string;
  hsn_code?: string; sac_code?: string; unit: string;
  mrp: number; default_gst_rate: number;
}
interface LineItem {
  item_id: string; sku_id: string; name: string; item_type: string;
  hsn_code: string; sac_code: string; unit: string;
  quantity: number; mrp: number; unit_price: number;
  discount_pct: number; discount_amount: number;
  taxable_amount: number; gst_rate: number;
  cgst_rate: number; sgst_rate: number; igst_rate: number;
  gst_amount: number; total: number;
}

const OUR_STATE_CODE = '33'; // Tamil Nadu

function calcLine(line: Omit<LineItem, 'discount_amount'|'taxable_amount'|'gst_amount'|'total'|'cgst_rate'|'sgst_rate'|'igst_rate'>, isIntra: boolean): LineItem {
  const discount_amount = parseFloat(((line.quantity * line.unit_price * line.discount_pct) / 100).toFixed(2));
  const taxable_amount  = parseFloat((line.quantity * line.unit_price - discount_amount).toFixed(2));
  const cgst_rate  = isIntra ? line.gst_rate / 2 : 0;
  const sgst_rate  = isIntra ? line.gst_rate / 2 : 0;
  const igst_rate  = isIntra ? 0 : line.gst_rate;
  const gst_amount = parseFloat(((taxable_amount * line.gst_rate) / 100).toFixed(2));
  const total      = parseFloat((taxable_amount + gst_amount).toFixed(2));
  return { ...line, discount_amount, taxable_amount, cgst_rate, sgst_rate, igst_rate, gst_amount, total };
}

const emptyLine = (): LineItem => ({
  item_id: '', sku_id: '', name: '', item_type: 'goods',
  hsn_code: '', sac_code: '', unit: 'kg',
  quantity: 1, mrp: 0, unit_price: 0,
  discount_pct: 0, discount_amount: 0,
  taxable_amount: 0, gst_rate: 18,
  cgst_rate: 9, sgst_rate: 9, igst_rate: 0,
  gst_amount: 0, total: 0,
});

export default function NewQuotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const today = new Date().toISOString().split('T')[0];
  const inThirtyDays = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const [form, setForm] = useState({
    customer_id: '', quote_date: today, valid_until: inThirtyDays,
    notes: '', terms: 'GST extra as applicable. Payment: 100% advance.',
  });
  const [lines, setLines] = useState<LineItem[]>([emptyLine()]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetch('/api/accounts/customers').then(r => r.json()).then(d => setCustomers(d.data ?? []));
    fetch('/api/accounts/items').then(r => r.json()).then(d => setCatalog(d.data ?? []));
  }, []);

  const isIntra = useCallback(() => {
    if (!selectedCustomer) return true; // default intra
    return (selectedCustomer.state_code === OUR_STATE_CODE) ||
           (selectedCustomer.state?.toLowerCase().includes('tamil'));
  }, [selectedCustomer]);

  function selectCustomer(id: string) {
    const c = customers.find(c => c.id === id) ?? null;
    setSelectedCustomer(c);
    setForm(f => ({ ...f, customer_id: id }));
    // Recalc all lines with new intra/inter status
    const intra = c
      ? (c.state_code === OUR_STATE_CODE || c.state?.toLowerCase().includes('tamil'))
      : true;
    setLines(ls => ls.map(l => calcLine(l, intra)));
  }

  function selectCatalogItem(idx: number, itemId: string) {
    const cat = catalog.find(c => c.id === itemId);
    if (!cat) return;
    const intra = isIntra();
    setLines(ls => ls.map((l, i) => i !== idx ? l : calcLine({
      ...l,
      item_id:   cat.id,
      sku_id:    cat.sku_id,
      name:      cat.name,
      item_type: cat.item_type,
      hsn_code:  cat.hsn_code ?? '',
      sac_code:  cat.sac_code ?? '',
      unit:      cat.unit,
      mrp:       cat.mrp ?? 0,
      unit_price: cat.mrp ?? 0,
      gst_rate:  cat.default_gst_rate,
    }, intra)));
  }

  function updateLine(idx: number, field: string, value: string | number) {
    const intra = isIntra();
    setLines(ls => ls.map((l, i) => {
      if (i !== idx) return l;
      const updated = { ...l, [field]: value };
      return calcLine(updated, intra);
    }));
  }

  function addLine() { setLines(ls => [...ls, emptyLine()]); }
  function removeLine(idx: number) { setLines(ls => ls.filter((_, i) => i !== idx)); }

  // Totals
  const subtotal       = parseFloat(lines.reduce((s, l) => s + l.quantity * l.unit_price, 0).toFixed(2));
  const discount_total = parseFloat(lines.reduce((s, l) => s + l.discount_amount, 0).toFixed(2));
  const taxable_total  = parseFloat(lines.reduce((s, l) => s + l.taxable_amount, 0).toFixed(2));
  const cgst_total     = parseFloat(lines.reduce((s, l) => s + (isIntra() ? l.gst_amount / 2 : 0), 0).toFixed(2));
  const sgst_total     = parseFloat(lines.reduce((s, l) => s + (isIntra() ? l.gst_amount / 2 : 0), 0).toFixed(2));
  const igst_total     = parseFloat(lines.reduce((s, l) => s + (isIntra() ? 0 : l.gst_amount), 0).toFixed(2));
  const grand_total    = parseFloat(lines.reduce((s, l) => s + l.total, 0).toFixed(2));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.customer_id) { setError('Please select a customer.'); return; }
    if (lines.some(l => !l.name)) { setError('All line items must have a name.'); return; }
    setLoading(true);

    const body = {
      customer_id:     form.customer_id,
      quote_date:      form.quote_date,
      valid_until:     form.valid_until || undefined,
      items:           lines,
      subtotal,
      discount_amount: discount_total,
      taxable_value:   taxable_total,
      cgst_amount:     cgst_total,
      sgst_amount:     sgst_total,
      igst_amount:     igst_total,
      total_amount:    grand_total,
      notes:           form.notes || undefined,
      terms:           form.terms || undefined,
    };

    try {
      const res = await fetch('/api/accounts/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data.error));
      router.push(`/dashboard/accounts/quotes/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quote.');
      setLoading(false);
    }
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

  const intra = isIntra();

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">New Quotation</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Quote number will be auto-generated (QT-YYYY-NNN)</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className={`${glass} space-y-5`}>
          <h2 className="text-sm font-semibold text-zinc-300">Quote Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="sm:col-span-1">
              <label className={label}>Customer *</label>
              <select
                value={form.customer_id}
                onChange={e => selectCustomer(e.target.value)}
                required className={input}
              >
                <option value="">— Select Customer —</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.customer_id} — {c.name}</option>
                ))}
              </select>
              {selectedCustomer && (
                <p className="mt-1.5 text-xs text-zinc-500">
                  {selectedCustomer.state} · {intra ? 'Intra-state (CGST+SGST)' : 'Inter-state (IGST)'}
                </p>
              )}
            </div>
            <div>
              <label className={label}>Quote Date *</label>
              <input type="date" value={form.quote_date}
                onChange={e => setForm(f => ({ ...f, quote_date: e.target.value }))}
                required className={input} />
            </div>
            <div>
              <label className={label}>Valid Until</label>
              <input type="date" value={form.valid_until}
                onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
                className={input} />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className={`${glass} space-y-4`}>
          <div className="flex items-center justify-between">
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

                {/* Catalog picker */}
                <div>
                  <label className={label}>Pick from Catalog</label>
                  <select
                    value={line.item_id}
                    onChange={e => selectCatalogItem(idx, e.target.value)}
                    className={input}
                  >
                    <option value="">— Or type manually below —</option>
                    {catalog.filter(c => c.item_type === 'goods').length > 0 && (
                      <optgroup label="Goods">
                        {catalog.filter(c => c.item_type === 'goods').map(c => (
                          <option key={c.id} value={c.id}>{c.sku_id} — {c.name}</option>
                        ))}
                      </optgroup>
                    )}
                    {catalog.filter(c => c.item_type === 'service').length > 0 && (
                      <optgroup label="Services">
                        {catalog.filter(c => c.item_type === 'service').map(c => (
                          <option key={c.id} value={c.id}>{c.sku_id} — {c.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  <div className="col-span-2 sm:col-span-4 lg:col-span-2">
                    <label className={label}>Item Name *</label>
                    <input type="text" value={line.name}
                      onChange={e => updateLine(idx, 'name', e.target.value)}
                      required placeholder="Description" className={input} />
                    <AIAssistButton description={line.name} field="description"
                      onAccept={(r) => updateLine(idx, 'name', String(r.corrected))} />
                  </div>
                  <div>
                    <label className={label}>Type</label>
                    <select value={line.item_type}
                      onChange={e => updateLine(idx, 'item_type', e.target.value)}
                      className={input}>
                      <option value="goods">Goods</option>
                      <option value="service">Service</option>
                    </select>
                  </div>
                  <div>
                    <label className={label}>{line.item_type === 'goods' ? 'HSN' : 'SAC'}</label>
                    <input type="text"
                      value={line.item_type === 'goods' ? line.hsn_code : line.sac_code}
                      onChange={e => updateLine(idx, line.item_type === 'goods' ? 'hsn_code' : 'sac_code', e.target.value)}
                      placeholder={line.item_type === 'goods' ? 'HSN' : 'SAC'} className={input} />
                    <AIAssistButton description={line.name} field="hsn"
                      onAccept={(r) => {
                        updateLine(idx, line.item_type === 'goods' ? 'hsn_code' : 'sac_code', String(r.code));
                        if (r.gst_rate) updateLine(idx, 'gst_rate', Number(r.gst_rate));
                      }} />
                  </div>
                  <div>
                    <label className={label}>Unit</label>
                    <input type="text" value={line.unit}
                      onChange={e => updateLine(idx, 'unit', e.target.value)}
                      placeholder="kg / pcs / hrs" className={input} />
                  </div>
                  <div>
                    <label className={label}>GST Rate %</label>
                    <select value={line.gst_rate}
                      onChange={e => updateLine(idx, 'gst_rate', parseFloat(e.target.value))}
                      className={input}>
                      {[0,5,12,18,28].map(r => <option key={r} value={r}>{r}%</option>)}
                    </select>
                  </div>

                  <div>
                    <label className={label}>Qty *</label>
                    <input type="number" value={line.quantity}
                      onChange={e => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      min="0" step="0.001" className={input} />
                  </div>
                  <div>
                    <label className={label}>MRP (₹)</label>
                    <input type="number" value={line.mrp}
                      onChange={e => updateLine(idx, 'mrp', parseFloat(e.target.value) || 0)}
                      min="0" step="0.01" placeholder="0.00" className={input} />
                  </div>
                  <div>
                    <label className={label}>Unit Price (₹) *</label>
                    <input type="number" value={line.unit_price}
                      onChange={e => updateLine(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                      required min="0" step="0.01" placeholder="0.00" className={input} />
                  </div>
                  <div>
                    <label className={label}>Discount %</label>
                    <input type="number" value={line.discount_pct}
                      onChange={e => updateLine(idx, 'discount_pct', parseFloat(e.target.value) || 0)}
                      min="0" max="100" step="0.01" className={input} />
                  </div>

                  {/* Computed */}
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
                </div>

                {/* GST breakdown */}
                {intra ? (
                  <p className="text-xs text-zinc-600">
                    CGST {line.gst_rate / 2}% + SGST {line.gst_rate / 2}% = {fmt(line.gst_amount)}
                  </p>
                ) : (
                  <p className="text-xs text-zinc-600">
                    IGST {line.gst_rate}% = {fmt(line.gst_amount)}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="flex justify-end mt-4">
            <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-4 space-y-2 min-w-[260px] text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span className="font-mono">{fmt(subtotal)}</span>
              </div>
              {discount_total > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Discount</span>
                  <span className="font-mono">− {fmt(discount_total)}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-400">
                <span>Taxable Value</span>
                <span className="font-mono">{fmt(taxable_total)}</span>
              </div>
              {intra ? (
                <>
                  <div className="flex justify-between text-zinc-500 text-xs">
                    <span>CGST</span><span className="font-mono">{fmt(cgst_total)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-500 text-xs">
                    <span>SGST</span><span className="font-mono">{fmt(sgst_total)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-zinc-500 text-xs">
                  <span>IGST</span><span className="font-mono">{fmt(igst_total)}</span>
                </div>
              )}
              <div className="border-t border-zinc-700 pt-2 flex justify-between text-white font-bold text-base">
                <span>Grand Total</span>
                <span className="font-mono text-amber-400">{fmt(grand_total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        <div className={`${glass} space-y-5`}>
          <h2 className="text-sm font-semibold text-zinc-300">Notes & Terms</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={label}>Notes</label>
              <textarea value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3} placeholder="Any additional notes for the customer…"
                className={`${input} resize-none`} />
            </div>
            <div>
              <label className={label}>Terms & Conditions</label>
              <textarea value={form.terms}
                onChange={e => setForm(f => ({ ...f, terms: e.target.value }))}
                rows={3} placeholder="Payment terms, delivery, validity…"
                className={`${input} resize-none`} />
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading}
            className="rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50 transition-colors">
            {loading ? 'Saving…' : 'Save Quote'}
          </button>
          <a href="/dashboard/accounts/quotes"
            className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-6 py-2.5 text-sm font-semibold text-zinc-300 hover:border-zinc-600 transition-colors">
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
