'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, ArrowLeft, Loader2 } from 'lucide-react';
import { type AgentId } from '@/lib/agents';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  agent: AgentId;
}

const AGENT_META: Record<AgentId, { name: string; emoji: string; color: string; title: string }> = {
  welcome:  { name: 'Rotehugels Assistant', emoji: '👋', title: 'Welcome', color: '#f59e0b' },
  sales:    { name: 'Sales Assistant',      emoji: '💼', title: 'Sales',   color: '#10b981' },
  marketing:{ name: 'Marketing Assistant',  emoji: '📢', title: 'Marketing', color: '#8b5cf6' },
  supplier: { name: 'Supplier Relations',   emoji: '🏭', title: 'Supplier', color: '#f97316' },
  hr:       { name: 'HR Assistant',         emoji: '👥', title: 'Careers', color: '#06b6d4' },
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [agent, setAgent] = useState<AgentId>('welcome');
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const meta = AGENT_META[agent];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const switchAgent = useCallback((newAgent: AgentId) => {
    setAgent(newAgent);
    const newMeta = AGENT_META[newAgent];
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: `Connecting you to ${newMeta.emoji} **${newMeta.name}**...`, agent: newAgent },
    ]);
  }, []);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setError('');
    const userMsg: Message = { role: 'user', content: text, agent };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Build conversation history for the current agent
      const history = [...messages, userMsg]
        .filter(m => m.agent === agent || m.role === 'user')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, agent }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        setLoading(false);
        return;
      }

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.content, agent },
      ]);

      // Handle routing
      if (data.routeTo && data.routeTo !== agent) {
        setTimeout(() => switchAgent(data.routeTo), 800);
      }
    } catch {
      setError('Failed to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function resetChat() {
    setMessages([]);
    setAgent('welcome');
    setError('');
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-amber-600 px-5 py-3 text-white font-semibold shadow-2xl shadow-amber-600/30 hover:bg-amber-500 transition-all hover:scale-105"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm hidden sm:inline">Chat with us</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-3rem)] flex flex-col rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/50 overflow-hidden">

          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0"
            style={{ background: `${meta.color}15` }}
          >
            <div className="flex items-center gap-2.5">
              {agent !== 'welcome' && (
                <button onClick={() => switchAgent('welcome')} className="text-zinc-400 hover:text-zinc-200 transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <span className="text-lg">{meta.emoji}</span>
              <div>
                <p className="text-sm font-bold text-white">{meta.name}</p>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: meta.color }}>{meta.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={resetChat} className="text-[10px] text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded transition-colors">
                Reset
              </button>
              <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-200 p-1 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-3xl mb-3">{meta.emoji}</p>
                <p className="text-sm text-zinc-300 font-medium">Welcome to Rotehugels</p>
                <p className="text-xs text-zinc-500 mt-1">How can we help you today?</p>
              </div>
            )}

            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              const msgMeta = AGENT_META[msg.agent];
              return (
                <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-amber-600 text-white rounded-br-md'
                      : 'bg-zinc-800 text-zinc-200 rounded-bl-md'
                  }`}>
                    {!isUser && (
                      <p className="text-[10px] font-medium mb-1" style={{ color: msgMeta.color }}>
                        {msgMeta.emoji} {msgMeta.name}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 className="h-4 w-4 text-zinc-400 animate-spin" />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-xs text-red-400">
                {error}
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="px-3 py-3 border-t border-zinc-800 shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={loading}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-xl bg-amber-600 p-2.5 text-white hover:bg-amber-500 disabled:opacity-40 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[9px] text-zinc-600 mt-1.5 text-center">
              Powered by Rotehugels AI &middot; Responses may not always be accurate
            </p>
          </form>
        </div>
      )}
    </>
  );
}
