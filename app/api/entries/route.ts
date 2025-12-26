import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getCurrentUser, requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireAuth(user);

    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM user_entries WHERE user_id = ? ORDER BY created_at DESC');
    const entries = stmt.all(user.id) as any[];

    return NextResponse.json({
      entries: entries.map(entry => ({
        id: entry.id,
        name: entry.name,
        email: entry.email,
        phone_number: entry.phone_number,
        job_title: entry.job_title,
        company_size: entry.company_size,
        budget: entry.budget,
        enrichment_status: entry.enrichment_status || 'pending',
        enriched_at: entry.enriched_at,
        enrichment_data: entry.enrichment_data ? JSON.parse(entry.enrichment_data) : null,
        created_at: entry.created_at,
      })),
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get entries error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireAuth(user);

    const body = await request.json();
    const { name, email, phone_number, job_title, company_size, budget } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO user_entries (user_id, name, email, phone_number, job_title, company_size, budget)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      user.id,
      name.trim(),
      email.trim().toLowerCase(),
      phone_number?.trim() || null,
      job_title?.trim() || null,
      company_size?.trim() || null,
      budget?.trim() || null
    );
    const entryId = result.lastInsertRowid;
    
    // Fetch the created entry
    const fetchStmt = db.prepare('SELECT * FROM user_entries WHERE id = ?');
    const entry = fetchStmt.get(entryId) as any;

    return NextResponse.json({
      entry: {
        id: entry.id,
        name: entry.name,
        email: entry.email,
        phone_number: entry.phone_number,
        job_title: entry.job_title,
        company_size: entry.company_size,
        budget: entry.budget,
        created_at: entry.created_at,
      },
    }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Create entry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

