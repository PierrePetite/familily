import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET: Get single meal plan with all meals
export async function GET(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const mealPlan = await prisma.mealPlan.findFirst({
      where: {
        id: params.planId,
        familyId: session.user.familyId,
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

    if (!mealPlan) {
      return NextResponse.json(
        { error: 'Plan nicht gefunden' },
        { status: 404 }
      );
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

// DELETE: Delete meal plan and all meals
export async function DELETE(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    // Verify plan belongs to family
    const mealPlan = await prisma.mealPlan.findFirst({
      where: {
        id: params.planId,
        familyId: session.user.familyId,
      },
    });

    if (!mealPlan) {
      return NextResponse.json(
        { error: 'Plan nicht gefunden' },
        { status: 404 }
      );
    }

    await prisma.mealPlan.delete({
      where: { id: params.planId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete meal plan error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
