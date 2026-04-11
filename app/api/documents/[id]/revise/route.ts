import { NextRequest, NextResponse } from 'next/server';
import { createRevision } from '@/lib/documentControl';

// POST — Create new revision
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const result = await createRevision({
      documentId: id,
      changeSummary: body.changeSummary ?? 'Revised',
      changedBy: body.changedBy,
      newData: body.newData,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
