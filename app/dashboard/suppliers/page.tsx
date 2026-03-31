import { supabaseAdmin } from '@/lib/supabaseAdmin';
import SupplierList from './SupplierList';

export default async function SuppliersPage() {
  const { data: suppliers } = await supabaseAdmin
    .from('suppliers')
    .select('id, legal_name, trade_name, gstin, gst_status, entity_type, address, state, pincode')
    .order('legal_name');

  return (
    <div className="p-8">
      <SupplierList suppliers={suppliers ?? []} />
    </div>
  );
}
