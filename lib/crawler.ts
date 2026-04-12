// lib/crawler.ts — Market Intelligence Crawler v2
// Multi-stage pipeline: Discovery → Deep Crawl → AI Extraction → Enrichment

import { load } from 'cheerio';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface ExtractedInfo {
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
  pan?: string;
  cin?: string;
  products_services?: string[];
  potential_needs?: string[];
  industry?: string;
  estimated_value?: string;
  confidence_score: number;
  relevance_notes?: string;
  directors?: string[];
  plant_locations?: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const COMPANY_CONTEXT = `Rotehügels is an engineering, technology, and EPC company based in Chennai, India.
Products: AutoREX™ (plant automation), Operon (cloud ERP), LabREX (LIMS).
We supply: instrumentation, control panels, automation systems, lead anodes, aluminium cathodes, piping.
We serve: zinc, copper, gold, silver, aluminium processing, battery recycling, black mass, water treatment, textiles, food, automotive, paper.
We need suppliers of: raw materials (metals, chemicals), instruments, electrical, fabrication, lab equipment.
We target customers: metal refineries, electroplating, battery recyclers, mining, chemical plants, ETP companies, process industries.`;

export const DEFAULT_SUPPLIER_QUERIES = [
  'lead anode manufacturers India', 'aluminium cathode suppliers India',
  'high purity lead ingot suppliers India', 'copper busbar manufacturers India',
  'zinc ingot suppliers India', 'titanium mesh anode manufacturers',
  'CPVC pipe manufacturers India', 'acid resistant piping suppliers India',
  'sulphuric acid suppliers India', 'zinc sulphate manufacturers India',
  'activated carbon suppliers India', 'industrial chemical suppliers Chennai',
  'pH meter manufacturers India', 'temperature transmitter suppliers India',
  'pressure gauge manufacturers India', 'flow meter suppliers India',
  'ORP sensor manufacturers India', 'level transmitter suppliers India',
  'PLC automation suppliers India', 'VFD drive suppliers India',
  'rectifier manufacturers India', 'DC power supply manufacturers India',
  'industrial panel board manufacturers Chennai', 'CNC machining job work Chennai',
  'industrial fabrication companies Chennai', 'FRP fabrication companies India',
  'metallurgical testing laboratory India', 'ICP-OES suppliers India',
  'AAS instrument suppliers India', 'laboratory equipment suppliers India',
  'weighing scale manufacturers India', 'belt conveyor manufacturers India',
  'industrial pump manufacturers India', 'heat exchanger manufacturers India',
  'rubber lining contractors India', 'SS welding job work Tamil Nadu',
  'industrial safety equipment suppliers India', 'transformer manufacturers India',
];

export const DEFAULT_CUSTOMER_QUERIES = [
  'zinc electroplating plant India', 'zinc smelter India',
  'zinc refining company India', 'hot dip galvanizing plant India',
  'copper refining company India', 'copper smelter India',
  'copper electrowinning plant India', 'copper recycling company India',
  'lead smelting plant India', 'lead acid battery manufacturer India',
  'lead recycling plant India', 'secondary lead smelter India',
  'battery recycling plant India', 'lithium ion battery recycler India',
  'e-waste recycling company India', 'black mass processing plant',
  'hydrometallurgy company India', 'solvent extraction plant India',
  'mineral processing company India', 'rare earth processing India',
  'electrowinning plant India', 'electroplating company India',
  'anodizing plant India', 'chrome plating company India',
  'effluent treatment plant company India', 'ETP manufacturer India',
  'zero liquid discharge plant India', 'water treatment company India',
  'mining company India', 'aluminium smelter India',
  'ferro alloy manufacturers India', 'metal recycling company India',
  'steel plant India', 'chemical plant India',
  'textile dyeing company India', 'food processing plant India',
  'pharmaceutical manufacturing India', 'petrochemical company India',
  'paper mill India', 'sugar factory India',
  'cement plant India', 'fertilizer plant India',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function extractEmailsFromText(text: string): string[] {
  const re = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(re) ?? [];
  return [...new Set(matches)].filter(e =>
    !e.includes('example.com') && !e.includes('sentry') && !e.includes('webpack')
    && !e.endsWith('.png') && !e.endsWith('.jpg') && !e.endsWith('.css') && !e.endsWith('.js')
  ).slice(0, 5);
}

function extractPhonesFromText(text: string): string[] {
  const patterns = [
    /(?:\+91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}/g,
    /\+\d{1,3}[\s-]?\(?\d{1,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/g,
    /(?:0\d{2,4})[\s-]?\d{6,8}/g,
  ];
  const all: string[] = [];
  for (const p of patterns) all.push(...(text.match(p) ?? []));
  return [...new Set(all)].slice(0, 5);
}

// ── Stage 1: Web Search ──────────────────────────────────────────────────────

export async function searchWeb(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are a business intelligence researcher. Return a JSON array of 8-12 REAL companies for this query.
Format: [{"title":"Company Name","url":"https://company.com","snippet":"What they do, where"}]
Rules: Only REAL companies. Actual URLs. Mix of sizes. Focus on India.`,
          },
          { role: 'user', content: query },
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const m = (data.choices?.[0]?.message?.content ?? '').match(/\[[\s\S]*\]/);
    if (!m) return [];
    return (JSON.parse(m[0]) as SearchResult[]).filter(r => r.title && r.url?.startsWith('http')).slice(0, 12);
  } catch { return []; }
}

// ── Stage 2: Deep Crawl (homepage + contact + about pages) ───────────────────

export async function deepCrawl(url: string): Promise<{ combined: string; emails: string[]; phones: string[] }> {
  try {
    const homeRes = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      signal: AbortSignal.timeout(10000),
    });
    if (!homeRes.ok) return { combined: '', emails: [], phones: [] };

    const homeHtml = await homeRes.text();
    const $ = load(homeHtml);
    $('script, style, nav, noscript, iframe, svg').remove();
    const homeText = $('body').text().replace(/\s+/g, ' ').trim();

    let combined = homeText.slice(0, 4000);
    const allEmails = extractEmailsFromText(homeHtml);
    const allPhones = extractPhonesFromText(homeText);

    // Find contact/about links
    const links: string[] = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const text = $(el).text().toLowerCase();
      if (text.includes('contact') || href.includes('/contact') || text.includes('about') || href.includes('/about')) {
        try { const full = new URL(href, url).href; if (!links.includes(full)) links.push(full); } catch {}
      }
    });

    // Crawl contact/about pages
    for (const link of links.slice(0, 3)) {
      await sleep(500);
      try {
        const r = await fetch(link, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) });
        if (!r.ok) continue;
        const html = await r.text();
        const $p = load(html);
        $p('script, style, nav, noscript, iframe, svg').remove();
        combined += '\n' + $p('body').text().replace(/\s+/g, ' ').trim().slice(0, 3000);
        allEmails.push(...extractEmailsFromText(html));
        allPhones.push(...extractPhonesFromText(html));
      } catch {}
    }

    return { combined: combined.slice(0, 8000), emails: [...new Set(allEmails)], phones: [...new Set(allPhones)] };
  } catch { return { combined: '', emails: [], phones: [] }; }
}

// ── Stage 3: AI Extraction ───────────────────────────────────────────────────

export async function extractCompanyInfo(
  pageText: string, emails: string[], phones: string[],
  searchQuery: string, type: 'supplier' | 'customer'
): Promise<ExtractedInfo | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || !pageText || pageText.length < 50) return null;

  const fields = type === 'supplier'
    ? '"products_services" (array — what they supply)'
    : '"potential_needs" (array — what they need from us), "estimated_value" ("small"/"medium"/"large")';

  const hints = [
    emails.length > 0 ? `Emails found: ${emails.join(', ')}` : '',
    phones.length > 0 ? `Phones found: ${phones.join(', ')}` : '',
  ].filter(Boolean).join('\n');

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: `Extract company info as JSON. ${COMPANY_CONTEXT}\nQuery: "${searchQuery}" | Type: ${type}\n${hints}\nFields: company_name, contact_person, designation, email, phone, website, address, city, state, country, gstin, pan, cin, directors (array), plant_locations (array), industry, ${fields}, confidence_score (0-100), relevance_notes.\nUse found emails/phones. Pick sales/info email over noreply. Return ONLY JSON.` },
          { role: 'user', content: pageText.slice(0, 6000) },
        ],
        temperature: 0.1, max_tokens: 1500,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const m = (data.choices?.[0]?.message?.content ?? '').match(/\{[\s\S]*\}/);
    if (!m) return null;
    const parsed = JSON.parse(m[0]) as ExtractedInfo;
    if (!parsed.company_name) return null;

    // Fill from direct extraction if AI missed
    if (!parsed.email && emails.length > 0) parsed.email = emails.find(e => e.includes('sales') || e.includes('info')) ?? emails[0];
    if (!parsed.phone && phones.length > 0) parsed.phone = phones[0];
    return parsed;
  } catch { return null; }
}

// ── Enrichment ───────────────────────────────────────────────────────────────

export async function enrichLead(website: string): Promise<{ email?: string; phone?: string; contact_person?: string }> {
  if (!website) return {};
  const { emails, phones } = await deepCrawl(website);
  const result: { email?: string; phone?: string; contact_person?: string } = {};
  if (emails.length > 0) result.email = emails.find(e => e.includes('sales') || e.includes('info')) ?? emails[0];
  if (phones.length > 0) result.phone = phones[0];
  return result;
}

// ── Main Job Runner ──────────────────────────────────────────────────────────

export interface CrawlJobResult {
  jobId: string; type: string; resultsCount: number; enrichedCount: number;
  errors: Array<{ query: string; error: string }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runCrawlJob(type: 'supplier' | 'customer', queries: string[], supabase: any): Promise<CrawlJobResult> {
  const table = type === 'supplier' ? 'supplier_leads' : 'customer_leads';
  const allQ = type === 'supplier' ? DEFAULT_SUPPLIER_QUERIES : DEFAULT_CUSTOMER_QUERIES;
  const used = new Set(queries);
  const queue = [...queries];

  const { data: job } = await supabase.from('crawl_jobs')
    .insert({ job_type: `${type}_search`, search_queries: queries, status: 'running', started_at: new Date().toISOString() })
    .select('id').single();
  const jobId = job?.id ?? 'unknown';

  let results = 0, processed = 0, enriched = 0;
  const allUsed: string[] = [];
  const errors: Array<{ query: string; error: string }> = [];

  // Phase 1: Discovery
  while (results < 10 && processed < 12) {
    if (queue.length === 0) {
      const rem = allQ.filter(q => !used.has(q));
      if (rem.length === 0) break;
      rem.sort(() => Math.random() - 0.5).slice(0, 3).forEach(q => { queue.push(q); used.add(q); });
    }
    const query = queue.shift()!;
    allUsed.push(query);
    processed++;

    try {
      const srs = await searchWeb(query);
      await sleep(800);

      for (const sr of srs.slice(0, 8)) {
        if (results >= 10) break;
        try {
          const { combined, emails, phones } = await deepCrawl(sr.url);
          await sleep(1000);
          if (!combined) continue;

          const info = await extractCompanyInfo(combined, emails, phones, query, type);
          if (!info?.company_name || info.confidence_score < 10) continue;

          const { data: dup } = await supabase.from(table)
            .select('id').or(`company_name.ilike.%${info.company_name.trim().toLowerCase()}%`).maybeSingle();
          if (dup) continue;

          const rec: Record<string, unknown> = {
            company_name: info.company_name, contact_person: info.contact_person ?? null,
            email: info.email ?? null, phone: info.phone ?? null,
            website: info.website ?? sr.url, address: info.address ?? null,
            city: info.city ?? null, state: info.state ?? null, country: info.country ?? 'India',
            gstin: info.gstin ?? null, industry: info.industry ?? null,
            source_url: sr.url, source_type: sr.url.includes('indiamart') ? 'indiamart' : 'ai_discovery',
            confidence_score: info.confidence_score, relevance_notes: info.relevance_notes ?? null,
            status: 'new', raw_data: info,
          };
          if (type === 'supplier') rec.products_services = info.products_services ?? null;
          else { rec.potential_needs = info.potential_needs ?? null; rec.estimated_value = info.estimated_value ?? null; rec.designation = info.designation ?? null; }

          await supabase.from(table).insert(rec);
          results++;
        } catch (e) { console.error('[crawl]', e instanceof Error ? e.message : e); }
      }
    } catch (e) { errors.push({ query, error: e instanceof Error ? e.message : String(e) }); }
  }

  // Phase 2: Enrich incomplete leads
  try {
    const { data: incomplete } = await supabase.from(table)
      .select('id, website, email, phone').is('email', null).not('website', 'is', null).limit(5);
    for (const lead of (incomplete ?? [])) {
      try {
        const e = await enrichLead(lead.website);
        const upd: Record<string, unknown> = {};
        if (e.email && !lead.email) upd.email = e.email;
        if (e.phone && !lead.phone) upd.phone = e.phone;
        if (Object.keys(upd).length > 0) { await supabase.from(table).update(upd).eq('id', lead.id); enriched++; }
        await sleep(1000);
      } catch {}
    }
  } catch {}

  await supabase.from('crawl_jobs').update({
    status: 'completed', results_count: results, errors, search_queries: allUsed, completed_at: new Date().toISOString(),
  }).eq('id', jobId);

  return { jobId, type, resultsCount: results, enrichedCount: enriched, errors };
}
