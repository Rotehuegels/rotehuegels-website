export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { AGENTS, parseRouting, type AgentId } from '@/lib/agents';

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL ?? 'llama3.2:3b';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

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

  // Build the full message array with system prompt
  const fullMessages: ChatMessage[] = [
    { role: 'system', content: agentConfig.systemPrompt },
    ...messages.slice(-20), // Keep last 20 messages to stay within context
  ];

  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: fullMessages,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 512,
        },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Ollama error:', res.status, errText);
      return NextResponse.json(
        { error: `LLM service unavailable. Please try again later.` },
        { status: 502 },
      );
    }

    const data = await res.json();
    const content: string = data.message?.content ?? '';

    // Check for routing instruction
    const routeTo = parseRouting(content);
    // Strip routing tag from displayed message
    const cleanContent = content.replace(/\[ROUTE:\w+\]/gi, '').trim();

    return NextResponse.json({
      content: cleanContent,
      routeTo,
      agent: agentId,
      model: MODEL,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (msg.includes('abort') || msg.includes('timeout')) {
      return NextResponse.json({ error: 'Response took too long. Please try again.' }, { status: 504 });
    }
    console.error('Chat API error:', msg);
    return NextResponse.json(
      { error: 'AI service is not running. Please ensure Ollama is started.' },
      { status: 503 },
    );
  }
}
