# Buddy Handoff → Claude
Generated: 2026-04-13
Agent: Claude

## Session 13 Apr 2026 — Multi-AI Lead Discovery

### What was built
- **Multi-AI lead discovery system** (`lib/leadDiscovery.ts`) — replaces the old web crawler
  - Fires 6 free-tier AI providers in parallel: Groq, Gemini, Mistral, Cerebras, Together, OpenRouter
  - Returns fully-populated company profiles (no web scraping needed)
  - Consolidates + deduplicates results across providers
  - Merges partial data (e.g., Groq has email, Gemini has phone → merged record)
  - Supports 3 lead types: suppliers, customers, trading partners

- **Trading leads table** (`supabase/migrations/20260413_trading_leads.sql`)
  - New table with commodities, trade_type, typical_volume, origin_countries, certifications

- **API route** `/api/leads/discover` — on-demand lead discovery endpoint

- **Updated intelligence page** — 3 tabs (supplier/customer/trading), 6 KPI cards, auto-discovery on dashboard login via sessionStorage

- **Updated lead detail page** — full trading lead support with commodities, trade type, volume, certifications

- **Security fixes** — API table allowlist validation, UUID format validation

- **Cron swap** — replaced crawl cron with stock-analysis cron in vercel.json (crawl no longer needed as a cron)

- **Health check** — now shows all 6 AI providers status

### Key decisions
- On-login discovery eliminates need for frequent crons
- Daily type rotation: supplier → customer → trading (based on day of month)
- Query rotation: different queries each login (day × hour seed)
- LLM temperature 0.3 for factual accuracy, json_object response format
- Groq 70b model for better quality vs 8b used in old crawler
- Vercel free tier now used: stock-analysis (daily) + reminders (weekly)

### Environment variables needed for new providers
```
GROQ_API_KEY=...       (already exists)
GEMINI_API_KEY=...     (new — get from Google AI Studio)
MISTRAL_API_KEY=...    (new — get from La Plateforme)
CEREBRAS_API_KEY=...   (new — get from cerebras.ai)
TOGETHER_API_KEY=...   (new — get from together.ai)
OPENROUTER_API_KEY=... (new — get from openrouter.ai)
```
System works with even just 1 provider configured. More = more diverse results.

### Supabase migration needed
Run `supabase/migrations/20260413_trading_leads.sql` in the SQL editor before deploying.

### Pending for next session
1. **Run the migration** — create trading_leads table in Supabase SQL editor
2. **Add API keys** — sign up for free tiers and add to Vercel env vars
3. **Test discovery** — login to dashboard, verify auto-discovery triggers
4. **Test client portal** — create real client account, test full project flow
5. **Test operations portal** — log first production entry
