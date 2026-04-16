import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Recycle, CheckCircle2, Clock, Truck, Package, ArrowLeft, Factory } from 'lucide-react';

const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const STEPS = [
  { status: 'submitted', label: 'Submitted', icon: Clock, color: 'text-amber-400' },
  { status: 'assigned', label: 'Recycler Assigned', icon: CheckCircle2, color: 'text-sky-400' },
  { status: 'scheduled', label: 'Pickup Scheduled', icon: Clock, color: 'text-indigo-400' },
  { status: 'collected', label: 'Collected', icon: Truck, color: 'text-emerald-400' },
  { status: 'processing', label: 'Processing', icon: Factory, color: 'text-amber-400' },
  { status: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-emerald-400' },
];

export default async function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: request, error } = await supabaseAdmin
    .from('ewaste_collection_requests')
    .select('*, ewaste_recyclers(company_name, recycler_code, city)')
    .eq('id', id)
    .single();

  if (error || !request) notFound();

  const { data: items } = await supabaseAdmin
    .from('ewaste_collection_items')
    .select('*')
    .eq('request_id', id);

  const { data: logs } = await supabaseAdmin
    .from('ewaste_activity_log')
    .select('*')
    .eq('request_id', id)
    .order('created_at', { ascending: false });

  const recycler = request.ewaste_recyclers as { company_name: string; recycler_code: string; city: string } | null;
  const currentStepIdx = STEPS.findIndex(s => s.status === request.status);
  const isCancelled = request.status === 'cancelled';

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/recycling" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-6">
          <ArrowLeft className="h-3 w-3" /> E-Waste Collection
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Recycle className="h-7 w-7 text-emerald-400" />
          <div>
            <h1 className="text-xl font-bold">Track Collection</h1>
            <p className="text-sm font-mono text-emerald-400">{request.request_no}</p>
          </div>
        </div>

        {/* Status progress */}
        {!isCancelled ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const reached = i <= currentStepIdx;
                return (
                  <div key={step.status} className="flex flex-col items-center text-center flex-1">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center mb-2 ${reached ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-zinc-800 border border-zinc-700'}`}>
                      <Icon className={`h-4 w-4 ${reached ? 'text-emerald-400' : 'text-zinc-600'}`} />
                    </div>
                    <span className={`text-[10px] ${reached ? 'text-emerald-400 font-medium' : 'text-zinc-600'}`}>{step.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.max(5, (currentStepIdx / (STEPS.length - 1)) * 100)}%` }} />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 mb-6 text-center">
            <p className="text-red-400 font-semibold">This request has been cancelled.</p>
            {request.cancelled_reason && <p className="text-sm text-zinc-500 mt-1">{request.cancelled_reason}</p>}
          </div>
        )}

        {/* Details */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 mb-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Collection Details</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-zinc-500">Submitted</span><p className="text-white">{fmtDate(request.created_at)}</p></div>
            <div><span className="text-zinc-500">Location</span><p className="text-white">{request.generator_city}, {request.generator_state}</p></div>
            {request.preferred_date && <div><span className="text-zinc-500">Preferred Date</span><p className="text-white">{fmtDate(request.preferred_date)}</p></div>}
            {request.scheduled_date && <div><span className="text-zinc-500">Scheduled</span><p className="text-emerald-400 font-medium">{fmtDate(request.scheduled_date)}</p></div>}
            {request.estimated_weight_kg && <div><span className="text-zinc-500">Est. Weight</span><p className="text-white">{request.estimated_weight_kg} kg</p></div>}
            {request.actual_weight_kg && <div><span className="text-zinc-500">Actual Weight</span><p className="text-emerald-400 font-medium">{request.actual_weight_kg} kg</p></div>}
          </div>
          {recycler && (
            <div className="rounded-xl bg-zinc-800/50 p-4 mt-3">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Assigned Recycler</p>
              <p className="text-sm font-semibold text-white">{recycler.company_name}</p>
              <p className="text-xs text-zinc-400">{recycler.recycler_code} &middot; {recycler.city}</p>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 mb-6">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Items</h2>
          <div className="space-y-2">
            {(items ?? []).map((item: { id: string; category_name: string; quantity: number; unit: string; description?: string; condition: string }) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl bg-zinc-800/30 px-4 py-3">
                <div>
                  <p className="text-sm text-white">{item.category_name}</p>
                  {item.description && <p className="text-xs text-zinc-500">{item.description}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-300">{item.quantity} {item.unit}</p>
                  <p className="text-[10px] text-zinc-600 capitalize">{item.condition.replace('_', ' ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity log */}
        {(logs ?? []).length > 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Activity</h2>
            <div className="space-y-3">
              {(logs ?? []).map((log: { id: string; action: string; notes?: string; created_at: string; performed_by?: string }) => (
                <div key={log.id} className="flex gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-zinc-300">{log.notes ?? log.action}</p>
                    <p className="text-xs text-zinc-600">{fmtDate(log.created_at)} {log.performed_by ? `by ${log.performed_by}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
