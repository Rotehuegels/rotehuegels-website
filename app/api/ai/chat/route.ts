export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { AGENTS, parseRouting, type AgentId } from '@/lib/agents';

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL ?? 'llama3.2:3b';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// ── Ollama backend ─────────────────────────────────────────────────────────
async function callOllama(messages: ChatMessage[]): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: false,
      options: { temperature: 0.7, top_p: 0.9, num_predict: 512 },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) throw new Error(`Ollama ${res.status}`);
  const data = await res.json();
  return data.message?.content ?? '';
}

// ── Claude fallback ────────────────────────────────────────────────────────
async function callClaude(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content })),
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const block = data.content?.[0];
  return block?.text ?? '';
}

// ── Main handler ───────────────────────────────────────────────────────────
export async function POST(req: Request) {
  let body: { messages: ChatMessage[]; agent: AgentId };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { messages, agent: agentId } = body;
  if (!messages?.length || !agentId) {
    return NextResponse.json({ error: 'messages and agent are required.' }, { status: 400 });
  }

  const agentConfig = AGENTS[agentId];
  if (!agentConfig) {
    return NextResponse.json({ error: 'Unknown agent.' }, { status: 400 });
  }

  const systemPrompt = agentConfig.systemPrompt;
  const fullMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages.slice(-20),
  ];

  let content = '';
  let backend = 'ollama';

  // Try Ollama first, fall back to Claude
  try {
    content = await callOllama(fullMessages);
  } catch (ollamaErr) {
    console.warn('Ollama unavailable, falling back to Claude:', (ollamaErr as Error).message);
    backend = 'claude';
    try {
      content = await callClaude(systemPrompt, messages.slice(-20));
    } catch (claudeErr) {
      console.error('Claude fallback also failed:', (claudeErr as Error).message);
      return NextResponse.json(
        { error: 'AI service temporarily unavailable. Please try again later.' },
        { status: 503 },
      );
    }
  }

  const routeTo = parseRouting(content);
  const cleanContent = content.replace(/\[ROUTE:\w+\]/gi, '').trim();

  return NextResponse.json({
    content: cleanContent,
    routeTo,
    agent: agentId,
    backend,
  });
}
