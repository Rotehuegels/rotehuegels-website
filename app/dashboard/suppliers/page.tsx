import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Package } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

export default async function SuppliersAdminPage() {
  const { data: suppliers } = await supabaseAdmin
    .from('suppliers')
    .select('id, company_name, contact_person, email, phone, country, product_categories, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-emerald-500/10 p-2.5">
          <Package className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Suppliers</h1>
          <p className="text-sm text-zinc-400">{suppliers?.length ?? 0} registered</p>
        </div>
      </div>

      <div className={glass}>
        {!suppliers || suppliers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-zinc-500 text-sm">No suppliers registered yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left">
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">Contact</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">Country</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Categories</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{s.company_name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{s.email}</p>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-zinc-300">{s.contact_person}</p>
                      {s.phone && <p className="text-xs text-zinc-500">{s.phone}</p>}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 hidden md:table-cell">{s.country}</td>
                    <td className="px-6 py-4 text-zinc-400 hidden lg:table-cell max-w-xs truncate">{s.product_categories}</td>
                    <td className="px-6 py-4 text-zinc-400 hidden lg:table-cell">
                      {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
