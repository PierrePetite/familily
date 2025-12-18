import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { budgetSchema } from '@/lib/validations/budget';

// Helper: Berechnet den Start des aktuellen Budget-Zeitraums
function getCurrentPeriodStart(resetDay: number): Date {
  const now = new Date();
  const currentDay = now.getDate();

  let periodStart = new Date(now.getFullYear(), now.getMonth(), resetDay);

  if (currentDay < resetDay) {
    periodStart.setMonth(periodStart.getMonth() - 1);
  }

  if (periodStart.getDate() !== resetDay) {
    periodStart = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);
  }

  periodStart.setHours(0, 0, 0, 0);
  return periodStart;
}

// GET: Einzelnes Budget mit Details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const budget = await prisma.budget.findFirst({
      where: {
        id,
        familyId: session.user.familyId,
      },
      include: {
        expenses: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!budget) {
      return NextResponse.json(
        { error: 'Budget nicht gefunden' },
        { status: 404 }
      );
    }

    const periodStart = getCurrentPeriodStart(budget.resetDay);

    const currentPeriodExpenses = budget.expenses.filter(
      (expense) => new Date(expense.date) >= periodStart
    );

    const spent = currentPeriodExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    return NextResponse.json({
      ...budget,
      periodStart: periodStart.toISOString(),
      spent: Math.round(spent * 100) / 100,
      remaining: Math.round((budget.monthlyAmount - spent) * 100) / 100,
      percentage: budget.monthlyAmount > 0
        ? Math.round((spent / budget.monthlyAmount) * 1000) / 10
        : 0,
      currentPeriodExpenses,
    });
  } catch (error) {
    console.error('Get budget error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

// PUT: Budget aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Prüfe ob Budget zur Familie gehört
    const existingBudget = await prisma.budget.findFirst({
      where: {
        id,
        familyId: session.user.familyId,
      },
    });

    if (!existingBudget) {
      return NextResponse.json(
        { error: 'Budget nicht gefunden' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = budgetSchema.parse(body);

    const budget = await prisma.budget.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(budget);
  } catch (error) {
    console.error('Update budget error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

// DELETE: Budget löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Prüfe ob Budget zur Familie gehört
    const existingBudget = await prisma.budget.findFirst({
      where: {
        id,
        familyId: session.user.familyId,
      },
    });

    if (!existingBudget) {
      return NextResponse.json(
        { error: 'Budget nicht gefunden' },
        { status: 404 }
      );
    }

    await prisma.budget.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete budget error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
