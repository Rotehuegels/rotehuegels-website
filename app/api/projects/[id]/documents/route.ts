import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET — list project documents (admin)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from('project_documents')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — upload document
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const fileType = formData.get('file_type') as string || 'other';
  const description = formData.get('description') as string || '';
  const uploadedBy = formData.get('uploaded_by') as string || 'Admin';
  const visibleToClient = formData.get('visible_to_client') !== 'false';

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  // Upload to Supabase Storage
  const ext = file.name.split('.').pop() || 'bin';
  const storagePath = `${id}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('project-documents')
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  // Create metadata record
  const { data, error } = await supabaseAdmin
    .from('project_documents')
    .insert({
      project_id: id,
      file_name: file.name,
      file_type: fileType,
      file_size: file.size,
      storage_path: storagePath,
      description: description || null,
      uploaded_by: uploadedBy,
      visible_to_client: visibleToClient,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log activity
  await supabaseAdmin.from('project_activities').insert({
    project_id: id,
    activity_type: 'document_uploaded',
    title: `Document uploaded: ${file.name}`,
    description: description || null,
    actor: uploadedBy,
    visible_to_client: visibleToClient,
  });

  return NextResponse.json(data, { status: 201 });
}
