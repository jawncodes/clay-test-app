import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getCurrentUser, requireAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    requireAuth(user);

    const entryId = parseInt(params.id, 10);
    if (isNaN(entryId)) {
      return NextResponse.json(
        { error: 'Invalid entry ID' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Verify entry belongs to user
    const checkStmt = db.prepare('SELECT * FROM user_entries WHERE id = ? AND user_id = ?');
    const entry = checkStmt.get(entryId, user.id) as any;

    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Clear enrichment data - reset to pending status
    const updateStmt = db.prepare(`
      UPDATE user_entries
      SET enrichment_status = 'pending',
          enriched_at = NULL,
          enrichment_data = NULL
      WHERE id = ?
    `);
    updateStmt.run(entryId);

    return NextResponse.json(
      { message: 'Enrichment data cleared successfully. Entry is now pending enrichment.' },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Clear enrichment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

