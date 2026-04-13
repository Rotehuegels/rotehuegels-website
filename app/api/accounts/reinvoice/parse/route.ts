import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Parse supplier invoice using AI — extract line items, GST, totals

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Read file as base64 for AI processing
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = file.type || 'application/pdf';

    // Try Gemini first (best for PDF/image understanding), fall back to Groq
    const result = await parseWithGemini(base64, mimeType)
      ?? await parseWithGroq(base64, mimeType);

    if (!result) {
      return NextResponse.json({ error: 'Failed to parse invoice with any AI provider' }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('[POST /api/accounts/reinvoice/parse]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Parse failed' },
      { status: 500 },
    );
  }
}

const EXTRACTION_PROMPT = `You are an expert Indian GST invoice parser. Extract ALL line items from this supplier invoice.

Return JSON with this exact structure:
{
  "supplier_name": "...",
  "supplier_gstin": "...",
  "invoice_no": "...",
  "invoice_date": "YYYY-MM-DD",
  "items": [
    {
      "description": "Full item description as on invoice",
      "hsn_code": "8-digit HSN/SAC code",
      "quantity": 6,
      "unit": "NOS or MTR or KG or LS etc",
      "rate": 5070.00,
      "discount": "30%" or null,
      "taxable_amount": 21294.00,
      "gst_rate": 18,
      "gst_amount": 3832.92,
      "total": 25126.92
    }
  ],
  "subtotal": 43217.80,
  "cgst": 3889.60,
  "sgst": 3889.60,
  "igst": 0,
  "grand_total": 50997.00
}

RULES:
- Extract EVERY line item, do not skip any
- Include exact HSN/SAC codes as printed
- If discount is shown as percentage, include it (e.g. "30%")
- If no discount, set discount to null
- Rate should be the ORIGINAL rate before discount
- Taxable amount = rate × quantity × (1 - discount%)
- All amounts in INR, 2 decimal places
- Return ONLY valid JSON, no markdown`;

async function parseWithGemini(base64: string, mimeType: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType, data: base64 } },
              { text: EXTRACTION_PROMPT },
            ],
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4000,
            responseMimeType: 'application/json',
          },
        }),
        signal: AbortSignal.timeout(30000),
      },
    );

    if (!res.ok) {
      console.error('[reinvoice/parse/gemini]', res.status, await res.text().catch(() => ''));
      return null;
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return JSON.parse(text);
  } catch (err) {
    console.error('[reinvoice/parse/gemini]', err);
    return null;
  }
}

async function parseWithGroq(base64: string, _mimeType: string) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  // Groq doesn't support vision — decode PDF text and send as text
  // For now, return null and let Gemini handle PDFs
  // Future: use pdf-parse or similar to extract text, then send to Groq
  console.log('[reinvoice/parse/groq] Groq does not support PDF vision, skipping. Base64 length:', base64.length);
  return null;
}
