import { redirect } from 'next/navigation';
import { isSetupComplete } from '@/lib/setup';

export default async function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const setupComplete = await isSetupComplete();

  if (setupComplete) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {children}
      </div>
    </div>
  );
}
