import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getCurrentUser, requireAuth } from '@/lib/auth';
import { enrichUserData } from '@/lib/clay';

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

    // Check if already queued or enriched
    // Handle both old 'enriched' column and new 'enrichment_status' column
    const enrichmentStatus = entry.enrichment_status || (entry.enriched ? 'enriched' : 'pending');
    if (enrichmentStatus === 'queued' || enrichmentStatus === 'enriched') {
      return NextResponse.json(
        { error: `Entry has already been ${enrichmentStatus === 'enriched' ? 'enriched' : 'queued for enrichment'}` },
        { status: 400 }
      );
    }

    // Prepare data to send to Clay
    const enrichmentPayload: Record<string, any> = {
      email: entry.email,
      name: entry.name,
    };

    if (entry.phone_number) enrichmentPayload.phone_number = entry.phone_number;
    if (entry.job_title) enrichmentPayload.job_title = entry.job_title;
    if (entry.company_size) enrichmentPayload.company_size = entry.company_size;
    if (entry.budget) enrichmentPayload.budget = entry.budget;

    // Queue entry for enrichment by sending to Clay.com webhook
    // Note: This doesn't return enriched data immediately - Clay will send it back via webhook
    const success = await enrichUserData(enrichmentPayload);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to queue entry for enrichment. Please try again later.' },
        { status: 500 }
      );
    }

    // Mark entry as queued (not enriched yet - Clay will send data back via webhook)
    const updateStmt = db.prepare('UPDATE user_entries SET enrichment_status = \'queued\' WHERE id = ?');
    updateStmt.run(entryId);

    return NextResponse.json(
      { message: 'Entry queued for enrichment successfully. Enriched data will be received via webhook callback.' },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Enrich entry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

