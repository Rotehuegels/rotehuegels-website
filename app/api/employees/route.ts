export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

// ── Schemas ──────────────────────────────────────────────────────────────────

const RexMemberSchema = z.object({
  rex_id:                  z.string().min(1),
  full_name:               z.string().min(2),
  date_of_birth:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  phone:                   z.string().optional(),
  email:                   z.string().email().optional().or(z.literal('')),
  address:                 z.string().optional(),
  national_id:             z.string().optional(),
  bank_name:               z.string().optional(),
  bank_account:            z.string().optional(),
  bank_ifsc:               z.string().optional(),
  emergency_contact_name:  z.string().optional(),
  emergency_contact_phone: z.string().optional(),
});

const EngagementSchema = z.object({
  rex_id:           z.string().optional(),
  employment_type:  z.enum(['full_time', 'rex_network', 'board_member']),
  rex_subtype:      z.enum(['part_time', 'consultant', 'contract', 'intern']).optional(),
  role:             z.string().min(1),
  department:       z.string().optional(),
  reporting_manager: z.string().optional(),
  basic_salary:     z.coerce.number().nonnegative().optional(),
  allowance:        z.coerce.number().nonnegative().optional(),
  bonus:            z.coerce.number().nonnegative().optional(),
  join_date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  // Personal details — used to upsert rex_members
  full_name:               z.string().min(2),
  date_of_birth:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  phone:                   z.string().optional(),
  email:                   z.string().email().optional().or(z.literal('')),
  address:                 z.string().optional(),
  national_id:             z.string().optional(),
  bank_name:               z.string().optional(),
  bank_account:            z.string().optional(),
  bank_ifsc:               z.string().optional(),
  emergency_contact_name:  z.string().optional(),
  emergency_contact_phone: z.string().optional(),
});

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ── Generate ENG-YY-NNN ───────────────────────────────────────────────────────
async function generateEngagementId(joinDate?: string): Promise<string> {
  const year = joinDate ? new Date(joinDate).getFullYear() : new Date().getFullYear();
  const yy = String(year).slice(2);

  const { data } = await supabaseAdmin
    .from('employees')
    .select('engagement_id')
    .like('engagement_id', `ENG-${yy}-%`)
    .order('engagement_id', { ascending: false })
    .limit(1);

  const last = data?.[0]?.engagement_id;
  const lastSeq = last ? parseInt(last.split('-')[2], 10) : 0;
  const next = String(lastSeq + 1).padStart(3, '0');
  return `ENG-${yy}-${next}`;
}

// ── Generate RBC-NNN ──────────────────────────────────────────────────────────
async function generateBoardMemberId(): Promise<string> {
  const { data } = await supabaseAdmin
    .from('employees')
    .select('engagement_id')
    .like('engagement_id', 'RBC-%')
    .order('engagement_id', { ascending: false })
    .limit(1);

  const last = data?.[0]?.engagement_id;
  const lastSeq = last ? parseInt(last.split('-')[1], 10) : 0;
  const next = String(lastSeq + 1).padStart(3, '0');
  return `RBC-${next}`;
}

// ── GET /api/employees ────────────────────────────────────────────────────────
export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('employees')
    .select('id, engagement_id, rex_id, role, department, employment_type, rex_subtype, status, join_date, end_date, created_at, rex_members(full_name, email, phone)')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// ── POST /api/employees ───────────────────────────────────────────────────────
export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = EngagementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const d = parsed.data;

  if (d.employment_type === 'rex_network' && !d.rex_subtype) {
    return NextResponse.json({ error: 'REX sub-type is required for REX Network employees.' }, { status: 400 });
  }

  const isBoardMember = d.employment_type === 'board_member';
  const rexId = d.rex_id ? d.rex_id.trim().toUpperCase() : null;

  // 1. Upsert rex_member only if REX ID provided
  if (rexId) {
    const { error: memberErr } = await supabaseAdmin
      .from('rex_members')
      .upsert({
        rex_id:                  rexId,
        full_name:               d.full_name,
        date_of_birth:           d.date_of_birth || null,
        phone:                   d.phone || null,
        email:                   d.email || null,
        address:                 d.address || null,
        national_id:             d.national_id || null,
        bank_name:               d.bank_name || null,
        bank_account:            d.bank_account || null,
        bank_ifsc:               d.bank_ifsc || null,
        emergency_contact_name:  d.emergency_contact_name || null,
        emergency_contact_phone: d.emergency_contact_phone || null,
      }, { onConflict: 'rex_id' });

    if (memberErr) return NextResponse.json({ error: memberErr.message }, { status: 500 });
  }

  // 2. Generate engagement ID (RBC-NNN for board members, ENG-YY-NNN for others)
  const engagementId = isBoardMember ? await generateBoardMemberId() : await generateEngagementId(d.join_date);

  // 3. Create engagement
  const { data, error } = await supabaseAdmin
    .from('employees')
    .insert([{
      engagement_id:     engagementId,
      rex_id:            rexId,
      employment_type:   d.employment_type,
      rex_subtype:       d.rex_subtype || null,
      role:              d.role,
      department:        d.department || null,
      reporting_manager: d.reporting_manager || null,
      basic_salary:      d.basic_salary ?? null,
      allowance:         d.allowance ?? null,
      bonus:             d.bonus ?? null,
      join_date:         d.join_date || new Date().toISOString().split('T')[0],
      status:            'active',
    }])
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, id: data.id, engagement_id: engagementId }, { status: 201 });
}
