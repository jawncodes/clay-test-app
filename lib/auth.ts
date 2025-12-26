import { getDatabase } from './db';
import { generateOTP, setSession, clearSession, getSessionUserId } from './utils';
import { sendOTP } from './email';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'flagged' | 'blocked';
  created_at: string;
}

export async function createUser(name: string, email: string): Promise<User> {
  const db = getDatabase();
  
  try {
    const stmt = db.prepare(`
      INSERT INTO users (name, email, role, status)
      VALUES (?, ?, 'user', 'active')
    `);
    
    const result = stmt.run(name, email);
    const userId = result.lastInsertRowid;
    
    // Fetch the created user
    const fetchStmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = fetchStmt.get(userId) as any;
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
    };
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error('Email already exists');
    }
    throw error;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  const user = stmt.get(email) as any;
  
  if (!user) {
    return null;
  }
  
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    created_at: user.created_at,
  };
}

export async function getUserById(id: number): Promise<User | null> {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const user = stmt.get(id) as any;
  
  if (!user) {
    return null;
  }
  
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    created_at: user.created_at,
  };
}

export async function getCurrentUser(): Promise<User | null> {
  const userId = getSessionUserId();
  if (!userId) {
    return null;
  }
  return getUserById(userId);
}

export async function requestOTP(email: string): Promise<void> {
  const db = getDatabase();
  
  // Check if user exists, create if not
  let user = await getUserByEmail(email);
  if (!user) {
    // For passwordless login, we can auto-create users or require sign-up
    // For this implementation, we'll require users to sign up first
    throw new Error('User not found. Please sign up first.');
  }

  if (user.status === 'blocked') {
    throw new Error('Your account has been blocked. Please contact support.');
  }

  // Generate OTP
  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate any existing OTPs for this user
  const invalidateStmt = db.prepare('UPDATE otp_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = ? AND used_at IS NULL');
  invalidateStmt.run(user.id);

  // Store new OTP
  const stmt = db.prepare(`
    INSERT INTO otp_tokens (user_id, code, expires_at)
    VALUES (?, ?, ?)
  `);
  stmt.run(user.id, code, expiresAt.toISOString());

  // Send OTP (mock email service)
  await sendOTP(email, code);
}

export async function verifyOTP(email: string, code: string): Promise<User> {
  const db = getDatabase();
  
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error('Invalid code');
  }

  if (user.status === 'blocked') {
    throw new Error('Your account has been blocked. Please contact support.');
  }

  // Check OTP
  const stmt = db.prepare(`
    SELECT * FROM otp_tokens
    WHERE user_id = ? AND code = ? AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP
    ORDER BY created_at DESC
    LIMIT 1
  `);
  
  const otpToken = stmt.get(user.id, code) as any;
  
  if (!otpToken) {
    throw new Error('Invalid or expired code');
  }

  // Mark OTP as used
  const markUsedStmt = db.prepare('UPDATE otp_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?');
  markUsedStmt.run(otpToken.id);

  // Create session
  setSession(user.id);

  return user;
}

export function logout(): void {
  clearSession();
}

export function requireAuth(user: User | null): asserts user is User {
  if (!user || user.status === 'blocked') {
    throw new Error('Unauthorized');
  }
}

export function requireAdmin(user: User | null): asserts user is User {
  if (!user || user.role !== 'admin' || user.status === 'blocked') {
    throw new Error('Admin access required');
  }
}

