// Render schema.org structured data into the document.
// Usage: <JsonLd data={{ "@context": "https://schema.org", "@type": "...", ... }} />
// Multiple: pass a single object or compose with <JsonLd data={graph} /> where
// graph uses "@graph": [ ... ] to emit several schemas together.
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const BASE_URL = 'https://www.rotehuegels.com';
const PROVIDER = {
  '@type': 'Organization',
  '@id': `${BASE_URL}/#organization`,
  name: 'Rotehügels',
  url: BASE_URL,
} as const;

/** Build a BreadcrumbList schema from an array of {name, path} */
export function breadcrumbSchema(trail: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: `${BASE_URL}${t.path}`,
    })),
  };
}

/** Build a SoftwareApplication schema for AutoREX / Operon / LabREX. */
export function softwareSchema(opts: {
  name: string;
  description: string;
  path: string;
  category: string;
  subCategory?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: opts.name,
    applicationCategory: opts.category,
    ...(opts.subCategory ? { applicationSubCategory: opts.subCategory } : {}),
    operatingSystem: 'Web, Cloud, Edge',
    description: opts.description,
    url: `${BASE_URL}${opts.path}`,
    provider: PROVIDER,
    brand: { '@type': 'Brand', name: 'Rotehügels' },
  };
}

/** Build a Service schema for an engineering offering. */
export function serviceSchema(opts: {
  name: string;
  description: string;
  path: string;
  serviceType: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: opts.name,
    serviceType: opts.serviceType,
    description: opts.description,
    url: `${BASE_URL}${opts.path}`,
    provider: PROVIDER,
    areaServed: { '@type': 'Place', name: 'Worldwide' },
  };
}
