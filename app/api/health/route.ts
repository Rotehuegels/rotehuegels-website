export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const timestamp = new Date().toISOString();

  // ── Database ──────────────────────────────────────────────────────────────
  let database: { status: string; latency_ms?: number } = { status: 'down' };
  try {
    const t0 = Date.now();
    const { error } = await supabaseAdmin
      .from('audit_log')
      .select('id', { count: 'exact', head: true });
    if (!error) {
      database = { status: 'up', latency_ms: Date.now() - t0 };
    }
  } catch {
    database = { status: 'down' };
  }

  // ── Ollama ────────────────────────────────────────────────────────────────
  let ai_ollama: { status: string; latency_ms?: number } = { status: 'down' };
  try {
    const t0 = Date.now();
    const res = await fetch('http://localhost:11434/api/tags', {
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      ai_ollama = { status: 'up', latency_ms: Date.now() - t0 };
    }
  } catch {
    ai_ollama = { status: 'down' };
  }

  // ── AI Providers ──────────────────────────────────────────────────────────
  const ai_providers: Record<string, { status: string }> = {};
  const providerKeys = [
    ['groq', 'GROQ_API_KEY'],
    ['gemini', 'GEMINI_API_KEY'],
    ['mistral', 'MISTRAL_API_KEY'],
    ['cerebras', 'CEREBRAS_API_KEY'],
    ['together', 'TOGETHER_API_KEY'],
    ['openrouter', 'OPENROUTER_API_KEY'],
  ] as const;
  for (const [name, envKey] of providerKeys) {
    ai_providers[name] = { status: process.env[envKey] ? 'configured' : 'not_configured' };
  }

  // ── SMTP ──────────────────────────────────────────────────────────────────
  const email_smtp = process.env.SMTP_HOST
    ? { status: 'configured' }
    : { status: 'not_configured' };

  // ── Microsoft ─────────────────────────────────────────────────────────────
  const microsoft = process.env.MICROSOFT_CLIENT_ID
    ? { status: 'configured' }
    : { status: 'not_configured' };

  const overallStatus = database.status === 'up' ? 'healthy' : 'degraded';

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp,
      services: {
        database,
        ai_ollama,
        ai_providers,
        email_smtp,
        microsoft,
      },
      version: '1.0.0',
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
