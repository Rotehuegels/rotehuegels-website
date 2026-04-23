import { MetadataRoute } from 'next'

// Defence-in-depth SEO control:
// 1. Every internal-only path is blocked here in robots.txt.
// 2. Each internal layout also sets robots: { index: false, follow: false }
//    so even if a crawler ignores robots.txt, the page still asks not to be indexed.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/d/',
          '/portal/',
          '/p/',
          '/tickets/',
          '/requests/',
          '/marketplace/',
          '/login',
          '/customers/verify',
          '/customers/register/pending',
          '/suppliers/register/pending',
          '/recycler/',
          '/mobile/',
        ],
      },
    ],
    sitemap: 'https://www.rotehuegels.com/sitemap.xml',
    host: 'https://www.rotehuegels.com',
  }
}
