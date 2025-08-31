'use client';
import { useEffect, useState } from 'react'

type Item = { title: string; link: string; pubDate: string; source: string }

const FEEDS = [
  'https://www.reuters.com/markets/commodities/rss',
  'https://www.kitco.com/rss/metals.xml',
  'https://economictimes.indiatimes.com/rssfeeds/1898055.cms',
];

async function tryRss2Json(url: string): Promise<Item[]> {
  const api = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(url)
  const res = await fetch(api, { cache: 'no-store' })
  if (!res.ok) throw new Error(`rss2json HTTP ${res.status}`)
  const data = await res.json() as any
  if (!data.items) throw new Error('rss2json no items')
  return (data.items as any[]).slice(0, 6).map(it => ({
    title: (it.title || '').trim(),
    link: (it.link || it.guid || '').trim(),
    pubDate: (it.pubDate || it.pubDate_dt || it.pubDate_t || it.pubDateRaw || ''),
    source: url,
  }))
}

async function tryFeed2Json(url: string): Promise<Item[]> {
  const api = 'https://feed2json.org/convert?url=' + encodeURIComponent(url)
  const res = await fetch(api, { cache: 'no-store' })
  if (!res.ok) throw new Error(`feed2json HTTP ${res.status}`)
  const data = await res.json() as any
  const items = (data.items || []) as any[]
  if (!items.length) throw new Error('feed2json no items')
  return items.slice(0, 6).map(it => ({
    title: (it.title || '').trim(),
    link: (it.url || it.external_url || '').trim(),
    pubDate: (it.date_published || it.date_modified || ''),
    source: url,
  }))
}

async function tryAllOrigins(url: string): Promise<Item[]> {
  const api = 'https://api.allorigins.win/get?url=' + encodeURIComponent(url)
  const res = await fetch(api, { cache: 'no-store' })
  if (!res.ok) throw new Error(`allorigins HTTP ${res.status}`)
  const data = await res.json() as { contents: string }
  const xml = data.contents
  const doc = new DOMParser().parseFromString(xml, 'text/xml')

  const out: Item[] = []
  const rssItems = Array.from(doc.querySelectorAll('item'))
  const atomItems = Array.from(doc.querySelectorAll('entry'))

  if (rssItems.length) {
    for (const it of rssItems.slice(0, 6)) {
      out.push({
        title: it.querySelector('title')?.textContent?.trim() || '',
        link: it.querySelector('link')?.textContent?.trim() || '',
        pubDate: it.querySelector('pubDate')?.textContent?.trim() || '',
        source: url,
      })
    }
  } else if (atomItems.length) {
    for (const it of atomItems.slice(0, 6)) {
      out.push({
        title: it.querySelector('title')?.textContent?.trim() || '',
        link: (it.querySelector('link')?.getAttribute('href') || '').trim(),
        pubDate:
          it.querySelector('updated')?.textContent?.trim() ||
          it.querySelector('published')?.textContent?.trim() ||
          '',
        source: url,
      })
    }
  }
  if (!out.length) throw new Error('allorigins no items')
  return out
}

async function fetchFeed(url: string): Promise<Item[]> {
  // Try 1 → 2 → 3; stop at first success
  try { return await tryRss2Json(url) } catch {}
  try { return await tryFeed2Json(url) } catch {}
  try { return await tryAllOrigins(url) } catch {}
  return [{ title: `Error loading ${url}`, link: '', pubDate: new Date().toISOString(), source: url }]
}

export default function CurrentUpdates() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const all: Item[] = []
        for (const url of FEEDS) {
          const part = await fetchFeed(url)
          all.push(...part)
        }
        all.sort((a, b) => (new Date(b.pubDate).getTime() || 0) - (new Date(a.pubDate).getTime() || 0))
        setItems(all)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <section className="container mt-10">
      <h1>Current Updates</h1>
      <p className="opacity-80 mt-2">Live market news aggregated from public RSS feeds. (Free & open-source approach.)</p>
      {loading ? <p className="mt-6">Loading…</p> : (
        items.length ? (
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            {items.map((it, idx) => (
              <a key={idx} href={it.link || '#'} className="card no-underline" target="_blank" rel="noreferrer">
                <h3 className="line-clamp-2">{it.title || '—'}</h3>
                <p className="opacity-70 text-sm mt-2">
                  {it.pubDate ? new Date(it.pubDate).toLocaleString() : '—'}
                </p>
                <p className="opacity-60 text-xs mt-1">Source: {it.source}</p>
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-6">No items available right now. Please check back shortly.</p>
        )
      )}
    </section>
  )
}