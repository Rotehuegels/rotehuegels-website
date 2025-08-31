import { NextResponse } from 'next/server'
import { parseStringPromise } from 'xml2js'

const FEEDS = [
  // Add/adjust feeds as needed:
  'https://news.google.com/rss/search?q=copper+price&hl=en-IN&gl=IN&ceid=IN:en',
  'https://www.mining.com/feed/',
  'https://www.businesstoday.in/rssfeeds/?id=104', // commodities
];

export async function GET(){
  const items:any[] = [];
  for(const url of FEEDS){
    try{
      const res = await fetch(url, { cache: 'no-store' });
      const xml = await res.text();
      const parsed:any = await parseStringPromise(xml);
      const rssItems = parsed?.rss?.channel?.[0]?.item || parsed?.feed?.entry || [];
      for(const it of rssItems.slice(0,5)){
        const title = it.title?.[0] || it.title || '';
        const link = (it.link?.[0]?.$.href) || it.link?.[0] || it.link || '';
        const pub = it.pubDate?.[0] || it.updated?.[0] || '';
        items.push({ title, link, pubDate: pub, source: url });
      }
    }catch(e){
      items.push({ title: `Error loading ${url}`, link: '', pubDate: '', source: url })
    }
  }
  return NextResponse.json({ items })
}
