'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Check, X, RefreshCw } from 'lucide-react';

interface Props {
  quoteId:       string;
  currentStatus: string;
  totalAmount:   number;
  taxableValue:  number;
  defaultDesc?:  string;
}

export default function QuoteActions({ quoteId, currentStatus, totalAmount, taxableValue, defaultDesc }: Props) {
  const router = useRouter();
  const [loading,    setLoading]    = useState(false);
  const [showModal,  setShowModal]  = useState(false);
  const [converting, setConverting] = useState(false);
  const [error,      setError]      = useState('');

  // Modal form state
  const today = new Date().toISOString().split('T')[0];
  const [orderDate,     setOrderDate]     = useState(today);
  const [invoiceDate,   setInvoiceDate]   = useState(today);
  const [description,   setDescription]   = useState(defaultDesc ?? '');
  const [notes,         setNotes]         = useState('');
  const [stageName,     setStageName]     = useState('Full Payment — Advance Before Dispatch');
  const [stageTrigger,  setStageTrigger]  = useState('On invoicing / 100% advance before dispatch');
  const [tdsApplicable, setTdsApplicable] = useState(false);
  const [tdsRate,       setTdsRate]       = useState(2);
  const [createPI,      setCreatePI]      = useState(true);

  async function updateStatus(status: string) {
    setLoading(true);
    setError('');
    const res = await fetch(`/api/accounts/quotes/${quoteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? 'Failed.');
    }
    setLoading(false);
    router.refresh();
  }

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault();
    setConverting(true);
    setError('');
    const res = await fetch(`/api/accounts/quotes/${quoteId}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_date:      orderDate,
        invoice_date:    invoiceDate,
        description:     description.trim() || undefined,
        notes:           notes.trim() || undefined,
        tds_applicable:  tdsApplicable,
        tds_rate:        tdsApplicable ? tdsRate : 0,
        stage_name:      stageName.trim() || undefined,
        stage_trigger:   stageTrigger.trim() || undefined,
        create_proforma: createPI,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Conversion failed.');
      setConverting(false);
      return;
    }
    setShowModal(false);
    router.push(`/d/orders/${data.order_id}`);
  }

  const isConverted = currentStatus === 'converted';
  const canConvert  = !isConverted && currentStatus !== 'rejected';

  const tdsAmount = tdsApplicable ? Math.round(taxableValue * (tdsRate / 100) * 100) / 100 : 0;
  const netReceivable = totalAmount - tdsAmount;

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {error && <span className="text-xs text-red-400">{error}</span>}

        {canConvert && (
          <>
            {currentStatus === 'draft' && (
              <button onClick={() => updateStatus('sent')} disabled={loading}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600/80 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors">
                <Send className="h-3.5 w-3.5" /> Mark Sent
              </button>
            )}
            {(currentStatus === 'sent' || currentStatus === 'draft') && (
              <>
                <button onClick={() => updateStatus('accepted')} disabled={loading}
                  className="flex items-center gap-1.5 rounded-xl bg-green-600/80 px-3 py-2 text-xs font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors">
                  <Check className="h-3.5 w-3.5" /> Accept
                </button>
                <button onClick={() => updateStatus('rejected')} disabled={loading}
                  className="flex items-center gap-1.5 rounded-xl bg-red-600/20 border border-red-600/40 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-600/30 disabled:opacity-50 transition-colors">
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
              </>
            )}
            {currentStatus === 'accepted' && (
              <button onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 transition-colors">
                <RefreshCw className="h-3.5 w-3.5" />
                Convert to Order
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Convert to Order Modal ─────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <div>
                <h2 className="text-base font-bold text-white">Convert to Order</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Review and confirm order details before creating</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConvert} className="px-6 py-5 space-y-5">

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Order Date</label>
                  <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} required
                    className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Invoice Date</label>
                  <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} required
                    className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Order Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                  placeholder="Pre-filled from quote items — edit if needed"
                  className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 resize-none" />
              </div>

              {/* Payment Stage */}
              <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 space-y-3">
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Payment Stage (Stage 1)</div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Amount Due</span>
                  <span className="font-mono font-bold text-white">
                    {new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR' }).format(totalAmount)}
                  </span>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Stage Name</label>
                  <input type="text" value={stageName} onChange={e => setStageName(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Payment Trigger / Terms</label>
                  <input type="text" value={stageTrigger} onChange={e => setStageTrigger(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500" />
                </div>
              </div>

              {/* TDS */}
              <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={tdsApplicable} onChange={e => setTdsApplicable(e.target.checked)}
                    className="rounded border-zinc-600 accent-amber-500" />
                  <span className="text-sm font-medium text-zinc-300">TDS Applicable</span>
                </label>
                {tdsApplicable && (
                  <div className="grid grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">TDS Rate %</label>
                      <input type="number" min={0} max={30} step={0.5} value={tdsRate}
                        onChange={e => setTdsRate(parseFloat(e.target.value))}
                        className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500" />
                    </div>
                    <div className="col-span-2 text-xs text-zinc-500 pb-1.5">
                      TDS deduction:{' '}
                      <span className="font-mono text-amber-400">
                        {new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR' }).format(tdsAmount)}
                      </span>
                      {' '}→ Net receivable:{' '}
                      <span className="font-mono text-green-400">
                        {new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR' }).format(netReceivable)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes + Proforma option */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Order Notes (optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  placeholder="Internal notes, payment instructions…"
                  className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 resize-none" />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={createPI} onChange={e => setCreatePI(e.target.checked)}
                  className="rounded border-zinc-600 accent-amber-500" />
                <span className="text-sm text-zinc-400">Also create Proforma Invoice</span>
              </label>

              {error && <p className="text-xs text-red-400">{error}</p>}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-sm text-zinc-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={converting}
                  className="flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 px-5 py-2 text-sm font-semibold text-white transition-colors">
                  <RefreshCw className={`h-3.5 w-3.5 ${converting ? 'animate-spin' : ''}`} />
                  {converting ? 'Creating Order…' : 'Confirm & Create Order'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}
