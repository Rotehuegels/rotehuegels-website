import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET — redirect to signed download URL
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const { docId } = await params;

  const { data: doc } = await supabaseAdmin
    .from('project_documents')
    .select('storage_path')
    .eq('id', docId)
    .single();

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: signedUrl, error } = await supabaseAdmin.storage
    .from('project-documents')
    .createSignedUrl(doc.storage_path, 300); // 5 min

  if (error || !signedUrl) return NextResponse.json({ error: 'Failed to generate download' }, { status: 500 });

  return NextResponse.redirect(signedUrl.signedUrl);
}
