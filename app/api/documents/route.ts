import { NextRequest, NextResponse } from 'next/server';
import { registerDocument } from '@/lib/documentControl';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// POST — Register new document
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await registerDocument(body);
    return NextResponse.json(result, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

// GET — List documents with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const docType = searchParams.get('type');
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const q = searchParams.get('q');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100', 10), 500);

    let query = supabaseAdmin
      .from('document_registry')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (docType) query = query.eq('doc_type', docType);
    if (status) query = query.eq('status', status);
    if (department) query = query.eq('department', department);
    if (q) query = query.or(`doc_number.ilike.%${q}%,title.ilike.%${q}%`);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json(data ?? []);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
