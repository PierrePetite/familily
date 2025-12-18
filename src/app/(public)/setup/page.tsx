import { redirect } from 'next/navigation';
import { SetupWizard } from '@/components/setup/setup-wizard';
import { isSetupComplete } from '@/lib/setup';

// Force dynamic rendering - setup status must be checked at runtime
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Familily einrichten',
  description: 'Richte deinen Familienkalender ein',
};

export default async function SetupPage() {
  const setupComplete = await isSetupComplete();

  if (setupComplete) {
    redirect('/dashboard');
  }

  return <SetupWizard />;
}
