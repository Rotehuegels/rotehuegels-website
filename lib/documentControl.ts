// lib/documentControl.ts — IMS Document Control (ISO 9001:2015 §7.5)

import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ── Document type codes for numbering ────────────────────────────────────────
const DOC_TYPE_CODES: Record<string, string> = {
  invoice: 'INV',
  quote: 'QT',
  purchase_order: 'PO',
  proforma: 'PI',
  pl_statement: 'PL',
  gst_report: 'GST',
  customer_statement: 'CS',
  policy: 'POL',
  procedure: 'SOP',
  form: 'FRM',
  record: 'REC',
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function currentFY(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-based
  if (month >= 4) {
    return `${String(year).slice(2)}-${String(year + 1).slice(2)}`;
  }
  return `${String(year - 1).slice(2)}-${String(year).slice(2)}`;
}

// ── Generate next document number ────────────────────────────────────────────
// Format: RH/{TYPE_CODE}/{FY}/{SEQ padded to 3}/R0
export async function generateDocNumber(
  docType: string,
  fy?: string,
): Promise<string> {
  const fyStr = fy ?? currentFY();
  const code = DOC_TYPE_CODES[docType] ?? docType.toUpperCase().slice(0, 3);

  // Atomically increment the sequence
  const { data: existing } = await supabaseAdmin
    .from('document_sequences')
    .select('id, last_seq')
    .eq('doc_type', docType)
    .eq('fy', fyStr)
    .maybeSingle();

  let seq: number;
  if (existing) {
    seq = existing.last_seq + 1;
    await supabaseAdmin
      .from('document_sequences')
      .update({ last_seq: seq })
      .eq('id', existing.id);
  } else {
    seq = 1;
    await supabaseAdmin
      .from('document_sequences')
      .insert({ doc_type: docType, fy: fyStr, last_seq: seq });
  }

  return `RH/${code}/${fyStr}/${String(seq).padStart(3, '0')}/R0`;
}

// ── Register a new document ──────────────────────────────────────────────────
export async function registerDocument(params: {
  docType: string;
  title: string;
  description?: string;
  entityType?: string;
  entityId?: string;
  preparedBy?: string;
  department?: string;
  classification?: string;
  contentSnapshot?: Record<string, unknown>;
  retentionYears?: number;
  tags?: string[];
}): Promise<{ docNumber: string; documentId: string }> {
  const docNumber = await generateDocNumber(params.docType);

  const retYears = params.retentionYears ?? 7;
  const now = new Date();
  const expiry = new Date(now);
  expiry.setFullYear(expiry.getFullYear() + retYears);

  const { data, error } = await supabaseAdmin
    .from('document_registry')
    .insert({
      doc_number: docNumber,
      doc_type: params.docType,
      title: params.title,
      description: params.description ?? null,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
      prepared_by: params.preparedBy ?? null,
      department: params.department ?? null,
      classification: params.classification ?? 'internal',
      content_snapshot: params.contentSnapshot ?? null,
      retention_years: retYears,
      retention_expiry: expiry.toISOString().slice(0, 10),
      tags: params.tags ?? null,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to register document: ${error.message}`);

  // Create initial revision record
  await supabaseAdmin.from('document_revisions').insert({
    document_id: data.id,
    version: 1,
    revision: 'R0',
    status: 'draft',
    change_summary: 'Initial creation',
    changed_by: params.preparedBy ?? null,
    new_data: params.contentSnapshot ?? null,
  });

  return { docNumber, documentId: data.id };
}

// ── Create a new revision ────────────────────────────────────────────────────
export async function createRevision(params: {
  documentId: string;
  changeSummary: string;
  changedBy?: string;
  newData?: Record<string, unknown>;
}): Promise<{ version: number; revision: string }> {
  // Fetch current state
  const { data: doc, error: fetchErr } = await supabaseAdmin
    .from('document_registry')
    .select('*')
    .eq('id', params.documentId)
    .single();

  if (fetchErr || !doc) throw new Error('Document not found');

  const newVersion = doc.version + 1;
  const newRevision = `R${newVersion - 1}`;
  const newDocNumber = doc.doc_number.replace(/\/R\d+$/, `/${newRevision}`);

  // Update the main document
  await supabaseAdmin
    .from('document_registry')
    .update({
      version: newVersion,
      revision: newRevision,
      doc_number: newDocNumber,
      change_summary: params.changeSummary,
      content_snapshot: params.newData ?? doc.content_snapshot,
      status: 'draft', // revisions reset to draft
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.documentId);

  // Log revision
  await supabaseAdmin.from('document_revisions').insert({
    document_id: params.documentId,
    version: newVersion,
    revision: newRevision,
    status: 'draft',
    change_summary: params.changeSummary,
    changed_by: params.changedBy ?? null,
    previous_data: doc.content_snapshot,
    new_data: params.newData ?? null,
  });

  return { version: newVersion, revision: newRevision };
}

// ── Submit for review ────────────────────────────────────────────────────────
export async function submitForReview(
  documentId: string,
  submittedBy: string,
): Promise<void> {
  const { data: doc } = await supabaseAdmin
    .from('document_registry')
    .select('status, version, revision')
    .eq('id', documentId)
    .single();

  if (!doc) throw new Error('Document not found');
  if (doc.status !== 'draft') throw new Error('Only draft documents can be submitted for review');

  await supabaseAdmin
    .from('document_registry')
    .update({
      status: 'under_review',
      reviewed_by: submittedBy,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', documentId);

  await supabaseAdmin.from('document_revisions').insert({
    document_id: documentId,
    version: doc.version,
    revision: doc.revision,
    status: 'under_review',
    change_summary: 'Submitted for review',
    changed_by: submittedBy,
  });
}

// ── Approve a document ───────────────────────────────────────────────────────
export async function approveDocument(
  documentId: string,
  approvedBy: string,
  notes?: string,
): Promise<void> {
  const { data: doc } = await supabaseAdmin
    .from('document_registry')
    .select('status, version, revision')
    .eq('id', documentId)
    .single();

  if (!doc) throw new Error('Document not found');
  if (doc.status !== 'under_review') throw new Error('Only documents under review can be approved');

  await supabaseAdmin
    .from('document_registry')
    .update({
      status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      approval_notes: notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', documentId);

  await supabaseAdmin.from('document_revisions').insert({
    document_id: documentId,
    version: doc.version,
    revision: doc.revision,
    status: 'approved',
    change_summary: notes ? `Approved: ${notes}` : 'Document approved',
    changed_by: approvedBy,
  });
}

// ── Obsolete a document ──────────────────────────────────────────────────────
export async function obsoleteDocument(
  documentId: string,
  reason: string,
): Promise<void> {
  const { data: doc } = await supabaseAdmin
    .from('document_registry')
    .select('version, revision')
    .eq('id', documentId)
    .single();

  if (!doc) throw new Error('Document not found');

  await supabaseAdmin
    .from('document_registry')
    .update({
      status: 'obsolete',
      updated_at: new Date().toISOString(),
    })
    .eq('id', documentId);

  await supabaseAdmin.from('document_revisions').insert({
    document_id: documentId,
    version: doc.version,
    revision: doc.revision,
    status: 'obsolete',
    change_summary: `Obsoleted: ${reason}`,
    changed_by: null,
  });
}

// ── Get document with full revision history ──────────────────────────────────
export async function getDocumentWithHistory(documentId: string) {
  const { data: doc, error } = await supabaseAdmin
    .from('document_registry')
    .select('*')
    .eq('id', documentId)
    .single();

  if (error || !doc) throw new Error('Document not found');

  const { data: revisions } = await supabaseAdmin
    .from('document_revisions')
    .select('*')
    .eq('document_id', documentId)
    .order('changed_at', { ascending: false });

  return { ...doc, revisions: revisions ?? [] };
}

// ── Get all documents for an entity ──────────────────────────────────────────
export async function getEntityDocuments(
  entityType: string,
  entityId: string,
) {
  const { data, error } = await supabaseAdmin
    .from('document_registry')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch entity documents: ${error.message}`);
  return data ?? [];
}
