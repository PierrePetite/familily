import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { MainNav } from '@/components/layout/main-nav';
import { InstallPrompt } from '@/components/pwa/install-prompt';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
      <InstallPrompt />
    </div>
  );
}
