export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { AGENTS, parseRouting, type AgentId } from '@/lib/agents';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { checkMessage, getStrikeResponse, checkRateLimit, type ViolationType } from '@/lib/moderation';

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3.2:3b';
const GROQ_MODEL = process.env.GROQ_MODEL ?? 'llama-3.1-8b-instant';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// ── 1. Ollama (local, free) ───────────────────────────────────────────────
async function callOllama(messages: ChatMessage[]): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
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

// ── 2. Groq (cloud, free tier) ────────────────────────────────────────────
async function callGroq(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 512,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ── 3. Claude Haiku (paid fallback) ───────────────────────────────────────
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
    throw new Error(`Claude ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

// ── Helper: update session in background ──────────────────────────────────

async function updateSession(
  sessionToken: string,
  updates: Record<string, unknown>,
) {
  try {
    await supabaseAdmin
      .from('chat_sessions')
      .update({ ...updates, last_message_at: new Date().toISOString() })
      .eq('session_token', sessionToken);
  } catch (err) {
    console.error('Failed to update chat session:', err);
  }
}

// ── Helper: send security alert (fire-and-forget) ────────────────────────

async function sendSecurityAlert(session: Record<string, unknown>, violations: unknown[], messages: unknown[], violationType: string) {
  try {
    // Use internal fetch to the security-alert API route
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const url = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
    await fetch(`${url}/api/ai/security-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.id,
        sessionToken: session.session_token,
        ipAddress: session.ip_address,
        city: session.city,
        country: session.country,
        userAgent: session.user_agent,
        violations,
        messages,
        violationType,
      }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    console.error('[security-alert] Failed to send:', err);
  }
}

// ── Main handler: Ollama → Groq → Claude ──────────────────────────────────
export async function POST(req: Request) {
  let body: { messages: ChatMessage[]; agent: AgentId; sessionToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { messages, agent: agentId, sessionToken } = body;
  if (!messages?.length || !agentId) {
    return NextResponse.json({ error: 'messages and agent are required.' }, { status: 400 });
  }

  const agentConfig = AGENTS[agentId];
  if (!agentConfig) {
    return NextResponse.json({ error: 'Unknown agent.' }, { status: 400 });
  }

  // ── Fetch session (if token provided) ─────────────────────────────────
  let session: Record<string, unknown> | null = null;
  if (sessionToken) {
    const { data } = await supabaseAdmin
      .from('chat_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .single();
    session = data;
  }

  // ── Check if session is blocked ───────────────────────────────────────
  if (session?.status === 'blocked') {
    return NextResponse.json({
      content: getStrikeResponse(3, 'abusive'),
      routeTo: null,
      agent: agentId,
      backend: 'moderation',
      blocked: true,
    });
  }

  // ── Moderation: pre-check user message ────────────────────────────────
  const lastUserMessage = messages[messages.length - 1];
  if (lastUserMessage?.role === 'user') {
    const moderationResult = checkMessage(lastUserMessage.content);

    if (moderationResult.flagged && moderationResult.type) {
      const currentStrikes = ((session?.strike_count as number) || 0) + 1;
      const violationType = moderationResult.type as ViolationType;
      const now = new Date().toISOString();

      const violation = {
        type: violationType,
        message: lastUserMessage.content.slice(0, 200),
        timestamp: now,
      };

      const newStatus = currentStrikes >= 3 ? 'blocked' : currentStrikes >= 2 ? 'warned' : 'active';

      // Update session with strike
      if (session && sessionToken) {
        const existingViolations = Array.isArray(session.violations) ? session.violations : [];
        const existingMessages = Array.isArray(session.messages) ? session.messages : [];
        const updatedMessages = [
          ...existingMessages,
          { role: 'user', content: lastUserMessage.content, agent: agentId, timestamp: now },
        ];

        await updateSession(sessionToken, {
          strike_count: currentStrikes,
          violations: [...existingViolations, violation],
          messages: updatedMessages,
          message_count: (session.message_count as number || 0) + 1,
          status: newStatus,
          ...(newStatus === 'blocked' ? { ended_at: now } : {}),
        });

        // Send security alert on strike 3
        if (currentStrikes >= 3) {
          sendSecurityAlert(
            session,
            [...existingViolations, violation],
            updatedMessages,
            violationType,
          );
        }
      }

      const strikeResponse = getStrikeResponse(currentStrikes, violationType);
      return NextResponse.json({
        content: strikeResponse,
        routeTo: null,
        agent: agentId,
        backend: 'moderation',
        blocked: currentStrikes >= 3,
        strike: currentStrikes,
      });
    }

    // ── Rate limiting ──────────────────────────────────────────────────
    if (session) {
      const existingMessages = Array.isArray(session.messages) ? session.messages : [];
      const userTimestamps = existingMessages
        .filter((m: Record<string, unknown>) => m.role === 'user' && m.timestamp)
        .map((m: Record<string, unknown>) => new Date(m.timestamp as string).getTime());
      userTimestamps.push(Date.now());

      if (!checkRateLimit(userTimestamps)) {
        return NextResponse.json({
          content: "You're sending messages too quickly. Please wait a moment before trying again.",
          routeTo: null,
          agent: agentId,
          backend: 'rate_limit',
        });
      }
    }
  }

  // ── Call LLM (Ollama → Groq → Claude fallback chain) ──────────────────
  const systemPrompt = agentConfig.systemPrompt;
  const fullMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages.slice(-20),
  ];

  let content = '';
  let backend = 'ollama';

  // 1. Try Ollama (local)
  try {
    content = await callOllama(fullMessages);
  } catch (e1) {
    console.warn('Ollama unavailable:', (e1 as Error).message);

    // 2. Try Groq (free cloud)
    backend = 'groq';
    try {
      content = await callGroq(fullMessages);
    } catch (e2) {
      console.warn('Groq unavailable:', (e2 as Error).message);

      // 3. Try Claude (paid fallback)
      backend = 'claude';
      try {
        content = await callClaude(systemPrompt, messages.slice(-20));
      } catch (e3) {
        console.error('All backends failed:', (e3 as Error).message);
        return NextResponse.json(
          { error: 'AI service temporarily unavailable. Please try again later.' },
          { status: 503 },
        );
      }
    }
  }

  const routeTo = parseRouting(content);
  const cleanContent = content
    .replace(/\[ROUTE:\w+\]/gi, '')
    .replace(/\[FLAG:.*?\]/gi, '')
    .replace(/\[LEAD:.*?\]/gi, '')
    .trim();

  // ── Parse and save lead info ──────────────────────────────────────────
  const leadMatch = content.match(/\[LEAD:(.*?)\]/i);
  if (leadMatch) {
    const leadData: Record<string, string> = {};
    leadMatch[1].split('|').forEach(pair => {
      const [key, val] = pair.split('=');
      if (key && val) leadData[key.trim()] = val.trim();
    });

    if (leadData.name || leadData.email) {
      const isSupplier = routeTo === 'supplier';
      try {
        if (isSupplier) {
          // Save to supplier_registrations
          await supabaseAdmin.from('supplier_registrations').insert({
            company_name: leadData.name || 'Unknown',
            contact_person: leadData.name || '',
            email: leadData.email || '',
            phone: leadData.phone || null,
            categories: ['Chat inquiry'],
            status: 'pending',
          });
        } else {
          // Save to sales_leads (customer lead)
          const year = new Date().getFullYear();
          const { count } = await supabaseAdmin
            .from('sales_leads')
            .select('id', { count: 'exact', head: true });
          const leadCode = `LEAD-${year}-${String((count ?? 0) + 1).padStart(3, '0')}`;

          await supabaseAdmin.from('sales_leads').insert({
            lead_code: leadCode,
            company_name: leadData.company || leadData.name || 'Chat visitor',
            contact_person: leadData.name || null,
            email: leadData.email || null,
            phone: leadData.phone || null,
            source: 'chat',
            status: 'new',
            notes: `Via website chat. Routed to: ${routeTo || agentId}`,
          });
        }
      } catch (e) {
        console.error('[chat-lead] Failed to save lead:', e);
      }
    }
  }

  // ── Check if AI flagged the question for internal review ──────────────
  const flagMatch = content.match(/\[FLAG:(.*?)\]/i);
  if (flagMatch) {
    const flagReason = flagMatch[1] || 'Unknown topic';
    // Log to market intelligence / crawl_leads as a new lead
    try {
      await supabaseAdmin.from('project_activities').insert({
        project_id: null,
        activity_type: 'note',
        title: `Chat flag: ${flagReason}`,
        description: `Visitor asked: "${lastUserMessage?.content?.slice(0, 300)}"\nAgent: ${agentId}\nSession: ${sessionToken || 'unknown'}`,
        actor: 'AI Chat System',
        visible_to_client: false,
      }).then(() => {});
    } catch { /* non-critical */ }

    // Email notification
    try {
      const nodemailer = await import('nodemailer');
      const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
      if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
        const t = nodemailer.default.createTransport({
          host: SMTP_HOST, port: Number(SMTP_PORT), secure: false,
          auth: { user: SMTP_USER, pass: SMTP_PASS },
        });
        await t.sendMail({
          from: 'Rotehügels <noreply@rotehuegels.com>',
          to: process.env.EMAIL_TO || 'sivakumar@rotehuegels.com',
          subject: `Chat Flag: ${flagReason}`,
          html: `
            <h3>AI Chat — Flagged for Review</h3>
            <p><strong>Reason:</strong> ${flagReason}</p>
            <p><strong>Visitor asked:</strong> ${lastUserMessage?.content?.slice(0, 500)}</p>
            <p><strong>Agent:</strong> ${agentId}</p>
            <p><strong>Session:</strong> ${sessionToken || 'unknown'}</p>
            <p style="margin-top:16px;font-size:12px;color:#666;">This may represent a new business opportunity, market trend, or topic to add to the knowledge base.</p>
          `,
        });
      }
    } catch { /* non-critical */ }
  }

  // ── Update session with messages ──────────────────────────────────────
  if (session && sessionToken) {
    const existingMessages = Array.isArray(session.messages) ? session.messages : [];
    const now = new Date().toISOString();
    const updatedMessages = [
      ...existingMessages,
      { role: 'user', content: lastUserMessage?.content, agent: agentId, timestamp: now },
      { role: 'assistant', content: cleanContent, agent: agentId, timestamp: now, backend },
    ];

    updateSession(sessionToken, {
      messages: updatedMessages,
      message_count: (session.message_count as number || 0) + 2,
      agent_id: routeTo || agentId,
    });
  }

  return NextResponse.json({
    content: cleanContent,
    routeTo,
    agent: agentId,
    backend,
  });
}
