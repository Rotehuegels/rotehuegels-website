import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';

export default async function EmployeesPage() {
  const supabase = await supabaseServer(); // ✅ FIX

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Employees</h1>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <p className="text-zinc-300">
          Employee management module will be available soon.
        </p>
      </div>
    </div>
  );
}