import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// DELETE: Calendar Feed löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const existingFeed = await prisma.calendarFeed.findFirst({
      where: {
        id: params.id,
        familyId: session.user.familyId,
      },
    });

    if (!existingFeed) {
      return NextResponse.json(
        { error: 'Feed nicht gefunden' },
        { status: 404 }
      );
    }

    await prisma.calendarFeed.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete calendar feed error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

// PUT: Token erneuern
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const existingFeed = await prisma.calendarFeed.findFirst({
      where: {
        id: params.id,
        familyId: session.user.familyId,
      },
    });

    if (!existingFeed) {
      return NextResponse.json(
        { error: 'Feed nicht gefunden' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Regenerate token if requested
    const updateData: Record<string, unknown> = {};
    if (body.regenerateToken) {
      // Generate new cuid-like token
      updateData.token = `cl${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`;
    }
    if (body.enabled !== undefined) {
      updateData.enabled = body.enabled;
    }

    const feed = await prisma.calendarFeed.update({
      where: { id: params.id },
      data: updateData,
      include: {
        member: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    return NextResponse.json(feed);
  } catch (error) {
    console.error('Update calendar feed error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
