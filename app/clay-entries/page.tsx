import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import EntriesClient from './entries-client';

export default async function EntriesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <EntriesClient user={user} />;
}

