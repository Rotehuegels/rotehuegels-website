'use client';

import { useState, useCallback } from 'react';
import {
  Camera, Upload, Loader2, FileText, Check, ArrowRight,
  AlertCircle, Sparkles, ChevronDown, Download, Send,
  Plus, Trash2, ArrowLeft, Eye,
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
  email: string;
  state: string;
  state_code: string;
}

type Step = 'capture' | 'review' | 'customer' | 'preview';

// ── Styles ───────────────────────────────────────────────────────────────────

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const input = 'w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

// ── Component ────────────────────────────────────────────────────────────────

export default function MobileReinvoicePage() {
  const [step, setStep] = useState<Step>('capture');
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Parsed data
  const [invoices, setInvoices] = useState<ParsedInvoice[]>([]);
  const [allItems, setAllItems] = useState<ParsedItem[]>([]);
  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([]);

  // Customer & margin
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [marginPercent, setMarginPercent] = useState(0);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Result
  const [result, setResult] = useState<{ id: string; order_no: string; total: number } | null>(null);

  // ── Upload & parse ─────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/accounts/reinvoice/parse', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      const parsed = data as ParsedInvoice;
      setInvoices(prev => [...prev, parsed]);
      setAllItems(prev => [...prev, ...parsed.items]);
      // Auto-advance to review
      setStep('review');
    } catch {
      setError('Failed to parse invoice. Please try again.');
    } finally {
      setUploading(false);
    }
  }, []);

  // ── Load customers ─────────────────────────────────────────────────────

  const loadCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/accounts/customers');
      const data = await res.json();
      setCustomers((data.data ?? []).map((c: Record<string, unknown>) => ({
        id: c.id, name: c.name, gstin: c.gstin ?? '', pan: c.pan ?? '',
        billing_address: c.billing_address ?? null,
        contact_person: c.contact_person ?? '', email: c.email ?? '',
        state: c.state ?? '', state_code: c.state_code ?? '',
      })));
    } catch { /* ignore */ }
  }, []);

  // ── Extra charges ──────────────────────────────────────────────────────

  const addExtra = () => setExtraCharges(prev => [...prev, {
    description: '', hsn_code: '', quantity: 1, unit: 'LS', rate: 0, gst_rate: 18,
  }]);
  const updateExtra = (i: number, f: string, v: string | number) =>
    setExtraCharges(prev => prev.map((c, idx) => idx === i ? { ...c, [f]: v } : c));
  const removeExtra = (i: number) =>
    setExtraCharges(prev => prev.filter((_, idx) => idx !== i));

  // ── Totals ─────────────────────────────────────────────────────────────

  const mm = 1 + marginPercent / 100;
  const matTax = allItems.reduce((s, i) => s + i.taxable_amount, 0) * mm;
  const extTax = extraCharges.reduce((s, c) => s + c.rate * c.quantity, 0) * mm;
  const totalTaxable = matTax + extTax;
  const matGst = allItems.reduce((s, i) => s + i.gst_amount, 0) * mm;
  const extGst = extraCharges.reduce((s, c) => {
    const t = c.rate * c.quantity * mm;
    return s + t * c.gst_rate / 100;
  }, 0);
  const totalGst = matGst + extGst;
  const grandTotal = Math.round(totalTaxable + totalGst);

  // ── Create re-invoice ──────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!selectedCustomer) return;
    setCreating(true);
    setError(null);

    const extraItems: ParsedItem[] = extraCharges.map(c => ({
      description: c.description, hsn_code: c.hsn_code, quantity: c.quantity,
      unit: c.unit, rate: c.rate, discount: null,
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
            ? [selectedCustomer.billing_address.line1, selectedCustomer.billing_address.line2,
               selectedCustomer.billing_address.city, selectedCustomer.billing_address.state,
               selectedCustomer.billing_address.pincode].filter(Boolean).join(', ')
            : '',
          customer_contact: selectedCustomer.contact_person,
          items: allItems, extra_charges: extraItems,
          margin_percent: marginPercent, invoice_date: invoiceDate, notes,
          supplier_refs: invoices.map(i => `${i.invoice_no} dt. ${i.invoice_date} (${i.supplier_name})`).join('; '),
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); }
      else { setResult(data); setStep('preview'); }
    } catch { setError('Failed to create re-invoice'); }
    finally { setCreating(false); }
  };

  // ── Send email ─────────────────────────────────────────────────────────

  const handleSendEmail = async () => {
    if (!result) return;
    setEmailing(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/accounts/reinvoice/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: result.id }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setSuccess(`Invoice emailed to ${data.sent_to}`);
    } catch { setError('Failed to send email'); }
    finally { setEmailing(false); }
  };

  // ── Step indicator ─────────────────────────────────────────────────────

  const steps: { key: Step; label: string }[] = [
    { key: 'capture', label: 'Capture' },
    { key: 'review', label: 'Review' },
    { key: 'customer', label: 'Invoice' },
    { key: 'preview', label: 'Done' },
  ];
  const stepIdx = steps.findIndex(s => s.key === step);

  return (
    <div className="p-4 pb-8 space-y-4 max-w-lg mx-auto">
      {/* Progress bar */}
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={s.key} className="flex-1 flex flex-col items-center gap-1">
            <div className={`h-1.5 w-full rounded-full transition-colors ${
              i <= stepIdx ? 'bg-rose-500' : 'bg-zinc-800'
            }`} />
            <span className={`text-[10px] uppercase tracking-wider ${
              i <= stepIdx ? 'text-rose-400' : 'text-zinc-700'
            }`}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="flex items-start gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-400">
          <Check className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* ═══════════════════════ STEP 1: CAPTURE ═══════════════════════════ */}
      {step === 'capture' && (
        <div className="space-y-4">
          <div className="text-center py-2">
            <h1 className="text-xl font-bold">Re-Invoice</h1>
            <p className="text-sm text-zinc-500 mt-1">Snap a photo of the supplier invoice</p>
          </div>

          {/* Camera capture */}
          <div className={`${glass} p-6`}>
            {uploading ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="h-12 w-12 text-rose-400 animate-spin" />
                <p className="text-sm text-zinc-400">AI is reading your invoice...</p>
                <p className="text-xs text-zinc-600">This may take a few seconds</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Camera button */}
                <label className="flex flex-col items-center gap-3 cursor-pointer rounded-2xl border-2 border-dashed border-rose-500/30 bg-rose-500/5 p-8 active:bg-rose-500/10 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                      e.target.value = '';
                    }}
                  />
                  <Camera className="h-12 w-12 text-rose-400" />
                  <span className="text-sm font-medium text-rose-400">Take Photo</span>
                  <span className="text-xs text-zinc-500">Opens your camera</span>
                </label>

                {/* Or upload from gallery */}
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-800" />
                  </div>
                  <span className="relative bg-zinc-950 px-4 text-xs text-zinc-600">or</span>
                </div>

                <label className="flex flex-col items-center gap-2 cursor-pointer rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 active:bg-zinc-800/40 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                      e.target.value = '';
                    }}
                  />
                  <Upload className="h-8 w-8 text-zinc-500" />
                  <span className="text-sm text-zinc-400">Upload from Gallery</span>
                  <span className="text-xs text-zinc-600">PDF, PNG, or JPG</span>
                </label>
              </div>
            )}
          </div>

          {/* Already uploaded invoices */}
          {invoices.length > 0 && (
            <div className={`${glass} p-4 space-y-3`}>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Uploaded ({invoices.length})
              </p>
              {invoices.map((inv, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-zinc-800/50 p-3">
                  <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{inv.supplier_name}</p>
                    <p className="text-xs text-zinc-500">{inv.invoice_no} &middot; {inv.items.length} items &middot; {fmt(inv.grand_total)}</p>
                  </div>
                </div>
              ))}
              <button onClick={() => setStep('review')} className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-500/20 py-3 text-sm font-medium text-rose-400 active:bg-rose-500/30">
                <ArrowRight className="h-4 w-4" /> Review Items
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════ STEP 2: REVIEW ════════════════════════════ */}
      {step === 'review' && (
        <div className="space-y-4">
          <button onClick={() => setStep('capture')} className="flex items-center gap-1 text-xs text-zinc-500 active:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>

          <h2 className="text-lg font-bold">Review Extracted Items</h2>

          {/* Items list (mobile-friendly cards) */}
          <div className="space-y-2">
            {allItems.map((item, idx) => (
              <div key={idx} className={`${glass} p-4`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200">{item.description}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      HSN: {item.hsn_code} &middot; {item.quantity} {item.unit} @ {fmt(item.rate)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-white ml-3">{fmt(item.total)}</p>
                </div>
                <div className="flex gap-4 mt-2 text-[11px] text-zinc-500">
                  <span>Taxable: {fmt(item.taxable_amount)}</span>
                  <span>GST: {fmt(item.gst_amount)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Extra charges */}
          <div className={`${glass} p-4 space-y-3`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Extra Charges</p>
              <button onClick={addExtra} className="flex items-center gap-1 text-xs text-sky-400 active:text-sky-300">
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
            {extraCharges.length === 0 ? (
              <p className="text-xs text-zinc-600">No extra charges added.</p>
            ) : (
              extraCharges.map((c, idx) => (
                <div key={idx} className="space-y-2 rounded-xl bg-zinc-800/30 p-3">
                  <div className="flex gap-2">
                    <input className={`${input} flex-1`} placeholder="Description" value={c.description}
                      onChange={e => updateExtra(idx, 'description', e.target.value)} />
                    <button onClick={() => removeExtra(idx)} className="px-2 text-red-400"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input className={input} placeholder="HSN" value={c.hsn_code}
                      onChange={e => updateExtra(idx, 'hsn_code', e.target.value)} />
                    <input className={input} type="number" placeholder="Rate" value={c.rate || ''}
                      onChange={e => updateExtra(idx, 'rate', Number(e.target.value))} />
                    <select className={input} value={c.gst_rate}
                      onChange={e => updateExtra(idx, 'gst_rate', Number(e.target.value))}>
                      <option value={0}>0%</option><option value={5}>5%</option>
                      <option value={12}>12%</option><option value={18}>18%</option>
                      <option value={28}>28%</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary */}
          <div className={`${glass} p-4`}>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Items Total</span>
              <span className="text-white font-medium">{fmt(allItems.reduce((s, i) => s + i.total, 0))}</span>
            </div>
            {extraCharges.length > 0 && (
              <div className="flex justify-between text-sm mt-1">
                <span className="text-zinc-500">Extra Charges</span>
                <span className="text-white font-medium">{fmt(extraCharges.reduce((s, c) => s + c.rate * c.quantity * (1 + c.gst_rate / 100), 0))}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => { setStep('customer'); loadCustomers(); }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-500/20 py-3.5 text-sm font-medium text-rose-400 active:bg-rose-500/30"
          >
            <ArrowRight className="h-4 w-4" /> Select Customer & Generate
          </button>
        </div>
      )}

      {/* ═══════════════════════ STEP 3: CUSTOMER & GENERATE ═══════════════ */}
      {step === 'customer' && (
        <div className="space-y-4">
          <button onClick={() => setStep('review')} className="flex items-center gap-1 text-xs text-zinc-500 active:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>

          <h2 className="text-lg font-bold">Generate Invoice</h2>

          {/* Customer selector */}
          <div className={`${glass} p-4 space-y-3`}>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Bill To</p>
            <div className="relative">
              <select
                className={`${input} appearance-none pr-10`}
                value={selectedCustomer?.id ?? ''}
                onChange={e => setSelectedCustomer(customers.find(c => c.id === e.target.value) ?? null)}
              >
                <option value="">Select customer...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
            </div>
            {selectedCustomer && (
              <div className="rounded-xl bg-zinc-800/50 p-3 text-xs text-zinc-400 space-y-0.5">
                <p className="text-sm text-zinc-200 font-medium">{selectedCustomer.name}</p>
                {selectedCustomer.gstin && <p>GSTIN: {selectedCustomer.gstin}</p>}
                {selectedCustomer.contact_person && <p>{selectedCustomer.contact_person}</p>}
                {selectedCustomer.email && <p>{selectedCustomer.email}</p>}
              </div>
            )}
          </div>

          {/* Margin */}
          <div className={`${glass} p-4 space-y-3`}>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Margin</p>
            <div className="flex gap-2">
              {[0, 5, 10, 15, 20].map(m => (
                <button
                  key={m}
                  onClick={() => setMarginPercent(m)}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                    marginPercent === m
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700 active:bg-zinc-700'
                  }`}
                >
                  {m}%
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Custom:</span>
              <input
                type="number" min={0} max={100} step={0.5}
                value={marginPercent}
                onChange={e => setMarginPercent(Number(e.target.value))}
                className={`${input} w-24`}
              />
              <span className="text-xs text-zinc-500">%</span>
            </div>
          </div>

          {/* Date & notes */}
          <div className={`${glass} p-4 space-y-3`}>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Invoice Date</label>
              <input type="date" className={input} value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Notes (optional)</label>
              <textarea className={`${input} resize-none`} rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Additional notes..." />
            </div>
          </div>

          {/* Grand total */}
          <div className={`${glass} p-4`}>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Taxable</span>
              <span className="text-zinc-300">{fmt(totalTaxable)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-zinc-500">GST</span>
              <span className="text-zinc-300">{fmt(totalGst)}</span>
            </div>
            {marginPercent > 0 && (
              <p className="text-[11px] text-amber-400 mt-1">{marginPercent}% margin applied</p>
            )}
            <div className="flex justify-between mt-2 pt-2 border-t border-zinc-800">
              <span className="text-sm font-semibold text-white">Grand Total</span>
              <span className="text-xl font-black text-rose-400">{fmt(grandTotal)}</span>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!selectedCustomer || creating}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500/20 py-3.5 text-sm font-semibold text-emerald-400 active:bg-emerald-500/30 disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Generate Re-Invoice
          </button>
        </div>
      )}

      {/* ═══════════════════════ STEP 4: PREVIEW & ACTIONS ═════════════════ */}
      {step === 'preview' && result && (
        <div className="space-y-4">
          {/* Success header */}
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/20 mx-auto mb-3">
              <Check className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold">Invoice Created</h2>
            <p className="text-sm text-zinc-400 mt-1">
              <span className="font-mono text-white">{result.order_no}</span> &mdash; {fmt(result.total)}
            </p>
          </div>

          {/* Invoice preview (iframe) */}
          <div className={`${glass} overflow-hidden`}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Invoice Preview</p>
              <a
                href={`/d/orders/${result.id}/invoice`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-sky-400"
              >
                <Eye className="h-3 w-3" /> Full View
              </a>
            </div>
            <iframe
              src={`/dashboard/accounts/orders/${result.id}/invoice?embed=1`}
              className="w-full h-[60vh] bg-white"
              title="Invoice Preview"
            />
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            {/* Download */}
            <a
              href={`/d/orders/${result.id}/invoice`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-500/20 py-3.5 text-sm font-medium text-sky-400 active:bg-sky-500/30"
            >
              <Download className="h-4 w-4" /> Open & Download PDF
            </a>

            {/* Send email */}
            <button
              onClick={handleSendEmail}
              disabled={emailing}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500/20 py-3.5 text-sm font-medium text-emerald-400 active:bg-emerald-500/30 disabled:opacity-50"
            >
              {emailing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send to Customer by Email
            </button>

            {/* New re-invoice */}
            <button
              onClick={() => {
                setStep('capture');
                setInvoices([]); setAllItems([]); setExtraCharges([]);
                setResult(null); setSelectedCustomer(null);
                setMarginPercent(0); setNotes(''); setSuccess(null); setError(null);
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-700 py-3.5 text-sm font-medium text-zinc-400 active:bg-zinc-800"
            >
              <Camera className="h-4 w-4" /> New Re-Invoice
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
