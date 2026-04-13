'use client';

import { useEffect, useState } from 'react';
import {
  Truck, Plus, Loader2, ExternalLink, Package, CheckCircle2, Clock,
} from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const inputCls = 'w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-rose-500 outline-none';

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const statusConfig: Record<string, { icon: React.ElementType; color: string }> = {
  booked:           { icon: Package,      color: 'text-zinc-400 bg-zinc-500/10' },
  in_transit:       { icon: Truck,        color: 'text-blue-400 bg-blue-500/10' },
  out_for_delivery: { icon: Truck,        color: 'text-amber-400 bg-amber-500/10' },
  delivered:        { icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10' },
  returned:         { icon: Clock,        color: 'text-red-400 bg-red-500/10' },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<AnyObj[]>([]);
  const [carriers, setCarriers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => {
    fetch('/api/shipments').then(r => r.json()).then(d => {
      setShipments(d.shipments ?? []);
      setCarriers(d.carriers ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const addShipment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/shipments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tracking_no: fd.get('tracking_no'),
        carrier: fd.get('carrier'),
        supplier_name: fd.get('supplier_name'),
        description: fd.get('description'),
        ship_date: fd.get('ship_date') || null,
        expected_date: fd.get('expected_date') || null,
        notes: fd.get('notes'),
      }),
    });
    setSaving(false);
    if (res.ok) { setMsg('Shipment added.'); setShowForm(false); load(); }
    else { const d = await res.json(); setMsg(`Error: ${d.error}`); }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/shipments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const getTrackingUrl = (s: AnyObj) => {
    if (s.carrier === 'ARC') return `https://online.arclimited.com/cnstrk/cnstrk.aspx`;
    if (s.carrier_url) return s.carrier_url;
    return null;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Truck className="h-5 w-5 text-rose-400" />
          <h1 className="text-xl font-bold text-white">Shipment Tracking</h1>
          <span className="text-xs text-zinc-500 bg-zinc-800 rounded-full px-2 py-0.5">
            {shipments.filter(s => s.status !== 'delivered').length} active
          </span>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-500">
          <Plus className="h-4 w-4" /> Add Shipment
        </button>
      </div>

      {msg && <p className="text-xs text-zinc-400 bg-zinc-800 rounded-lg px-3 py-2 mb-4">{msg}</p>}

      {/* Add form */}
      {showForm && (
        <form onSubmit={addShipment} className={`${glass} p-5 mb-6`}>
          <h2 className="text-sm font-semibold text-white mb-3">New Shipment</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div><label className="block text-xs text-zinc-400 mb-1">Tracking No *</label><input name="tracking_no" required placeholder="e.g., B4002064885" className={inputCls} /></div>
            <div><label className="block text-xs text-zinc-400 mb-1">Carrier *</label>
              <select name="carrier" required className={inputCls}>
                {carriers.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="block text-xs text-zinc-400 mb-1">Supplier / From</label><input name="supplier_name" placeholder="e.g., Galena Metals" className={inputCls} /></div>
            <div><label className="block text-xs text-zinc-400 mb-1">Description</label><input name="description" placeholder="What's being shipped" className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div><label className="block text-xs text-zinc-400 mb-1">Ship Date</label><input type="date" name="ship_date" className={inputCls} /></div>
            <div><label className="block text-xs text-zinc-400 mb-1">Expected Delivery</label><input type="date" name="expected_date" className={inputCls} /></div>
            <div className="col-span-2"><label className="block text-xs text-zinc-400 mb-1">Notes</label><input name="notes" className={inputCls} /></div>
          </div>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-500 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
          </button>
        </form>
      )}

      {/* Shipments list */}
      {shipments.length === 0 ? (
        <div className={`${glass} p-12 text-center`}>
          <Truck className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500">No shipments tracked yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shipments.map(s => {
            const cfg = statusConfig[s.status] ?? statusConfig.in_transit;
            const Icon = cfg.icon;
            const trackUrl = getTrackingUrl(s);
            return (
              <div key={s.id} className={`${glass} p-5`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-rose-400 font-bold">{s.tracking_no}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{s.carrier}</span>
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>
                        <Icon className="h-3 w-3" /> {s.status.replace('_', ' ')}
                      </span>
                    </div>
                    {(s.purchase_orders?.suppliers?.legal_name || s.supplier_name) && (
                      <p className="text-sm text-white font-medium">
                        <span className="text-zinc-500 text-xs">From:</span> {s.purchase_orders?.suppliers?.legal_name ?? s.supplier_name}
                        {s.purchase_orders?.po_no && <span className="text-zinc-600 text-xs ml-1">({s.purchase_orders.po_no})</span>}
                      </p>
                    )}
                    {s.orders?.client_name && (
                      <p className="text-sm text-emerald-400/80">
                        <span className="text-zinc-500 text-xs">To:</span> {s.orders.client_name}
                        {s.orders?.order_no && <span className="text-zinc-600 text-xs ml-1">({s.orders.order_no})</span>}
                      </p>
                    )}
                    {s.description && <p className="text-xs text-zinc-400">{s.description}</p>}
                    <div className="flex gap-3 text-xs text-zinc-500 mt-1">
                      {s.ship_date && <span>Shipped: {fmtDate(s.ship_date)}</span>}
                      {s.expected_date && <span>Expected: {fmtDate(s.expected_date)}</span>}
                      {s.delivered_date && <span className="text-emerald-400">Delivered: {fmtDate(s.delivered_date)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a href={`/d/shipments/${s.id}`}
                      className="flex items-center gap-1.5 rounded-lg border border-rose-700/50 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-400 hover:text-white hover:bg-rose-500/20">
                      <Truck className="h-3.5 w-3.5" /> Live Track
                    </a>
                    {trackUrl && (
                      <a href={trackUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:border-zinc-600">
                        <ExternalLink className="h-3.5 w-3.5" /> Carrier Site
                      </a>
                    )}
                    {s.status !== 'delivered' && (
                      <select value={s.status} onChange={e => updateStatus(s.id, e.target.value)}
                        className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-white">
                        <option value="booked">Booked</option>
                        <option value="in_transit">In Transit</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="returned">Returned</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
