'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, ArrowLeft, ExternalLink } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_COLOR: Record<string, string> = {
  draft:        'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  sent:         'bg-blue-500/10 text-blue-400 border-blue-500/20',
  acknowledged: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  partial:      'bg-amber-500/10 text-amber-400 border-amber-500/20',
  received:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  closed:       'bg-teal-500/10 text-teal-400 border-teal-500/20',
  cancelled:    'bg-red-500/10 text-red-400 border-red-500/20',
};

const PMT_TYPE_LABEL: Record<string, string> = {
  advance:   'Advance',
  milestone: 'Milestone',
  balance:   'Balance',
  final:     'Final',
};

const PMT_TYPE_COLOR: Record<string, string> = {
  advance:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  milestone: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  balance:   'bg-violet-500/10 text-violet-400 border-violet-500/20',
  final:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

interface POItem {
  id: string; sl_no: number; description: string; hsn_code?: string;
  unit: string; quantity: number; unit_price: number;
  taxable_amount: number; gst_rate: number;
  igst_rate: number; cgst_rate: number; sgst_rate: number;
  gst_amount: number; total: number; notes?: string;
}
interface POPayment {
  id: string; payment_date: string; amount: number;
  payment_type: string; reference?: string; notes?: string;
}
interface PO {
  id: string; po_no: string; po_date: string; expected_delivery?: string;
  status: string; supplier_ref?: string;
  suppliers: { legal_name: string; trade_name?: string; gstin?: string; address?: string; state?: string; pincode?: string; email?: string; phone?: string };
  orders?: { id: string; order_no: string; client_name: string };
  bill_to: Record<string, string>; ship_to?: Record<string, string>;
  subtotal: number; taxable_value: number;
  igst_amount: number; cgst_amount: number; sgst_amount: number;
  total_amount: number;
  notes?: string; terms?: string;
  items: POItem[];
  payments: POPayment[];
}

const input = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none transition-colors';
const lbl   = 'block text-xs font-medium text-zinc-400 mb-1.5';

export default function PODetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [po, setPo] = useState<PO | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusSaving, setStatusSaving] = useState(false);

  // Payment form state
  const [showPmtForm, setShowPmtForm] = useState(false);
  const [pmtForm, setPmtForm] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_type: 'balance',
    reference: '',
    notes: '',
  });
  const [pmtLoading, setPmtLoading] = useState(false);
  const [pmtError, setPmtError] = useState('');

  const load = useCallback(async () => {
    const res = await fetch(`/api/accounts/purchase-orders/${id}`);
    if (!res.ok) { router.push('/dashboard/accounts/purchase-orders'); return; }
    const { data } = await res.json();
    setPo(data);
    setLoading(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(status: string) {
    setStatusSaving(true);
    await fetch(`/api/accounts/purchase-orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await load();
    setStatusSaving(false);
  }

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault();
    setPmtError('');
    if (!pmtForm.amount || parseFloat(pmtForm.amount) <= 0) {
      setPmtError('Enter a valid amount.');
      return;
    }
    setPmtLoading(true);
    try {
      const res = await fetch(`/api/accounts/purchase-orders/${id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_date: pmtForm.payment_date,
          amount:       parseFloat(pmtForm.amount),
          payment_type: pmtForm.payment_type,
          reference:    pmtForm.reference || undefined,
          notes:        pmtForm.notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data.error));
      setPmtForm({ payment_date: new Date().toISOString().split('T')[0], amount: '', payment_type: 'balance', reference: '', notes: '' });
      setShowPmtForm(false);
      await load();
    } catch (err) {
      setPmtError(err instanceof Error ? err.message : 'Failed.');
    }
    setPmtLoading(false);
  }

  async function deletePayment(paymentId: string) {
    if (!confirm('Delete this payment record?')) return;
    await fetch(`/api/accounts/purchase-orders/${id}/payments?payment_id=${paymentId}`, { method: 'DELETE' });
    await load();
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!po) return null;

  const totalPaid = po.payments.reduce((s, p) => s + p.amount, 0);
  const balance   = po.total_amount - totalPaid;

  const supplier = po.suppliers as PO['suppliers'];
  const order    = po.orders as PO['orders'];

  return (
    <div className="p-6 max-w-5xl space-y-6">
      {/* Back + Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/dashboard/accounts/purchase-orders"
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-2 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> All POs
          </Link>
          <h1 className="text-xl font-bold text-white">{po.po_no}</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {fmtDate(po.po_date)}
            {po.expected_delivery && ` · Expected: ${fmtDate(po.expected_delivery)}`}
            {po.supplier_ref && ` · Supplier Ref: ${po.supplier_ref}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={po.status}
            onChange={e => updateStatus(e.target.value)}
            disabled={statusSaving}
            className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-xs font-medium text-white focus:border-amber-500 focus:outline-none transition-colors"
          >
            {['draft','sent','acknowledged','partial','received','closed','cancelled'].map(s => (
              <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium capitalize border ${STATUS_COLOR[po.status] ?? STATUS_COLOR.draft}`}>
            {po.status}
          </span>
        </div>
      </div>

      {/* Supplier + Linked Order */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className={`${glass} p-5`}>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Supplier</p>
          <p className="text-sm font-bold text-white">{supplier?.legal_name}</p>
          {supplier?.trade_name && supplier.trade_name !== supplier.legal_name && (
            <p className="text-xs text-zinc-500">{supplier.trade_name}</p>
          )}
          {supplier?.gstin && (
            <p className="text-xs font-mono text-amber-400 mt-1">GSTIN: {supplier.gstin}</p>
          )}
          {(supplier?.address || supplier?.state) && (
            <p className="text-xs text-zinc-500 mt-1">
              {[supplier.address, supplier.state, supplier.pincode].filter(Boolean).join(', ')}
            </p>
          )}
          {supplier?.email && <p className="text-xs text-zinc-500 mt-1">{supplier.email}</p>}
        </div>

        <div className={`${glass} p-5`}>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Financial Summary</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>PO Value (incl. GST)</span>
              <span className="font-mono text-white">{fmt(po.total_amount)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Taxable Value</span>
              <span className="font-mono">{fmt(po.taxable_value)}</span>
            </div>
            {po.igst_amount > 0 && (
              <div className="flex justify-between text-zinc-500 text-xs">
                <span>IGST</span><span className="font-mono">{fmt(po.igst_amount)}</span>
              </div>
            )}
            {(po.cgst_amount > 0 || po.sgst_amount > 0) && (
              <>
                <div className="flex justify-between text-zinc-500 text-xs">
                  <span>CGST</span><span className="font-mono">{fmt(po.cgst_amount)}</span>
                </div>
                <div className="flex justify-between text-zinc-500 text-xs">
                  <span>SGST</span><span className="font-mono">{fmt(po.sgst_amount)}</span>
                </div>
              </>
            )}
            <div className="border-t border-zinc-800 pt-2 flex justify-between text-emerald-400">
              <span>Total Paid</span>
              <span className="font-mono">{fmt(totalPaid)}</span>
            </div>
            <div className={`flex justify-between font-bold ${balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              <span>Balance Due</span>
              <span className="font-mono">{fmt(balance)}</span>
            </div>
          </div>

          {order && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Linked Sales Order</p>
              <Link href={`/dashboard/accounts/orders/${order.id}`}
                className="flex items-center gap-2 text-xs text-sky-400 hover:underline">
                <ExternalLink className="h-3 w-3" />
                {order.order_no} — {order.client_name}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className={`${glass} overflow-hidden`}>
        <div className="px-6 py-4 border-b border-zinc-800/60">
          <h2 className="text-sm font-semibold text-zinc-300">Line Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/40">
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 w-8">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">HSN</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">Unit</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500">Rate</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500">Taxable</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500">GST</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {po.items.map(item => (
                <tr key={item.id} className="hover:bg-zinc-800/20">
                  <td className="px-4 py-3 text-zinc-500 text-xs">{item.sl_no}</td>
                  <td className="px-4 py-3">
                    <div className="text-white text-sm">{item.description}</div>
                    {item.notes && <div className="text-xs text-zinc-500 mt-0.5">{item.notes}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">{item.hsn_code ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-zinc-300">{item.quantity}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{item.unit}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-zinc-300">{fmt(item.unit_price)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-zinc-300">{fmt(item.taxable_amount)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-zinc-400">
                    {fmt(item.gst_amount)}
                    <div className="text-[10px] text-zinc-600">
                      {item.igst_rate > 0 ? `IGST ${item.igst_rate}%` : `CGST+SGST ${item.cgst_rate}%+${item.sgst_rate}%`}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-amber-300 font-semibold">{fmt(item.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-700 bg-zinc-900/60">
                <td colSpan={6} className="px-4 py-3 text-right text-xs font-semibold text-zinc-400">Totals</td>
                <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-zinc-300">{fmt(po.taxable_value)}</td>
                <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-zinc-300">
                  {fmt(po.igst_amount + po.cgst_amount + po.sgst_amount)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm font-bold text-amber-400">{fmt(po.total_amount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Payments */}
      <div className={glass}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60">
          <h2 className="text-sm font-semibold text-zinc-300">Payments</h2>
          <button
            onClick={() => setShowPmtForm(v => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-600 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Record Payment
          </button>
        </div>

        {showPmtForm && (
          <form onSubmit={recordPayment} className="px-6 py-4 border-b border-zinc-800/60 bg-zinc-900/60 space-y-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">New Payment</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className={lbl}>Date *</label>
                <input type="date" value={pmtForm.payment_date}
                  onChange={e => setPmtForm(f => ({ ...f, payment_date: e.target.value }))}
                  required className={input} />
              </div>
              <div>
                <label className={lbl}>Amount (₹) *</label>
                <input type="number" value={pmtForm.amount}
                  onChange={e => setPmtForm(f => ({ ...f, amount: e.target.value }))}
                  required min="0.01" step="0.01" placeholder="0.00" className={input} />
              </div>
              <div>
                <label className={lbl}>Type</label>
                <select value={pmtForm.payment_type}
                  onChange={e => setPmtForm(f => ({ ...f, payment_type: e.target.value }))}
                  className={input}>
                  <option value="advance">Advance</option>
                  <option value="milestone">Milestone</option>
                  <option value="balance">Balance</option>
                  <option value="final">Final</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Reference (UTR/Chq)</label>
                <input type="text" value={pmtForm.reference}
                  onChange={e => setPmtForm(f => ({ ...f, reference: e.target.value }))}
                  placeholder="UTR / cheque no" className={input} />
              </div>
              <div className="col-span-2 sm:col-span-4">
                <label className={lbl}>Notes</label>
                <input type="text" value={pmtForm.notes}
                  onChange={e => setPmtForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Remarks" className={input} />
              </div>
            </div>
            {pmtError && <p className="text-xs text-red-400">{pmtError}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={pmtLoading}
                className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-50 transition-colors">
                {pmtLoading ? 'Saving…' : 'Save Payment'}
              </button>
              <button type="button" onClick={() => setShowPmtForm(false)}
                className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-xs font-semibold text-zinc-300 hover:border-zinc-600 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        {!po.payments.length ? (
          <div className="px-6 py-8 text-center">
            <p className="text-zinc-500 text-sm">No payments recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {po.payments.map(pmt => (
              <div key={pmt.id} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-800/20 transition-colors">
                <div className="flex items-center gap-4">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize border ${PMT_TYPE_COLOR[pmt.payment_type] ?? PMT_TYPE_COLOR.advance}`}>
                    {PMT_TYPE_LABEL[pmt.payment_type] ?? pmt.payment_type}
                  </span>
                  <div>
                    <p className="text-sm font-mono font-semibold text-white">{fmt(pmt.amount)}</p>
                    <p className="text-xs text-zinc-500">
                      {fmtDate(pmt.payment_date)}
                      {pmt.reference && ` · ${pmt.reference}`}
                    </p>
                    {pmt.notes && <p className="text-xs text-zinc-600 mt-0.5">{pmt.notes}</p>}
                  </div>
                </div>
                <button onClick={() => deletePayment(pmt.id)}
                  className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Payment summary */}
        {po.payments.length > 0 && (
          <div className="px-6 py-4 border-t border-zinc-800/60 flex justify-end">
            <div className="space-y-1.5 text-sm min-w-[220px]">
              <div className="flex justify-between text-zinc-400">
                <span>PO Total</span>
                <span className="font-mono">{fmt(po.total_amount)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Total Paid</span>
                <span className="font-mono">{fmt(totalPaid)}</span>
              </div>
              <div className={`flex justify-between font-bold pt-1 border-t border-zinc-800 ${balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                <span>Balance Due</span>
                <span className="font-mono">{fmt(balance)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notes & Terms */}
      {(po.notes || po.terms) && (
        <div className={`${glass} p-6 grid grid-cols-1 sm:grid-cols-2 gap-5`}>
          {po.notes && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Notes</p>
              <p className="text-sm text-zinc-400 whitespace-pre-line">{po.notes}</p>
            </div>
          )}
          {po.terms && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Terms</p>
              <p className="text-sm text-zinc-400 whitespace-pre-line">{po.terms}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
