import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Package, Wrench } from 'lucide-react';

export const dynamic = 'force-dynamic';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

export default async function ItemsPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard/accounts/items');

  const { data: items } = await supabaseAdmin
    .from('items')
    .select('*')
    .order('name');

  const goods = items?.filter(i => i.item_type === 'goods') ?? [];
  const services = items?.filter(i => i.item_type === 'service') ?? [];

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Item Catalog</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {goods.length} goods · {services.length} services
          </p>
        </div>
        <Link
          href="/dashboard/accounts/items/new"
          className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Item
        </Link>
      </div>

      {!items?.length ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center">
          <Package className="mx-auto h-8 w-8 text-zinc-700 mb-3" />
          <p className="text-zinc-500 text-sm">No items in catalog yet.</p>
          <Link href="/dashboard/accounts/items/new" className="mt-3 inline-block text-amber-400 text-sm hover:underline">
            Add your first item →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {[
            { label: 'Goods', icon: Package, rows: goods },
            { label: 'Services', icon: Wrench, rows: services },
          ].map(({ label, icon: Icon, rows }) => rows.length > 0 && (
            <div key={label}>
              <h2 className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
                <Icon className="h-3.5 w-3.5" /> {label}
              </h2>
              <div className="rounded-2xl border border-zinc-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/60">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">SKU</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Name</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">HSN/SAC</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Unit</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">MRP</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">GST%</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Category</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {rows.map(item => (
                      <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs text-amber-400 font-semibold">{item.sku_id}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="text-white font-medium">{item.name}</div>
                          {item.description && (
                            <div className="text-xs text-zinc-500 mt-0.5 truncate max-w-xs">{item.description}</div>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs text-zinc-300">
                            {item.hsn_code ?? item.sac_code ?? '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-zinc-400 text-xs">{item.unit}</td>
                        <td className="px-5 py-3.5 text-right text-zinc-300 text-xs font-mono">
                          {item.mrp ? fmt(item.mrp) : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right text-zinc-400 text-xs">{item.default_gst_rate}%</td>
                        <td className="px-5 py-3.5 text-zinc-500 text-xs">{item.category ?? '—'}</td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            href={`/dashboard/accounts/items/${item.id}`}
                            className="text-xs text-amber-400 hover:underline"
                          >
                            Edit →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
