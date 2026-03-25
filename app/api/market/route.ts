import { NextResponse } from 'next/server';
import { load, type CheerioAPI, type Cheerio } from 'cheerio';

export const dynamic = 'force-dynamic';

type Quote = {
  label: string;
  price: number | null; // metals: USD/t ; gold: USD/oz
  ok: boolean;
  error?: string;
  debug?: any;
};

// ---------- helpers ----------
function parseEuroNumber(txt: string): number | null {
  // Grab the first plausible numeric token (keeps commas/dots inside)
  const m = txt.match(/-?\d[\d.,\s]*\d|-?\d/);
  if (!m) return null;
  let s = m[0].trim().replace(/\s/g, '');

  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');

  if (lastDot === -1 && lastComma === -1) {
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  // Decide decimal separator by whichever appears LAST
  if (lastDot > lastComma) {
    // US style: 3,653.30 -> remove thousands commas, keep dot as decimal
    s = s.replace(/,/g, '');
  } else if (lastComma > lastDot) {
    // EU style: 9.013,50 -> remove thousands dots, convert comma to decimal
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    // Fallback
    s = s.replace(/(?<=\d),(?=\d{3}\b)/g, '').replace(',', '.');
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

async function fetchHTML(url: string): Promise<string> {
  const r = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'Accept': 'text/html',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return await r.text();
}

// ---------- Westmetall scraper (Official LME-Prices in USD) ----------
async function scrapeWestmetallOfficial(): Promise<
  Record<string, { cash: number | null; m3: number | null }>
> {
  const url = 'https://www.westmetall.com/en/markdaten.php';
  const html = await fetchHTML(url);
  const $: CheerioAPI = load(html);

  // Find the table whose nearby text includes "Official LME-Prices" and "US Dollar"
  let target: Cheerio<any> | null = null;
  $('table').each((_, tbl) => {
    const before = $(tbl).prevAll('h1,h2,h3,h4,p,div').first().text().toLowerCase();
    const snippet = before + $(tbl).text().slice(0, 200).toLowerCase();
    if (snippet.includes('official lme-prices') && snippet.includes('us dollar')) {
      target = $(tbl);
      return false; // break
    }
  });
  if (!target) target = $('table').first();

  const out: Record<string, { cash: number | null; m3: number | null }> = {};
  target.find('tr').each((_, tr) => {
    const cells = $(tr).find('td,th');
    if (cells.length < 3) return;

    const name = $(cells[0]).text().trim();
    if (!name) return;
    // Skip header/archived rows
    if (/settlement|kasse|3\s*months|chart|table|average/i.test(name)) return;
    if (/mk|until/i.test(name)) return;

    const cashTxt = $(cells[1]).text().trim();
    const m3Txt   = $(cells[2]).text().trim();

    // Westmetall prints values already in USD/t (e.g., "9,881.00")
    const cash = parseEuroNumber(cashTxt);
    const m3   = parseEuroNumber(m3Txt);

    if (cash !== null || m3 !== null) {
      out[name.toLowerCase()] = { cash, m3 };
    }
  });

  return out;
}

// ---------- Yahoo Finance: Gold Futures (GC=F), USD/oz ----------
async function fetchGoldUSDperOz(): Promise<{ price: number | null; dbg?: any }> {
  const url = 'https://query1.finance.yahoo.com/v8/finance/chart/GC=F';
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      return { price: null, dbg: { status: res.status, body: txt.slice(0, 300) } };
    }
    const json = await res.json();
    const p = json?.chart?.result?.[0]?.meta?.regularMarketPrice ?? null;
    return { price: p !== null ? Math.round(p) : null, dbg: json?.chart?.result?.[0]?.meta };
  } catch (e: any) {
    return { price: null, dbg: { error: String(e?.message || e) } };
  }
}

// ---------- GET ----------
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const debug = searchParams.get('debug') === '1';

  try {
    const [table, gold] = await Promise.all([
      scrapeWestmetallOfficial(),
      fetchGoldUSDperOz(),
    ]);

    const wanted: Array<[label: string, key: string, which: 'cash' | 'm3']> = [
      ['LME Copper (Cash)',    'copper',    'cash'],
      ['LME Copper (3M)',      'copper',    'm3'],
      ['Aluminium (Cash)',     'aluminium', 'cash'],
      ['Aluminium (3M)',       'aluminium', 'm3'],
      ['Zinc (Cash)',          'zinc',      'cash'],
      ['Zinc (3M)',            'zinc',      'm3'],
      ['Nickel (Cash)',        'nickel',    'cash'],
      ['Nickel (3M)',          'nickel',    'm3'],
      ['Lead (Cash)',          'lead',      'cash'],
      ['Lead (3M)',            'lead',      'm3'],
      ['Tin (Cash)',           'tin',       'cash'],
      ['Tin (3M)',             'tin',       'm3'],
    ];

    const data: Quote[] = wanted.map(([label, key, which]) => {
      const row = table[key];
      const value = row ? row[which] ?? null : null; // already USD/t
      return {
        label,
        price: value !== null ? Math.round(value) : null,
        ok: value !== null,
        ...(debug ? { debug: { row: key, which, raw: row ?? null } } : {}),
      };
    });

    // Add Gold (USD/oz) from Yahoo Finance
    data.push({
      label: 'Gold (USD/oz)',
      price: gold.price,
      ok: gold.price !== null,
      ...(debug ? { debug: gold.dbg } : {}),
    });

    return NextResponse.json(
      { data },
      { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' } }
    );
  } catch (e: any) {
    return NextResponse.json({ data: [], error: String(e.message) }, { status: 500 });
  }
}
