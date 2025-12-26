import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      );
    }

    const user = await verifyOTP(email.trim().toLowerCase(), code.trim());

    return NextResponse.json(
      { message: 'Login successful', user: { id: user.id, name: user.name, email: user.email, role: user.role } },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.message.includes('Invalid') || error.message.includes('expired') || error.message.includes('blocked')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    console.error('Verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

