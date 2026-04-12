export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export interface SearchResult {
  type: string;
  id: string;
  label: string;
  sublabel?: string;
  href: string;
}

export async function GET(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const term = `%${q}%`;

  const [
    ordersRes,
    customersRes,
    quotesRes,
    suppliersRes,
    expensesRes,
    engagementsRes,
  ] = await Promise.all([
    // Orders
    supabaseAdmin
      .from('orders')
      .select('id, order_no, client_name, description')
      .or(`order_no.ilike.${term},client_name.ilike.${term},description.ilike.${term}`)
      .neq('status', 'cancelled')
      .limit(5),

    // Customers
    supabaseAdmin
      .from('customers')
      .select('id, customer_id, name, gstin')
      .or(`name.ilike.${term},customer_id.ilike.${term},gstin.ilike.${term}`)
      .limit(5),

    // Quotes
    supabaseAdmin
      .from('quotes')
      .select('id, quote_no, customer_id')
      .ilike('quote_no', term)
      .limit(5),

    // Suppliers (accounts suppliers)
    supabaseAdmin
      .from('suppliers')
      .select('id, legal_name, vendor_code, gstin')
      .or(`legal_name.ilike.${term},vendor_code.ilike.${term},gstin.ilike.${term}`)
      .limit(5),

    // Expenses
    supabaseAdmin
      .from('expenses')
      .select('id, description, vendor_name, expense_date')
      .or(`description.ilike.${term},vendor_name.ilike.${term}`)
      .limit(5),

    // Employees via engagements joined to rex_members
    supabaseAdmin
      .from('employees')
      .select('id, role, department, rex_members(rex_id, full_name, email)')
      .or(`role.ilike.${term},department.ilike.${term}`)
      .limit(5),
  ]);

  const results: SearchResult[] = [];

  // Orders
  for (const o of ordersRes.data ?? []) {
    results.push({
      type: 'Order',
      id: o.id,
      label: o.order_no,
      sublabel: o.client_name + (o.description ? ` — ${o.description}` : ''),
      href: `/d/orders/${o.id}`,
    });
  }

  // Customers
  for (const c of customersRes.data ?? []) {
    results.push({
      type: 'Customer',
      id: c.id,
      label: c.name,
      sublabel: [c.customer_id, c.gstin].filter(Boolean).join(' · '),
      href: `/d/customers/${c.id}`,
    });
  }

  // Quotes
  for (const q of quotesRes.data ?? []) {
    results.push({
      type: 'Quote',
      id: q.id,
      label: q.quote_no,
      sublabel: q.customer_id,
      href: `/d/quotes/${q.id}`,
    });
  }

  // Suppliers
  for (const s of suppliersRes.data ?? []) {
    results.push({
      type: 'Supplier',
      id: s.id,
      label: s.legal_name,
      sublabel: [s.vendor_code, s.gstin].filter(Boolean).join(' · '),
      href: `/d/suppliers/${s.id}`,
    });
  }

  // Expenses
  for (const e of expensesRes.data ?? []) {
    results.push({
      type: 'Expense',
      id: e.id,
      label: e.description,
      sublabel: [e.vendor_name, e.expense_date].filter(Boolean).join(' · '),
      href: `/d/expenses`,
    });
  }

  // Employees
  for (const eng of engagementsRes.data ?? []) {
    // rex_members may be an array or object depending on join type
    const member = Array.isArray(eng.rex_members)
      ? eng.rex_members[0]
      : eng.rex_members;
    if (!member) continue;

    // Also match on name/email for better UX — filter client-side since OR on joined table is tricky
    const haystack = [member.full_name, member.email, member.rex_id, eng.role, eng.department]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(q.toLowerCase())) continue;

    results.push({
      type: 'Employee',
      id: eng.id,
      label: member.full_name ?? member.rex_id,
      sublabel: [eng.role, eng.department].filter(Boolean).join(' · '),
      href: `/d/employees/${eng.id}`,
    });
  }

  // Re-search employees by name/email directly on rex_members for better match
  if ((engagementsRes.data ?? []).length === 0 || results.filter(r => r.type === 'Employee').length === 0) {
    const { data: memberMatches } = await supabaseAdmin
      .from('rex_members')
      .select('rex_id, full_name, email, employees(id, role, department)')
      .or(`full_name.ilike.${term},email.ilike.${term},rex_id.ilike.${term}`)
      .limit(5);

    for (const m of memberMatches ?? []) {
      const engList = Array.isArray(m.employees) ? m.employees : (m.employees ? [m.employees] : []);
      for (const eng of engList) {
        if (results.some(r => r.id === eng.id)) continue;
        results.push({
          type: 'Employee',
          id: eng.id,
          label: m.full_name ?? m.rex_id,
          sublabel: [eng.role, eng.department].filter(Boolean).join(' · '),
          href: `/d/employees/${eng.id}`,
        });
      }
    }
  }

  // Cap at 20 total
  return NextResponse.json({ results: results.slice(0, 20) });
}
