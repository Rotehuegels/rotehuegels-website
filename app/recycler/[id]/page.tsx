import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/app/api/ewaste/recyclers/verify/route';
import {
  Factory, CheckCircle2, Clock, Truck, Package, XCircle,
  MapPin, Phone, Mail, Calendar,
} from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const STATUS_CONFIG: Record<string, { cls: string; icon: React.ElementType; label: string }> = {
  assigned:   { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock, label: 'Assigned' },
  scheduled:  { cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Calendar, label: 'Scheduled' },
  in_transit: { cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: Truck, label: 'In Transit' },
  collected:  { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: Package, label: 'Collected' },
  processing: { cls: 'bg-violet-500/10 text-violet-400 border-violet-500/20', icon: Factory, label: 'Processing' },
  completed:  { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2, label: 'Completed' },
  cancelled:  { cls: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle, label: 'Cancelled' },
};

export default async function RecyclerDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Auth: verify signed session cookie matches this recycler
  const cookieStore = await cookies();
  const session = cookieStore.get('recycler_session')?.value;
  const sessionId = session ? verifyToken(session) : null;
  if (!sessionId || sessionId !== id) redirect('/recycler');

  const { data: recycler, error } = await supabaseAdmin
    .from('recyclers')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !recycler) notFound();

  const { data: requests } = await supabaseAdmin
    .from('collection_requests')
    .select('*')
    .eq('recycler_id', id)
    .order('created_at', { ascending: false });

  const list = requests ?? [];
  const pending = list.filter(r => ['assigned', 'scheduled'].includes(r.status));
  const active = list.filter(r => ['in_transit', 'collected', 'processing'].includes(r.status));
  const completed = list.filter(r => r.status === 'completed');
  const totalWeight = list.reduce((s, r) => s + (r.actual_weight_kg ?? r.estimated_weight_kg ?? 0), 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 bg-zinc-950/95">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Factory className="h-6 w-6 text-indigo-400" />
            <div>
              <h1 className="text-lg font-bold">{recycler.company_name}</h1>
              <p className="text-xs text-zinc-500 font-mono">{recycler.recycler_code}</p>
            </div>
          </div>
          <a href="/api/ewaste/recyclers/logout" className="text-xs text-zinc-500 hover:text-zinc-300">Sign Out</a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Pending Pickup', value: pending.length, color: pending.length > 0 ? 'text-amber-400' : 'text-zinc-600' },
            { label: 'Active', value: active.length, color: 'text-sky-400' },
            { label: 'Completed', value: completed.length, color: 'text-emerald-400' },
            { label: 'Total Weight', value: `${Math.round(totalWeight)} kg`, color: 'text-indigo-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`${glass} p-4`}>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</p>
              <p className={`text-2xl font-black mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Pending pickups alert */}
        {pending.length > 0 && (
          <div className="flex items-start gap-3 rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3">
            <Clock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-400">
              {pending.length} collection{pending.length > 1 ? 's' : ''} waiting for pickup. Please schedule and collect promptly.
            </p>
          </div>
        )}

        {/* Assigned requests */}
        <div className={glass}>
          <div className="px-6 py-3 border-b border-zinc-800/60">
            <h2 className="text-sm font-semibold text-white">Your Collection Assignments</h2>
          </div>
          {list.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No assignments yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {list.map(req => {
                const cfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.assigned;
                const Icon = cfg.icon;
                return (
                  <div key={req.id} className="px-6 py-4 hover:bg-zinc-800/20 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-mono font-semibold text-emerald-400">{req.request_no}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${cfg.cls}`}>
                            <Icon className="h-3 w-3" /> {cfg.label}
                          </span>
                        </div>
                        <p className="text-sm text-white">{req.generator_name} {req.generator_company ? `(${req.generator_company})` : ''}</p>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-zinc-500">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{req.generator_address}, {req.generator_city}</span>
                          {req.generator_phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{req.generator_phone}</span>}
                          {req.generator_email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{req.generator_email}</span>}
                        </div>
                        {req.preferred_date && (
                          <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Preferred: {fmtDate(req.preferred_date)} {req.preferred_time_slot ?? ''}
                          </p>
                        )}
                        {req.notes && <p className="text-xs text-zinc-600 mt-1 italic">{req.notes}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-zinc-500">{fmtDate(req.created_at)}</p>
                        {req.estimated_weight_kg && <p className="text-sm font-bold text-white">{req.estimated_weight_kg} kg</p>}
                        {req.scheduled_date && <p className="text-xs text-emerald-400">Scheduled: {fmtDate(req.scheduled_date)}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recycler info */}
        <div className={`${glass} p-5 text-sm text-zinc-500`}>
          <p>
            <strong className="text-zinc-300">{recycler.company_name}</strong> &middot; {recycler.recycler_code}
            {recycler.cpcb_registration && <> &middot; CPCB: {recycler.cpcb_registration}</>}
          </p>
          <p className="text-xs mt-1">
            For support, contact Roteh&uuml;gels Procurement at procurements@rotehuegels.com
          </p>
        </div>
      </div>
    </div>
  );
}
