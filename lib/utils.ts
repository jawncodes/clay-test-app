import { cookies } from 'next/headers';

export function generateOTP(): string {
  // Generate a 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getSessionUserId(): number | null {
  const cookieStore = cookies();
  const sessionId = cookieStore.get('session')?.value;
  
  if (!sessionId) {
    return null;
  }

  // Session is stored as user_id in the cookie
  const userId = parseInt(sessionId, 10);
  return isNaN(userId) ? null : userId;
}

export function setSession(userId: number): void {
  const cookieStore = cookies();
  cookieStore.set('session', userId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export function clearSession(): void {
  const cookieStore = cookies();
  cookieStore.delete('session');
}

