import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { MONTH_NAMES } from '@/lib/payroll';
import { ChevronLeft } from 'lucide-react';
import PayrollEditForm from './PayrollEditForm';

export default async function PayrollRunEditPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;

  const [{ data: run }, { data: entriesRaw }] = await Promise.all([
    supabaseAdmin.from('payroll_runs').select('*').eq('id', runId).single(),
    supabaseAdmin
      .from('payroll_entries')
      .select('*, employees(full_name, role, department)')
      .eq('run_id', runId)
      .order('created_at'),
  ]);

  if (!run) notFound();
  if (run.status === 'paid') redirect(`/d/payroll/${runId}`);

  const entries = entriesRaw ?? [];

  return (
    <div className="p-5 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/d/payroll/${runId}`} className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">
            Edit — {MONTH_NAMES[run.month]} {run.year}
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Edit individual slip amounts. Totals recalculate automatically.
          </p>
        </div>
      </div>

      <PayrollEditForm runId={runId} month={run.month} entries={entries} />
    </div>
  );
}
