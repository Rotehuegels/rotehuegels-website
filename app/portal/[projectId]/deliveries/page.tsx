import { redirect, notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getPortalUser } from '@/lib/portalAuth';
import { Package, Truck, CheckCircle2, Clock, MapPin } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  processing:       { icon: Clock,        color: 'text-zinc-400',    bg: 'bg-zinc-500/10 border-zinc-700',       label: 'Processing' },
  dispatched:       { icon: Package,      color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30',    label: 'Dispatched' },
  in_transit:       { icon: Truck,        color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30',  label: 'In Transit' },
  out_for_delivery: { icon: MapPin,       color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/30', label: 'Out for Delivery' },
  delivered:        { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', label: 'Delivered' },
};

export default async function DeliveriesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const portalUser = await getPortalUser();
  if (!portalUser) redirect('/login?next=/portal');

  const { projectId } = await params;

  const { data: project } = await supabaseAdmin
    .from('projects').select('id, name').eq('id', projectId).eq('customer_id', portalUser.customerId).single();
  if (!project) notFound();

  const { data: deliveries } = await supabaseAdmin
    .from('delivery_updates')
    .select('id, title, description, status, expected_date, delivered_date, created_at')
    .eq('project_id', projectId)
    .eq('visible_to_client', true)
    .order('created_at', { ascending: false });

  const list = deliveries ?? [];
  const active = list.filter(d => d.status !== 'delivered').length;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-white mb-1">Delivery Status</h1>
      <p className="text-sm text-zinc-500 mb-6">{project.name} · {active} active, {list.length} total</p>

      {list.length === 0 ? (
        <div className={`${glass} p-12 text-center`}>
          <Package className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No delivery updates yet.</p>
          <p className="text-xs text-zinc-600 mt-1">Updates will appear here when items are dispatched.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-zinc-800" />

          <div className="space-y-6">
            {list.map(d => {
              const cfg = statusConfig[d.status] ?? statusConfig.processing;
              const Icon = cfg.icon;
              return (
                <div key={d.id} className="relative flex gap-4">
                  <div className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border ${cfg.bg}`}>
                    <Icon className={`h-5 w-5 ${cfg.color}`} />
                  </div>
                  <div className={`${glass} p-4 flex-1`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">{d.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color} ${cfg.bg}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-600">{fmtDate(d.created_at)}</span>
                    </div>
                    {d.description && <p className="text-xs text-zinc-400 mt-1">{d.description}</p>}
                    <div className="flex gap-3 text-xs text-zinc-500 mt-2">
                      {d.expected_date && <span>Expected: {fmtDate(d.expected_date)}</span>}
                      {d.delivered_date && <span className="text-emerald-400">Delivered: {fmtDate(d.delivered_date)}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
