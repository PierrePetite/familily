import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const feedSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100),
  memberId: z.string().optional().nullable(), // null = alle Familienmitglieder
});

// GET: Alle Calendar Feeds der Familie
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const feeds = await prisma.calendarFeed.findMany({
      where: {
        familyId: session.user.familyId,
      },
      include: {
        member: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(feeds);
  } catch (error) {
    console.error('Get calendar feeds error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

// POST: Neuen Calendar Feed erstellen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = feedSchema.parse(body);

    const feed = await prisma.calendarFeed.create({
      data: {
        name: validatedData.name,
        memberId: validatedData.memberId || null,
        familyId: session.user.familyId,
      },
      include: {
        member: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    return NextResponse.json(feed, { status: 201 });
  } catch (error) {
    console.error('Create calendar feed error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
