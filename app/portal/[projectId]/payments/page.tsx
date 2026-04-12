import { redirect, notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getPortalUser } from '@/lib/portalAuth';
import { CreditCard, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const stageStatusIcon: Record<string, { icon: React.ElementType; color: string }> = {
  paid:    { icon: CheckCircle2, color: 'text-emerald-400' },
  partial: { icon: Clock,        color: 'text-amber-400' },
  pending: { icon: AlertCircle,  color: 'text-zinc-500' },
};

export default async function PaymentsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const portalUser = await getPortalUser();
  if (!portalUser) redirect('/login?next=/portal');

  const { projectId } = await params;

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .eq('customer_id', portalUser.customerId)
    .single();

  if (!project) notFound();

  // Get linked orders
  const { data: links } = await supabaseAdmin
    .from('project_orders')
    .select('order_id')
    .eq('project_id', projectId);

  const orderIds = (links ?? []).map(l => l.order_id);

  let orders: { id: string; order_no: string; description: string; total_value_incl_gst: number }[] = [];
  let stages: { id: string; order_id: string; stage_name: string; amount_due: number; gst_on_stage: number; status: string; due_date: string | null; trigger_condition: string | null }[] = [];
  let payments: { id: string; order_id: string; payment_date: string; amount_received: number; payment_mode: string; reference_no: string | null }[] = [];

  if (orderIds.length > 0) {
    const [oRes, sRes, pRes] = await Promise.all([
      supabaseAdmin.from('orders').select('id, order_no, description, total_value_incl_gst').in('id', orderIds),
      supabaseAdmin.from('order_payment_stages').select('id, order_id, stage_name, amount_due, gst_on_stage, status, due_date, trigger_condition').in('order_id', orderIds).order('stage_number'),
      supabaseAdmin.from('order_payments').select('id, order_id, payment_date, amount_received, payment_mode, reference_no').in('order_id', orderIds).order('payment_date', { ascending: false }),
    ]);
    orders = oRes.data ?? [];
    stages = sRes.data ?? [];
    payments = pRes.data ?? [];
  }

  const totalContract = orders.reduce((s, o) => s + (o.total_value_incl_gst ?? 0), 0);
  const totalReceived = payments.reduce((s, p) => s + (p.amount_received ?? 0), 0);
  const totalPending = totalContract - totalReceived;
  const paidPct = totalContract > 0 ? Math.round((totalReceived / totalContract) * 100) : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-white mb-1">Payment Tracker</h1>
      <p className="text-sm text-zinc-500">{project.name}</p>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`${glass} p-5`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Total Contract</p>
          <p className="text-lg font-bold text-white mt-1">{fmt(totalContract)}</p>
        </div>
        <div className={`${glass} p-5`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Received</p>
          <p className="text-lg font-bold text-emerald-400 mt-1">{fmt(totalReceived)}</p>
          <p className="text-xs text-zinc-600 mt-0.5">{paidPct}% of contract</p>
        </div>
        <div className={`${glass} p-5`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Pending</p>
          <p className={`text-lg font-bold mt-1 ${totalPending > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {fmt(totalPending)}
          </p>
        </div>
      </div>

      {/* Payment Stages */}
      {stages.length > 0 && (
        <div className={`${glass} p-5`}>
          <h2 className="text-sm font-semibold text-white mb-4">Payment Milestones</h2>
          <div className="space-y-3">
            {stages.map(s => {
              const cfg = stageStatusIcon[s.status] ?? stageStatusIcon.pending;
              const Icon = cfg.icon;
              const stageTotal = (s.amount_due ?? 0) + (s.gst_on_stage ?? 0);
              return (
                <div key={s.id} className="flex items-center gap-3 rounded-xl bg-zinc-800/40 px-4 py-3">
                  <Icon className={`h-5 w-5 shrink-0 ${cfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{s.stage_name}</p>
                    <div className="flex gap-3 text-xs text-zinc-500 mt-0.5">
                      {s.trigger_condition && <span>{s.trigger_condition}</span>}
                      {s.due_date && <span>Due: {fmtDate(s.due_date)}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-white">{fmt(stageTotal)}</p>
                    <p className={`text-xs font-medium ${s.status === 'paid' ? 'text-emerald-400' : s.status === 'partial' ? 'text-amber-400' : 'text-zinc-500'}`}>
                      {s.status}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <div className={`${glass} p-5`}>
          <h2 className="text-sm font-semibold text-white mb-4">Payment History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wide">
                  <th className="text-left py-2 pr-4">Date</th>
                  <th className="text-right py-2 pr-4">Amount</th>
                  <th className="text-left py-2 pr-4">Mode</th>
                  <th className="text-left py-2">Reference</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b border-zinc-800/50">
                    <td className="py-2.5 pr-4 text-zinc-300">{fmtDate(p.payment_date)}</td>
                    <td className="py-2.5 pr-4 text-right font-medium text-emerald-400">{fmt(p.amount_received)}</td>
                    <td className="py-2.5 pr-4 text-zinc-400">{p.payment_mode}</td>
                    <td className="py-2.5 text-zinc-500 font-mono text-xs">{p.reference_no ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {orders.length === 0 && (
        <div className={`${glass} p-12 text-center`}>
          <CreditCard className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500">No payment information available yet.</p>
        </div>
      )}
    </div>
  );
}
