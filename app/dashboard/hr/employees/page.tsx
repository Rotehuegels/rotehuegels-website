// app/dashboard/hr/employees/page.tsx

import { supabaseServer } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';

export default async function EmployeesPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Employees</h1>

      <p className="mt-2">
        HR Employee Management Module
      </p>
    </main>
  );
}