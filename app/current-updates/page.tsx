'use client';
import { useEffect, useState } from 'react'

type Item = { title: string; link: string; pubDate: string; source: string }

const FEEDS = [
  // Use reliable sources; you can add more
  'https://www.reuters.com/markets/commodities/rss',
  'https://www.kitco.com/rss/metals.xml',
  'https://economictimes.indiatimes.com/rssfeeds/1898055.cms',
]

// Fetch a single RSS feed via public CORS proxy and parse on the client
async function fetchFeed(url: string): Promise<Item[]> {
  const proxy = 'https://api.allorigins.win/get?url=' + encodeURIComponent(url)
  const res = await fetch(proxy, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json() as { contents: string }
  const xml = data.contents

  const doc = new DOMParser().parseFromString(xml, 'text/xml')

  // Support both RSS 2.0 and Atom
  const rssItems = Array.from(doc.querySelectorAll('item'))
  const atomItems = Array.from(doc.querySelectorAll('entry'))
  const items: Item[] = []

  if (rssItems.length) {
    for (const it of rssItems.slice(0, 5)) {
      const title = it.querySelector('title')?.textContent?.trim() || ''
      const link = it.querySelector('link')?.textContent?.trim() || ''
      const pub = it.querySelector('pubDate')?.textContent?.trim() || ''
      items.push({ title, link, pubDate: pub, source: url })
    }
  } else if (atomItems.length) {
    for (const it of atomItems.slice(0, 5)) {
      const title = it.querySelector('title')?.textContent?.trim() || ''
      const link =
        (it.querySelector('link')?.getAttribute('href') || '').trim()
      const pub =
        it.querySelector('updated')?.textContent?.trim() ||
        it.querySelector('published')?.textContent?.trim() ||
        ''
      items.push({ title, link, pubDate: pub, source: url })
    }
  }

  return items
}

export default function CurrentUpdates() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const all: Item[] = []
        for (const url of FEEDS) {
          try {
            const part = await fetchFeed(url)
            all.push(...part)
          } catch {
            all.push({ title: `Error loading ${url}`, link: '', pubDate: new Date().toISOString(), source: url })
          }
        }
        // sort newest first if dates exist
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