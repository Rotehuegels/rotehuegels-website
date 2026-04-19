'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload, FileText, Loader2, Plus, Trash2, Check,
  ArrowRight, AlertCircle, Sparkles,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface ParsedItem {
  description: string;
  hsn_code: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: string | null;
  taxable_amount: number;
  gst_rate: number;
  gst_amount: number;
  total: number;
}

interface ParsedInvoice {
  supplier_name: string;
  supplier_gstin: string;
  invoice_no: string;
  invoice_date: string;
  items: ParsedItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  grand_total: number;
}

interface ExtraCharge {
  description: string;
  hsn_code: string;
  quantity: number;
  unit: string;
  rate: number;
  gst_rate: number;
}

interface Customer {
  id: string;
  name: string;
  gstin: string;
  pan: string;
  billing_address: { line1?: string; line2?: string; city?: string; state?: string; pincode?: string } | null;
  contact_person: string;
  state: string;
  state_code: string;
}

// ── Styles ───────────────────────────────────────────────────────────────────

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const input = 'w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600';
const btn = (color: string) =>
  `flex items-center gap-2 rounded-xl bg-${color}-500/20 px-5 py-2.5 text-sm font-medium text-${color}-400 hover:bg-${color}-500/30 transition-colors disabled:opacity-50`;

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

// ── Component ────────────────────────────────────────────────────────────────

export default function ReinvoicePage() {
  const router = useRouter();

  // State
  const [step, setStep] = useState<'upload' | 'review' | 'customer' | 'done'>('upload');
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parsed invoices
  const [invoices, setInvoices] = useState<ParsedInvoice[]>([]);
  const [allItems, setAllItems] = useState<ParsedItem[]>([]);

  // Extra charges
  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([]);

  // Customer & margin
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [marginPercent, setMarginPercent] = useState(0);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Result
  const [result, setResult] = useState<{ id: string; order_no: string; total: number } | null>(null);

  // ── Upload & parse invoice ──────────────────────────────────────────────

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/accounts/reinvoice/parse', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      const parsed = data as ParsedInvoice;
      setInvoices(prev => [...prev, parsed]);
      setAllItems(prev => [...prev, ...parsed.items]);
    } catch {
      setError('Failed to parse invoice');
    } finally {
      setUploading(false);
    }
  }, []);

  // ── Load customers ──────────────────────────────────────────────────────

  const loadCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/accounts/customers');
      const data = await res.json();
      // API returns 'name', we keep as-is
      setCustomers((data.data ?? []).map((c: Record<string, unknown>) => ({
        id: c.id,
        name: c.name,
        gstin: c.gstin ?? '',
        pan: c.pan ?? '',
        billing_address: c.billing_address ?? null,
        contact_person: c.contact_person ?? '',
        state: c.state ?? '',
        state_code: c.state_code ?? '',
      })));
    } catch { /* ignore */ }
  }, []);

  // ── Add extra charge ────────────────────────────────────────────────────

  const addExtraCharge = () => {
    setExtraCharges(prev => [...prev, {
      description: '', hsn_code: '', quantity: 1, unit: 'LS', rate: 0, gst_rate: 18,
    }]);
  };

  const updateExtra = (idx: number, field: string, value: string | number) => {
    setExtraCharges(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const removeExtra = (idx: number) => {
    setExtraCharges(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Compute totals ──────────────────────────────────────────────────────

  const marginMultiplier = 1 + marginPercent / 100;

  const materialsTaxable = allItems.reduce((s, i) => s + i.taxable_amount, 0) * marginMultiplier;
  const extraTaxable = extraCharges.reduce((s, c) => s + c.rate * c.quantity, 0) * marginMultiplier;
  const totalTaxable = materialsTaxable + extraTaxable;

  const materialsGst = allItems.reduce((s, i) => s + i.gst_amount, 0) * marginMultiplier;
  const extraGst = extraCharges.reduce((s, c) => {
    const taxable = c.rate * c.quantity * marginMultiplier;
    return s + taxable * c.gst_rate / 100;
  }, 0);
  const totalGst = materialsGst + extraGst;
  const grandTotal = Math.round(totalTaxable + totalGst);

  // ── Create re-invoice ───────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!selectedCustomer) return;
    setCreating(true);
    setError(null);

    const extraItems: ParsedItem[] = extraCharges.map(c => ({
      description: c.description,
      hsn_code: c.hsn_code,
      quantity: c.quantity,
      unit: c.unit,
      rate: c.rate,
      discount: null,
      taxable_amount: c.rate * c.quantity,
      gst_rate: c.gst_rate,
      gst_amount: parseFloat((c.rate * c.quantity * c.gst_rate / 100).toFixed(2)),
      total: parseFloat((c.rate * c.quantity * (1 + c.gst_rate / 100)).toFixed(2)),
    }));

    try {
      const res = await fetch('/api/accounts/reinvoice/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomer.id,
          customer_name: selectedCustomer.name,
          customer_gstin: selectedCustomer.gstin,
          customer_pan: selectedCustomer.pan,
          customer_address: selectedCustomer.billing_address
            ? [selectedCustomer.billing_address.line1, selectedCustomer.billing_address.line2, selectedCustomer.billing_address.city, selectedCustomer.billing_address.state, selectedCustomer.billing_address.pincode].filter(Boolean).join(', ')
            : '',
          customer_contact: selectedCustomer.contact_person,
          items: allItems,
          extra_charges: extraItems,
          margin_percent: marginPercent,
          invoice_date: invoiceDate,
          notes,
          supplier_refs: invoices.map(i => `${i.invoice_no} dt. ${i.invoice_date} (${i.supplier_name})`).join('; '),
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        setStep('done');
      }
    } catch {
      setError('Failed to create re-invoice');
    } finally {
      setCreating(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-[1800px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Re-Invoice Supplier Materials</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Upload supplier invoices, select customer, choose margin, and generate a re-invoice
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2 text-sm">
        {['Upload Invoices', 'Review Items', 'Customer & Generate'].map((label, i) => {
          const stepIdx = ['upload', 'review', 'customer', 'done'].indexOf(step);
          const active = i <= stepIdx;
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <ArrowRight className="h-3.5 w-3.5 text-zinc-700" />}
              <span className={active ? 'text-rose-400 font-medium' : 'text-zinc-600'}>{label}</span>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Step 1: Upload ──────────────────────────────────────────────── */}
      {step === 'upload' && (
        <div className="space-y-6">
          {/* Upload zone */}
          <div className={`${glass} p-8`}>
            <label className="flex flex-col items-center justify-center gap-4 cursor-pointer border-2 border-dashed border-zinc-700 rounded-2xl p-10 hover:border-zinc-500 transition-colors">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                  e.target.value = '';
                }}
                disabled={uploading}
              />
              {uploading ? (
                <>
                  <Loader2 className="h-10 w-10 text-rose-400 animate-spin" />
                  <span className="text-sm text-zinc-400">AI is reading your invoice...</span>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-zinc-500" />
                  <span className="text-sm text-zinc-400">Drop supplier invoice PDF or click to upload</span>
                  <span className="text-xs text-zinc-600">Supports PDF, PNG, JPG</span>
                </>
              )}
            </label>
          </div>

          {/* Uploaded invoices */}
          {invoices.length > 0 && (
            <div className={`${glass} p-6 space-y-4`}>
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                Uploaded Invoices ({invoices.length})
              </h2>
              {invoices.map((inv, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{inv.supplier_name}</p>
                      <p className="text-xs text-zinc-500">
                        {inv.invoice_no} | {inv.invoice_date} | {inv.items.length} items | {fmt(inv.grand_total)}
                      </p>
                    </div>
                  </div>
                  <Sparkles className="h-4 w-4 text-amber-400" />
                </div>
              ))}

              <p className="text-sm text-zinc-400">
                Total: <strong className="text-white">{allItems.length} line items</strong> | {fmt(allItems.reduce((s, i) => s + i.total, 0))}
              </p>

              <div className="flex gap-3">
                <button onClick={() => setStep('review')} className={btn('rose')}>
                  <ArrowRight className="h-4 w-4" />
                  Review Items
                </button>
                <span className="text-xs text-zinc-600 self-center">or upload more invoices above</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Review items + extras ────────────────────────────────── */}
      {step === 'review' && (
        <div className="space-y-6">
          {/* Items table */}
          <div className={`${glass} p-6`}>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">
              Line Items from Supplier Invoices
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-zinc-500 border-b border-zinc-800">
                    <th className="pb-2 pr-3">#</th>
                    <th className="pb-2 pr-3">Description</th>
                    <th className="pb-2 pr-3">HSN</th>
                    <th className="pb-2 pr-3 text-center">Qty</th>
                    <th className="pb-2 pr-3 text-right">Rate</th>
                    <th className="pb-2 pr-3 text-center">Disc</th>
                    <th className="pb-2 pr-3 text-right">Taxable</th>
                    <th className="pb-2 pr-3 text-right">GST</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {allItems.map((item, idx) => (
                    <tr key={idx} className="border-b border-zinc-800/50">
                      <td className="py-2 pr-3 text-zinc-500">{idx + 1}</td>
                      <td className="py-2 pr-3 text-zinc-200 font-medium">{item.description}</td>
                      <td className="py-2 pr-3 text-zinc-400 font-mono text-xs">{item.hsn_code}</td>
                      <td className="py-2 pr-3 text-center text-zinc-300">{item.quantity} {item.unit}</td>
                      <td className="py-2 pr-3 text-right text-zinc-300">{fmt(item.rate)}</td>
                      <td className="py-2 pr-3 text-center text-zinc-400">{item.discount ?? '—'}</td>
                      <td className="py-2 pr-3 text-right text-zinc-300">{fmt(item.taxable_amount)}</td>
                      <td className="py-2 pr-3 text-right text-zinc-400">{fmt(item.gst_amount)}</td>
                      <td className="py-2 text-right text-white font-medium">{fmt(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Extra charges */}
          <div className={`${glass} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                Additional Charges
              </h2>
              <button onClick={addExtraCharge} className={btn('sky')}>
                <Plus className="h-4 w-4" />
                Add Charge
              </button>
            </div>

            {extraCharges.length === 0 ? (
              <p className="text-sm text-zinc-600">No extra charges. Add delivery, labour, or other charges above.</p>
            ) : (
              <div className="space-y-3">
                {extraCharges.map((c, idx) => (
                  <div key={idx} className="grid grid-cols-7 gap-3 items-end">
                    <div className="col-span-2">
                      <label className="text-xs text-zinc-500 mb-1 block">Description</label>
                      <input className={input} value={c.description} onChange={e => updateExtra(idx, 'description', e.target.value)}
                        placeholder="e.g. Delivery Charges" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">HSN/SAC</label>
                      <input className={input} value={c.hsn_code} onChange={e => updateExtra(idx, 'hsn_code', e.target.value)}
                        placeholder="996511" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Qty</label>
                      <input className={input} type="number" value={c.quantity} onChange={e => updateExtra(idx, 'quantity', Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Rate (₹)</label>
                      <input className={input} type="number" value={c.rate} onChange={e => updateExtra(idx, 'rate', Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">GST %</label>
                      <select className={input} value={c.gst_rate} onChange={e => updateExtra(idx, 'gst_rate', Number(e.target.value))}>
                        <option value={0}>0%</option>
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                        <option value={28}>28%</option>
                      </select>
                    </div>
                    <div>
                      <button onClick={() => removeExtra(idx)} className="rounded-xl p-2.5 text-red-400 hover:bg-red-500/20 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('upload')} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
              ← Back
            </button>
            <button onClick={() => { setStep('customer'); loadCustomers(); }} className={btn('rose')}>
              <ArrowRight className="h-4 w-4" />
              Select Customer
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Customer + margin + generate ─────────────────────────── */}
      {step === 'customer' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer selection */}
            <div className={`${glass} p-6 space-y-4`}>
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Customer</h2>
              <select
                className={input}
                value={selectedCustomer?.id ?? ''}
                onChange={e => {
                  const c = customers.find(c => c.id === e.target.value);
                  setSelectedCustomer(c ?? null);
                }}
              >
                <option value="">Select customer...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.gstin})</option>
                ))}
              </select>

              {selectedCustomer && (
                <div className="rounded-xl bg-zinc-800/50 p-4 text-xs text-zinc-400 space-y-1">
                  <p className="text-sm text-zinc-200 font-medium">{selectedCustomer.name}</p>
                  <p>GSTIN: {selectedCustomer.gstin}</p>
                  <p>{selectedCustomer.contact_person}</p>
                  {selectedCustomer.billing_address && (
                    <p>{[selectedCustomer.billing_address.line1, selectedCustomer.billing_address.line2, selectedCustomer.billing_address.city, selectedCustomer.billing_address.state, selectedCustomer.billing_address.pincode].filter(Boolean).join(', ')}</p>
                  )}
                </div>
              )}
            </div>

            {/* Margin + date */}
            <div className={`${glass} p-6 space-y-4`}>
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Invoice Settings</h2>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Margin</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setMarginPercent(0)}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                      marginPercent === 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    Zero Margin
                  </button>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={marginPercent}
                      onChange={e => setMarginPercent(Number(e.target.value))}
                      className={`${input} w-24`}
                    />
                    <span className="text-sm text-zinc-500">%</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Invoice Date</label>
                <input type="date" className={input} value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Notes (optional)</label>
                <textarea className={`${input} resize-none`} rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Additional notes for the invoice..." />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className={`${glass} p-6`}>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">Summary</h2>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-zinc-500">Materials</p>
                <p className="text-lg font-bold text-white">{fmt(materialsTaxable)}</p>
              </div>
              <div>
                <p className="text-zinc-500">Extra Charges</p>
                <p className="text-lg font-bold text-white">{fmt(extraTaxable)}</p>
              </div>
              <div>
                <p className="text-zinc-500">GST (18%)</p>
                <p className="text-lg font-bold text-white">{fmt(totalGst)}</p>
              </div>
              <div>
                <p className="text-zinc-500">Grand Total</p>
                <p className="text-2xl font-bold text-rose-400">{fmt(grandTotal)}</p>
              </div>
            </div>
            {marginPercent > 0 && (
              <p className="text-xs text-amber-400 mt-2">* {marginPercent}% margin applied on all items</p>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('review')} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
              ← Back
            </button>
            <button
              onClick={handleCreate}
              disabled={!selectedCustomer || creating}
              className={btn('emerald')}
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Generate Re-Invoice
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Done ─────────────────────────────────────────────────── */}
      {step === 'done' && result && (
        <div className={`${glass} p-10 text-center space-y-4`}>
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/20 mx-auto">
            <Check className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Re-Invoice Created</h2>
          <p className="text-zinc-400">
            Order <strong className="text-white font-mono">{result.order_no}</strong> — {fmt(result.total)}
          </p>
          <div className="flex justify-center gap-3 mt-4">
            <button onClick={() => router.push(`/d/orders/${result.id}/invoice`)} className={btn('rose')}>
              <FileText className="h-4 w-4" />
              View Invoice
            </button>
            <button onClick={() => router.push(`/d/orders/${result.id}`)} className={btn('sky')}>
              View Order
            </button>
            <button onClick={() => {
              setStep('upload');
              setInvoices([]);
              setAllItems([]);
              setExtraCharges([]);
              setResult(null);
              setSelectedCustomer(null);
              setMarginPercent(0);
              setNotes('');
            }} className={btn('zinc')}>
              <Plus className="h-4 w-4" />
              New Re-Invoice
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
