import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const BudgetSchema = z.object({
  fiscal_year: z.string(),
  department: z.string().min(1),
  category: z.enum(['operating', 'capital', 'project']).default('operating'),
  budget_amount: z.number().min(0),
  notes: z.string().optional(),
});

// GET — list all budgets, optionally filtered by FY
export async function GET(req: Request) {
  const url = new URL(req.url);
  const fy = url.searchParams.get('fy');

  let query = supabaseAdmin.from('budgets').select('*').order('department');
  if (fy) query = query.eq('fiscal_year', fy);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch actual expenses by department for variance calc
  if (fy) {
    const [startYear] = fy.split('-').map(Number);
    const from = `${startYear}-04-01`;
    const to = `${startYear + 1}-03-31`;
    const { data: expenses } = await supabaseAdmin
      .from('expenses')
      .select('category, amount')
      .gte('expense_date', from)
      .lte('expense_date', to);

    const actualByDept: Record<string, number> = {};
    for (const e of expenses ?? []) {
      const dept = e.category ?? 'Other';
      actualByDept[dept] = (actualByDept[dept] ?? 0) + (e.amount ?? 0);
    }

    const enriched = (data ?? []).map(b => ({
      ...b,
      actual_amount: actualByDept[b.department] ?? 0,
      variance: b.budget_amount - (actualByDept[b.department] ?? 0),
      utilization_pct: b.budget_amount > 0
        ? Math.round(((actualByDept[b.department] ?? 0) / b.budget_amount) * 100)
        : 0,
    }));
    return NextResponse.json({ data: enriched });
  }

  return NextResponse.json({ data });
}

// POST — create or update budget
export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = BudgetSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('budgets')
    .upsert(
      { ...parsed.data, created_by: user.id },
      { onConflict: 'fiscal_year,department,category' },
    )
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logAudit({
    userId: user.id, userEmail: user.email ?? undefined,
    action: 'create', entityType: 'budget', entityId: data.id,
    entityLabel: `Budget ${parsed.data.department} ${parsed.data.fiscal_year}`,
  });

  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}
