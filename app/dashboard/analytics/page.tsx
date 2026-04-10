import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import {
  BarChart3, Users, UserCheck, Radio, ShieldAlert, Clock,
  Building2, Globe, Monitor, ArrowRight,
} from 'lucide-react';

// ── Helpers ─────────────────────────────────────────────────────────────────
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
    <span className={`text-xs font-medium rounded-full border px-2 py-0.5 ${cls}`}>
      {s}
    </span>
  );
}

// ── Data fetchers ───────────────────────────────────────────────────────────
async function getKPIs() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

  const [todayRes, weekRes, monthRes, activeRes, monthSessions, allDurations] = await Promise.all([
    supabaseAdmin.from('chat_sessions').select('id', { count: 'exact', head: true }).gte('started_at', todayStart),
    supabaseAdmin.from('chat_sessions').select('id', { count: 'exact', head: true }).gte('started_at', weekAgo),
    supabaseAdmin.from('chat_sessions').select('id', { count: 'exact', head: true }).gte('started_at', monthAgo),
    supabaseAdmin.from('chat_sessions').select('id', { count: 'exact', head: true })
      .eq('status', 'active').gte('last_message_at', fiveMinsAgo),
    supabaseAdmin.from('chat_sessions').select('visitor_token, strike_count, session_duration_secs').gte('started_at', monthAgo),
    supabaseAdmin.from('chat_sessions').select('session_duration_secs').not('session_duration_secs', 'is', null),
  ]);

  const sessions = monthSessions.data ?? [];
  const tokenCounts: Record<string, number> = {};
  let totalStrikes = 0;
  for (const s of sessions) {
    if (s.visitor_token) {
      tokenCounts[s.visitor_token] = (tokenCounts[s.visitor_token] ?? 0) + 1;
    }
    totalStrikes += (s.strike_count ?? 0);
  }
  const uniqueVisitors = Object.keys(tokenCounts).length;
  const returnVisitors = Object.values(tokenCounts).filter(c => c >= 2).length;

  const durations = (allDurations.data ?? []).map(d => d.session_duration_secs).filter(Boolean) as number[];
  const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  return {
    today: todayRes.count ?? 0,
    week: weekRes.count ?? 0,
    month: monthRes.count ?? 0,
    active: activeRes.count ?? 0,
    uniqueVisitors,
    returnVisitors,
    totalStrikes,
    avgDuration,
  };
}

async function getTopOrgs() {
  const { data } = await supabaseAdmin
    .from('chat_sessions')
    .select('org, city, country, started_at')
    .not('org', 'is', null)
    .neq('org', '')
    .order('started_at', { ascending: false });

  const rows = data ?? [];
  const orgMap: Record<string, { sessions: number; lastSeen: string; city: string; country: string }> = {};
  for (const r of rows) {
    const key = r.org!;
    if (!orgMap[key]) {
      orgMap[key] = { sessions: 0, lastSeen: r.started_at, city: r.city ?? '—', country: r.country ?? '—' };
    }
    orgMap[key].sessions++;
  }
  return Object.entries(orgMap)
    .sort((a, b) => b[1].sessions - a[1].sessions)
    .slice(0, 15)
    .map(([org, info]) => ({ org, ...info }));
}

async function getRecentSessions() {
  const { data } = await supabaseAdmin
    .from('chat_sessions')
    .select('id, started_at, org, isp, city, country, device_type, browser, agent_id, message_count, session_duration_secs, status')
    .order('started_at', { ascending: false })
    .limit(50);
  return data ?? [];
}

async function getAgentUsage() {
  const { data } = await supabaseAdmin
    .from('chat_sessions')
    .select('agent_id');
  const counts: Record<string, number> = {};
  for (const r of (data ?? [])) {
    const agent = r.agent_id ?? 'unknown';
    counts[agent] = (counts[agent] ?? 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

async function getTopReferrers() {
  const { data } = await supabaseAdmin
    .from('chat_sessions')
    .select('referrer')
    .not('referrer', 'is', null)
    .neq('referrer', '');

  const counts: Record<string, number> = {};
  for (const r of (data ?? [])) {
    try {
      const domain = new URL(r.referrer!).hostname;
      counts[domain] = (counts[domain] ?? 0) + 1;
    } catch {
      counts[r.referrer!] = (counts[r.referrer!] ?? 0) + 1;
    }
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
}

async function getSecurityLog() {
  const { data } = await supabaseAdmin
    .from('chat_sessions')
    .select('id, started_at, ip_address, org, city, strike_count, status, violations')
    .gt('strike_count', 0)
    .order('started_at', { ascending: false })
    .limit(30);
  return data ?? [];
}

// ── Page ────────────────────────────────────────────────────────────────────
export default async function ChatAnalyticsPage() {
  const [kpis, topOrgs, recent, agentUsage, referrers, securityLog] = await Promise.all([
    getKPIs(),
    getTopOrgs(),
    getRecentSessions(),
    getAgentUsage(),
    getTopReferrers(),
    getSecurityLog(),
  ]);

  const agentMax = agentUsage.length > 0 ? agentUsage[0][1] : 1;
  const agentColors: Record<string, string> = {
    welcome: 'bg-sky-500', sales: 'bg-emerald-500', marketing: 'bg-violet-500',
    supplier: 'bg-amber-500', hr: 'bg-rose-500', unknown: 'bg-zinc-500',
  };

  const kpiCards = [
    { label: 'Sessions Today', value: kpis.today, icon: BarChart3, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Sessions (7d)', value: kpis.week, icon: BarChart3, color: 'text-sky-400', bg: 'bg-sky-500/10' },
    { label: 'Sessions (30d)', value: kpis.month, icon: BarChart3, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Unique Visitors (30d)', value: kpis.uniqueVisitors, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Return Visitors', value: kpis.returnVisitors, icon: UserCheck, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Active Now', value: kpis.active, icon: Radio, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Violations (30d)', value: kpis.totalStrikes, icon: ShieldAlert, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { label: 'Avg Duration', value: fmtDuration(kpis.avgDuration), icon: Clock, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Chat Analytics</h1>
        <p className="mt-1 text-sm text-zinc-400">Visitor chat sessions &amp; lead intelligence</p>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${glass} p-5 flex items-center justify-between`}>
            <div>
              <p className="text-xs text-zinc-500">{label}</p>
              <p className={`text-2xl font-black mt-1 ${color}`}>{value}</p>
            </div>
            <div className={`${bg} rounded-xl p-2.5`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Top Organizations ──────────────────────────────────── */}
      <div className={`${glass} p-6`}>
        <div className="flex items-center gap-2 mb-5">
          <Building2 className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-zinc-300">Top Organizations (Lead Intelligence)</h2>
        </div>
        {topOrgs.length === 0 ? (
          <p className="text-sm text-zinc-600">No organization data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
                  <th className="text-left py-2 pr-4">Organization</th>
                  <th className="text-right py-2 px-4">Sessions</th>
                  <th className="text-left py-2 px-4">Last Seen</th>
                  <th className="text-left py-2 pl-4">City / Country</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {topOrgs.map((o) => (
                  <tr key={o.org} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-2.5 pr-4 text-zinc-200 font-medium">{o.org}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-amber-400">{o.sessions}</td>
                    <td className="py-2.5 px-4 text-zinc-400">{fmtDate(o.lastSeen)}</td>
                    <td className="py-2.5 pl-4 text-zinc-400">{o.city} / {o.country}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Recent Sessions ────────────────────────────────────── */}
      <div className={`${glass} p-6`}>
        <div className="flex items-center gap-2 mb-5">
          <Monitor className="h-4 w-4 text-sky-400" />
          <h2 className="text-sm font-semibold text-zinc-300">Recent Sessions</h2>
          <span className="text-xs text-zinc-600 ml-1">(last 50)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
                <th className="text-left py-2 pr-3">Time</th>
                <th className="text-left py-2 px-3">Org / ISP</th>
                <th className="text-left py-2 px-3">City</th>
                <th className="text-left py-2 px-3">Country</th>
                <th className="text-left py-2 px-3">Device</th>
                <th className="text-left py-2 px-3">Browser</th>
                <th className="text-left py-2 px-3">Agent</th>
                <th className="text-right py-2 px-3">Msgs</th>
                <th className="text-right py-2 px-3">Duration</th>
                <th className="text-left py-2 pl-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {recent.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-2.5 pr-3 text-zinc-400 whitespace-nowrap">
                    <Link href={`/dashboard/analytics/${s.id}`} className="hover:text-white transition-colors">
                      {fmtDate(s.started_at)}
                    </Link>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-200 max-w-[200px] truncate">{s.org || s.isp || '—'}</td>
                  <td className="py-2.5 px-3 text-zinc-400">{s.city ?? '—'}</td>
                  <td className="py-2.5 px-3 text-zinc-400">{s.country ?? '—'}</td>
                  <td className="py-2.5 px-3 text-zinc-400 capitalize">{s.device_type ?? '—'}</td>
                  <td className="py-2.5 px-3 text-zinc-400">{s.browser ?? '—'}</td>
                  <td className="py-2.5 px-3 text-zinc-400">{s.agent_id ?? '—'}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-sky-400">{s.message_count ?? 0}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-zinc-400">{fmtDuration(s.session_duration_secs)}</td>
                  <td className="py-2.5 pl-3">{statusBadge(s.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Agent Usage & Referrers side by side ───────────────── */}
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Agent Usage */}
        <div className={`${glass} p-6`}>
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">Agent Usage</h2>
          {agentUsage.length === 0 ? (
            <p className="text-sm text-zinc-600">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {agentUsage.map(([agent, count]) => (
                <div key={agent}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-zinc-300 capitalize">{agent}</span>
                    <span className="text-sm font-mono text-zinc-400">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${agentColors[agent] ?? 'bg-zinc-500'}`}
                      style={{ width: `${(count / agentMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Referrers */}
        <div className={`${glass} p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-zinc-300">Top Referrers</h2>
          </div>
          {referrers.length === 0 ? (
            <p className="text-sm text-zinc-600">No referrer data yet.</p>
          ) : (
            <div className="space-y-2">
              {referrers.map(([domain, count]) => (
                <div key={domain} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-zinc-400 font-mono truncate">{domain}</span>
                  <span className="text-sm font-semibold text-emerald-400 shrink-0">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Security Log ───────────────────────────────────────── */}
      <div className={`${glass} p-6`}>
        <div className="flex items-center gap-2 mb-5">
          <ShieldAlert className="h-4 w-4 text-rose-400" />
          <h2 className="text-sm font-semibold text-zinc-300">Security Log</h2>
        </div>
        {securityLog.length === 0 ? (
          <p className="text-sm text-zinc-600">No violations recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
                  <th className="text-left py-2 pr-3">Time</th>
                  <th className="text-left py-2 px-3">IP</th>
                  <th className="text-left py-2 px-3">Org</th>
                  <th className="text-left py-2 px-3">City</th>
                  <th className="text-right py-2 px-3">Strikes</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="text-left py-2 pl-3">Violations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {securityLog.map((s) => {
                  const violations = Array.isArray(s.violations) ? s.violations : [];
                  const summary = violations.map((v: { type?: string; reason?: string }) => v.type || v.reason || 'violation').join(', ');
                  return (
                    <tr key={s.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-2.5 pr-3 text-zinc-400 whitespace-nowrap">
                        <Link href={`/dashboard/analytics/${s.id}`} className="hover:text-white transition-colors">
                          {fmtDate(s.started_at)}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400 font-mono">{s.ip_address ?? '—'}</td>
                      <td className="py-2.5 px-3 text-zinc-200">{s.org ?? '—'}</td>
                      <td className="py-2.5 px-3 text-zinc-400">{s.city ?? '—'}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-400">{s.strike_count}</td>
                      <td className="py-2.5 px-3">{statusBadge(s.status)}</td>
                      <td className="py-2.5 pl-3 text-zinc-500 max-w-[300px] truncate">{summary || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
