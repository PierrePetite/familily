import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { isSetupComplete } from '@/lib/setup';

// Force dynamic rendering - setup status must be checked at runtime
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  // Force dynamic by reading headers
  headers();

  const setupComplete = await isSetupComplete();

  if (!setupComplete) {
    redirect('/setup');
  }

  redirect('/dashboard');
}
