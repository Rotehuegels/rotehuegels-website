import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { ChevronLeft, Info } from 'lucide-react';
import SalarySetupForm from './SalarySetupForm';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

export default async function SalarySetupPage() {
  const [{ data: empsRaw }, { data: structsRaw }] = await Promise.all([
    supabaseAdmin
      .from('employees')
      .select('id, role, department, basic_salary, allowance, rex_members(full_name)')
      .eq('status', 'active')
      .order('role'),
    supabaseAdmin.from('payroll_salary_structures').select('*'),
  ]);

  const employees  = empsRaw   ?? [];
  const structures = structsRaw ?? [];
  const unconfigured = employees.filter(
    (e) => !structures.find((s) => s.employee_id === e.id)
  ).length;

  return (
    <div className="p-5 md:p-8 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/payroll" className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Salary Setup</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Configure salary components per employee · {employees.length} active
            {unconfigured > 0 && <span className="text-amber-400"> · {unconfigured} not configured</span>}
          </p>
        </div>
      </div>

      {/* Info card */}
      <div className="flex items-start gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3 text-xs text-indigo-300">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p><strong>EPF</strong> — 12% of Basic (capped at ₹15,000 basic). Enable for permanent employees earning basic ≤ ₹15K or if opted in.</p>
          <p><strong>ESI</strong> — 0.75% employee / 3.25% employer. Only applicable if gross ≤ ₹21,000/mo.</p>
          <p><strong>PT</strong> — Tamil Nadu Professional Tax. Applies to all employees regardless of work location (including international assignments) — payroll is processed from HQ, Tamil Nadu. Deducted in April &amp; October only. ₹0 (HY ≤₹21K) · ₹135 (≤₹30K) · ₹315 (≤₹45K) · ₹690 (≤₹60K) · ₹1,025 (≤₹75K) · ₹1,250 (above). Max ₹2,500/year.</p>
        </div>
      </div>

      <div className={glass}>
        <div className="border-b border-zinc-800 px-5 py-3">
          <h2 className="font-semibold text-white text-sm">Employee Salary Structures</h2>
        </div>
        <div className="p-4">
          <SalarySetupForm employees={employees} structures={structures} />
        </div>
      </div>
    </div>
  );
}
