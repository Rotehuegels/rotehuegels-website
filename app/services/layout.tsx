import type { Metadata } from 'next';
import JsonLd, { serviceSchema, breadcrumbSchema } from '@/components/JsonLd';

const DESCRIPTION = 'Rotehügels Engineering — plant EPC, custom anodes & cathodes, testwork & feasibility, operations advisory, and severe-service valves. One accountable partner from flowsheet to first pour.';

export const metadata: Metadata = {
  title: 'Engineering — Plant EPC, Electrodes, Testwork, Advisory · Rotehügels',
  description: DESCRIPTION,
  alternates: { canonical: '/services' },
  openGraph: {
    title: 'Engineering — Rotehügels',
    description: DESCRIPTION,
    url: 'https://www.rotehuegels.com/services',
    type: 'website',
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={serviceSchema({
        name: 'Rotehügels Engineering',
        description: DESCRIPTION,
        path: '/services',
        serviceType: 'Process Engineering, EPC, Metallurgical Testwork, Operations Advisory, Electrode Fabrication',
      })} />
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Engineering', path: '/services' },
      ])} />
      {children}
    </>
  );
}
