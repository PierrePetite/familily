import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// PUT: Item aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: { listId: string; itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId || !session.user.memberId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    // Verify item belongs to user's family
    const existingItem = await prisma.todoItem.findFirst({
      where: {
        id: params.itemId,
        listId: params.listId,
        list: {
          familyId: session.user.familyId,
        },
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item nicht gefunden' },
        { status: 404 }
      );
    }

    const body = await request.json();

    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.assignedToId !== undefined) updateData.assignedToId = body.assignedToId || null;

    // Handle completion
    if (body.completed !== undefined) {
      updateData.completed = body.completed;
      if (body.completed) {
        updateData.completedAt = new Date();
        updateData.completedById = session.user.memberId;
      } else {
        updateData.completedAt = null;
        updateData.completedById = null;
      }
    }

    const item = await prisma.todoItem.update({
      where: { id: params.itemId },
      data: updateData,
      include: {
        assignedTo: {
          select: { id: true, name: true, color: true },
        },
        completedBy: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Update todo item error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

// DELETE: Item löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { listId: string; itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    // Verify item belongs to user's family
    const existingItem = await prisma.todoItem.findFirst({
      where: {
        id: params.itemId,
        listId: params.listId,
        list: {
          familyId: session.user.familyId,
        },
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item nicht gefunden' },
        { status: 404 }
      );
    }

    await prisma.todoItem.delete({
      where: { id: params.itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete todo item error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
