import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import EcosystemDirectory from './EcosystemDirectory';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'India Circular Economy Directory — Rotehügels',
  description:
    '1,300+ verified facilities mapped across India\'s circular economy — primary metal producers, EV OEMs, battery pack makers, and licensed recyclers. Filter by material stream, geography, and licence class. Sourced from CPCB, SPCB, MPCB, and MoEF registries.',
  alternates: { canonical: '/ecosystem' },
  openGraph: {
    title: 'India Circular Economy Directory — Rotehügels',
    description:
      '1,300+ verified facilities across India — primary producers, battery & e-waste recyclers, EV OEMs, and forward-chain players. A single searchable map for the circular value chain.',
    url: 'https://www.rotehuegels.com/ecosystem',
    type: 'website',
  },
};

// Public ecosystem page: aggregate counts + pins showing company name on hover
// (same info the govt CPCB/SPCB registries publish). What stays internal is
// contact info (email/phone), GSTIN/CIN, recycler_code, and the full profile
// page — those live under /d/ecosystem.
export default async function EcosystemPage() {
  let allRecyclers: {
    company_name: string | null;
    state: string | null;
    city: string | null;
    waste_type: string | null;
    capacity_per_month: string | null;
    black_mass_mta: number | string | null;
    latitude: number | string | null;
    longitude: number | string | null;
  }[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data } = await supabaseAdmin
      .from('recyclers')
      .select('company_name, state, city, waste_type, capacity_per_month, black_mass_mta, latitude, longitude')
      .eq('is_active', true)
      .range(from, from + pageSize - 1);
    if (!data || data.length === 0) break;
    allRecyclers = allRecyclers.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  const rawList = allRecyclers.map(r => ({
    state: r.state ?? '',
    waste_type: r.waste_type ?? 'other',
    black_mass_mta: r.black_mass_mta ? Number(r.black_mass_mta) : null,
    capacity: (() => {
      const cap = r.capacity_per_month;
      if (!cap) return 0;
      const match = cap.match(/^[\d,.]+/);
      if (!match) return 0;
      const num = parseFloat(match[0].replace(/,/g, ''));
      return (!isNaN(num) && num < 500000) ? num : 0;
    })(),
  }));

  // Pin payload: lat/lng + company_name + city/state + waste_type. No
  // recycler_code / id / contact info — so the map can't link to the
  // internal profile page or leak contact details.
  const pins = allRecyclers
    .filter(r => r.latitude != null && r.longitude != null)
    .map(r => ({
      lat: Number(r.latitude),
      lng: Number(r.longitude),
      label: r.company_name ?? 'Recycling facility',
      sub: [r.city, r.state].filter(Boolean).join(', '),
      waste_type: r.waste_type ?? undefined,
      state: r.state ?? undefined,
      black_mass_mta: r.black_mass_mta ? Number(r.black_mass_mta) : undefined,
    }));

  return <EcosystemDirectory rawList={rawList} pins={pins} />;
}
