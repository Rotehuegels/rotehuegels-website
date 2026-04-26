import type { Metadata } from 'next';
import JsonLd, { serviceSchema, breadcrumbSchema } from '@/components/JsonLd';

const DESCRIPTION = 'Rotehügels Talent — corporate training and specialist recruitment for metals, recycling, and process industries. Build the team and the skills your plant actually needs.';

export const metadata: Metadata = {
  title: 'Talent — Corporate Training & Recruitment · Rotehügels',
  description: DESCRIPTION,
  alternates: { canonical: '/talent' },
  openGraph: {
    title: 'Talent — Rotehügels',
    description: DESCRIPTION,
    url: 'https://www.rotehuegels.com/talent',
    type: 'website',
  },
};

export default function TalentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={serviceSchema({
        name: 'Rotehügels Talent',
        description: DESCRIPTION,
        path: '/talent',
        serviceType: 'Corporate Training, Specialist Recruitment, Workforce Development',
      })} />
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Talent', path: '/talent' },
      ])} />
      {children}
    </>
  );
}
