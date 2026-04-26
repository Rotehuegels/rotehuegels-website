import { supabaseAdmin } from '@/lib/supabaseAdmin';
import AddStockForm from './AddStockForm';
import { Package, Pencil, AlertTriangle, TrendingDown } from 'lucide-react';
import { Suspense } from 'react';
import Link from 'next/link';
import StockFilterBar from './StockFilterBar';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
const fmtNum = (n: number, dec = 3) => n.toLocaleString('en-IN', { maximumFractionDigits: dec });

const LOW_STOCK_THRESHOLD = 5; // items with qty <= this are flagged

export default async function StockPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : '';

  let query = supabaseAdmin
    .from('stock_items')
    .select('*, orders(order_no, client_name)')
    .order('item_name');

  if (q) {
    query = query.or(`item_name.ilike.%${q}%,item_code.ilike.%${q}%,hsn_code.ilike.%${q}%`);
  }

  const { data: items } = await query;

  const list = items ?? [];
  const totalValue = list.reduce((s, i) => s + (i.quantity ?? 0) * (i.unit_cost ?? 0), 0);
  const lowStockItems = list.filter(i => (i.quantity ?? 0) <= LOW_STOCK_THRESHOLD && (i.quantity ?? 0) > 0);
  const outOfStock = list.filter(i => (i.quantity ?? 0) === 0);
  const categories = [...new Set(list.map(i => i.category).filter(Boolean))];

  return (
    <div className="p-5 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Package className="h-6 w-6 text-amber-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Stock &amp; Inventory</h1>
          <p className="mt-0.5 text-sm text-zinc-500">{list.length} items &middot; {categories.length} categories</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`${glass} p-4`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Total Items</p>
          <p className="text-2xl font-black text-white mt-1">{list.length}</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Stock Value</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{fmt(totalValue)}</p>
        </div>
        <div className={`${glass} p-4`}>
          <div className="flex items-center gap-1.5">
            <TrendingDown className="h-3 w-3 text-amber-400" />
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Low Stock</p>
          </div>
          <p className={`text-2xl font-black mt-1 ${lowStockItems.length > 0 ? 'text-amber-400' : 'text-zinc-600'}`}>{lowStockItems.length}</p>
        </div>
        <div className={`${glass} p-4`}>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 text-red-400" />
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Out of Stock</p>
          </div>
          <p className={`text-2xl font-black mt-1 ${outOfStock.length > 0 ? 'text-red-400' : 'text-zinc-600'}`}>{outOfStock.length}</p>
        </div>
      </div>

      {/* Low stock alert banner */}
      {(lowStockItems.length > 0 || outOfStock.length > 0) && (
        <div className="flex items-start gap-3 rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            {outOfStock.length > 0 && (
              <p className="text-red-400 font-medium">
                {outOfStock.length} item{outOfStock.length > 1 ? 's' : ''} out of stock: {outOfStock.map(i => i.item_name).join(', ')}
              </p>
            )}
            {lowStockItems.length > 0 && (
              <p className="text-amber-400">
                {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} running low (&le;{LOW_STOCK_THRESHOLD}): {lowStockItems.map(i => `${i.item_name} (${i.quantity})`).join(', ')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Add stock */}
      <div className={`${glass} p-6`}>
        <h2 className="text-sm font-semibold text-zinc-300 mb-5">Add Stock Item</h2>
        <AddStockForm />
      </div>

      {/* Filter bar */}
      <Suspense fallback={null}>
        <StockFilterBar />
      </Suspense>

      {/* Stock table */}
      <div className={glass}>
        {!list.length ? (
          <div className="p-12 text-center">
            <Package className="mx-auto h-8 w-8 text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-600">No stock items found.</p>
          </div>
        ) : (
          <>
            <div className="hidden lg:grid grid-cols-[80px_1fr_1fr_80px_80px_120px_120px_1fr_40px] gap-4 px-6 py-3 border-b border-zinc-800/60 text-[11px] font-medium uppercase tracking-wider text-zinc-600">
              <span>Code</span><span>Item</span><span>Category</span>
              <span className="text-right">Qty</span><span>Unit</span>
              <span className="text-right">Unit Cost</span><span className="text-right">Total Value</span>
              <span>Order</span><span></span>
            </div>
            <div className="divide-y divide-zinc-800/60">
              {list.map(item => {
                const totalItemValue = (item.quantity ?? 0) * (item.unit_cost ?? 0);
                const order = item.orders as { order_no: string; client_name: string } | null;
                return (
                  <div key={item.id}
                    className="flex flex-col lg:grid lg:grid-cols-[80px_1fr_1fr_80px_80px_120px_120px_1fr_40px] gap-2 lg:gap-4 px-6 py-4 items-start lg:items-center hover:bg-zinc-800/20 transition-colors">
                    <p className="text-xs font-mono text-zinc-500">{item.item_code ?? '—'}</p>
                    <div className="min-w-0">
                      <Link href={`/d/stock/${item.id}`} className="block">
                        <p className="text-sm font-medium text-rose-300 hover:text-rose-200 truncate">{item.item_name}</p>
                      </Link>
                      {item.description && <p className="text-xs text-zinc-600 truncate">{item.description}</p>}
                      {item.hsn_code && <p className="text-xs text-zinc-700 font-mono">HSN: {item.hsn_code}</p>}
                    </div>
                    <p className="text-xs text-zinc-500">{item.category ?? '—'}</p>
                    <p className={`text-sm font-semibold text-right ${(item.quantity ?? 0) === 0 ? 'text-red-400' : 'text-white'}`}>
                      {fmtNum(item.quantity ?? 0)}
                    </p>
                    <p className="text-xs text-zinc-500">{item.unit}</p>
                    <p className="text-sm text-right text-zinc-300">{fmt(item.unit_cost ?? 0)}</p>
                    <p className="text-sm font-semibold text-right text-amber-400">{fmt(totalItemValue)}</p>
                    <div className="min-w-0">
                      {order ? (
                        <div>
                          <p className="text-xs text-amber-400 font-mono">{order.order_no}</p>
                          <p className="text-xs text-zinc-600 truncate">{order.client_name}</p>
                        </div>
                      ) : <span className="text-zinc-700">—</span>}
                    </div>
                    <Link href={`/d/stock/${item.id}/edit`}
                      className="rounded-lg border border-zinc-700 bg-zinc-800/60 p-1.5 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
                      title="Edit stock item">
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Footer total */}
            <div className="flex items-center justify-end px-6 py-4 border-t border-zinc-800/60 gap-4">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Total Stock Value</span>
              <span className="text-lg font-black text-amber-400">{fmt(totalValue)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
