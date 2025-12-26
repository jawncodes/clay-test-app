import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/auth';
import { enrichUserData, storeEnrichmentData } from '@/lib/clay';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, website } = body; // website is the honeypot field

    // Honeypot validation - if website field is filled, it's likely a bot
    if (website && website.trim() !== '') {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Validate input
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Create user
    const user = await createUser(name.trim(), email.trim().toLowerCase());

    // Queue user data for enrichment by sending to Clay.com webhook asynchronously
    // Enriched data will be sent back via webhook callback
    enrichUserData({ email: user.email, name: user.name })
      .then((queued) => {
        if (queued) {
          console.log(`User ${user.email} queued for enrichment`);
        }
      })
      .catch((error) => {
        console.error('Error queueing user data for enrichment:', error);
      });

    return NextResponse.json(
      { message: 'User created successfully', user: { id: user.id, email: user.email } },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === 'Email already exists') {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

