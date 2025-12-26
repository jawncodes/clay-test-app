import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getCurrentUser, requireAuth } from '@/lib/auth';

export async function PATCH(
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

    const body = await request.json();
    const { name, email, phone_number, job_title, company_size, budget } = body;

    const db = getDatabase();
    
    // Verify entry belongs to user
    const checkStmt = db.prepare('SELECT * FROM user_entries WHERE id = ? AND user_id = ?');
    const existingEntry = checkStmt.get(entryId, user.id) as any;
    
    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Validate required fields if provided
    if (name !== undefined && (!name || typeof name !== 'string' || name.trim() === '')) {
      return NextResponse.json(
        { error: 'Name cannot be empty' },
        { status: 400 }
      );
    }

    if (email !== undefined) {
      if (!email || typeof email !== 'string' || email.trim() === '') {
        return NextResponse.json(
          { error: 'Email cannot be empty' },
          { status: 400 }
        );
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name.trim());
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email.trim());
    }
    if (phone_number !== undefined) {
      updates.push('phone_number = ?');
      values.push(phone_number.trim() || null);
    }
    if (job_title !== undefined) {
      updates.push('job_title = ?');
      values.push(job_title.trim() || null);
    }
    if (company_size !== undefined) {
      updates.push('company_size = ?');
      values.push(company_size.trim() || null);
    }
    if (budget !== undefined) {
      updates.push('budget = ?');
      values.push(budget.trim() || null);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(entryId, user.id);
    const updateStmt = db.prepare(`
      UPDATE user_entries 
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `);
    updateStmt.run(...values);
    
    // Fetch the updated entry
    const fetchStmt = db.prepare('SELECT * FROM user_entries WHERE id = ?');
    const updatedEntry = fetchStmt.get(entryId) as any;

    return NextResponse.json({
      entry: {
        id: updatedEntry.id,
        name: updatedEntry.name,
        email: updatedEntry.email,
        phone_number: updatedEntry.phone_number,
        job_title: updatedEntry.job_title,
        company_size: updatedEntry.company_size,
        budget: updatedEntry.budget,
        created_at: updatedEntry.created_at,
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Update entry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const existingEntry = checkStmt.get(entryId, user.id) as any;
    
    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    const deleteStmt = db.prepare('DELETE FROM user_entries WHERE id = ? AND user_id = ?');
    deleteStmt.run(entryId, user.id);

    return NextResponse.json(
      { message: 'Entry deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Delete entry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

