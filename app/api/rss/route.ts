import { NextResponse } from 'next/server'
import { parseStringPromise } from 'xml2js'

/**
 * Feeds that generally fetch well from serverless (Vercel).
 * You can add/remove sources as you like.
 */
const FEEDS = [
  'https://www.reuters.com/markets/commodities/rss',
  'https://economictimes.indiatimes.com/rssfeeds/1898055.cms',
  'https://www.kitco.com/rss/metals.xml',
];

export async function GET() {
  const items: any[] = [];

  for (const url of FEEDS) {
    try {
      // Some hosts reject requests without a user-agent
      const res = await fetch(url, {
        cache: 'no-store',
        headers: { 'user-agent': 'Mozilla/5.0; Rotehuegels RSS fetcher' },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      const parsed: any = await parseStringPromise(xml);

      // Handle RSS 2.0 (rss.channel.item) and Atom (feed.entry)
      const rssItems =
        parsed?.rss?.channel?.[0]?.item ??
        parsed?.feed?.entry ??
        [];

      for (const it of rssItems.slice(0, 5)) {
        const title = it.title?.[0]?._ ?? it.title?.[0] ?? it.title ?? '';
        // Atom link could be an array of objects with $.href
        const link =
          it.link?.[0]?.$.href ??
          it.link?.[0] ??
          it.link ??
          '';
        const pub =
          it.pubDate?.[0] ??
          it.updated?.[0] ??
          it.published?.[0] ??
          '';

        items.push({ title, link, pubDate: pub, source: url });
      }
    } catch (e) {
      items.push({
        title: `Error loading ${url}`,
        link: '',
        pubDate: '',
        source: url,
      });
    }
  }

  return NextResponse.json({ items });
}