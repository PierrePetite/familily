import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { expenseSchema } from '@/lib/validations/budget';

// GET: Einzelne Ausgabe
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

    const expense = await prisma.expense.findFirst({
      where: {
        id,
        budget: {
          familyId: session.user.familyId,
        },
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

    if (!expense) {
      return NextResponse.json(
        { error: 'Ausgabe nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Get expense error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

// PUT: Ausgabe aktualisieren
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

    // Prüfe ob Ausgabe zur Familie gehört
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id,
        budget: {
          familyId: session.user.familyId,
        },
      },
    });

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'Ausgabe nicht gefunden' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = expenseSchema.parse(body);

    // Prüfe ob neues Budget zur Familie gehört
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

    const expense = await prisma.expense.update({
      where: { id },
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

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Update expense error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

// DELETE: Ausgabe löschen
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

    // Prüfe ob Ausgabe zur Familie gehört
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id,
        budget: {
          familyId: session.user.familyId,
        },
      },
    });

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'Ausgabe nicht gefunden' },
        { status: 404 }
      );
    }

    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete expense error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
