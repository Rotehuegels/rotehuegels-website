import { NextResponse } from 'next/server';
import { load } from 'cheerio';

export const dynamic = 'force-dynamic';

type INRQuote = {
  metal: string;        // 'Gold' | 'Silver' | ...
  unit: string;         // 'INR/10g' | 'INR/kg'
  price: number | null;
  changeAbs: number | null;
  changePct: number | null;
  direction: 'up' | 'down' | null;
  asOf: string | null;  // raw timestamp from source
  source: 'MCX (via 5paisa)';
  ok: boolean;
  error?: string;
};

const TARGETS: Array<{ metal: string; slug: string; unit: string }> = [
  { metal: 'Gold',      slug: 'gold',      unit: 'INR/10g' },
  { metal: 'Silver',    slug: 'silver',    unit: 'INR/kg'  },
  { metal: 'Copper',    slug: 'copper',    unit: 'INR/kg'  },
  { metal: 'Aluminium', slug: 'aluminium', unit: 'INR/kg'  },
  { metal: 'Zinc',      slug: 'zinc',      unit: 'INR/kg'  },
  { metal: 'Lead',      slug: 'lead',      unit: 'INR/kg'  },
  { metal: 'Nickel',    slug: 'nickel',    unit: 'INR/kg'  },
];

async function fetchHTML(url: string): Promise<string> {
  const r = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-IN,en;q=0.9',
    },
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

function parseNumber(s: string): number | null {
  const cleaned = s.replace(/[^0-9.\-]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

async function scrape5paisa(slug: string): Promise<Omit<INRQuote, 'metal' | 'unit' | 'source'>> {
  const url = `https://www.5paisa.com/commodity-trading/mcx-${slug}-price`;
  try {
    const html = await fetchHTML(url);
    const $ = load(html);

    // Price: <div class="commodity-page__value">₹1,276<span class="commodity-page__valuesmall">.95</span></div>
    const valueDiv = $('.commodity-page__value').first();
    const integerText = valueDiv.contents().filter((_, n) => n.type === 'text').text();
    const decimalText = valueDiv.find('.commodity-page__valuesmall').first().text();
    const priceStr = (integerText + decimalText).trim();
    const price = parseNumber(priceStr);

    // Change: <div class="commodity-page__percentage stock--up">…1.5 (0.12%)</div>
    const pctDiv = $('.commodity-page__percentage').first();
    const pctText = pctDiv.text().trim();
    const direction: 'up' | 'down' | null =
      pctDiv.hasClass('stock--up') ? 'up' :
      pctDiv.hasClass('stock--down') ? 'down' : null;

    const m = pctText.match(/(-?[\d.,]+)\s*\(\s*(-?[\d.,]+)\s*%\s*\)/);
    const changeAbs = m ? parseNumber(m[1]) : null;
    const changePct = m ? parseNumber(m[2]) : null;

    // Date: <div class="commodity-page__date">As on 26 April, 2026 | 08:58</div>
    const asOf = $('.commodity-page__date').first().text().replace(/^As on\s*/i, '').trim() || null;

    return {
      price,
      changeAbs: changeAbs !== null && direction === 'down' ? -Math.abs(changeAbs) : changeAbs,
      changePct: changePct !== null && direction === 'down' ? -Math.abs(changePct) : changePct,
      direction,
      asOf,
      ok: price !== null,
    };
  } catch (e: any) {
    return {
      price: null, changeAbs: null, changePct: null, direction: null, asOf: null,
      ok: false, error: String(e?.message || e),
    };
  }
}

export async function GET() {
  const results = await Promise.all(
    TARGETS.map(async (t) => {
      const scraped = await scrape5paisa(t.slug);
      const quote: INRQuote = { metal: t.metal, unit: t.unit, source: 'MCX (via 5paisa)', ...scraped };
      return quote;
    })
  );

  return NextResponse.json(
    { data: results, fetchedAt: new Date().toISOString() },
    { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' } }
  );
}
