import { redirect } from 'next/navigation';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import AdminClient from './admin-client';

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  try {
    requireAdmin(user);
  } catch {
    redirect('/clay-entries');
  }

  return <AdminClient />;
}

