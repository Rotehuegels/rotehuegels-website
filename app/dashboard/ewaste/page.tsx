import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import {
  Recycle, ArrowRight, Clock, CheckCircle2, Truck,
  Factory, Users, Package, AlertTriangle,
} from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_CONFIG: Record<string, { cls: string; icon: React.ElementType; label: string }> = {
  submitted:   { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock, label: 'Submitted' },
  reviewing:   { cls: 'bg-sky-500/10 text-sky-400 border-sky-500/20', icon: Clock, label: 'Reviewing' },
  assigned:    { cls: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: CheckCircle2, label: 'Assigned' },
  scheduled:   { cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Clock, label: 'Scheduled' },
  in_transit:  { cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: Truck, label: 'In Transit' },
  collected:   { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: Package, label: 'Collected' },
  processing:  { cls: 'bg-violet-500/10 text-violet-400 border-violet-500/20', icon: Factory, label: 'Processing' },
  completed:   { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2, label: 'Completed' },
  cancelled:   { cls: 'bg-red-500/10 text-red-400 border-red-500/20', icon: AlertTriangle, label: 'Cancelled' },
};

export default async function EWasteDashboard() {
  const [{ data: requests }, { data: recyclers }] = await Promise.all([
    supabaseAdmin.from('ewaste_collection_requests')
      .select('*, ewaste_recyclers(company_name)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabaseAdmin.from('ewaste_recyclers').select('*', { count: 'exact', head: true }),
  ]);

  const list = requests ?? [];
  const pending = list.filter(r => ['submitted', 'reviewing'].includes(r.status));
  const active = list.filter(r => ['assigned', 'scheduled', 'in_transit', 'collected', 'processing'].includes(r.status));
  const completed = list.filter(r => r.status === 'completed');
  const totalWeight = list.reduce((s, r) => s + (r.actual_weight_kg ?? r.estimated_weight_kg ?? 0), 0);

  return (
    <div className="p-5 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Recycle className="h-6 w-6 text-emerald-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">E-Waste Collection</h1>
            <p className="mt-0.5 text-sm text-zinc-500">{list.length} requests &middot; {recyclers?.length ?? 0} recyclers</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/d/ewaste/recyclers" className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
            Recyclers
          </Link>
          <Link href="/ewaste" target="_blank" className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors">
            Public Page <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: list.length, color: 'text-white' },
          { label: 'Pending Review', value: pending.length, color: pending.length > 0 ? 'text-amber-400' : 'text-zinc-600' },
          { label: 'Active', value: active.length, color: 'text-sky-400' },
          { label: 'Completed', value: completed.length, color: 'text-emerald-400' },
          { label: 'Total Weight', value: `${Math.round(totalWeight)} kg`, color: 'text-indigo-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`${glass} p-4`}>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</p>
            <p className={`text-xl font-black mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Pending alert */}
      {pending.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-400">
            {pending.length} request{pending.length > 1 ? 's' : ''} awaiting review and recycler assignment.
          </p>
        </div>
      )}

      {/* Request list */}
      <div className={glass}>
        <div className="px-6 py-3 border-b border-zinc-800/60 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Collection Requests</h2>
        </div>
        {list.length === 0 ? (
          <div className="p-12 text-center">
            <Recycle className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No collection requests yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {list.map(req => {
              const cfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.submitted;
              const Icon = cfg.icon;
              const recyclerName = (req.ewaste_recyclers as { company_name: string } | null)?.company_name;
              return (
                <div key={req.id} className="px-6 py-4 hover:bg-zinc-800/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-semibold text-emerald-400">{req.request_no}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${cfg.cls}`}>
                            <Icon className="h-3 w-3" /> {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {req.generator_name} {req.generator_company ? `(${req.generator_company})` : ''} &middot; {req.generator_city}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500">{fmtDate(req.created_at)}</p>
                      {recyclerName && <p className="text-[10px] text-indigo-400">{recyclerName}</p>}
                      {req.estimated_weight_kg && <p className="text-[10px] text-zinc-600">{req.estimated_weight_kg} kg est.</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
