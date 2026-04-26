import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { getUserRole } from '@/lib/portalAuth';
import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import ApprovalRow from './ApprovalRow';

export const dynamic = 'force-dynamic';

type ChainStep = {
  level: number;
  approver_email: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  acted_by_email?: string;
  acted_at?: string;
  notes?: string;
};

type Approval = {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_label: string | null;
  requested_by_email: string | null;
  status: string;
  current_level: number;
  total_levels: number;
  approval_chain: ChainStep[];
  amount: number | null;
  created_at: string;
  completed_at: string | null;
};

export default async function ApprovalsPage({
  searchParams,
}: { searchParams: Promise<{ tab?: string }> }) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/d/approvals');
  const me = (user.email ?? '').toLowerCase();
  const role = await getUserRole();
  const isAdmin = role === 'admin';

  const sp = await searchParams;
  const tab = sp.tab ?? 'mine';

  const { data: rows } = await supabaseAdmin
    .from('approvals')
    .select('id, entity_type, entity_id, entity_label, requested_by_email, status, current_level, total_levels, approval_chain, amount, created_at, completed_at')
    .order('created_at', { ascending: false })
    .limit(200);

  const all = (rows ?? []) as Approval[];

  const isWaitingOnMe = (a: Approval) => {
    if (a.status !== 'pending') return false;
    const step = a.approval_chain.find((s) => s.level === a.current_level);
    return step?.approver_email?.toLowerCase() === me;
  };

  const isMyRequest = (a: Approval) => (a.requested_by_email ?? '').toLowerCase() === me;

  const list = (() => {
    if (tab === 'mine')      return all.filter(isWaitingOnMe);
    if (tab === 'requested') return all.filter(isMyRequest);
    return all;
  })();

  const counts = {
    mine:      all.filter(isWaitingOnMe).length,
    requested: all.filter(isMyRequest).length,
    all:       all.length,
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-rose-400" />
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Approvals</h1>
          <p className="text-xs text-zinc-500">Pending decisions across all modules — POs above threshold, expense reimbursements, anything that asked for sign-off.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['mine', 'requested', 'all'] as const).map((t) => (
          <a key={t} href={`/d/approvals?tab=${t}`}
            className={[
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs capitalize transition-colors',
              tab === t
                ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-white',
            ].join(' ')}>
            {t === 'mine' ? 'Waiting on me' : t === 'requested' ? 'Requested by me' : 'All'}
            <span className="text-[10px] opacity-60">({counts[t]})</span>
          </a>
        ))}
      </div>

      <div className="space-y-2">
        {list.length === 0 && (
          <p className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-5 py-8 text-center text-sm text-zinc-500">
            {tab === 'mine'
              ? 'Nothing waiting on you. Inbox zero.'
              : tab === 'requested'
              ? 'You have not requested any approvals yet.'
              : 'No approvals on record.'}
          </p>
        )}
        {list.map((a) => (
          <ApprovalRow
            key={a.id}
            approval={a}
            canAct={isWaitingOnMe(a)}
            isMine={isMyRequest(a)}
            canCancel={isMyRequest(a) || isAdmin}
          />
        ))}
      </div>
    </div>
  );
}
