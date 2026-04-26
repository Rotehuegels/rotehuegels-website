import { supabaseAdmin } from '@/lib/supabaseAdmin';
import NewRunForm from './NewRunForm';

export default async function NewRunPage() {
  const { data } = await supabaseAdmin
    .from('employees').select('id').ilike('status', 'active');
  const activeCount = data?.length ?? 0;

  return (
    <div className="p-5 md:p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Run Payroll</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Select the pay period to generate this month's payslips.</p>
      </div>
      <NewRunForm activeCount={activeCount} />
    </div>
  );
}
