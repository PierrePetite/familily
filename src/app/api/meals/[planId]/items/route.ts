import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { mealSchema } from '@/lib/validations/meal';

// POST: Add a meal to a plan
export async function POST(
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

    const body = await request.json();
    const validatedData = mealSchema.parse(body);

    const meal = await prisma.meal.create({
      data: {
        dayOfWeek: validatedData.dayOfWeek,
        mealType: validatedData.mealType,
        title: validatedData.title,
        description: validatedData.description || null,
        recipeUrl: validatedData.recipeUrl || null,
        planId: params.planId,
      },
    });

    return NextResponse.json(meal, { status: 201 });
  } catch (error) {
    console.error('Create meal error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
