'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Wallet, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface Budget {
  id: string;
  name: string;
  icon: string;
  monthlyAmount: number;
  color: string;
  showInDashboard: boolean;
  spent: number;
  remaining: number;
  percentage: number;
}

export function BudgetWidget() {
  const { t } = useTranslation();
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const response = await fetch('/api/budgets');
        if (response.ok) {
          const data = await response.json();
          // Nur Budgets mit showInDashboard=true anzeigen
          setBudgets(data.filter((b: Budget) => b.showInDashboard));
        }
      } catch (error) {
        console.error('Error fetching budgets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBudgets();
  }, []);

  // Navigiere zu Finanzen mit Budget-Filter
  const handleBudgetClick = (budgetId: string) => {
    router.push(`/finances?budget=${budgetId}`);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {t('finances.budgets')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-2 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-2 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (budgets.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {t('finances.budgets')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            {t('finances.noBudgets')}
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/finances">
              {t('finances.createBudget')}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Berechne Gesamtübersicht
  const totalBudget = budgets.reduce((sum, b) => sum + b.monthlyAmount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {t('finances.budgets')}
          </CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/finances">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gesamtübersicht */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">{t('finances.total')}</span>
            <span className="text-sm">
              {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
            </span>
          </div>
          <Progress
            value={Math.min(totalPercentage, 100)}
            className="h-2"
          />
        </div>

        {/* Einzelne Budgets - klickbar */}
        <div className="space-y-3">
          {budgets.slice(0, 4).map((budget) => (
            <div
              key={budget.id}
              className="space-y-1 cursor-pointer hover:bg-muted/50 p-2 -mx-2 rounded-md transition-colors"
              onClick={() => handleBudgetClick(budget.id)}
              title={t('finances.viewExpenses')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{budget.icon}</span>
                  <span className="text-sm font-medium">{budget.name}</span>
                </div>
                <span className={`text-xs ${budget.remaining < 0 ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                  {budget.remaining >= 0
                    ? `${formatCurrency(budget.remaining)} ${t('finances.left')}`
                    : `${formatCurrency(Math.abs(budget.remaining))} ${t('finances.over')}`
                  }
                </span>
              </div>
              <Progress
                value={Math.min(budget.percentage, 100)}
                className="h-1.5"
                style={{
                  // @ts-expect-error CSS custom property
                  '--progress-color': budget.percentage > 100 ? '#ef4444' : budget.color,
                }}
              />
            </div>
          ))}
        </div>

        {budgets.length > 4 && (
          <p className="text-xs text-muted-foreground text-center">
            {t('finances.moreBudgets', { count: budgets.length - 4 })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
