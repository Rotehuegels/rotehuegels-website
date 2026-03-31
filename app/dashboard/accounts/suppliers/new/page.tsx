import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AddSupplierForm from '../AddSupplierForm';

export default function NewSupplierPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <Link href="/dashboard/accounts/suppliers"
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Suppliers
        </Link>
        <h1 className="text-2xl font-black text-white">Add Supplier</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Enter a GSTIN to auto-fetch company details from the GST portal.
        </p>
      </div>
      <AddSupplierForm />
    </div>
  );
}
