'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Truck, Package, CheckCircle2, Clock, MapPin,
  Loader2, RefreshCw, Calendar, Building2,
} from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

interface TrackingEvent {
  date: string;
  time: string;
  location: string;
  status: string;
  remarks: string;
}

interface TrackingData {
  carrier: string;
  tracking_no: string;
  status: string;
  origin: string;
  destination: string;
  booked_date: string;
  current_status: string;
  delivery_type: string;
  weight: string;
  packages: string;
  events: TrackingEvent[];
  fetched_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  booked:           { icon: Package,      color: 'text-zinc-400', bg: 'bg-zinc-500/20' },
  in_transit:       { icon: Truck,        color: 'text-blue-400', bg: 'bg-blue-500/20' },
  out_for_delivery: { icon: Truck,        color: 'text-amber-400', bg: 'bg-amber-500/20' },
  delivered:        { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  returned:         { icon: Clock,        color: 'text-red-400', bg: 'bg-red-500/20' },
};

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const fmtDateTime = (d: string | null) =>
  d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [shipment, setShipment] = useState<AnyObj | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load shipment (includes cached tracking_data from DB)
  const loadShipment = useCallback(() => {
    fetch('/api/shipments').then(r => r.json()).then(d => {
      const s = (d.shipments ?? []).find((s: AnyObj) => s.id === id);
      if (s) setShipment(s);
      else setError('Shipment not found');
      setLoading(false);
    });
  }, [id]);

  useEffect(() => { loadShipment(); }, [loadShipment]);

  // Background refresh: triggers scrape → saves to DB → reloads
  const refreshTracking = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetch('/api/shipments/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipment_id: id }),
      });
      // Reload shipment from DB after scrape completes
      loadShipment();
    } catch {
      // Silently fail — old data still shown
    } finally {
      setRefreshing(false);
    }
  }, [id, loadShipment]);

  // Auto-refresh if no cached data or data is stale (>4 hours)
  useEffect(() => {
    if (!shipment) return;
    const cached = shipment.tracking_data as TrackingData | null;
    const lastFetch = shipment.tracking_updated_at ? new Date(shipment.tracking_updated_at).getTime() : 0;
    const stale = Date.now() - lastFetch > 4 * 60 * 60 * 1000; // 4 hours
    if (!cached || stale) {
      refreshTracking();
    }
  }, [shipment?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>;
  if (error || !shipment) return <div className="p-8 text-red-400">{error ?? 'Not found'}</div>;

  const tracking = shipment.tracking_data as TrackingData | null;
  const cfg = statusConfig[shipment.status] ?? statusConfig.booked;
  const StatusIcon = cfg.icon;

  const steps = ['booked', 'in_transit', 'out_for_delivery', 'delivered'];
  const currentStepIdx = steps.indexOf(shipment.status);

  return (
    <div className="p-4 md:p-8 max-w-[1800px] space-y-6">
      <Link href="/d/shipments" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Shipments
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white font-mono">{shipment.tracking_no}</h1>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${cfg.color} ${cfg.bg}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {shipment.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            {shipment.carrier}
            {(shipment.purchase_orders?.suppliers?.legal_name || shipment.supplier_name) && (
              <> — From: <span className="text-zinc-200">{shipment.purchase_orders?.suppliers?.legal_name ?? shipment.supplier_name}</span></>
            )}
            {shipment.orders?.client_name && (
              <> → To: <span className="text-emerald-400">{shipment.orders.client_name}</span></>
            )}
          </p>
          {shipment.description && <p className="text-xs text-zinc-500 mt-0.5">{shipment.description}</p>}
        </div>
        <button
          onClick={refreshTracking}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl bg-rose-500/20 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/30 transition-colors disabled:opacity-50"
        >
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Progress bar */}
      <div className={`${glass} p-6`}>
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => {
            const isActive = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            const StepIcon = statusConfig[step]?.icon ?? Package;
            return (
              <div key={step} className="flex-1 flex flex-col items-center relative">
                {idx > 0 && (
                  <div className={`absolute top-5 -left-1/2 w-full h-0.5 ${idx <= currentStepIdx ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
                )}
                <div className={`relative z-10 flex items-center justify-center h-10 w-10 rounded-full border-2 ${
                  isCurrent ? 'border-rose-500 bg-rose-500/20' : isActive ? 'border-emerald-500 bg-emerald-500/20' : 'border-zinc-700 bg-zinc-800'
                }`}>
                  <StepIcon className={`h-5 w-5 ${isCurrent ? 'text-rose-400' : isActive ? 'text-emerald-400' : 'text-zinc-600'}`} />
                </div>
                <span className={`mt-2 text-xs font-medium capitalize ${isActive ? 'text-zinc-200' : 'text-zinc-600'}`}>
                  {step.replace(/_/g, ' ')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Details + Tracking */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shipment details */}
        <div className={`${glass} p-6 space-y-3`}>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Shipment Details</h2>
          <div className="space-y-2 text-sm">
            <Row icon={Building2} label="Carrier" value={shipment.carrier} />
            <Row icon={Package} label="Tracking No" value={shipment.tracking_no} mono />
            <Row icon={Building2} label="Supplier" value={shipment.purchase_orders?.suppliers?.legal_name ?? shipment.supplier_name} />
            {shipment.purchase_orders?.po_no && (
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-zinc-500" />
                <span className="text-zinc-500 w-24">PO Ref</span>
                <a href={`/d/purchase-orders/${shipment.po_id}`} className="text-rose-400 hover:text-rose-300 text-sm">{shipment.purchase_orders.po_no}</a>
              </div>
            )}
            {shipment.orders?.client_name && <Row icon={Building2} label="Customer" value={shipment.orders.client_name} color="text-emerald-400" />}
            {shipment.orders?.order_no && (
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-emerald-500" />
                <span className="text-zinc-500 w-24">Order Ref</span>
                <a href={`/d/orders/${shipment.order_id}`} className="text-rose-400 hover:text-rose-300 text-sm">{shipment.orders.order_no}</a>
              </div>
            )}
            <Row icon={Calendar} label="Ship Date" value={fmtDate(shipment.ship_date)} />
            <Row icon={Calendar} label="Expected" value={fmtDate(shipment.expected_date)} />
            {shipment.delivered_date && <Row icon={CheckCircle2} label="Delivered" value={fmtDate(shipment.delivered_date)} color="text-emerald-400" />}
            {tracking?.weight && <Row icon={Package} label="Weight" value={`${tracking.weight} kg`} />}
            {tracking?.packages && <Row icon={Package} label="Packages" value={tracking.packages} />}
            {shipment.notes && <div className="mt-2 text-xs text-zinc-500 border-t border-zinc-800 pt-2">{shipment.notes}</div>}
          </div>
        </div>

        {/* Live tracking */}
        <div className={`${glass} p-6 space-y-3`}>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Tracking Status</h2>
          {tracking ? (
            <div className="space-y-3 text-sm">
              <div className="rounded-xl bg-zinc-800/50 p-3">
                <p className="text-xs text-zinc-500 mb-1">Current Status</p>
                <p className="text-zinc-200 font-medium">{tracking.current_status}</p>
              </div>
              {tracking.origin && <Row icon={MapPin} label="Origin" value={tracking.origin} />}
              {tracking.destination && <Row icon={MapPin} label="Destination" value={tracking.destination} />}
              {tracking.booked_date && <Row icon={Calendar} label="Booked" value={tracking.booked_date} />}
              {tracking.delivery_type && <Row icon={Truck} label="Delivery" value={tracking.delivery_type} />}
              <p className="text-xs text-zinc-600 mt-2">
                Last updated: {fmtDateTime(shipment.tracking_updated_at)}
              </p>
            </div>
          ) : refreshing ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Fetching tracking from {shipment.carrier}...
            </div>
          ) : (
            <p className="text-sm text-zinc-600">No tracking data yet. Click Refresh to fetch.</p>
          )}
        </div>
      </div>

      {/* Timeline */}
      {tracking && tracking.events.length > 0 && (
        <div className={`${glass} p-6`}>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">Tracking Timeline</h2>
          <div className="space-y-0">
            {tracking.events.map((event, idx) => {
              const isLast = idx === tracking.events.length - 1;
              return (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`h-3 w-3 rounded-full ${isLast ? 'bg-rose-500' : 'bg-zinc-600'}`} />
                    {!isLast && <div className="w-0.5 flex-1 bg-zinc-800" />}
                  </div>
                  <div className="pb-6">
                    <div className="flex items-center gap-3 mb-0.5">
                      <span className="text-xs font-mono text-zinc-500">{event.date} {event.time}</span>
                      {event.location && (
                        <>
                          <span className="text-xs text-zinc-600">|</span>
                          <span className="text-xs text-zinc-400 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {event.location}
                          </span>
                        </>
                      )}
                    </div>
                    <p className={`text-sm font-medium ${isLast ? 'text-rose-400' : 'text-zinc-300'}`}>
                      {event.status}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No events */}
      {tracking && tracking.events.length === 0 && tracking.status !== 'not_found' && (
        <div className={`${glass} p-6 text-center`}>
          <p className="text-sm text-zinc-500">No tracking events yet. The carrier may not have updated the status.</p>
        </div>
      )}
    </div>
  );
}

function Row({ icon: Icon, label, value, mono, color }: {
  icon: React.ElementType; label: string; value: string | null | undefined;
  mono?: boolean; color?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${color ? color.replace('text-', 'text-') : 'text-zinc-500'}`} />
      <span className="text-zinc-500 w-24">{label}</span>
      <span className={`${color ?? 'text-zinc-200'} ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
