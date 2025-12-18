import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { budgetSchema } from '@/lib/validations/budget';

// Helper: Berechnet den Start des Budget-Zeitraums für ein bestimmtes Datum
function getPeriodStart(resetDay: number, referenceDate?: Date): Date {
  const ref = referenceDate || new Date();
  const currentDay = ref.getDate();

  let periodStart = new Date(ref.getFullYear(), ref.getMonth(), resetDay);

  // Wenn wir vor dem Reset-Tag sind, gehe zum vorherigen Monat
  if (currentDay < resetDay) {
    periodStart.setMonth(periodStart.getMonth() - 1);
  }

  // Handle: resetDay > Tage im Monat (z.B. 31. Februar)
  if (periodStart.getDate() !== resetDay) {
    // Gehe zum letzten Tag des vorherigen Monats
    periodStart = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);
  }

  periodStart.setHours(0, 0, 0, 0);
  return periodStart;
}

// Helper: Berechnet das Ende des Budget-Zeitraums
function getPeriodEnd(periodStart: Date, resetDay: number): Date {
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  periodEnd.setDate(resetDay - 1);

  // Handle: resetDay > Tage im nächsten Monat
  if (periodEnd.getDate() !== resetDay - 1) {
    periodEnd.setDate(0); // Letzter Tag des Monats
  }

  periodEnd.setHours(23, 59, 59, 999);
  return periodEnd;
}

// GET: Alle Budgets für die Familie mit Ausgabenstand
// Optional: ?month=2025-12 für historische Daten
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month'); // Format: YYYY-MM

    // Bestimme das Referenzdatum (Mitte des Monats für korrekte Berechnung)
    let referenceDate: Date | undefined;
    if (monthParam) {
      const [year, month] = monthParam.split('-').map(Number);
      referenceDate = new Date(year, month - 1, 15); // 15. des Monats
    }

    const budgets = await prisma.budget.findMany({
      where: { familyId: session.user.familyId },
      include: {
        expenses: {
          select: {
            id: true,
            amount: true,
            vendor: true,
            date: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Berechne für jedes Budget die Ausgaben im gewählten Zeitraum
    const budgetsWithSpending = budgets.map((budget) => {
      const periodStart = getPeriodStart(budget.resetDay, referenceDate);
      const periodEnd = getPeriodEnd(periodStart, budget.resetDay);

      const periodExpenses = budget.expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= periodStart && expenseDate <= periodEnd;
      });

      const spent = periodExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );

      const remaining = budget.monthlyAmount - spent;
      const percentage = budget.monthlyAmount > 0
        ? Math.min((spent / budget.monthlyAmount) * 100, 100)
        : 0;

      return {
        id: budget.id,
        name: budget.name,
        icon: budget.icon,
        monthlyAmount: budget.monthlyAmount,
        resetDay: budget.resetDay,
        color: budget.color,
        showInDashboard: budget.showInDashboard,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        spent: Math.round(spent * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
        percentage: Math.round(percentage * 10) / 10,
        expenseCount: periodExpenses.length,
      };
    });

    return NextResponse.json(budgetsWithSpending);
  } catch (error) {
    console.error('Get budgets error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

// POST: Neues Budget erstellen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = budgetSchema.parse(body);

    const budget = await prisma.budget.create({
      data: {
        ...validatedData,
        familyId: session.user.familyId,
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error('Create budget error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
