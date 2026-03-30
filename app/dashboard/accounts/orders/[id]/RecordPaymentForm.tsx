'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Stage {
  id: string;
  stage_name: string;
  net_receivable: number;
  status: string;
}

interface Props {
  orderId: string;
  stages: Stage[];
  defaultTdsRate: number;
}

export default function RecordPaymentForm({ orderId, stages, defaultTdsRate }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    stage_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    amount_received: '',
    tds_deducted: '',
    payment_mode: 'NEFT',
    reference_no: '',
    notes: '',
  });

  const net = parseFloat(form.amount_received || '0') - parseFloat(form.tds_deducted || '0');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  // Auto-fill TDS when stage changes
  function handleStageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const stageId = e.target.value;
    const stage = stages.find(s => s.id === stageId);
    setForm(f => ({ ...f, stage_id: stageId }));
    if (stage && defaultTdsRate > 0) {
      // Base amount ≈ net_receivable / (1 + tds_rate/100) ... for simple auto-fill
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const body = {
      stage_id: form.stage_id || undefined,
      payment_date: form.payment_date,
      amount_received: parseFloat(form.amount_received),
      tds_deducted: parseFloat(form.tds_deducted || '0'),
      payment_mode: form.payment_mode,
      reference_no: form.reference_no || undefined,
      notes: form.notes || undefined,
    };

    try {
      const res = await fetch(`/api/accounts/orders/${orderId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data.error));
      setSuccess('Payment recorded successfully.');
      setForm({
        stage_id: '', payment_date: new Date().toISOString().split('T')[0],
        amount_received: '', tds_deducted: '', payment_mode: 'NEFT',
        reference_no: '', notes: '',
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment.');
    } finally {
      setLoading(false);
    }
  }

  const input = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none transition-colors';
  const label = 'block text-xs font-medium text-zinc-400 mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Stage link */}
        {stages.length > 0 && (
          <div>
            <label className={label}>Link to Stage (optional)</label>
            <select name="stage_id" value={form.stage_id} onChange={handleStageChange} className={input}>
              <option value="">— Not linked —</option>
              {stages.map(s => (
                <option key={s.id} value={s.id} disabled={s.status === 'paid'}>
                  {s.stage_name} {s.status === 'paid' ? '(paid)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Payment date */}
        <div>
          <label className={label}>Payment Date *</label>
          <input type="date" name="payment_date" value={form.payment_date} onChange={handleChange}
            required className={input} />
        </div>

        {/* Payment mode */}
        <div>
          <label className={label}>Mode</label>
          <select name="payment_mode" value={form.payment_mode} onChange={handleChange} className={input}>
            {['NEFT', 'RTGS', 'IMPS', 'Cheque', 'Cash', 'UPI', 'Other'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Amount received */}
        <div>
          <label className={label}>Amount Received (Gross, incl GST) *</label>
          <input type="number" name="amount_received" value={form.amount_received} onChange={handleChange}
            required min="0" step="0.01" placeholder="0.00" className={input} />
        </div>

        {/* TDS deducted */}
        <div>
          <label className={label}>TDS Deducted by Client</label>
          <input type="number" name="tds_deducted" value={form.tds_deducted} onChange={handleChange}
            min="0" step="0.01" placeholder="0.00" className={input} />
          {net > 0 && (
            <p className="mt-1 text-xs text-emerald-400">
              Net to bank: ₹{net.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          )}
        </div>

        {/* Reference no */}
        <div>
          <label className={label}>Reference / UTR No.</label>
          <input type="text" name="reference_no" value={form.reference_no} onChange={handleChange}
            placeholder="UTR or cheque number" className={input} />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={label}>Notes</label>
        <textarea name="notes" value={form.notes} onChange={handleChange}
          rows={2} placeholder="Additional notes..." className={`${input} resize-none`} />
      </div>

      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}
      {success && <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">{success}</p>}

      <button type="submit" disabled={loading}
        className="rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50 transition-colors">
        {loading ? 'Recording…' : 'Record Payment'}
      </button>
    </form>
  );
}
