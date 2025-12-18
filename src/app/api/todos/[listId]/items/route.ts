import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { todoItemSchema } from '@/lib/validations/todo';

// POST: Neues Item erstellen
export async function POST(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId || !session.user.memberId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    // Verify list belongs to user's family
    const list = await prisma.todoList.findFirst({
      where: {
        id: params.listId,
        familyId: session.user.familyId,
      },
    });

    if (!list) {
      return NextResponse.json(
        { error: 'Liste nicht gefunden' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = todoItemSchema.parse({
      ...body,
      listId: params.listId,
    });

    const item = await prisma.todoItem.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        priority: validatedData.priority,
        assignedToId: validatedData.assignedToId || null,
        listId: params.listId,
        createdById: session.user.memberId,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, color: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Create todo item error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
