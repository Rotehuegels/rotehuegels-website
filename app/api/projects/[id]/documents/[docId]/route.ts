import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET — generate signed download URL
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const { docId } = await params;

  const { data: doc } = await supabaseAdmin
    .from('project_documents')
    .select('storage_path, file_name')
    .eq('id', docId)
    .single();

  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  const { data: signedUrl, error } = await supabaseAdmin.storage
    .from('project-documents')
    .createSignedUrl(doc.storage_path, 3600); // 1 hour expiry

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ url: signedUrl.signedUrl, file_name: doc.file_name });
}

// DELETE — remove document
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const { docId } = await params;

  const { data: doc } = await supabaseAdmin
    .from('project_documents')
    .select('storage_path')
    .eq('id', docId)
    .single();

  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  // Delete from storage
  await supabaseAdmin.storage
    .from('project-documents')
    .remove([doc.storage_path]);

  // Delete metadata
  await supabaseAdmin
    .from('project_documents')
    .delete()
    .eq('id', docId);

  return NextResponse.json({ success: true });
}
