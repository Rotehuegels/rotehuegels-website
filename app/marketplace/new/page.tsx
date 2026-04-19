import Link from 'next/link';
import { ArrowLeft, PencilLine } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import ListingForm from './ListingForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Post a Listing — Marketplace · Rotehügels',
  description: 'Submit a buy or sell listing in the India Circular Economy Marketplace.',
};

const ALL_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand',
  'West Bengal',
  'Andaman & Nicobar Islands','Chandigarh','Dadra & Nagar Haveli','Daman & Diu',
  'Delhi','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry',
];

export default async function NewListingPage() {
  const { data: cats } = await supabaseAdmin.from('item_categories')
    .select('id, parent_id, group_code, label, typical_unit, sort_order')
    .eq('is_active', true)
    .order('sort_order');

  const categories = (cats ?? []).filter(c => !c.id.startsWith('_group_'));

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-6">
          <ArrowLeft className="h-3 w-3" /> Back to Marketplace
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <PencilLine className="h-7 w-7 text-emerald-400" />
          <h1 className="text-2xl font-bold">Post a Listing</h1>
        </div>
        <p className="text-sm text-zinc-500 mb-8">
          Your listing will be reviewed within 24 hours. We verify that the listing is coherent, legal, and safe to publish. Listings
          for illegal items (hazardous materials without CPCB/SPCB authorisation, stolen metal, etc.) will be rejected.
        </p>

        <ListingForm categories={categories} states={ALL_STATES} />

        <p className="text-[11px] text-zinc-600 mt-6">
          By submitting you agree to our <Link href="/terms" className="text-emerald-400 underline">Terms of Use</Link> and{' '}
          <Link href="/privacy" className="text-emerald-400 underline">Privacy Policy</Link>. Your contact information is stored with
          your listing and is visible to users viewing it. Rotehügels is a facilitator and is not party to any transaction.
        </p>
      </div>
    </div>
  );
}
