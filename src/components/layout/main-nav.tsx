'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTranslation } from '@/lib/i18n';
import {
  Calendar,
  Home,
  Users,
  Settings,
  LogOut,
  CheckSquare,
  Wallet,
  UtensilsCrossed,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', labelKey: 'nav.dashboard', icon: Home },
  { href: '/calendar', labelKey: 'nav.calendar', icon: Calendar },
  { href: '/todos', labelKey: 'nav.todos', icon: CheckSquare },
  { href: '/meals', labelKey: 'nav.meals', icon: UtensilsCrossed },
  { href: '/finances', labelKey: 'nav.finances', icon: Wallet },
  { href: '/family', labelKey: 'nav.family', icon: Users },
  { href: '/settings', labelKey: 'nav.settings', icon: Settings },
];

export function MainNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav className="border-b bg-background">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="font-bold text-xl text-primary">
              Familily
            </Link>

            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{t(item.labelKey)}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('nav.logout')}</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
