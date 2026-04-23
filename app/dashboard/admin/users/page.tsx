import Link from 'next/link';
import { listUsers } from '@/lib/userPermissions';
import { UserPlus, User, Mail, Shield, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const roleColour: Record<string, string> = {
  admin:  'bg-rose-500/10 text-rose-300 border-rose-500/30',
  staff:  'bg-amber-500/10 text-amber-300 border-amber-500/30',
  client: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
};

export default async function UsersListPage() {
  const users = await listUsers();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 py-10 space-y-8">

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-rose-400 mb-2">Administration</p>
            <h1 className="text-2xl md:text-3xl font-bold">User Management</h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Create new internal users, assign granular rights per module, and copy rights from one
              user to another when spawning additional people for the same role.
            </p>
          </div>
          <Link
            href="/d/admin/users/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white no-underline transition-colors shrink-0"
          >
            <UserPlus className="h-4 w-4" /> Add User
          </Link>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/30">
                <tr className="text-[10px] uppercase tracking-widest text-zinc-500">
                  <th className="text-left font-medium px-4 py-3">Name</th>
                  <th className="text-left font-medium px-4 py-3">Email</th>
                  <th className="text-left font-medium px-4 py-3">Role</th>
                  <th className="text-left font-medium px-4 py-3">Scope</th>
                  <th className="text-left font-medium px-4 py-3">Rights</th>
                  <th className="text-left font-medium px-4 py-3">Last sign-in</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {users.map(u => {
                  const badge = roleColour[u.role ?? 'staff'] ?? 'bg-zinc-500/10 text-zinc-300 border-zinc-700';
                  const lastSignIn = u.last_sign_in_at
                    ? new Date(u.last_sign_in_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—';
                  return (
                    <tr key={u.id} className="hover:bg-zinc-800/20">
                      <td className="px-4 py-3">
                        <Link href={`/d/admin/users/${u.id}`} className="inline-flex items-center gap-2 text-white hover:text-rose-300 no-underline font-medium">
                          <User className="h-3.5 w-3.5 text-zinc-500" />
                          {u.display_name || 'Unnamed'}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <a href={`mailto:${u.email}`} className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300">
                          <Mail className="h-3 w-3" /> {u.email}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badge}`}>
                          <Shield className="h-2.5 w-2.5" /> {u.role ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400">
                        {u.customer_name ? u.customer_name : <span className="text-zinc-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {u.role === 'admin'
                          ? <span className="text-rose-300">Full (admin)</span>
                          : <span className="text-zinc-300">{u.permission_count} permission{u.permission_count === 1 ? '' : 's'}</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {lastSignIn}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {u.is_active
                          ? <span className="text-emerald-400">Active</span>
                          : <span className="text-zinc-500">Deactivated</span>}
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-zinc-500">No users yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 text-xs text-zinc-400 space-y-1.5">
          <p><strong className="text-rose-300">admin</strong> — master login, full access to every module. Bypasses the permission checks entirely.</p>
          <p><strong className="text-amber-300">staff</strong> — internal team members. Access governed by the permissions checked on their edit page.</p>
          <p><strong className="text-sky-300">client</strong> — external client portal users, scoped to a single customer.</p>
        </div>

      </div>
    </div>
  );
}
