// lib/crawler.ts — Market Intelligence web crawler

import { load } from 'cheerio';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface ExtractedSupplierInfo {
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  gstin?: string;
  products_services?: string[];
  industry?: string;
  confidence_score: number;
  relevance_notes?: string;
}

export interface ExtractedCustomerInfo {
  company_name: string;
  contact_person?: string;
  designation?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  gstin?: string;
  industry?: string;
  potential_needs?: string[];
  estimated_value?: string;
  confidence_score: number;
  relevance_notes?: string;
}

export type ExtractedInfo = ExtractedSupplierInfo | ExtractedCustomerInfo;

// ── Constants ─────────────────────────────────────────────────────────────────

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const COMPANY_CONTEXT = `Rotehügels is an electrochemical engineering company based in Chennai, India. They:
- Supply lead anodes, aluminium cathodes, CPVC piping
- Provide plant commissioning, plumbing, electrical services
- Build AutoREX automation systems
- Work in zinc/copper refining, battery recycling, hydrometallurgy
- Need suppliers of: raw materials (metals, chemicals), instrumentation, electrical components, fabrication services, industrial supplies
- Target customers: metal refineries, electroplating companies, battery recyclers, mining companies, chemical plants`;

export const DEFAULT_SUPPLIER_QUERIES = [
  'lead anode manufacturers India',
  'aluminium cathode suppliers Chennai',
  'CPVC pipe manufacturers India',
  'industrial sensor suppliers India',
  'electrochemical equipment suppliers',
  'zinc refining equipment India',
];

export const DEFAULT_CUSTOMER_QUERIES = [
  'zinc electroplating plant India',
  'copper refining company India',
  'battery recycling plant India',
  'electrowinning plant',
  'hydrometallurgy company India',
  'lead acid battery manufacturer India',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── searchWeb ─────────────────────────────────────────────────────────────────

export async function searchWeb(query: string): Promise<SearchResult[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!res.ok) throw new Error(`DuckDuckGo returned HTTP ${res.status}`);
    const html = await res.text();
    const $ = load(html);
    const results: SearchResult[] = [];

    $('.result').each((i, el) => {
      if (i >= 10) return false;
      const titleEl = $(el).find('.result__title a, .result__a');
      const snippetEl = $(el).find('.result__snippet');
      const title = titleEl.text().trim();
      let href = titleEl.attr('href') ?? '';

      // DuckDuckGo wraps links in a redirect — extract the real URL
      if (href.includes('uddg=')) {
        const m = href.match(/uddg=([^&]+)/);
        if (m) href = decodeURIComponent(m[1]);
      }

      const snippet = snippetEl.text().trim();
      if (title && href && href.startsWith('http')) {
        results.push({ title, url: href, snippet });
      }
    });

    return results;
  } catch (err: unknown) {
    console.error('[searchWeb] Error:', err instanceof Error ? err.message : err);
    return [];
  }
}

// ── fetchPageContent ──────────────────────────────────────────────────────────

export async function fetchPageContent(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = load(html);

    // Remove scripts, styles, nav, footer
    $('script, style, nav, footer, header, noscript, iframe').remove();

    const text = $('body').text().replace(/\s+/g, ' ').trim();
    return text.slice(0, 5000);
  } catch (err: unknown) {
    console.error('[fetchPageContent] Error fetching', url, err instanceof Error ? err.message : err);
    return '';
  }
}

// ── extractCompanyInfo ────────────────────────────────────────────────────────

export async function extractCompanyInfo(
  pageText: string,
  searchQuery: string,
  type: 'supplier' | 'customer'
): Promise<ExtractedInfo | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('[extractCompanyInfo] GROQ_API_KEY not set');
    return null;
  }
  if (!pageText || pageText.length < 50) return null;

  const fieldsForType =
    type === 'supplier'
      ? `"products_services" (array of strings — what they supply), "industry"`
      : `"potential_needs" (array of strings — what they might need from Rotehügels), "industry", "estimated_value" (one of: "small", "medium", "large")`;

  const systemPrompt = `You are a data extraction assistant. Given a web page's text content, extract company information as JSON.

${COMPANY_CONTEXT}

The search query was: "${searchQuery}"
This is a potential ${type} lead.

Extract these fields:
- company_name (string, required)
- contact_person (string or null)
- email (string or null)
- phone (string or null)
- website (string or null)
- address (string or null)
- city (string or null)
- state (string or null)
- country (string, default "India")
- gstin (string or null — Indian GST number if found)
- ${fieldsForType}
- confidence_score (0-100 — how confident you are in the extracted data accuracy)
- relevance_notes (string — briefly explain why this company is relevant to Rotehügels)

Return ONLY valid JSON. If no company info can be extracted, return {"company_name":"","confidence_score":0}.`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: pageText.slice(0, 4000) },
        ],
        temperature: 0.1,
        max_tokens: 1024,
      }),
    });

    if (!res.ok) {
      console.error('[extractCompanyInfo] Groq API error:', res.status, await res.text().catch(() => ''));
      return null;
    }

    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content ?? '';

    // Extract JSON from the response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as ExtractedInfo;
    if (!parsed.company_name) return null;

    return parsed;
  } catch (err: unknown) {
    console.error('[extractCompanyInfo] Error:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ── runCrawlJob ───────────────────────────────────────────────────────────────

export interface CrawlJobResult {
  jobId: string;
  type: 'supplier' | 'customer';
  resultsCount: number;
  errors: Array<{ query: string; error: string }>;
}

export async function runCrawlJob(
  type: 'supplier' | 'customer',
  queries: string[],
  supabase: {
    from: (table: string) => {
      insert: (data: Record<string, unknown>) => { select: (cols: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: unknown }> } };
      update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: unknown }> };
      select: (cols: string) => { or: (filter: string) => { maybeSingle: () => Promise<{ data: Record<string, unknown> | null }> } };
    };
  }
): Promise<CrawlJobResult> {
  const table = type === 'supplier' ? 'supplier_leads' : 'customer_leads';

  // Create job record
  const { data: job } = await (supabase.from('crawl_jobs') as ReturnType<typeof supabase.from>)
    .insert({
      job_type: `${type}_search`,
      search_queries: queries,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  const jobId = (job as Record<string, unknown> | null)?.id as string ?? 'unknown';
  let resultsCount = 0;
  const errors: Array<{ query: string; error: string }> = [];

  for (const query of queries) {
    try {
      // Search
      const searchResults = await searchWeb(query);
      await sleep(1000); // respect rate limit

      // Process top 5 results
      for (const sr of searchResults.slice(0, 5)) {
        try {
          const pageText = await fetchPageContent(sr.url);
          await sleep(2000); // respect rate limit

          if (!pageText) continue;

          const info = await extractCompanyInfo(pageText, query, type);
          if (!info || !info.company_name || info.confidence_score < 10) continue;

          // Check for duplicates by website or company_name
          const companyNameClean = info.company_name.trim().toLowerCase();
          const websiteClean = (info.website ?? sr.url).toLowerCase();

          const { data: existing } = await (supabase.from(table) as ReturnType<typeof supabase.from>)
            .select('id')
            .or(`company_name.ilike.%${companyNameClean}%,website.ilike.%${websiteClean}%`)
            .maybeSingle();

          if (existing) continue; // skip duplicate

          // Determine source type
          let sourceType = 'google_search';
          if (sr.url.includes('indiamart.com')) sourceType = 'indiamart';
          else if (sr.url.includes('tradeindia.com')) sourceType = 'tradeindia';
          else if (sr.url.includes('justdial.com')) sourceType = 'justdial';

          const record: Record<string, unknown> = {
            company_name: info.company_name,
            contact_person: info.contact_person ?? null,
            email: info.email ?? null,
            phone: info.phone ?? null,
            website: info.website ?? sr.url,
            address: info.address ?? null,
            city: info.city ?? null,
            state: info.state ?? null,
            country: info.country ?? 'India',
            gstin: info.gstin ?? null,
            industry: info.industry ?? null,
            source_url: sr.url,
            source_type: sourceType,
            confidence_score: info.confidence_score,
            relevance_notes: info.relevance_notes ?? null,
            status: 'new',
            raw_data: info,
          };

          if (type === 'supplier') {
            record.products_services = (info as ExtractedSupplierInfo).products_services ?? null;
          } else {
            record.potential_needs = (info as ExtractedCustomerInfo).potential_needs ?? null;
            record.estimated_value = (info as ExtractedCustomerInfo).estimated_value ?? null;
          }

          await (supabase.from(table) as ReturnType<typeof supabase.from>)
            .insert(record)
            .select('id')
            .single();

          resultsCount++;
        } catch (pageErr: unknown) {
          console.error('[runCrawlJob] Page processing error:', pageErr instanceof Error ? pageErr.message : pageErr);
        }
      }
    } catch (queryErr: unknown) {
      const msg = queryErr instanceof Error ? queryErr.message : String(queryErr);
      errors.push({ query, error: msg });
      console.error('[runCrawlJob] Query error:', msg);
    }
  }

  // Update job record
  await (supabase.from('crawl_jobs') as ReturnType<typeof supabase.from>)
    .update({
      status: errors.length > 0 && resultsCount === 0 ? 'failed' : 'completed',
      results_count: resultsCount,
      errors: errors,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  return { jobId, type, resultsCount, errors };
}
