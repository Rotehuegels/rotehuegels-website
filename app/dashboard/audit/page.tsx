import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { History } from 'lucide-react';
import AuditFilters from './AuditFilters';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const ACTION_STYLE: Record<string, { cls: string; label: string }> = {
  create:        { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Create' },
  update:        { cls: 'bg-sky-500/10 text-sky-400 border-sky-500/20',             label: 'Update' },
  delete:        { cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20',          label: 'Delete' },
  status_change: { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20',       label: 'Status' },
  login:         { cls: 'bg-violet-500/10 text-violet-400 border-violet-500/20',     label: 'Login' },
  export:        { cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',           label: 'Export' },
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function ChangesDisplay({ changes }: { changes: Record<string, { old: unknown; new: unknown }> | null }) {
  if (!changes || Object.keys(changes).length === 0) return null;
  return (
    <div className="mt-1.5 space-y-0.5">
      {Object.entries(changes).map(([field, { old: oldVal, new: newVal }]) => (
        <div key={field} className="text-xs">
          <span className="text-zinc-600">{field}:</span>{' '}
          <span className="text-rose-400/70 line-through">{String(oldVal ?? '—')}</span>{' '}
          <span className="text-zinc-600">&rarr;</span>{' '}
          <span className="text-emerald-400">{String(newVal ?? '—')}</span>
        </div>
      ))}
    </div>
  );
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entity_type?: string; action?: string; q?: string }>;
}) {
  const sp = await searchParams;

  let query = supabaseAdmin
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (sp.entity_type) query = query.eq('entity_type', sp.entity_type);
  if (sp.action) query = query.eq('action', sp.action);
  if (sp.q) query = query.ilike('entity_label', `%${sp.q}%`);

  const { data: logs } = await query;
  const entries = logs ?? [];

  return (
    <div className="p-5 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <History className="h-5 w-5 text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Trail</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Recent activity across all modules</p>
        </div>
      </div>

      {/* Filters */}
      <AuditFilters
        currentEntityType={sp.entity_type ?? ''}
        currentAction={sp.action ?? ''}
        currentSearch={sp.q ?? ''}
      />

      {/* Activity feed */}
      <div className={glass}>
        <div className="border-b border-zinc-800 px-5 py-3">
          <h2 className="font-semibold text-white text-sm">
            Activity Log
            <span className="ml-2 text-zinc-500 font-normal">({entries.length} entries)</span>
          </h2>
        </div>

        {entries.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-zinc-500 text-sm">No audit entries found.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {entries.map((entry) => {
              const style = ACTION_STYLE[entry.action] ?? ACTION_STYLE.update;
              return (
                <div key={entry.id} className="px-5 py-3 hover:bg-zinc-800/20 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${style.cls}`}>
                          {style.label}
                        </span>
                        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400 uppercase tracking-wider">
                          {entry.entity_type}
                        </span>
                        {entry.entity_label && (
                          <span className="text-sm text-white font-medium truncate">
                            {entry.entity_label}
                          </span>
                        )}
                        {!entry.entity_label && entry.entity_id && (
                          <span className="text-xs text-zinc-600 font-mono truncate">
                            ID: {(entry.entity_id as string).substring(0, 8)}...
                          </span>
                        )}
                      </div>
                      <ChangesDisplay changes={entry.changes} />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-zinc-500">{formatTime(entry.created_at)}</p>
                      {entry.user_email && (
                        <p className="text-[10px] text-zinc-600 mt-0.5 truncate max-w-[180px]">{entry.user_email}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
