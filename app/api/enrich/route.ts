import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getCurrentUser, requireAuth } from '@/lib/auth';
import { enrichUserData, storeEnrichmentData } from '@/lib/clay';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireAuth(user);

    const db = getDatabase();
    
    // Get all user entries that haven't been queued or enriched yet
    // Handle both old 'enriched' column and new 'enrichment_status' column for backward compatibility
    const stmt = db.prepare(`
      SELECT * FROM user_entries 
      WHERE user_id = ? 
      AND (enrichment_status IS NULL OR enrichment_status = 'pending')
      AND (enriched IS NULL OR enriched = 0)
    `);
    const entries = stmt.all(user.id) as any[];

    if (entries.length === 0) {
      return NextResponse.json(
        { message: 'All entries have already been queued or enriched', enrichedCount: 0 },
        { status: 200 }
      );
    }

    let enrichedCount = 0;
    const errors: string[] = [];

    // Enrich each entry
    for (const entry of entries) {
      try {
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
        const queued = await enrichUserData(enrichmentPayload);

        if (queued) {
          // Mark entry as queued (enriched data will come back via webhook)
          const updateStmt = db.prepare('UPDATE user_entries SET enrichment_status = \'queued\' WHERE id = ?');
          updateStmt.run(entry.id);
          enrichedCount++;
        } else {
          errors.push(`Failed to queue entry ${entry.id} (${entry.email}) for enrichment`);
        }
      } catch (err) {
        errors.push(`Error enriching entry ${entry.id} (${entry.email}): ${err}`);
      }
    }

    // Also queue the user's own account data for enrichment (backward compatibility)
    try {
      const userEnrichmentPayload = {
        email: user.email,
        name: user.name,
      };
      await enrichUserData(userEnrichmentPayload);
      // User account enrichment data will come back via webhook and be stored in user_enrichments table
    } catch (err) {
      console.error('Error queueing user account data for enrichment:', err);
    }

    if (enrichedCount === 0 && errors.length > 0) {
      return NextResponse.json(
        { error: 'Failed to enrich entries', errors },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: `Successfully queued ${enrichedCount} entr${enrichedCount === 1 ? 'y' : 'ies'} for enrichment`,
        enrichedCount,
        errors: errors.length > 0 ? errors : undefined
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Enrich error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

