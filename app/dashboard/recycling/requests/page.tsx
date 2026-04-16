import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { ClipboardList, Clock, CheckCircle2, Truck } from 'lucide-react';

export const dynamic = 'force-dynamic';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

export default async function RequestsPage() {
  const { data: requests } = await supabaseAdmin
    .from('collection_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  const list = requests ?? [];
  const pending = list.filter(r => ['pending', 'assigned', 'scheduled'].includes(r.status));
  const active = list.filter(r => ['in_transit', 'collected', 'processing'].includes(r.status));
  const completed = list.filter(r => r.status === 'completed');

  return (
    <div className="p-5 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-indigo-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Collection Requests</h1>
            <p className="mt-0.5 text-sm text-zinc-500">{list.length} total requests</p>
          </div>
        </div>
        <Link href="/d/recycling" className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
          &larr; Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`${glass} p-4`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Total</p>
          <p className="text-2xl font-black text-white mt-1">{list.length}</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{pending.length}</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center gap-1"><Truck className="h-3 w-3" /> Active</p>
          <p className="text-2xl font-black text-sky-400 mt-1">{active.length}</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Completed</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{completed.length}</p>
        </div>
      </div>

      <div className={glass}>
        {list.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No collection requests yet.</p>
            <p className="text-xs text-zinc-600 mt-1">Requests will appear here when generators submit pickup requests.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {list.map(r => (
              <div key={r.id} className="px-6 py-4 hover:bg-zinc-800/20 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-mono text-emerald-400 font-bold">{r.request_no}</span>
                    <span className="ml-2 text-sm text-white">{r.generator_name}</span>
                    {r.generator_company && <span className="text-sm text-zinc-500"> ({r.generator_company})</span>}
                  </div>
                  <div className="text-right">
                    <span className={`text-xs rounded-full px-2 py-0.5 ${
                      r.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                      r.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-sky-500/10 text-sky-400'
                    }`}>{r.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
