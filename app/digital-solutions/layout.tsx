import type { Metadata } from 'next';
import JsonLd, { softwareSchema, breadcrumbSchema } from '@/components/JsonLd';

const DESCRIPTION = 'AutoREX is the Rotehügels industrial software platform — AutoREX™ for plant automation and digital twin, Operon for ERP, and LabREX for LIMS. Deploy any module independently; the suite shares a single identity layer, audit trail, and document store.';

export const metadata: Metadata = {
  title: 'AutoREX Suite — Automation · ERP · LIMS · Rotehügels',
  description: DESCRIPTION,
  alternates: { canonical: '/digital-solutions' },
  openGraph: {
    title: 'AutoREX Suite — Industrial software for plants',
    description: DESCRIPTION,
    url: 'https://www.rotehuegels.com/digital-solutions',
    type: 'website',
  },
};

export default function DigitalSolutionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={softwareSchema({
        name: 'AutoREX Suite',
        description: DESCRIPTION,
        path: '/digital-solutions',
        category: 'BusinessApplication',
        subCategory: 'Industrial Software Platform',
      })} />
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'AutoREX', path: '/digital-solutions' },
      ])} />
      {children}
    </>
  );
}
