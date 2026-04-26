import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, ClipboardList } from 'lucide-react';

export const dynamic = 'force-dynamic';

const STATUS_COLOR: Record<string, string> = {
  draft:     'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  submitted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  approved:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected:  'bg-red-500/10 text-red-400 border-red-500/20',
  converted: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  cancelled: 'bg-zinc-700/30 text-zinc-500 border-zinc-700/50',
};

const PRIORITY_COLOR: Record<string, string> = {
  low:    'text-zinc-500',
  normal: 'text-zinc-300',
  high:   'text-amber-400',
  urgent: 'text-rose-400',
};

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default async function IndentsPage({
  searchParams,
}: { searchParams: Promise<{ status?: string }> }) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/d/indents');

  const sp = await searchParams;
  const statusFilter = sp.status ?? 'all';

  let q = supabaseAdmin
    .from('indents')
    .select('id, indent_no, requested_by_email, department, required_by, priority, status, source, converted_to_po_id, created_at')
    .order('created_at', { ascending: false });
  if (statusFilter !== 'all') q = q.eq('status', statusFilter);

  const { data: indents } = await q;

  const counts: Record<string, number> = { all: 0, draft: 0, submitted: 0, approved: 0, rejected: 0, converted: 0, cancelled: 0 };
  const { data: countAll } = await supabaseAdmin.from('indents').select('status');
  for (const r of countAll ?? []) {
    counts.all++;
    counts[r.status as string] = (counts[r.status as string] ?? 0) + 1;
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-rose-400" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Indents</h1>
            <p className="text-xs text-zinc-500">Purchase requisitions — request → approve → convert to PO</p>
          </div>
        </div>
        <Link
          href="/d/indents/new"
          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition-colors"
        >
          <Plus className="h-4 w-4" /> New Indent
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'draft', 'submitted', 'approved', 'rejected', 'converted', 'cancelled'] as const).map((s) => (
          <Link
            key={s}
            href={s === 'all' ? '/d/indents' : `/d/indents?status=${s}`}
            className={[
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs capitalize transition-colors',
              statusFilter === s
                ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-white',
            ].join(' ')}
          >
            {s} <span className="text-[10px] opacity-60">({counts[s] ?? 0})</span>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/60">
              <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Indent No</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Requested by</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Department</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Required by</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Priority</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Source</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Created</th>
            </tr>
          </thead>
          <tbody>
            {(indents ?? []).map((i) => (
              <tr key={i.id} className="border-b border-zinc-800/60 hover:bg-zinc-900/40">
                <td className="px-5 py-3 font-mono text-xs">
                  <Link href={`/d/indents/${i.id}`} className="text-rose-400 hover:text-rose-300">{i.indent_no}</Link>
                </td>
                <td className="px-5 py-3 text-zinc-300">{i.requested_by_email ?? '—'}</td>
                <td className="px-5 py-3 text-zinc-400">{i.department ?? '—'}</td>
                <td className="px-5 py-3 text-zinc-400">{fmtDate(i.required_by)}</td>
                <td className={`px-5 py-3 text-xs font-medium capitalize ${PRIORITY_COLOR[i.priority] ?? 'text-zinc-400'}`}>{i.priority}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_COLOR[i.status] ?? STATUS_COLOR.draft}`}>
                    {i.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-zinc-500">{i.source === 'auto_low_stock' ? 'auto' : 'manual'}</td>
                <td className="px-5 py-3 text-xs text-zinc-500">{fmtDate(i.created_at)}</td>
              </tr>
            ))}
            {!indents?.length && (
              <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-zinc-500">No indents{statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''} yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
