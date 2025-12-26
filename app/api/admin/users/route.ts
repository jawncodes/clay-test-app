import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { getEnrichmentData } from '@/lib/clay';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireAdmin(user);

    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC');
    const users = stmt.all() as any[];

    // Get enrichment data for each user
    const usersWithEnrichment = await Promise.all(
      users.map(async (u) => {
        const enrichment = await getEnrichmentData(u.id);
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.status,
          created_at: u.created_at,
          enrichment: enrichment,
        };
      })
    );

    return NextResponse.json({ users: usersWithEnrichment });
  } catch (error: any) {
    if (error.message === 'Admin access required' || error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

