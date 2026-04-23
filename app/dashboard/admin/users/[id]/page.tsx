import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getUser, getUserPermissions, listUsers } from '@/lib/userPermissions';
import { PERMISSION_CATALOGUE } from '@/lib/userPermissions.types';
import EditUserForm from './EditUserForm';

export const dynamic = 'force-dynamic';

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [user, grantedKeys, allUsers, customers] = await Promise.all([
    getUser(id),
    getUserPermissions(id),
    listUsers(),
    supabaseAdmin.from('customers').select('id, name').order('name'),
  ]);

  if (!user) notFound();

  const copyCandidates = allUsers.filter(u => u.id !== id && u.role !== 'client');

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-[1100px] mx-auto px-6 md:px-8 py-10 space-y-6">

        <Link href="/d/admin/users" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 no-underline">
          <ArrowLeft className="h-3 w-3" /> Back to users
        </Link>

        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-rose-400 mb-2">Administration</p>
          <h1 className="text-2xl md:text-3xl font-bold">{user.display_name || 'Unnamed user'}</h1>
          <p className="text-sm text-zinc-400 mt-1">{user.email}</p>
        </div>

        <EditUserForm
          user={user}
          grantedKeys={grantedKeys}
          catalogue={PERMISSION_CATALOGUE}
          copyCandidates={copyCandidates.map(u => ({ id: u.id, label: `${u.display_name ?? 'Unnamed'} · ${u.email} · ${u.permission_count} rights` }))}
          customers={(customers.data ?? []).map(c => ({ id: c.id, name: c.name }))}
        />

      </div>
    </div>
  );
}
