import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Globe, Monitor, Smartphone, MapPin, Clock,
  ShieldAlert, MessageSquare, User, Bot,
} from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtDuration(secs: number | null) {
  if (!secs) return '—';
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function statusBadge(status: string | null) {
  const s = status ?? 'unknown';
  const map: Record<string, string> = {
    active:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    completed: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    warned:    'bg-amber-500/10 text-amber-400 border-amber-500/30',
    blocked:   'bg-rose-500/10 text-rose-400 border-rose-500/30',
  };
  const cls = map[s] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700';
  return (
    <span className={`text-xs font-medium rounded-full border px-2.5 py-1 ${cls}`}>
      {s}
    </span>
  );
}

function MetaRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-zinc-800/60">
      <span className="text-xs text-zinc-500 shrink-0 w-36">{label}</span>
      <span className="text-sm text-zinc-300 text-right break-all">{value || '—'}</span>
    </div>
  );
}

type Message = {
  role: string;
  content: string;
  agent?: string;
  timestamp?: string;
};

type Violation = {
  type?: string;
  reason?: string;
  message?: string;
  timestamp?: string;
};

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: session } = await supabaseAdmin
    .from('chat_sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (!session) notFound();

  const messages: Message[] = Array.isArray(session.messages) ? session.messages : [];
  const violations: Violation[] = Array.isArray(session.violations) ? session.violations : [];
  const pagesVisited: string[] = Array.isArray(session.pages_visited) ? session.pages_visited : [];

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/analytics"
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="flex-1" />
        {statusBadge(session.status)}
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">Session Detail</h1>
        <p className="mt-1 text-sm text-zinc-500 font-mono">{session.id}</p>
      </div>

      {/* ── Metadata Grid ──────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Visitor Info */}
        <div className={`${glass} p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-zinc-300">Visitor Information</h2>
          </div>
          <MetaRow label="IP Address" value={session.ip_address} />
          <MetaRow label="Organization" value={session.org} />
          <MetaRow label="ISP" value={session.isp} />
          <MetaRow label="City" value={session.city} />
          <MetaRow label="Region" value={session.region} />
          <MetaRow label="Country" value={session.country} />
          <MetaRow label="Timezone" value={session.timezone} />
          <MetaRow label="Visitor Token" value={session.visitor_token} />
        </div>

        {/* Device Info */}
        <div className={`${glass} p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-zinc-300">Device &amp; Browser</h2>
          </div>
          <MetaRow label="User Agent" value={session.user_agent} />
          <MetaRow label="Device Type" value={session.device_type} />
          <MetaRow label="Browser" value={session.browser} />
          <MetaRow label="OS" value={session.os} />
          <MetaRow label="Screen Resolution" value={session.screen_resolution} />
          <MetaRow label="Language" value={session.browser_language} />
          <MetaRow label="Connection" value={session.connection_type} />
        </div>

        {/* Session Info */}
        <div className={`${glass} p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-zinc-300">Session Timeline</h2>
          </div>
          <MetaRow label="Started At" value={fmtDate(session.started_at)} />
          <MetaRow label="Last Message" value={fmtDate(session.last_message_at)} />
          <MetaRow label="Ended At" value={fmtDate(session.ended_at)} />
          <MetaRow label="Duration" value={fmtDuration(session.session_duration_secs)} />
          <MetaRow label="Messages" value={String(session.message_count ?? 0)} />
          <MetaRow label="Agent" value={session.agent_id} />
          <MetaRow label="Strikes" value={String(session.strike_count ?? 0)} />
          <MetaRow label="Summary Sent" value={session.summary_sent ? `Yes (${session.summary_sent_to})` : 'No'} />
        </div>

        {/* Referrer & Pages */}
        <div className={`${glass} p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-4 w-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-zinc-300">Referrer &amp; Navigation</h2>
          </div>
          <MetaRow label="Referrer" value={session.referrer} />
          <MetaRow label="Landing Page" value={session.landing_page} />
          <div className="mt-3">
            <p className="text-xs text-zinc-500 mb-2">Pages Visited</p>
            {pagesVisited.length === 0 ? (
              <p className="text-xs text-zinc-700">None recorded.</p>
            ) : (
              <div className="space-y-1">
                {pagesVisited.map((page, i) => (
                  <p key={i} className="text-xs text-zinc-400 font-mono">{typeof page === 'string' ? page : JSON.stringify(page)}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Violations ─────────────────────────────────────────── */}
      {violations.length > 0 && (
        <div className={`${glass} p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            <h2 className="text-sm font-semibold text-zinc-300">Violations</h2>
          </div>
          <div className="space-y-2">
            {violations.map((v, i) => (
              <div key={i} className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-rose-400">{v.type || v.reason || 'Violation'}</span>
                  {v.timestamp && (
                    <span className="text-xs text-zinc-500">{fmtDate(v.timestamp)}</span>
                  )}
                </div>
                {v.message && <p className="text-xs text-zinc-400 mt-1">{v.message}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Conversation Transcript ────────────────────────────── */}
      <div className={`${glass} p-6`}>
        <div className="flex items-center gap-2 mb-5">
          <MessageSquare className="h-4 w-4 text-sky-400" />
          <h2 className="text-sm font-semibold text-zinc-300">Conversation Transcript</h2>
          <span className="text-xs text-zinc-600 ml-1">({messages.length} messages)</span>
        </div>
        {messages.length === 0 ? (
          <p className="text-sm text-zinc-600">No messages recorded.</p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={i}
                  className={`rounded-xl p-4 ${
                    isUser
                      ? 'bg-zinc-800/60 border border-zinc-700/50 ml-8'
                      : 'bg-sky-500/5 border border-sky-500/10 mr-8'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {isUser ? (
                      <User className="h-3.5 w-3.5 text-zinc-400" />
                    ) : (
                      <Bot className="h-3.5 w-3.5 text-sky-400" />
                    )}
                    <span className={`text-xs font-semibold ${isUser ? 'text-zinc-400' : 'text-sky-400'}`}>
                      {isUser ? 'Visitor' : (msg.agent || 'Assistant')}
                    </span>
                    {msg.timestamp && (
                      <span className="text-xs text-zinc-600">{fmtDate(msg.timestamp)}</span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{msg.content}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
