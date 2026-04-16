// lib/leadDiscovery.ts — Multi-AI lead discovery (no web crawling)
// Fires Groq, Gemini, Mistral, Cerebras, Together, OpenRouter in parallel.
// Consolidates + deduplicates results from all providers.

export type LeadType = 'supplier' | 'customer' | 'trading' | 'recycler';

interface DiscoveredLead {
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
  products_services?: string[];
  potential_needs?: string[];
  estimated_value?: string;
  commodities?: string[];
  trade_type?: string;
  typical_volume?: string;
  origin_countries?: string[];
  certifications?: string;
  confidence_score: number;
  relevance_notes?: string;
  _provider?: string;
}

export interface DiscoveryResult {
  type: LeadType;
  query: string;
  providers_used: string[];
  providers_succeeded: string[];
  discovered: number;
  saved: number;
  duplicates: number;
}

// ── Company context ─────────────────────────────────────────────────────────

const COMPANY_CONTEXT = `Rotehügels is an engineering, technology, and EPC company based in Chennai, India.
Products: AutoREX™ (plant automation), Operon (cloud ERP), LabREX (LIMS).
We supply: instrumentation, control panels, automation systems, lead anodes, aluminium cathodes, piping.
We serve: zinc, copper, gold, silver, aluminium processing, battery recycling, black mass, water treatment, textiles, food, automotive, paper.`;

// ── AI Providers (all free tier, OpenAI-compatible) ─────────────────────────

interface Provider {
  name: string;
  endpoint: string;
  keyEnv: string;
  model: string;
  extraHeaders?: Record<string, string>;
  extraBody?: Record<string, unknown>;
}

const PROVIDERS: Provider[] = [
  {
    name: 'groq',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    keyEnv: 'GROQ_API_KEY',
    model: 'llama-3.3-70b-versatile',
  },
  {
    name: 'gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    keyEnv: 'GEMINI_API_KEY',
    model: 'gemini-2.0-flash',
  },
  {
    name: 'mistral',
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    keyEnv: 'MISTRAL_API_KEY',
    model: 'mistral-small-latest',
  },
  {
    name: 'cerebras',
    endpoint: 'https://api.cerebras.ai/v1/chat/completions',
    keyEnv: 'CEREBRAS_API_KEY',
    model: 'llama-3.3-70b',
  },
  {
    name: 'together',
    endpoint: 'https://api.together.xyz/v1/chat/completions',
    keyEnv: 'TOGETHER_API_KEY',
    model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  },
  {
    name: 'openrouter',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    keyEnv: 'OPENROUTER_API_KEY',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
  },
];

// ── Query pools ─────────────────────────────────────────────────────────────

const SUPPLIER_QUERIES = [
  'lead anode manufacturers India', 'aluminium cathode suppliers India',
  'copper busbar manufacturers India', 'zinc ingot suppliers India',
  'titanium mesh anode manufacturers India', 'CPVC pipe manufacturers India',
  'sulphuric acid suppliers India', 'zinc sulphate manufacturers India',
  'pH meter manufacturers India', 'temperature transmitter suppliers India',
  'flow meter suppliers India', 'ORP sensor manufacturers India',
  'PLC automation suppliers India', 'VFD drive suppliers India',
  'rectifier manufacturers India', 'industrial panel board manufacturers Chennai',
  'CNC machining job work Chennai', 'FRP fabrication companies India',
  'ICP-OES suppliers India', 'AAS instrument suppliers India',
  'laboratory equipment suppliers India', 'industrial pump manufacturers India',
  'heat exchanger manufacturers India', 'rubber lining contractors India',
  'transformer manufacturers India', 'weighing scale manufacturers India',
  'belt conveyor manufacturers India', 'activated carbon suppliers India',
  'industrial safety equipment suppliers India', 'SS welding job work Tamil Nadu',
];

const CUSTOMER_QUERIES = [
  'zinc electroplating plant India', 'zinc smelter India',
  'copper refining company India', 'copper electrowinning plant India',
  'lead acid battery manufacturer India', 'lead recycling plant India',
  'battery recycling plant India', 'lithium ion battery recycler India',
  'e-waste recycling company India', 'black mass processing plant India',
  'hydrometallurgy company India', 'solvent extraction plant India',
  'electrowinning plant India', 'electroplating company India',
  'anodizing plant India', 'effluent treatment plant company India',
  'zero liquid discharge plant India', 'mining company India',
  'aluminium smelter India', 'ferro alloy manufacturers India',
  'metal recycling company India', 'chemical plant India',
  'textile dyeing company India', 'pharmaceutical manufacturing India',
  'petrochemical company India', 'paper mill India',
  'sugar factory India', 'cement plant India',
  'hot dip galvanizing plant India', 'chrome plating company India',
];

const TRADING_QUERIES = [
  'copper cathode traders India', 'zinc ingot brokers India',
  'lead ingot traders international', 'aluminium scrap dealers India',
  'copper scrap exporters India', 'battery scrap dealers India',
  'black mass traders Asia', 'lithium battery recycling traders',
  'nickel sulphate suppliers trading', 'cobalt hydroxide traders',
  'tin ingot brokers India', 'precious metals traders India',
  'gold refining byproduct traders', 'silver recycling traders India',
  'zinc dross buyers India', 'copper anode slime traders',
  'e-waste metal recovery traders', 'ferro alloy traders India',
  'manganese ore traders India', 'chrome ore traders India',
];

const RECYCLER_QUERIES = [
  'CPCB registered e-waste recyclers India',
  'e-waste recycling companies Tamil Nadu',
  'electronic waste processing facilities India',
  'battery recycling companies India CPCB authorized',
  'PCB recycling companies India',
  'computer hardware recyclers India',
  'e-waste dismantlers India SPCB registered',
  'lithium battery recycling India',
  'black mass recycling companies India',
  'solar panel recycling India',
  'WEEE recyclers India authorized',
  'e-waste collection agents India CPCB',
];

function pickQuery(type: LeadType): string {
  const pool = type === 'supplier' ? SUPPLIER_QUERIES
    : type === 'customer' ? CUSTOMER_QUERIES
    : type === 'recycler' ? RECYCLER_QUERIES
    : TRADING_QUERIES;
  // Rotate based on day + hour so each login gets different queries
  const seed = new Date().getDate() * 24 + new Date().getHours();
  return pool[seed % pool.length];
}

// ── Build prompt for a given type ───────────────────────────────────────────

function buildPrompt(type: LeadType, query: string): { system: string; user: string } {
  const typeInstructions: Record<LeadType, string> = {
    supplier: `Find 5–8 REAL Indian companies matching this query that could be suppliers.
For each, return: company_name, contact_person, designation, email, phone, website, address, city, state, country, gstin (if known), industry, products_services (array of what they supply), confidence_score (0-100), relevance_notes.`,
    customer: `Find 5–8 REAL Indian companies matching this query that could be our customers.
For each, return: company_name, contact_person, designation, email, phone, website, address, city, state, country, gstin (if known), industry, potential_needs (array of what they'd buy from us), estimated_value ("small"/"medium"/"large"), confidence_score (0-100), relevance_notes.`,
    trading: `Find 5–8 REAL companies (India + international) matching this query as commodity trading partners.
For each, return: company_name, contact_person, designation, email, phone, website, address, city, state, country, industry, commodities (array like ["copper","zinc"]), trade_type ("seller"/"buyer"/"both"), typical_volume (e.g. "50-100 MT/month"), origin_countries (array), certifications, confidence_score (0-100), relevance_notes.`,
    recycler: `Find 5–8 REAL Indian companies matching this query that are CPCB/SPCB registered e-waste recyclers.
For each, return: company_name, contact_person, designation, email, phone, website, address, city, state, country, gstin (if known), cpcb_registration (CPCB authorization number if known), spcb_registration (SPCB number if known), capabilities (array of e-waste types they handle, e.g. ["batteries","PCBs","computers"]), capacity_per_month (e.g. "500 MT/month"), confidence_score (0-100), relevance_notes.`,
  };

  return {
    system: `You are a business intelligence researcher.
${COMPANY_CONTEXT}

${typeInstructions[type]}

RULES:
- Only REAL, existing companies (not fabricated)
- Include actual contact details from your knowledge
- If you don't know an email/phone, set it to null — don't invent
- GSTIN format: 2-digit state + 10-char PAN + 1 check (e.g. 33AABCT1234F1Z5)
- Return JSON: { "leads": [ ... ] }`,
    user: query,
  };
}

// ── Call a single provider ──────────────────────────────────────────────────

async function callProvider(
  provider: Provider,
  type: LeadType,
  query: string,
): Promise<{ name: string; leads: DiscoveredLead[] }> {
  const apiKey = process.env[provider.keyEnv];
  if (!apiKey) return { name: provider.name, leads: [] };

  const { system, user } = buildPrompt(type, query);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
    ...provider.extraHeaders,
  };

  const body = {
    model: provider.model,
    messages: [
      { role: 'system' as const, content: system },
      { role: 'user' as const, content: user },
    ],
    temperature: 0.3,
    max_tokens: 3000,
    ...provider.extraBody,
  };

  try {
    const res = await fetch(provider.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      console.error(`[leadDiscovery/${provider.name}] ${res.status}: ${await res.text().catch(() => '')}`);
      return { name: provider.name, leads: [] };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    // Parse response
    let leads: DiscoveredLead[] = [];
    try {
      const parsed = JSON.parse(content);
      const arr = Array.isArray(parsed)
        ? parsed
        : (parsed.leads ?? parsed.results ?? parsed.companies ?? Object.values(parsed)[0]);
      if (Array.isArray(arr)) leads = arr;
    } catch {
      const m = content.match(/\[[\s\S]*\]/);
      if (m) {
        try { leads = JSON.parse(m[0]); } catch { /* skip */ }
      }
    }

    return {
      name: provider.name,
      leads: leads
        .filter((l) => l && l.company_name)
        .map((l) => ({ ...l, _provider: provider.name })),
    };
  } catch (err) {
    console.error(`[leadDiscovery/${provider.name}]`, err instanceof Error ? err.message : err);
    return { name: provider.name, leads: [] };
  }
}

// ── Merge + deduplicate across providers ────────────────────────────────────

function consolidateLeads(allResults: DiscoveredLead[]): DiscoveredLead[] {
  const seen = new Map<string, DiscoveredLead>();

  for (const lead of allResults) {
    const key = lead.company_name.trim().toLowerCase().replace(/\s+(pvt|private|ltd|limited|llp|inc|corp)\.?/gi, '').trim();

    if (seen.has(key)) {
      // Merge: keep the version with more filled fields
      const existing = seen.get(key)!;
      const merged = mergeLeads(existing, lead);
      seen.set(key, merged);
    } else {
      seen.set(key, lead);
    }
  }

  return Array.from(seen.values());
}

function mergeLeads(a: DiscoveredLead, b: DiscoveredLead): DiscoveredLead {
  // For each field, prefer the non-null value; if both exist, prefer higher confidence
  const pick = a.confidence_score >= (b.confidence_score ?? 0) ? a : b;
  const other = pick === a ? b : a;

  return {
    ...pick,
    contact_person: pick.contact_person ?? other.contact_person,
    designation: pick.designation ?? other.designation,
    email: pick.email ?? other.email,
    phone: pick.phone ?? other.phone,
    website: pick.website ?? other.website,
    address: pick.address ?? other.address,
    city: pick.city ?? other.city,
    state: pick.state ?? other.state,
    country: pick.country ?? other.country,
    gstin: pick.gstin ?? other.gstin,
    industry: pick.industry ?? other.industry,
    products_services: pick.products_services ?? other.products_services,
    potential_needs: pick.potential_needs ?? other.potential_needs,
    commodities: pick.commodities ?? other.commodities,
    confidence_score: Math.max(pick.confidence_score ?? 0, other.confidence_score ?? 0),
    relevance_notes: [pick.relevance_notes, other.relevance_notes].filter(Boolean).join(' | ') || undefined,
    _provider: [pick._provider, other._provider].filter(Boolean).join('+'),
  };
}

// ── Main: discover and save ─────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function discoverAndSave(type: LeadType, supabase: any): Promise<DiscoveryResult> {
  const query = pickQuery(type);

  // Get all configured providers
  const available = PROVIDERS.filter((p) => process.env[p.keyEnv]);
  if (available.length === 0) {
    return { type, query, providers_used: [], providers_succeeded: [], discovered: 0, saved: 0, duplicates: 0 };
  }

  // Fire all providers in parallel
  const results = await Promise.allSettled(
    available.map((p) => callProvider(p, type, query)),
  );

  const succeeded: string[] = [];
  const allLeads: DiscoveredLead[] = [];

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value.leads.length > 0) {
      succeeded.push(r.value.name);
      allLeads.push(...r.value.leads);
    }
  }

  // Consolidate across providers
  const unique = consolidateLeads(allLeads);
  const discovered = allLeads.length;
  let saved = 0, duplicates = 0;

  // Save to DB with dedup against existing
  const table = type === 'supplier' ? 'supplier_leads'
    : type === 'customer' ? 'customer_leads'
    : type === 'recycler' ? 'recyclers'
    : 'trading_leads';

  for (const lead of unique) {
    const name = lead.company_name.trim();

    // Check if already in DB
    const { data: existing } = await supabase
      .from(table)
      .select('id')
      .ilike('company_name', `%${name.replace(/'/g, "''")}%`)
      .limit(1);

    if (existing && existing.length > 0) {
      duplicates++;
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: Record<string, any> = {
      company_name: name,
      contact_person: lead.contact_person ?? null,
      email: lead.email ?? null,
      phone: lead.phone ?? null,
      website: lead.website ?? null,
      address: lead.address ?? null,
      city: lead.city ?? null,
      state: lead.state ?? null,
      country: lead.country ?? 'India',
      gstin: lead.gstin ?? null,
      industry: lead.industry ?? null,
      source_type: `ai_discovery (${lead._provider ?? 'unknown'})`,
      confidence_score: lead.confidence_score ?? 50,
      relevance_notes: lead.relevance_notes ?? null,
      status: 'new',
      raw_data: lead,
    };

    if (type === 'supplier') {
      rec.products_services = lead.products_services ?? null;
    } else if (type === 'customer') {
      rec.designation = lead.designation ?? null;
      rec.potential_needs = lead.potential_needs ?? null;
      rec.estimated_value = lead.estimated_value ?? null;
    } else {
      rec.designation = lead.designation ?? null;
      rec.commodities = lead.commodities ?? null;
      rec.trade_type = lead.trade_type ?? 'both';
      rec.typical_volume = lead.typical_volume ?? null;
      rec.origin_countries = lead.origin_countries ?? null;
      rec.certifications = lead.certifications ?? null;
    }

    const { error } = await supabase.from(table).insert(rec);
    if (!error) saved++;
    else console.error('[leadDiscovery] Insert error:', error.message);
  }

  return {
    type,
    query,
    providers_used: available.map((p) => p.name),
    providers_succeeded: succeeded,
    discovered,
    saved,
    duplicates,
  };
}

// ── Auto-discovery: rotates type per day ────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function autoDiscover(supabase: any): Promise<DiscoveryResult> {
  const types: LeadType[] = ['supplier', 'customer', 'trading'];
  const dayIndex = new Date().getDate() % 3;
  return discoverAndSave(types[dayIndex], supabase);
}
