import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { SetupWizard } from '@/components/setup/setup-wizard';
import { isSetupComplete } from '@/lib/setup';

// Force dynamic rendering - setup status must be checked at runtime
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Familily einrichten',
  description: 'Richte deinen Familienkalender ein',
};

export default async function SetupPage() {
  // Force dynamic by reading headers
  headers();

  const setupComplete = await isSetupComplete();

  if (setupComplete) {
    redirect('/dashboard');
  }

  return <SetupWizard />;
}
