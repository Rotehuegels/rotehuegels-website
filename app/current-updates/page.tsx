'use client';
import { useEffect, useState } from 'react'


type Item = { title:string; link:string; pubDate:string; source:string }

export default function CurrentUpdates(){
  const [items,setItems] = useState<Item[]>([])
  const [loading,setLoading] = useState(true)
  useEffect(()=>{
    (async()=>{
      try{
        const res = await fetch('/api/rss', { cache:'no-store' })
        const data = await res.json()
        setItems(data.items || [])
      } finally {
        setLoading(false)
      }
    })()
  },[])
  return (
    <section className="container mt-10">
      <h1>Current Updates</h1>
      <p className="opacity-80 mt-2">Live market news aggregated from public RSS feeds. (Free & open-source approach.)</p>
      {loading ? <p className="mt-6">Loading…</p> : (
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          {items.map((it, idx)=>(
            <a key={idx} href={it.link || '#'} className="card no-underline" target="_blank" rel="noreferrer">
              <h3 className="line-clamp-2">{it.title || '—'}</h3>
              <p className="opacity-70 text-sm mt-2">{new Date(it.pubDate || Date.now()).toLocaleString()}</p>
              <p className="opacity-60 text-xs mt-1">Source: {it.source}</p>
            </a>
          ))}
        </div>
      )}
    </section>
  )
}
