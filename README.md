# Rotehuegels — Next.js Starter (App Router)

A production-ready starter for **Rotehuegel Research Business Consultancy Private Limited**.

## 📦 Tech
- Next.js 14 (App Router) + React 18
- Tailwind CSS
- Live market **TradingView** ticker (free embed)
- **RSS aggregator** API route using `xml2js` (free/open)
- Basic pages: Home, About, Services (with 3 subpages), Success Stories, Suppliers (form), Current Updates, Contact

## ▶️ Quick Start
```bash
npm install
npm run dev
# open http://localhost:3000
```

## 🚀 Deploy (Vercel)
1. Create a Vercel account and import this repo.
2. Set **Framework preset**: Next.js.
3. Deploy, then **Add Domain**: `rotehuegels.com` (and optionally `www.rotehuegels.com`).
4. In GoDaddy DNS, create the CNAMEs Vercel shows (`cname.vercel-dns.com`).

## 🔁 Live Market / News (free)
- The top **ticker** is TradingView’s free widget (no API keys).
- The **Current Updates** page calls `/api/rss`, which fetches public RSS feeds from:
  - Google News (query: copper price)
  - mining.com
  - Business Today commodities
- Edit feeds in `app/api/rss/route.ts` by changing the `FEEDS` array.

> Advanced (optional): Self-host **FreshRSS** or **Miniflux** and point one feed to your aggregator’s consolidated RSS. You can also use **RSSHub** to generate feeds where none exist.

## 📨 Email & Webmail Subdomain
- Microsoft 365 MX/SPF/DKIM/DMARC (recommended):
  - **MX**: as given by M365 admin center
  - **SPF** (TXT at root): `v=spf1 include:spf.protection.outlook.com -all`
  - **DKIM**: enable in M365 admin → create two CNAMEs as instructed
  - **DMARC** (TXT at `_dmarc`): `v=DMARC1; p=none; rua=mailto:postmaster@rotehuegels.com`
- **webmail.rotehuegels.com** (friendly URL → Outlook on the web):
  - **Option A: GoDaddy Subdomain Forwarding**: forward `webmail` → `https://outlook.office.com/mail/` (prefer 301 permanent).
  - **Option B: Host redirect**: create a tiny site (Vercel) at `webmail.rotehuegels.com` that issues a `301` to Outlook; ensures clean HTTPS and your own TLS cert.

## 🧭 Navigation
Editable in `components/Header.tsx`. Add/remove pages freely.

## 🖼️ Styling
- Theme controlled by Tailwind (see `globals.css` and `tailwind.config.ts`).
- Cards/Buttons are utility classes for speed.

## 🔐 Security & SEO
- Metadata in `app/layout.tsx` (OpenGraph, title/description).
- Consider adding security headers (can be done via `next.config.js` or Vercel settings).
- Add `sitemap.xml` and `robots.txt` (Next’s file-based routes or a small API route) if needed.

## 📝 Content
- Home hero uses the approved one-liner: “Where Research Meets Business Excellence”
- About & Contact contain the Chennai-only details and your email `sivakumar@rotehuegels.com`

## 📄 License
This starter is provided as-is for Rotehuegels internal and website use.
