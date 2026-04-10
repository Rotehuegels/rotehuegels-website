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
  // Raw materials — metals
  'lead anode manufacturers India',
  'aluminium cathode suppliers India',
  'high purity lead ingot suppliers India',
  'copper busbar manufacturers India',
  'zinc ingot suppliers India',
  'titanium mesh anode manufacturers',
  'stainless steel electrode suppliers India',
  // Piping & fittings
  'CPVC pipe manufacturers India',
  'HDPE pipe suppliers India',
  'acid resistant piping suppliers',
  'PP FRP tank manufacturers India',
  'rubber lined tank manufacturers India',
  // Chemicals
  'sulphuric acid suppliers India',
  'zinc sulphate manufacturers India',
  'manganese dioxide suppliers India',
  'activated carbon suppliers India',
  'industrial chemical suppliers Chennai Tamil Nadu',
  // Instrumentation & sensors
  'industrial sensor suppliers India',
  'pH meter manufacturers India',
  'temperature transmitter suppliers India',
  'pressure gauge manufacturers India',
  'flow meter suppliers India',
  'ORP sensor manufacturers',
  'level transmitter suppliers India',
  // Electrical & automation
  'PLC automation suppliers India',
  'VFD drive suppliers India',
  'rectifier manufacturers India',
  'thyristor rectifier manufacturers India',
  'DC power supply manufacturers India',
  'industrial panel board manufacturers Chennai',
  // Fabrication & machining
  'CNC machining job work Chennai',
  'industrial fabrication companies Chennai',
  'SS welding job work Tamil Nadu',
  'rubber lining contractors India',
  'FRP fabrication companies India',
  // Lab & testing
  'metallurgical testing laboratory India',
  'chemical analysis laboratory Chennai',
  'water testing equipment suppliers India',
];

export const DEFAULT_CUSTOMER_QUERIES = [
  // Zinc industry
  'zinc electroplating plant India',
  'zinc smelter India',
  'zinc refining company India',
  'hot dip galvanizing plant India',
  'zinc plating job work India',
  'zinc oxide manufacturers India',
  // Copper industry
  'copper refining company India',
  'copper smelter India',
  'copper electrowinning plant',
  'copper rod manufacturers India',
  'copper recycling company India',
  // Lead industry
  'lead smelting plant India',
  'lead acid battery manufacturer India',
  'lead recycling plant India',
  'secondary lead smelter India',
  // Battery recycling
  'battery recycling plant India',
  'lithium ion battery recycler India',
  'e-waste recycling company India',
  'black mass processing plant India',
  'battery scrap dealers India',
  // Hydrometallurgy
  'hydrometallurgy company India',
  'solvent extraction plant India',
  'leaching plant India',
  'mineral processing company India',
  'rare earth processing India',
  // Electrochemical
  'electrowinning plant India',
  'electroplating company India',
  'anodizing plant India',
  'chrome plating company India',
  'nickel plating India',
  'electrorefining company India',
  // Water treatment
  'effluent treatment plant company India',
  'ETP manufacturer India',
  'zero liquid discharge plant India',
  'industrial water treatment company India',
  // Mining & metals
  'mining company India',
  'steel plant India',
  'aluminium smelter India',
  'ferro alloy manufacturers India',
  'metal recycling company India',
  // Chemical plants
  'chemical plant India',
  'pharmaceutical manufacturing India',
  'fertilizer plant India',
  'petrochemical company India',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── searchWeb ─────────────────────────────────────────────────────────────────

export async function searchWeb(query: string): Promise<SearchResult[]> {
  // Strategy: Use Groq LLM to generate a list of real companies for the query.
  // DuckDuckGo blocks serverless IPs with captchas, and Google requires API keys.
  // The LLM has training data about Indian industrial companies.
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('[searchWeb] GROQ_API_KEY not set');
    return [];
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are a business intelligence researcher. Given a search query about Indian industrial companies, return a JSON array of 8-10 real companies with their websites.

Return ONLY a JSON array, no other text:
[{"title": "Company Name", "url": "https://www.company.com", "snippet": "Brief description of what they do"}]

Rules:
- Only include REAL companies that actually exist in India
- Include their actual website URLs (not made up)
- Focus on companies in the electrochemical, metallurgy, instrumentation, and manufacturing sectors
- Include a mix of large and small companies
- If you don't know the exact URL, use the most likely domain`,
          },
          { role: 'user', content: query },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.error('[searchWeb] Groq error:', res.status);
      return [];
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const results = JSON.parse(jsonMatch[0]) as SearchResult[];
    return results.filter(r => r.title && r.url?.startsWith('http')).slice(0, 10);
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

const MIN_LEADS_PER_JOB = 10;
const MAX_QUERIES_PER_JOB = 15; // safety cap to avoid infinite loops

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
  const allQueries = type === 'supplier' ? DEFAULT_SUPPLIER_QUERIES : DEFAULT_CUSTOMER_QUERIES;

  // Build a queue: start with provided queries, then add more from the full list if needed
  const usedQueries = new Set<string>();
  const queryQueue = [...queries];
  queries.forEach(q => usedQueries.add(q));

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
  let queriesProcessed = 0;
  const allQueriesUsed: string[] = [];
  const errors: Array<{ query: string; error: string }> = [];

  while (resultsCount < MIN_LEADS_PER_JOB && queriesProcessed < MAX_QUERIES_PER_JOB) {
    // If queue is empty, add more queries from the full list
    if (queryQueue.length === 0) {
      const remaining = allQueries.filter(q => !usedQueries.has(q));
      if (remaining.length === 0) break; // exhausted all queries
      // Shuffle and add next batch
      const shuffled = [...remaining].sort(() => Math.random() - 0.5);
      const batch = shuffled.slice(0, 4);
      batch.forEach(q => { queryQueue.push(q); usedQueries.add(q); });
    }

    const query = queryQueue.shift()!;
    allQueriesUsed.push(query);
    queriesProcessed++;

    try {
      const searchResults = await searchWeb(query);
      await sleep(1000);

      for (const sr of searchResults.slice(0, 8)) {
        if (resultsCount >= MIN_LEADS_PER_JOB) break;

        try {
          const pageText = await fetchPageContent(sr.url);
          await sleep(1500);

          if (!pageText) continue;

          const info = await extractCompanyInfo(pageText, query, type);
          if (!info || !info.company_name || info.confidence_score < 10) continue;

          // Check for duplicates
          const companyNameClean = info.company_name.trim().toLowerCase();
          const websiteClean = (info.website ?? sr.url).toLowerCase();

          const { data: existing } = await (supabase.from(table) as ReturnType<typeof supabase.from>)
            .select('id')
            .or(`company_name.ilike.%${companyNameClean}%,website.ilike.%${websiteClean}%`)
            .maybeSingle();

          if (existing) continue;

          let sourceType = 'ai_discovery';
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
          console.error('[runCrawlJob] Page error:', pageErr instanceof Error ? pageErr.message : pageErr);
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
      status: resultsCount >= MIN_LEADS_PER_JOB ? 'completed' : (errors.length > 0 && resultsCount === 0 ? 'failed' : 'completed'),
      results_count: resultsCount,
      errors: errors,
      search_queries: allQueriesUsed,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  return { jobId, type, resultsCount, errors };
}
