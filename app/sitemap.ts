import { MetadataRoute } from 'next'

// Keep this in sync with the public Header (components/Header.tsx) and
// Footer (components/Footer.tsx). Internal / auth-gated paths
// (dashboard, admin, portal, tickets, requests, marketplace, login)
// are NOT listed here — they are blocked in app/robots.ts and marked
// noindex in their layouts.
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.rotehuegels.com'

  // Homepage and company
  const home: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency'] }[] = [
    { path: '',                    priority: 1.0, changeFrequency: 'weekly'  },
    { path: '/about',              priority: 0.8, changeFrequency: 'monthly' },
    { path: '/rotehuegels-story',  priority: 0.6, changeFrequency: 'yearly'  },
    { path: '/success-stories',    priority: 0.8, changeFrequency: 'monthly' },
    { path: '/careers',            priority: 0.6, changeFrequency: 'weekly'  },
    { path: '/contact',            priority: 0.7, changeFrequency: 'yearly'  },
  ]

  // Engineering product line
  const engineering = [
    { path: '/services',                              priority: 0.9 },
    { path: '/services/plant-epc',                    priority: 0.85 },
    { path: '/services/custom-electrodes',            priority: 0.85 },
    { path: '/services/testwork-feasibility',         priority: 0.8  },
    { path: '/services/operations-advisory',          priority: 0.8  },
    { path: '/services/severe-service-valves',        priority: 0.8  },
  ].map(r => ({ ...r, changeFrequency: 'monthly' as const }))

  // AutoREX product line (digital platform)
  const autorex = [
    { path: '/digital-solutions',          priority: 0.9  },
    { path: '/digital-solutions/autorex',  priority: 0.85 },
    { path: '/digital-solutions/operon',   priority: 0.85 },
    { path: '/digital-solutions/labrex',   priority: 0.85 },
  ].map(r => ({ ...r, changeFrequency: 'monthly' as const }))

  // Circular product line
  const circular = [
    { path: '/circular',                          priority: 0.9  },
    { path: '/ecosystem',                         priority: 0.85 },
    { path: '/recycling',                         priority: 0.8  },
    { path: '/recycling/recycler-register',       priority: 0.7  },
  ].map(r => ({ ...r, changeFrequency: 'weekly' as const }))

  // Community / network
  const community = [
    { path: '/rex', priority: 0.6, changeFrequency: 'monthly' as const },
  ]

  // Registration (light priority — transactional, not discovery)
  const registration = [
    { path: '/customers/register', priority: 0.5 },
    { path: '/suppliers/register', priority: 0.5 },
    { path: '/trading/register',   priority: 0.5 },
  ].map(r => ({ ...r, changeFrequency: 'yearly' as const }))

  // Legal
  const legal = [
    { path: '/privacy',   priority: 0.3 },
    { path: '/terms',     priority: 0.3 },
    { path: '/grievance', priority: 0.3 },
  ].map(r => ({ ...r, changeFrequency: 'yearly' as const }))

  const all = [...home, ...engineering, ...autorex, ...circular, ...community, ...registration, ...legal]

  const lastModified = new Date()
  return all.map(r => ({
    url: `${baseUrl}${r.path}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))
}
