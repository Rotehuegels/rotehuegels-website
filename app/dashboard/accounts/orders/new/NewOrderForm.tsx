'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';

interface Stage {
  stage_name: string;
  stage_number: number;
  percentage: string;
  amount_due: string;
  gst_on_stage: string;
  tds_rate: string;
  tds_amount: string;
  trigger_condition: string;
  due_date: string;
  status: 'pending' | 'partial' | 'paid';
}

const emptyStage = (): Stage => ({
  stage_name: '', stage_number: 1, percentage: '',
  amount_due: '', gst_on_stage: '', tds_rate: '',
  tds_amount: '', trigger_condition: '', due_date: '', status: 'pending',
});

export default function NewOrderForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    order_type: 'goods' as 'goods' | 'service',
    client_name: '',
    client_gstin: '',
    client_pan: '',
    description: '',
    order_date: today,
    entry_date: today,
    total_value_incl_gst: '',
    base_value: '',
    gst_rate: '18',
    cgst_amount: '',
    sgst_amount: '',
    igst_amount: '',
    tds_applicable: false,
    tds_rate: '',
    notes: '',
  });

  const [stages, setStages] = useState<Stage[]>([]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setForm(f => ({ ...f, [name]: val }));
  }

  // Auto-compute base value from total when GST rate changes
  function computeBase() {
    const total = parseFloat(form.total_value_incl_gst || '0');
    const rate = parseFloat(form.gst_rate || '18');
    if (total && rate >= 0) {
      const base = total / (1 + rate / 100);
      const gst = total - base;
      const half = gst / 2;
      setForm(f => ({
        ...f,
        base_value: base.toFixed(2),
        cgst_amount: half.toFixed(2),
        sgst_amount: half.toFixed(2),
        igst_amount: '0',
      }));
    }
  }

  function addStage() {
    setStages(s => [...s, { ...emptyStage(), stage_number: s.length + 1 }]);
  }

  function removeStage(i: number) {
    setStages(s => s.filter((_, idx) => idx !== i).map((st, idx) => ({ ...st, stage_number: idx + 1 })));
  }

  function updateStage(i: number, key: keyof Stage, value: string) {
    setStages(s => s.map((st, idx) => idx === i ? { ...st, [key]: value } : st));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const body = {
      ...form,
      total_value_incl_gst: parseFloat(form.total_value_incl_gst),
      base_value: form.base_value ? parseFloat(form.base_value) : undefined,
      gst_rate: parseFloat(form.gst_rate || '18'),
      cgst_amount: form.cgst_amount ? parseFloat(form.cgst_amount) : 0,
      sgst_amount: form.sgst_amount ? parseFloat(form.sgst_amount) : 0,
      igst_amount: form.igst_amount ? parseFloat(form.igst_amount) : 0,
      tds_rate: form.tds_rate ? parseFloat(form.tds_rate) : 0,
      stages: stages.map(s => ({
        stage_name: s.stage_name,
        stage_number: s.stage_number,
        percentage: s.percentage ? parseFloat(s.percentage) : null,
        amount_due: parseFloat(s.amount_due || '0'),
        gst_on_stage: parseFloat(s.gst_on_stage || '0'),
        tds_rate: parseFloat(s.tds_rate || '0'),
        tds_amount: parseFloat(s.tds_amount || '0'),
        trigger_condition: s.trigger_condition || undefined,
        due_date: s.due_date || null,
        status: s.status,
      })),
    };

    try {
      const res = await fetch('/api/accounts/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data.error));
      router.push(`/dashboard/accounts/orders/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order.');
      setLoading(false);
    }
  }

  const input = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none transition-colors';
  const label = 'block text-xs font-medium text-zinc-400 mb-1.5';
  const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm p-6 space-y-5';
  const sectionTitle = 'text-sm font-semibold text-zinc-300 mb-4';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Basic info */}
      <div className={glass}>
        <h2 className={sectionTitle}>Order Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={label}>Order Type *</label>
            <select name="order_type" value={form.order_type} onChange={handleChange} className={input}>
              <option value="goods">Goods</option>
              <option value="service">Service</option>
            </select>
          </div>
          <div>
            <label className={label}>Client Name *</label>
            <input type="text" name="client_name" value={form.client_name} onChange={handleChange}
              required placeholder="Client / Company name" className={input} />
          </div>
          <div>
            <label className={label}>Client GSTIN</label>
            <input type="text" name="client_gstin" value={form.client_gstin} onChange={handleChange}
              placeholder="22AAAAA0000A1Z5" className={input} />
          </div>
          <div>
            <label className={label}>Client PAN</label>
            <input type="text" name="client_pan" value={form.client_pan} onChange={handleChange}
              placeholder="AAAAA0000A" className={input} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              rows={3} placeholder="Order description, scope, specifications…" className={`${input} resize-none`} />
          </div>
          <div>
            <label className={label}>Order Received Date *</label>
            <input type="date" name="order_date" value={form.order_date} onChange={handleChange}
              required className={input} />
          </div>
          <div>
            <label className={label}>Entry Date *</label>
            <input type="date" name="entry_date" value={form.entry_date} onChange={handleChange}
              required className={input} />
            <p className="mt-1 text-xs text-zinc-600">Use if order was entered on a later date (e.g. weekend delay)</p>
          </div>
        </div>
      </div>

      {/* Financial */}
      <div className={glass}>
        <h2 className={sectionTitle}>Financial Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className={label}>Total Value (incl GST) *</label>
            <input type="number" name="total_value_incl_gst" value={form.total_value_incl_gst}
              onChange={handleChange} onBlur={computeBase}
              required min="0" step="0.01" placeholder="0.00" className={input} />
          </div>
          <div>
            <label className={label}>GST Rate (%)</label>
            <input type="number" name="gst_rate" value={form.gst_rate} onChange={handleChange}
              onBlur={computeBase} min="0" max="28" step="0.01" placeholder="18" className={input} />
          </div>
          <div>
            <label className={label}>Base Value (excl GST)</label>
            <input type="number" name="base_value" value={form.base_value} onChange={handleChange}
              min="0" step="0.01" placeholder="Auto-computed" className={input} />
          </div>
          <div>
            <label className={label}>CGST Amount</label>
            <input type="number" name="cgst_amount" value={form.cgst_amount} onChange={handleChange}
              min="0" step="0.01" placeholder="0.00" className={input} />
          </div>
          <div>
            <label className={label}>SGST Amount</label>
            <input type="number" name="sgst_amount" value={form.sgst_amount} onChange={handleChange}
              min="0" step="0.01" placeholder="0.00" className={input} />
          </div>
          <div>
            <label className={label}>IGST Amount</label>
            <input type="number" name="igst_amount" value={form.igst_amount} onChange={handleChange}
              min="0" step="0.01" placeholder="0.00 (inter-state only)" className={input} />
          </div>
        </div>
      </div>

      {/* TDS */}
      <div className={glass}>
        <h2 className={sectionTitle}>TDS Settings</h2>
        <div className="flex items-center gap-3 mb-4">
          <input type="checkbox" id="tds_applicable" name="tds_applicable"
            checked={form.tds_applicable} onChange={handleChange}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500" />
          <label htmlFor="tds_applicable" className="text-sm text-zinc-300">TDS applicable on this order</label>
        </div>
        {form.tds_applicable && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={label}>TDS Rate (%)</label>
              <input type="number" name="tds_rate" value={form.tds_rate} onChange={handleChange}
                min="0" max="30" step="0.01" placeholder="e.g. 2 for 194C, 10 for 194J" className={input} />
            </div>
          </div>
        )}
      </div>

      {/* Payment stages */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className={sectionTitle}>Payment Stages</h2>
          <button type="button" onClick={addStage}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-600 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add Stage
          </button>
        </div>

        {!stages.length && (
          <p className="text-xs text-zinc-600">No stages yet. Add stages to define how payment will be received in instalments.</p>
        )}

        <div className="space-y-4">
          {stages.map((s, i) => (
            <div key={i} className="rounded-xl border border-zinc-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-400">Stage {i + 1}</span>
                <button type="button" onClick={() => removeStage(i)}
                  className="p-1 text-zinc-600 hover:text-red-400 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className={label}>Stage Name *</label>
                  <input type="text" value={s.stage_name} onChange={e => updateStage(i, 'stage_name', e.target.value)}
                    required placeholder="e.g. 40% Advance at Order" className={input} />
                </div>
                <div>
                  <label className={label}>Trigger / Milestone</label>
                  <input type="text" value={s.trigger_condition} onChange={e => updateStage(i, 'trigger_condition', e.target.value)}
                    placeholder="e.g. Against equipment setup" className={input} />
                </div>
                <div>
                  <label className={label}>Base Amount Due (excl GST) *</label>
                  <input type="number" value={s.amount_due} onChange={e => updateStage(i, 'amount_due', e.target.value)}
                    required min="0" step="0.01" placeholder="0.00" className={input} />
                </div>
                <div>
                  <label className={label}>GST on this Stage</label>
                  <input type="number" value={s.gst_on_stage} onChange={e => updateStage(i, 'gst_on_stage', e.target.value)}
                    min="0" step="0.01" placeholder="0.00" className={input} />
                </div>
                <div>
                  <label className={label}>TDS Rate (%)</label>
                  <input type="number" value={s.tds_rate} onChange={e => updateStage(i, 'tds_rate', e.target.value)}
                    min="0" step="0.01" placeholder="0" className={input} />
                </div>
                <div>
                  <label className={label}>TDS Amount</label>
                  <input type="number" value={s.tds_amount} onChange={e => updateStage(i, 'tds_amount', e.target.value)}
                    min="0" step="0.01" placeholder="0.00" className={input} />
                </div>
                <div>
                  <label className={label}>% of Base (optional)</label>
                  <input type="number" value={s.percentage} onChange={e => updateStage(i, 'percentage', e.target.value)}
                    min="0" max="100" step="0.01" placeholder="e.g. 40" className={input} />
                </div>
                <div>
                  <label className={label}>Due Date (optional)</label>
                  <input type="date" value={s.due_date} onChange={e => updateStage(i, 'due_date', e.target.value)}
                    className={input} />
                </div>
                <div>
                  <label className={label}>Status</label>
                  <select value={s.status} onChange={e => updateStage(i, 'status', e.target.value)} className={input}>
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className={glass}>
        <h2 className={sectionTitle}>Notes</h2>
        <textarea name="notes" value={form.notes} onChange={handleChange}
          rows={3} placeholder="Any additional notes, terms, conditions…"
          className={`${input} resize-none`} />
      </div>

      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading}
          className="rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50 transition-colors">
          {loading ? 'Creating…' : 'Create Order'}
        </button>
        <a href="/dashboard/accounts/orders"
          className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-6 py-2.5 text-sm font-semibold text-zinc-300 hover:border-zinc-600 transition-colors">
          Cancel
        </a>
      </div>
    </form>
  );
}
