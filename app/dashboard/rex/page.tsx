import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Network } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const TYPE_STYLE: Record<string, string> = {
  student: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  professional: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  academic: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  enthusiast: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default async function RexAdminPage() {
  const { data: members } = await supabaseAdmin
    .from('rex_members')
    .select('rex_id, title, full_name, email, member_type, linkedin_url, interests, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-rose-500/10 p-2.5">
          <Network className="h-5 w-5 text-rose-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">REX Members</h1>
          <p className="text-sm text-zinc-400">{members?.length ?? 0} registered</p>
        </div>
      </div>

      <div className={glass}>
        {!members || members.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-zinc-500 text-sm">No REX members yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left">
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">REX ID</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden lg:table-cell">LinkedIn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {members.map((m) => (
                  <tr key={m.rex_id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-zinc-400">{m.rex_id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{m.title} {m.full_name}</p>
                      {m.interests && (
                        <p className="text-xs text-zinc-500 mt-0.5 max-w-xs truncate">{m.interests}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 hidden md:table-cell">{m.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${TYPE_STYLE[m.member_type] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                        {m.member_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 hidden lg:table-cell">
                      {new Date(m.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {m.linkedin_url ? (
                        <a href={m.linkedin_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-rose-400 hover:text-rose-300 transition-colors underline">
                          Profile
                        </a>
                      ) : <span className="text-zinc-600">—</span>}
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
