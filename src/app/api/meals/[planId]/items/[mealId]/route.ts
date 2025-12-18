import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { mealUpdateSchema } from '@/lib/validations/meal';

// PUT: Update a meal
export async function PUT(
  request: NextRequest,
  { params }: { params: { planId: string; mealId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    // Verify meal belongs to a plan in this family
    const existingMeal = await prisma.meal.findFirst({
      where: {
        id: params.mealId,
        planId: params.planId,
        plan: {
          familyId: session.user.familyId,
        },
      },
    });

    if (!existingMeal) {
      return NextResponse.json(
        { error: 'Mahlzeit nicht gefunden' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = mealUpdateSchema.parse(body);

    const meal = await prisma.meal.update({
      where: { id: params.mealId },
      data: {
        ...(validatedData.dayOfWeek !== undefined && {
          dayOfWeek: validatedData.dayOfWeek,
        }),
        ...(validatedData.mealType !== undefined && {
          mealType: validatedData.mealType,
        }),
        ...(validatedData.title !== undefined && {
          title: validatedData.title,
        }),
        ...(validatedData.description !== undefined && {
          description: validatedData.description || null,
        }),
        ...(validatedData.recipeUrl !== undefined && {
          recipeUrl: validatedData.recipeUrl || null,
        }),
      },
    });

    return NextResponse.json(meal);
  } catch (error) {
    console.error('Update meal error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a meal
export async function DELETE(
  request: NextRequest,
  { params }: { params: { planId: string; mealId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    // Verify meal belongs to a plan in this family
    const existingMeal = await prisma.meal.findFirst({
      where: {
        id: params.mealId,
        planId: params.planId,
        plan: {
          familyId: session.user.familyId,
        },
      },
    });

    if (!existingMeal) {
      return NextResponse.json(
        { error: 'Mahlzeit nicht gefunden' },
        { status: 404 }
      );
    }

    await prisma.meal.delete({
      where: { id: params.mealId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete meal error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
