import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateICalendar } from '@/lib/ical';

// GET: iCal Feed abrufen (öffentlich, ohne Auth - nur per Token)
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Feed anhand Token finden
    const feed = await prisma.calendarFeed.findUnique({
      where: { token: params.token },
      include: {
        family: true,
        member: {
          select: { id: true, name: true },
        },
      },
    });

    if (!feed || !feed.enabled) {
      return new NextResponse('Feed nicht gefunden oder deaktiviert', {
        status: 404,
      });
    }

    // Events für diesen Feed laden
    const whereClause: Record<string, unknown> = {
      familyId: feed.familyId,
    };

    // Falls Feed für bestimmtes Mitglied, nur dessen Events
    if (feed.memberId) {
      whereClause.participants = {
        some: {
          memberId: feed.memberId,
        },
      };
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        participants: {
          include: {
            member: {
              select: { id: true, name: true },
            },
          },
        },
        recurrence: true,
      },
      orderBy: { startTime: 'asc' },
    });

    // Last accessed aktualisieren
    await prisma.calendarFeed.update({
      where: { id: feed.id },
      data: { lastAccessed: new Date() },
    });

    // iCal generieren
    const icalContent = generateICalendar(events, feed.family.name, feed.name);

    return new NextResponse(icalContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${feed.name}.ics"`,
      },
    });
  } catch (error) {
    console.error('iCal feed error:', error);
    return new NextResponse('Fehler beim Generieren des Feeds', {
      status: 500,
    });
  }
}
