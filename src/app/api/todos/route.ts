import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { todoListSchema } from '@/lib/validations/todo';

// GET: Alle Listen für die Familie (gefiltert nach Sichtbarkeit)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId || !session.user.memberId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const lists = await prisma.todoList.findMany({
      where: {
        familyId: session.user.familyId,
        OR: [
          // Shared lists are visible to everyone
          { isShared: true },
          // Non-shared lists visible only if user is in visibleTo or is creator
          {
            isShared: false,
            OR: [
              { createdById: session.user.memberId },
              { visibleTo: { some: { memberId: session.user.memberId } } },
            ],
          },
        ],
      },
      include: {
        items: {
          orderBy: [
            { completed: 'asc' },
            { priority: 'desc' },
            { createdAt: 'desc' },
          ],
          include: {
            assignedTo: {
              select: { id: true, name: true, color: true },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true },
        },
        visibleTo: {
          include: {
            member: {
              select: { id: true, name: true, color: true },
            },
          },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add completion stats to each list
    const listsWithStats = lists.map((list) => ({
      ...list,
      completedCount: list.items.filter((item) => item.completed).length,
      totalCount: list.items.length,
    }));

    return NextResponse.json(listsWithStats);
  } catch (error) {
    console.error('Get todo lists error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

// POST: Neue Liste erstellen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId || !session.user.memberId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = todoListSchema.parse(body);

    const list = await prisma.todoList.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        icon: validatedData.icon,
        isShared: validatedData.isShared,
        familyId: session.user.familyId,
        createdById: session.user.memberId,
        // If not shared, add visible members
        visibleTo: !validatedData.isShared && validatedData.visibleToIds?.length
          ? {
              create: validatedData.visibleToIds.map((memberId) => ({
                memberId,
              })),
            }
          : undefined,
      },
      include: {
        items: true,
        createdBy: {
          select: { id: true, name: true },
        },
        visibleTo: {
          include: {
            member: {
              select: { id: true, name: true, color: true },
            },
          },
        },
      },
    });

    return NextResponse.json(list, { status: 201 });
  } catch (error) {
    console.error('Create todo list error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
