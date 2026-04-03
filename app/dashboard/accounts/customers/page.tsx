import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, User, Mail, Phone, Building2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard/accounts/customers');

  const { data: customers } = await supabaseAdmin
    .from('customers')
    .select('id, customer_id, name, gstin, contact_person, email, phone, state, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Customers</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{customers?.length ?? 0} customers in master</p>
        </div>
        <Link
          href="/dashboard/accounts/customers/new"
          className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Customer
        </Link>
      </div>

      {/* Table */}
      {!customers?.length ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center">
          <Building2 className="mx-auto h-8 w-8 text-zinc-700 mb-3" />
          <p className="text-zinc-500 text-sm">No customers yet.</p>
          <Link href="/dashboard/accounts/customers/new" className="mt-3 inline-block text-amber-400 text-sm hover:underline">
            Add your first customer →
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60">
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">ID</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">GSTIN</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Contact</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">State</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {customers.map(c => (
                <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs text-amber-400 font-semibold">{c.customer_id}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-white font-medium">{c.name}</div>
                    {c.contact_person && (
                      <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                        <User className="h-3 w-3" /> {c.contact_person}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs text-zinc-300">{c.gstin ?? '—'}</span>
                  </td>
                  <td className="px-5 py-3.5 space-y-0.5">
                    {c.email && (
                      <div className="text-xs text-zinc-400 flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {c.email}
                      </div>
                    )}
                    {c.phone && (
                      <div className="text-xs text-zinc-400 flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {c.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-zinc-400">{c.state ?? '—'}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/dashboard/accounts/customers/${c.id}`}
                      className="text-xs text-amber-400 hover:underline"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
