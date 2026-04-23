import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { listUsers } from '@/lib/userPermissions';
import { PERMISSION_CATALOGUE } from '@/lib/userPermissions.types';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import NewUserForm from './NewUserForm';

export const dynamic = 'force-dynamic';

export default async function NewUserPage() {
  const [users, customers] = await Promise.all([
    listUsers(),
    supabaseAdmin.from('customers').select('id, name').order('name'),
  ]);

  // Only offer staff/admin users as rights-copy sources — clients have none.
  const copyCandidates = users.filter(u => u.role !== 'client');

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-[900px] mx-auto px-6 md:px-8 py-10 space-y-6">

        <Link href="/d/admin/users" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 no-underline">
          <ArrowLeft className="h-3 w-3" /> Back to users
        </Link>

        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-rose-400 mb-2">Administration</p>
          <h1 className="text-2xl md:text-3xl font-bold">Add new user</h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Creates a Supabase auth account, the user_profiles row, and (optionally) copies the rights
            of an existing team member into the new user so they can hit the ground running.
          </p>
        </div>

        <NewUserForm
          copyCandidates={copyCandidates.map(u => ({ id: u.id, label: `${u.display_name ?? 'Unnamed'} · ${u.email} · ${u.permission_count} rights` }))}
          customers={(customers.data ?? []).map(c => ({ id: c.id, name: c.name }))}
          catalogue={PERMISSION_CATALOGUE}
        />

      </div>
    </div>
  );
}
