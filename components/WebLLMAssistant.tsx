'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import type { AgentId } from '@/lib/agents';

type Msg = { role: 'user' | 'assistant'; content: string; agent: AgentId };

const AGENT_META: Record<AgentId, { name: string; emoji: string; color: string }> = {
  welcome:   { name: 'Rotehügels Assistant', emoji: '👋', color: '#f59e0b' },
  sales:     { name: 'Sales',               emoji: '💼', color: '#10b981' },
  marketing: { name: 'Marketing',           emoji: '📢', color: '#8b5cf6' },
  supplier:  { name: 'Supplier Relations',   emoji: '🏭', color: '#f97316' },
  hr:        { name: 'Careers',             emoji: '👥', color: '#06b6d4' },
};

export default function WebLLMAssistant() {
  const [history, setHistory] = useState<Msg[]>([
    { role: 'assistant', content: "Hi! I'm Rotehügels Assist. I can help with sales inquiries, supplier registration, careers, or general questions. How can I help you today?", agent: 'welcome' },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [agent, setAgent] = useState<AgentId>('welcome');
  const [showSummary, setShowSummary] = useState(false);
  const [summaryForm, setSummaryForm] = useState({ name: '', email: '', phone: '' });
  const [summarySent, setSummarySent] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [sendingMail, setSendingMail] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, showSummary]);

  const switchAgent = useCallback((newAgent: AgentId) => {
    const meta = AGENT_META[newAgent];
    setAgent(newAgent);
    setHistory(prev => [
      ...prev,
      { role: 'assistant', content: `Connecting you to ${meta.emoji} ${meta.name}... How can I help?`, agent: newAgent },
    ]);
  }, []);

  const send = async () => {
    const question = input.trim();
    if (!question || busy) return;

    const userMsg: Msg = { role: 'user', content: question, agent };
    setHistory(h => [...h, userMsg]);
    setInput('');
    setBusy(true);

    try {
      const apiMessages = [...history, userMsg]
        .filter(m => m.agent === agent || m.role === 'user')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, agent }),
      });

      const data = await res.json();

      if (!res.ok) {
        setHistory(h => [...h, { role: 'assistant', content: data.error ?? 'Something went wrong. Please try again or email us at sales@rotehuegels.com.', agent }]);
      } else {
        setHistory(h => [...h, { role: 'assistant', content: data.content, agent }]);

        // Handle agent routing
        if (data.routeTo && data.routeTo !== agent) {
          setTimeout(() => switchAgent(data.routeTo), 600);
        }
      }
    } catch {
      setHistory(h => [...h, { role: 'assistant', content: 'Connection error. Please try again or email us at sales@rotehuegels.com.', agent }]);
    } finally {
      setBusy(false);
    }
  };

  const sendSummary = async () => {
    setSummaryError('');
    setSendingMail(true);

    try {
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent,
          messages: history.map(m => ({ role: m.role, content: m.content })),
          visitorName: summaryForm.name || undefined,
          visitorEmail: summaryForm.email || undefined,
          visitorPhone: summaryForm.phone || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSummarySent(true);
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : 'Failed to send.');
    } finally {
      setSendingMail(false);
    }
  };

  const userMsgCount = history.filter(m => m.role === 'user').length;
  const meta = AGENT_META[agent];

  return (
    <div className="flex flex-col gap-3">
      {/* Agent indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {agent !== 'welcome' && (
            <button onClick={() => switchAgent('welcome')} className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
          )}
          <span className="text-xs font-medium" style={{ color: meta.color }}>
            {meta.emoji} {meta.name}
          </span>
        </div>
        {userMsgCount >= 2 && !showSummary && !summarySent && (
          <button
            onClick={() => setShowSummary(true)}
            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-amber-400 transition-colors"
          >
            <Mail className="h-3 w-3" /> Send to team
          </button>
        )}
      </div>

      {/* Chat history */}
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1 text-sm">
        {history.map((m, i) => {
          const isUser = m.role === 'user';
          const msgMeta = AGENT_META[m.agent];
          return (
            <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed ${
                isUser
                  ? 'bg-rose-600 text-white rounded-br-sm'
                  : 'bg-zinc-800 text-zinc-100 rounded-bl-sm'
              }`}>
                {!isUser && m.agent !== history[i - 1]?.agent && (
                  <p className="text-[10px] font-medium mb-1" style={{ color: msgMeta.color }}>
                    {msgMeta.emoji} {msgMeta.name}
                  </p>
                )}
                <span className="whitespace-pre-wrap">{m.content}</span>
              </div>
            </div>
          );
        })}

        {busy && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3">
              <Loader2 className="h-4 w-4 text-zinc-400 animate-spin" />
            </div>
          </div>
        )}

        {/* Email summary form */}
        {showSummary && !summarySent && (
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/80 p-3 space-y-2.5">
            <p className="text-xs font-medium text-zinc-300">
              Send this conversation to our {meta.name} team?
            </p>
            <p className="text-[10px] text-zinc-500">
              Leave your details so we can follow up (optional).
            </p>
            <input
              type="text" placeholder="Your name"
              value={summaryForm.name} onChange={e => setSummaryForm(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
            />
            <input
              type="email" placeholder="Email"
              value={summaryForm.email} onChange={e => setSummaryForm(f => ({ ...f, email: e.target.value }))}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
            />
            <input
              type="tel" placeholder="Phone"
              value={summaryForm.phone} onChange={e => setSummaryForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
            />
            {summaryError && <p className="text-[10px] text-red-400">{summaryError}</p>}
            <div className="flex gap-2">
              <button
                onClick={sendSummary} disabled={sendingMail}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 transition-colors"
              >
                {sendingMail ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
                {sendingMail ? 'Sending...' : 'Send to team'}
              </button>
              <button
                onClick={() => setShowSummary(false)}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Success state */}
        {summarySent && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-medium text-emerald-400">Sent to our team!</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">We&apos;ll follow up shortly.</p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-xl bg-zinc-800/80 border border-zinc-700 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Type your message..."
          disabled={busy}
        />
        <button
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-40 transition-colors flex items-center gap-1.5 text-sm font-medium"
          onClick={send}
          disabled={busy || !input.trim()}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[9px] text-zinc-600 text-center">
        Powered by Rotehügels AI &middot; Responses may not always be accurate
      </p>
    </div>
  );
}
