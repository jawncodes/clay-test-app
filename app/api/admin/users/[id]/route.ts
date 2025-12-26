import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getCurrentUser, requireAdmin } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    requireAdmin(user);

    const userId = parseInt(params.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !['active', 'flagged', 'blocked'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (active, flagged, or blocked)' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    
    // Check if user exists
    const checkStmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const existingUser = checkStmt.get(userId) as any;
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user status
    const updateStmt = db.prepare('UPDATE users SET status = ? WHERE id = ?');
    updateStmt.run(status, userId);
    
    // Fetch the updated user
    const fetchStmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const updatedUser = fetchStmt.get(userId) as any;

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        created_at: updatedUser.created_at,
      },
    });
  } catch (error: any) {
    if (error.message === 'Admin access required' || error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

