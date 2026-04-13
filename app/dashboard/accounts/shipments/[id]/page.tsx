'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Truck, Package, CheckCircle2, Clock, MapPin,
  Loader2, RefreshCw, AlertCircle, Calendar, Building2,
} from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

interface TrackingEvent {
  date: string;
  time: string;
  location: string;
  status: string;
  remarks: string;
}

interface TrackingResult {
  carrier: string;
  tracking_no: string;
  status: string;
  origin: string;
  destination: string;
  booked_date: string;
  expected_delivery: string;
  current_status: string;
  events: TrackingEvent[];
  error?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  booked:           { icon: Package,      color: 'text-zinc-400', bg: 'bg-zinc-500/20' },
  in_transit:       { icon: Truck,        color: 'text-blue-400', bg: 'bg-blue-500/20' },
  out_for_delivery: { icon: Truck,        color: 'text-amber-400', bg: 'bg-amber-500/20' },
  delivered:        { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  returned:         { icon: Clock,        color: 'text-red-400', bg: 'bg-red-500/20' },
  not_found:        { icon: AlertCircle,  color: 'text-red-400', bg: 'bg-red-500/20' },
  unknown:          { icon: Package,      color: 'text-zinc-400', bg: 'bg-zinc-500/20' },
};

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [shipment, setShipment] = useState<AnyObj | null>(null);
  const [tracking, setTracking] = useState<TrackingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load shipment
  useEffect(() => {
    fetch('/api/shipments').then(r => r.json()).then(d => {
      const s = (d.shipments ?? []).find((s: AnyObj) => s.id === id);
      if (s) setShipment(s);
      else setError('Shipment not found');
      setLoading(false);
    });
  }, [id]);

  // Fetch live tracking
  const fetchTracking = useCallback(async () => {
    if (!shipment) return;
    setTrackingLoading(true);
    try {
      const res = await fetch(`/api/shipments/track?tracking_no=${encodeURIComponent(shipment.tracking_no)}&carrier=${encodeURIComponent(shipment.carrier)}`);
      const data = await res.json();
      setTracking(data);

      // Auto-update shipment status if tracking shows a different status
      if (data.status && data.status !== 'unknown' && data.status !== 'not_found' && data.status !== shipment.status) {
        await fetch(`/api/shipments/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: data.status }),
        });
        setShipment((prev: AnyObj | null) => prev ? { ...prev, status: data.status } : prev);
      }
    } catch {
      setTracking({ carrier: shipment.carrier, tracking_no: shipment.tracking_no, status: 'error', origin: '', destination: '', booked_date: '', expected_delivery: '', current_status: 'Failed to fetch tracking', events: [] });
    } finally {
      setTrackingLoading(false);
    }
  }, [shipment, id]);

  // Auto-fetch tracking on load (with delay to let page render first)
  useEffect(() => {
    if (shipment && !tracking) {
      const timer = setTimeout(() => fetchTracking(), 500);
      return () => clearTimeout(timer);
    }
  }, [shipment, tracking, fetchTracking]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>;
  if (error || !shipment) return <div className="p-8 text-red-400">{error ?? 'Not found'}</div>;

  const cfg = statusConfig[shipment.status] ?? statusConfig.unknown;
  const StatusIcon = cfg.icon;

  // Progress steps
  const steps = ['booked', 'in_transit', 'out_for_delivery', 'delivered'];
  const currentStepIdx = steps.indexOf(shipment.status);

  return (
    <div className="p-4 md:p-8 max-w-4xl space-y-6">
      {/* Back */}
      <Link href="/d/shipments" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Shipments
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
          {shipment.description && <p className="text-xs text-zinc-500">{shipment.description}</p>}
        </div>
        <button
          onClick={fetchTracking}
          disabled={trackingLoading}
          className="flex items-center gap-2 rounded-xl bg-rose-500/20 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/30 transition-colors disabled:opacity-50"
        >
          {trackingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
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

      {/* Shipment details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${glass} p-6 space-y-3`}>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Shipment Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-zinc-500" /><span className="text-zinc-500 w-24">Carrier</span><span className="text-zinc-200">{shipment.carrier}</span></div>
            <div className="flex items-center gap-2"><Package className="h-4 w-4 text-zinc-500" /><span className="text-zinc-500 w-24">Tracking No</span><span className="text-zinc-200 font-mono">{shipment.tracking_no}</span></div>
            <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-zinc-500" /><span className="text-zinc-500 w-24">Supplier</span><span className="text-zinc-200">{shipment.purchase_orders?.suppliers?.legal_name ?? shipment.supplier_name ?? '—'}</span></div>
            {shipment.purchase_orders?.po_no && <div className="flex items-center gap-2"><Package className="h-4 w-4 text-zinc-500" /><span className="text-zinc-500 w-24">PO Ref</span><a href={`/d/purchase-orders/${shipment.po_id}`} className="text-rose-400 hover:text-rose-300">{shipment.purchase_orders.po_no}</a></div>}
            {shipment.orders?.client_name && <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-emerald-500" /><span className="text-zinc-500 w-24">Customer</span><span className="text-emerald-400">{shipment.orders.client_name}</span></div>}
            {shipment.orders?.order_no && <div className="flex items-center gap-2"><Package className="h-4 w-4 text-emerald-500" /><span className="text-zinc-500 w-24">Order Ref</span><a href={`/d/orders/${shipment.order_id}`} className="text-rose-400 hover:text-rose-300">{shipment.orders.order_no}</a></div>}
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-zinc-500" /><span className="text-zinc-500 w-24">Ship Date</span><span className="text-zinc-200">{fmtDate(shipment.ship_date)}</span></div>
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-zinc-500" /><span className="text-zinc-500 w-24">Expected</span><span className="text-zinc-200">{fmtDate(shipment.expected_date)}</span></div>
            {shipment.delivered_date && (
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /><span className="text-zinc-500 w-24">Delivered</span><span className="text-emerald-400">{fmtDate(shipment.delivered_date)}</span></div>
            )}
            {shipment.notes && (
              <div className="mt-2 text-xs text-zinc-500 border-t border-zinc-800 pt-2">{shipment.notes}</div>
            )}
          </div>
        </div>

        {/* Live tracking info */}
        <div className={`${glass} p-6 space-y-3`}>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Live Tracking</h2>
          {trackingLoading && !tracking ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Fetching live tracking from {shipment.carrier}...
            </div>
          ) : tracking ? (
            <div className="space-y-2 text-sm">
              {tracking.current_status && (
                <div className="rounded-xl bg-zinc-800/50 p-3">
                  <p className="text-xs text-zinc-500 mb-1">Current Status</p>
                  <p className="text-zinc-200 font-medium">{tracking.current_status}</p>
                </div>
              )}
              {tracking.origin && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-zinc-500" /><span className="text-zinc-500 w-24">Origin</span><span className="text-zinc-200">{tracking.origin}</span></div>}
              {tracking.destination && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-zinc-500" /><span className="text-zinc-500 w-24">Destination</span><span className="text-zinc-200">{tracking.destination}</span></div>}
              {tracking.booked_date && <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-zinc-500" /><span className="text-zinc-500 w-24">Booked</span><span className="text-zinc-200">{tracking.booked_date}</span></div>}
            </div>
          ) : (
            <p className="text-sm text-zinc-600">No tracking data available</p>
          )}
        </div>
      </div>

      {/* Tracking timeline */}
      {tracking && tracking.events.length > 0 && (
        <div className={`${glass} p-6`}>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">Tracking Timeline</h2>
          <div className="space-y-0">
            {tracking.events.map((event, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === tracking.events.length - 1;
              return (
                <div key={idx} className="flex gap-4">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className={`h-3 w-3 rounded-full ${isLast ? 'bg-rose-500' : 'bg-zinc-600'} ${isFirst ? 'mt-1' : ''}`} />
                    {!isLast && <div className="w-0.5 flex-1 bg-zinc-800" />}
                  </div>
                  {/* Event content */}
                  <div className={`pb-6 ${isLast ? '' : ''}`}>
                    <div className="flex items-center gap-3 mb-0.5">
                      <span className="text-xs font-mono text-zinc-500">{event.date} {event.time}</span>
                      <span className="text-xs text-zinc-600">|</span>
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </span>
                    </div>
                    <p className={`text-sm font-medium ${isLast ? 'text-rose-400' : 'text-zinc-300'}`}>
                      {event.status}
                    </p>
                    {event.remarks && event.remarks !== event.status && (
                      <p className="text-xs text-zinc-500 mt-0.5">{event.remarks}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fallback: no events but tracking attempted */}
      {tracking && tracking.events.length === 0 && tracking.status !== 'not_found' && (
        <div className={`${glass} p-6 text-center`}>
          <p className="text-sm text-zinc-500">No tracking events available yet. The carrier may not have updated the status.</p>
          <button onClick={() => {
            router.push(`https://online.arclimited.com/cnstrk/cnstrk.aspx`);
          }} className="mt-3 text-xs text-rose-400 hover:text-rose-300 transition-colors">
            Check on ARC website directly
          </button>
        </div>
      )}
    </div>
  );
}
