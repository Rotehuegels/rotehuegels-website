import { NextRequest, NextResponse } from 'next/server';
import {
  getDocumentWithHistory,
  submitForReview,
  approveDocument,
  obsoleteDocument,
} from '@/lib/documentControl';

// GET — Document detail + revision history
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const doc = await getDocumentWithHistory(id);
    return NextResponse.json(doc);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 404 });
  }
}

// PATCH — Update status (review, approve, obsolete)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, user, notes, reason } = body as {
      action: string;
      user?: string;
      notes?: string;
      reason?: string;
    };

    switch (action) {
      case 'submit_review':
        await submitForReview(id, user ?? 'system');
        break;
      case 'approve':
        await approveDocument(id, user ?? 'system', notes);
        break;
      case 'obsolete':
        await obsoleteDocument(id, reason ?? 'No reason provided');
        break;
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
