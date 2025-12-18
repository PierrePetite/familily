import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { startOfWeek } from 'date-fns';

// GET: Get meal plan for a specific week (or current week)
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
    const weekParam = searchParams.get('week');

    // Calculate week start (Monday)
    let weekStart: Date;
    if (weekParam) {
      const parsed = new Date(weekParam);
      weekStart = startOfWeek(parsed, { weekStartsOn: 1 });
    } else {
      weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    }

    // Normalize to midnight UTC
    weekStart.setHours(0, 0, 0, 0);

    // Find or create meal plan for this week
    let mealPlan = await prisma.mealPlan.findUnique({
      where: {
        familyId_weekStart: {
          familyId: session.user.familyId,
          weekStart,
        },
      },
      include: {
        meals: {
          orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }],
        },
        createdBy: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    // Auto-create empty plan if it doesn't exist
    if (!mealPlan) {
      mealPlan = await prisma.mealPlan.create({
        data: {
          weekStart,
          familyId: session.user.familyId,
          createdById: session.user.memberId,
        },
        include: {
          meals: true,
          createdBy: {
            select: { id: true, name: true, color: true },
          },
        },
      });
    }

    return NextResponse.json(mealPlan);
  } catch (error) {
    console.error('Get meal plan error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
