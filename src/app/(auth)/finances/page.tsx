'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Receipt, TrendingDown, TrendingUp, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BudgetForm } from '@/components/finance/budget-form';
import { ExpenseForm } from '@/components/finance/expense-form';
import { formatCurrency } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface Budget {
  id: string;
  name: string;
  icon: string;
  monthlyAmount: number;
  resetDay: number;
  color: string;
  showInDashboard: boolean;
  periodStart: string;
  spent: number;
  remaining: number;
  percentage: number;
  expenseCount: number;
}

interface Expense {
  id: string;
  amount: number;
  vendor: string;
  description?: string;
  date: string;
  budget: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  member?: {
    id: string;
    name: string;
    color: string;
  };
}

const MONTH_KEYS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
] as const;

function formatMonth(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export default function FinancesPage() {
  const { t, language } = useTranslation();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Monatswähler State
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | undefined>();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  // Prüfe ob aktueller Monat ausgewählt ist
  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth();

  const fetchBudgets = async (month?: string) => {
    try {
      const url = month ? `/api/budgets?month=${month}` : '/api/budgets';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setBudgets(data);
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
  };

  const fetchExpenses = async (month?: string) => {
    try {
      const url = month ? `/api/expenses?month=${month}&limit=20` : '/api/expenses?limit=20';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setRecentExpenses(data);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    const monthStr = formatMonth(selectedYear, selectedMonth);
    await Promise.all([fetchBudgets(monthStr), fetchExpenses(monthStr)]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth]);

  // Navigation Monat
  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedYear(selectedYear - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const goToCurrentMonth = () => {
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth());
  };

  const handleDeleteBudget = async () => {
    if (!deletingBudget) return;

    try {
      const response = await fetch(`/api/budgets/${deletingBudget.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
    } finally {
      setDeletingBudget(null);
    }
  };

  const handleBudgetSuccess = () => {
    setShowBudgetDialog(false);
    setEditingBudget(null);
    loadData();
  };

  const handleExpenseSuccess = () => {
    setShowExpenseDialog(false);
    setSelectedBudgetId(undefined);
    setEditingExpense(null);
    loadData();
  };

  const handleDeleteExpense = async () => {
    if (!deletingExpense) return;

    try {
      const response = await fetch(`/api/expenses/${deletingExpense.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    } finally {
      setDeletingExpense(null);
    }
  };

  const openExpenseDialogForBudget = (budgetId: string) => {
    setSelectedBudgetId(budgetId);
    setShowExpenseDialog(true);
  };

  // Berechne Gesamtübersicht
  const totalBudget = budgets.reduce((sum, b) => sum + b.monthlyAmount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('finances.title')}</h1>
          <p className="text-muted-foreground">
            {t('finances.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowExpenseDialog(true)}>
            <Receipt className="h-4 w-4 mr-2" />
            {t('finances.expense')}
          </Button>
          <Button onClick={() => setShowBudgetDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('finances.budget')}
          </Button>
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold min-w-[180px] text-center">
            {t(`finances.months.${MONTH_KEYS[selectedMonth]}`)} {selectedYear}
          </h2>
          {!isCurrentMonth && (
            <Button variant="outline" size="sm" onClick={goToCurrentMonth}>
              {t('common.today')}
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextMonth}
          disabled={isCurrentMonth}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Overview */}
      {budgets.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full dark:bg-blue-900">
                  <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('finances.totalBudget')}</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-full dark:bg-red-900">
                  <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('finances.spent')}</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${totalRemaining >= 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                  <TrendingUp className={`h-6 w-6 ${totalRemaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('finances.remaining')}</p>
                  <p className={`text-2xl font-bold ${totalRemaining < 0 ? 'text-red-600' : ''}`}>
                    {formatCurrency(totalRemaining)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Budgets */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{t('finances.budgets')}</h2>
        {budgets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">{t('finances.noBudgets')}</p>
              <p className="text-muted-foreground mb-4">
                {t('finances.noBudgetsSubtitle')}
              </p>
              <Button onClick={() => setShowBudgetDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('finances.createBudget')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {budgets.map((budget) => (
              <Card key={budget.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{budget.icon}</span>
                      <CardTitle className="text-lg">{budget.name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingBudget(budget);
                          setShowBudgetDialog(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeletingBudget(budget)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.monthlyAmount)}
                      </span>
                      <span className={budget.remaining < 0 ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                        {budget.remaining >= 0
                          ? `${formatCurrency(budget.remaining)} ${t('finances.left')}`
                          : `${formatCurrency(Math.abs(budget.remaining))} ${t('finances.over')}`}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(budget.percentage, 100)}
                      className="h-2"
                      style={{
                        // @ts-expect-error CSS custom property
                        '--progress-color': budget.percentage > 100 ? '#ef4444' : budget.color,
                      }}
                    />
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-muted-foreground">
                        {budget.expenseCount === 1
                          ? t('finances.expenseCount', { count: budget.expenseCount })
                          : t('finances.expenseCountPlural', { count: budget.expenseCount })}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openExpenseDialogForBudget(budget.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {t('finances.expense')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Expenses of the month */}
      {recentExpenses.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {isCurrentMonth
              ? t('finances.expensesThisMonth')
              : t('finances.expensesInMonth', { month: t(`finances.months.${MONTH_KEYS[selectedMonth]}`) })}
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {recentExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                        style={{ backgroundColor: expense.budget.color + '20' }}
                      >
                        {expense.budget.icon}
                      </span>
                      <div>
                        <p className="font-medium">{expense.vendor}</p>
                        <p className="text-sm text-muted-foreground">
                          {expense.budget.name}
                          {expense.member && ` • ${expense.member.name}`}
                          {expense.description && ` • ${expense.description}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-medium text-red-600">-{formatCurrency(expense.amount)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingExpense(expense);
                            setShowExpenseDialog(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeletingExpense(expense)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty expenses display */}
      {recentExpenses.length === 0 && budgets.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {isCurrentMonth
              ? t('finances.expensesThisMonth')
              : t('finances.expensesInMonth', { month: t(`finances.months.${MONTH_KEYS[selectedMonth]}`) })}
          </h2>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Receipt className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {isCurrentMonth
                  ? t('finances.noExpenses')
                  : t('finances.noExpensesInMonth', {
                      month: t(`finances.months.${MONTH_KEYS[selectedMonth]}`),
                      year: selectedYear,
                    })}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Budget Dialog */}
      <Dialog open={showBudgetDialog} onOpenChange={(open) => {
        setShowBudgetDialog(open);
        if (!open) setEditingBudget(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBudget ? t('finances.editBudget') : t('finances.newBudget')}
            </DialogTitle>
          </DialogHeader>
          <BudgetForm
            budget={editingBudget}
            onSuccess={handleBudgetSuccess}
            onCancel={() => {
              setShowBudgetDialog(false);
              setEditingBudget(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={showExpenseDialog} onOpenChange={(open) => {
        setShowExpenseDialog(open);
        if (!open) {
          setSelectedBudgetId(undefined);
          setEditingExpense(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? t('finances.editExpense') : t('finances.newExpense')}
            </DialogTitle>
          </DialogHeader>
          <ExpenseForm
            budgets={budgets}
            defaultBudgetId={selectedBudgetId}
            expense={editingExpense}
            onSuccess={handleExpenseSuccess}
            onCancel={() => {
              setShowExpenseDialog(false);
              setSelectedBudgetId(undefined);
              setEditingExpense(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Budget Confirmation */}
      <AlertDialog open={!!deletingBudget} onOpenChange={() => setDeletingBudget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('finances.deleteBudget')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('finances.deleteBudgetConfirm', { name: deletingBudget?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBudget} className="bg-destructive text-destructive-foreground">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Expense Confirmation */}
      <AlertDialog open={!!deletingExpense} onOpenChange={() => setDeletingExpense(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('finances.deleteExpense')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('finances.deleteExpenseConfirm', {
                vendor: deletingExpense?.vendor || '',
                amount: deletingExpense ? formatCurrency(deletingExpense.amount) : '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense} className="bg-destructive text-destructive-foreground">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
