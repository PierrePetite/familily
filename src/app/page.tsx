import { redirect } from 'next/navigation';
import { isSetupComplete } from '@/lib/setup';

// Force dynamic rendering - setup status must be checked at runtime
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const setupComplete = await isSetupComplete();

  if (!setupComplete) {
    redirect('/setup');
  }

  redirect('/dashboard');
}
