export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

const GROQ_MODEL = process.env.GROQ_MODEL ?? 'llama-3.1-8b-instant';

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AI service not configured.' }, { status: 503 });
  }

  let body: { description: string; field: 'hsn' | 'description' | 'notes' };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const { description, field } = body;
  if (!description?.trim()) {
    return NextResponse.json({ error: 'Description is required.' }, { status: 400 });
  }

  let systemPrompt = '';
  let userPrompt = '';

  if (field === 'hsn') {
    systemPrompt = `You are an Indian GST expert. Given a product or service description, return the correct 8-digit HSN code (for goods) or 6-digit SAC code (for services) under the Indian GST system.

Return ONLY a JSON object in this exact format, nothing else:
{"code": "85371090", "type": "HSN", "description": "Boards, panels, consoles — voltage ≤1000V", "gst_rate": 18}

Rules:
- HSN codes are 8 digits for goods
- SAC codes are 6 digits for services
- Include the standard GST rate for that code
- If uncertain between codes, pick the most common one for industrial/engineering goods
- Description should be the official HSN/SAC chapter description`;

    userPrompt = `Product/service: "${description.trim()}"`;
  } else if (field === 'description') {
    systemPrompt = `You are a technical editor for an industrial engineering company (electrochemical, metallurgy, instrumentation). Fix spelling errors, improve technical accuracy, and make descriptions professional and clear for purchase orders and invoices.

Rules:
- Fix spelling and grammar
- Use proper technical terminology (e.g., "aluminium" not "aluminum" for Indian context)
- Keep it concise — this goes on an invoice/PO line item
- Capitalize proper nouns and technical terms correctly
- Use standard abbreviations where appropriate (SS for Stainless Steel, CPVC, HDPE, etc.)
- Do NOT add information that wasn't in the original — only correct and improve what's there

Return ONLY a JSON object: {"corrected": "the corrected description", "changes": ["list of changes made"]}`;

    userPrompt = `Original description: "${description.trim()}"`;
  } else if (field === 'notes') {
    systemPrompt = `You are a technical editor for an industrial engineering company. Improve notes, specifications, and remarks for purchase orders and invoices.

Rules:
- Fix spelling and grammar
- Make specifications precise (dimensions, grades, standards)
- Use proper technical terminology
- Keep it professional and concise
- Do NOT add information that wasn't in the original

Return ONLY a JSON object: {"corrected": "the corrected notes", "changes": ["list of changes made"]}`;

    userPrompt = `Original notes: "${description.trim()}"`;
  } else {
    return NextResponse.json({ error: 'Invalid field type.' }, { status: 400 });
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 300,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq ${res.status}: ${err}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    // Parse JSON from response (handle markdown code blocks)
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return NextResponse.json({ result: parsed, field });
  } catch (err) {
    console.error('AI assist error:', err);
    return NextResponse.json({ error: 'AI suggestion failed. Please enter manually.' }, { status: 500 });
  }
}
