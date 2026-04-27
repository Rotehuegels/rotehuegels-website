import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Package, AlertTriangle, PowerOff } from 'lucide-react';
import StockAdjustForm from './StockAdjustForm';
import ActiveToggle from '@/components/ActiveToggle';

export const dynamic = 'force-dynamic';

const TYPE_COLOR: Record<string, string> = {
  opening_balance: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  receipt:         'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  issue:           'bg-rose-500/10 text-rose-400 border-rose-500/20',
  adjustment:      'bg-amber-500/10 text-amber-400 border-amber-500/20',
  transfer:        'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 }).format(n);
const fmtINR = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
const fmtDateTime = (d: string) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default async function StockDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { id } = await params;

  const [{ data: item }, { data: movements }, { data: layers }, { data: valuationRow }] = await Promise.all([
    supabaseAdmin.from('stock_items').select('*').eq('id', id).single(),
    supabaseAdmin
      .from('stock_movements')
      .select('id, movement_type, quantity, unit_cost, cogs_value, source_type, source_id, warehouse_location, created_by_email, notes, created_at')
      .eq('stock_item_id', id)
      .order('created_at', { ascending: false })
      .limit(200),
    supabaseAdmin
      .from('stock_cost_layers')
      .select('id, original_qty, remaining_qty, unit_cost, created_at, source_movement_id')
      .eq('stock_item_id', id)
      .gt('remaining_qty', 0)
      .order('created_at', { ascending: true }),
    supabaseAdmin
      .from('stock_item_valuation')
      .select('layered_qty, fifo_value, weighted_avg_cost')
      .eq('stock_item_id', id)
      .single(),
  ]);

  if (!item) notFound();

  const lowStock = item.reorder_level != null && Number(item.quantity ?? 0) <= Number(item.reorder_level);

  // Compute running balance going forward from oldest to newest
  const sorted = [...(movements ?? [])].slice().reverse();   // oldest first
  let bal = 0;
  const runningById = new Map<string, number>();
  for (const m of sorted) {
    bal += Number(m.quantity);
    runningById.set(m.id, bal);
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <Link href="/d/stock" className="text-sm text-zinc-500 hover:text-zinc-300">← Back to Stock</Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-rose-400" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">{item.item_name}</h1>
            <p className="text-xs text-zinc-500 font-mono">{item.item_code ?? '—'}{item.category ? ` · ${item.category}` : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {lowStock && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-300">
              <AlertTriangle className="h-3 w-3" /> Below reorder level
            </span>
          )}
          {item.is_active === false && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-400">
              <PowerOff className="h-3 w-3" /> Deactivated
            </span>
          )}
          <ActiveToggle
            endpoint={`/api/accounts/stock/${id}`}
            isActive={item.is_active !== false}
            entityLabel={item.item_name}
          />
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="On hand"            value={`${fmt(Number(item.quantity ?? 0))} ${item.unit ?? ''}`}/>
        <Stat label="Reorder level"      value={item.reorder_level != null ? `${fmt(Number(item.reorder_level))} ${item.unit ?? ''}` : '—'} />
        <Stat label="Wgt-avg cost (FIFO)" value={valuationRow?.weighted_avg_cost != null ? fmtINR(Number(valuationRow.weighted_avg_cost)) : '—'} />
        <Stat label="FIFO value"         value={valuationRow?.fifo_value != null ? fmtINR(Number(valuationRow.fifo_value)) : '—'} muted />
      </div>

      {/* Adjustment form */}
      <StockAdjustForm
        stockItemId={item.id}
        itemUnit={item.unit ?? ''}
        currentQty={Number(item.quantity ?? 0)}
      />

      {/* FIFO cost layers — only meaningful when there are >= 2 active layers */}
      {(layers?.length ?? 0) > 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-x-auto">
          <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-300">FIFO cost layers</h2>
            <span className="text-[11px] text-zinc-500">
              {layers!.length} active {layers!.length === 1 ? 'layer' : 'layers'} · oldest issued first
            </span>
          </div>
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60">
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Acquired</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">Original qty</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">Remaining</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">Unit cost</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">Layer value</th>
              </tr>
            </thead>
            <tbody>
              {layers!.map((l) => {
                const layerValue = Number(l.remaining_qty) * Number(l.unit_cost);
                return (
                  <tr key={l.id} className="border-b border-zinc-800/60">
                    <td className="px-5 py-3 text-xs text-zinc-400">{fmtDateTime(l.created_at)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-zinc-500">{fmt(Number(l.original_qty))}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{fmt(Number(l.remaining_qty))}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{fmtINR(Number(l.unit_cost))}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold">{fmtINR(layerValue)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Movement history */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-x-auto">
        <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300">Movement history</h2>
          <span className="text-[11px] text-zinc-500">{movements?.length ?? 0} entries · ledger source of truth</span>
        </div>
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/60">
              <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">When</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Type</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">Qty</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">Running</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">Unit cost</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">COGS (FIFO)</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Source</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">By / Note</th>
            </tr>
          </thead>
          <tbody>
            {(movements ?? []).map((m) => {
              const q = Number(m.quantity);
              return (
                <tr key={m.id} className="border-b border-zinc-800/60">
                  <td className="px-5 py-3 text-xs text-zinc-400">{fmtDateTime(m.created_at)}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${TYPE_COLOR[m.movement_type] ?? TYPE_COLOR.adjustment}`}>
                      {m.movement_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className={`px-5 py-3 text-right tabular-nums ${q > 0 ? 'text-emerald-400' : q < 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
                    {q > 0 ? '+' : ''}{fmt(q)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-zinc-300">{fmt(runningById.get(m.id) ?? 0)}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-zinc-400">{m.unit_cost != null ? fmtINR(Number(m.unit_cost)) : '—'}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-rose-300">
                    {m.cogs_value != null ? fmtINR(Number(m.cogs_value)) : '—'}
                  </td>
                  <td className="px-5 py-3 text-xs text-zinc-500">
                    {m.source_type ?? 'manual'}
                    {m.source_id && <span className="font-mono text-[10px] block text-zinc-600">{String(m.source_id).slice(0, 8)}…</span>}
                  </td>
                  <td className="px-5 py-3 text-xs text-zinc-400">
                    {m.created_by_email && <div>{m.created_by_email}</div>}
                    {m.notes && <div className="text-zinc-500 mt-0.5">{m.notes}</div>}
                  </td>
                </tr>
              );
            })}
            {!movements?.length && (
              <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-zinc-500">No movements yet — odd, the backfill should have created an opening balance.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-1 text-base font-semibold tabular-nums ${muted ? 'text-zinc-300' : 'text-white'}`}>{value}</p>
    </div>
  );
}
