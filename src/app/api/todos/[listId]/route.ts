import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { todoListSchema } from '@/lib/validations/todo';

// GET: Eine Liste mit Items (mit Sichtbarkeitsprüfung)
export async function GET(
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

    const list = await prisma.todoList.findFirst({
      where: {
        id: params.listId,
        familyId: session.user.familyId,
        OR: [
          { isShared: true },
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
            completedBy: {
              select: { id: true, name: true },
            },
            createdBy: {
              select: { id: true, name: true },
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
      },
    });

    if (!list) {
      return NextResponse.json(
        { error: 'Liste nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(list);
  } catch (error) {
    console.error('Get todo list error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

// PUT: Liste aktualisieren
export async function PUT(
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

    const existingList = await prisma.todoList.findFirst({
      where: {
        id: params.listId,
        familyId: session.user.familyId,
      },
    });

    if (!existingList) {
      return NextResponse.json(
        { error: 'Liste nicht gefunden' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = todoListSchema.parse(body);

    // Update visibleTo members if changed
    if (validatedData.visibleToIds !== undefined) {
      // Delete existing
      await prisma.todoListMember.deleteMany({
        where: { listId: params.listId },
      });

      // Create new if not shared
      if (!validatedData.isShared && validatedData.visibleToIds.length > 0) {
        await prisma.todoListMember.createMany({
          data: validatedData.visibleToIds.map((memberId) => ({
            listId: params.listId,
            memberId,
          })),
        });
      }
    }

    const list = await prisma.todoList.update({
      where: { id: params.listId },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        icon: validatedData.icon,
        isShared: validatedData.isShared,
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

    return NextResponse.json(list);
  } catch (error) {
    console.error('Update todo list error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

// DELETE: Liste löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const existingList = await prisma.todoList.findFirst({
      where: {
        id: params.listId,
        familyId: session.user.familyId,
      },
    });

    if (!existingList) {
      return NextResponse.json(
        { error: 'Liste nicht gefunden' },
        { status: 404 }
      );
    }

    await prisma.todoList.delete({
      where: { id: params.listId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete todo list error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
