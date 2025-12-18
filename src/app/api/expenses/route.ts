import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { expenseSchema } from '@/lib/validations/budget';

// GET: Alle Ausgaben (optional gefiltert nach Budget)
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
    const budgetId = searchParams.get('budgetId');
    const month = searchParams.get('month'); // Format: YYYY-MM
    const limit = searchParams.get('limit');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      budget: {
        familyId: session.user.familyId,
      },
    };

    if (budgetId) {
      where.budgetId = budgetId;
    }

    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        budget: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
        member: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      take: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Get expenses error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

// POST: Neue Ausgabe erstellen
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
    const validatedData = expenseSchema.parse(body);

    // Prüfe ob Budget zur Familie gehört
    const budget = await prisma.budget.findFirst({
      where: {
        id: validatedData.budgetId,
        familyId: session.user.familyId,
      },
    });

    if (!budget) {
      return NextResponse.json(
        { error: 'Budget nicht gefunden' },
        { status: 404 }
      );
    }

    // Prüfe ob Member zur Familie gehört (falls angegeben)
    if (validatedData.memberId) {
      const member = await prisma.familyMember.findFirst({
        where: {
          id: validatedData.memberId,
          familyId: session.user.familyId,
        },
      });

      if (!member) {
        return NextResponse.json(
          { error: 'Familienmitglied nicht gefunden' },
          { status: 404 }
        );
      }
    }

    const expense = await prisma.expense.create({
      data: {
        amount: validatedData.amount,
        vendor: validatedData.vendor,
        description: validatedData.description,
        date: new Date(validatedData.date),
        budgetId: validatedData.budgetId,
        memberId: validatedData.memberId || null,
      },
      include: {
        budget: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
        member: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Create expense error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
