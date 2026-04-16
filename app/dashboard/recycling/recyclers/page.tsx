import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { Factory } from 'lucide-react';
import RecyclerList from './RecyclerList';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RecyclersPage() {
  const { data: recyclers } = await supabaseAdmin
    .from('ewaste_recyclers')
    .select('*')
    .order('state, company_name');

  return (
    <div className="p-5 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Factory className="h-6 w-6 text-indigo-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Registered Recyclers</h1>
            <p className="mt-0.5 text-sm text-zinc-500">{(recyclers ?? []).length} total in database</p>
          </div>
        </div>
        <Link href="/d/recycling" className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
          &larr; Dashboard
        </Link>
      </div>
      <RecyclerList recyclers={recyclers ?? []} />
    </div>
  );
}
