import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Clay.com webhook should send enriched data
    // We need to identify which entry this belongs to
    // Clay typically sends back the email or other identifier we sent them
    const { email, ...enrichmentData } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required to identify the entry' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    
    // Find the entry by email (assuming email is unique per entry)
    // Note: If multiple entries can have the same email, we might need a different approach
    const stmt = db.prepare('SELECT * FROM user_entries WHERE email = ? AND enrichment_status = ? ORDER BY created_at DESC LIMIT 1');
    const entry = stmt.get(email.toLowerCase(), 'queued') as any;
    
    if (!entry) {
      // Entry not found or not in queued status - log but don't error
      console.log(`Clay webhook received data for email ${email}, but no queued entry found`);
      return NextResponse.json(
        { message: 'Entry not found or not queued' },
        { status: 200 }
      );
    }

    // Update entry with enriched data
    const updateStmt = db.prepare(`
      UPDATE user_entries 
      SET enrichment_status = 'enriched',
          enriched_at = CURRENT_TIMESTAMP,
          enrichment_data = ?
      WHERE id = ?
    `);
    updateStmt.run(JSON.stringify(enrichmentData), entry.id);

    return NextResponse.json(
      { message: 'Enrichment data received and stored successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Clay webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

