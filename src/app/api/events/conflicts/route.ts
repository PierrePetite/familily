import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { findConflicts } from '@/lib/conflict-detection';
import { startOfDay, endOfDay, addDays, subDays } from 'date-fns';

// POST: Prüfe auf Konflikte
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
    const { startTime, endTime, allDay, participantIds, excludeEventId } = body;

    if (!startTime || !participantIds || participantIds.length === 0) {
      return NextResponse.json({ conflicts: [] });
    }

    const eventDate = new Date(startTime);

    // Hole Events im relevanten Zeitraum (1 Tag vor und nach)
    const rangeStart = startOfDay(subDays(eventDate, 1));
    const rangeEnd = endOfDay(addDays(eventDate, 1));

    const existingEvents = await prisma.event.findMany({
      where: {
        familyId: session.user.familyId,
        startTime: {
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
      include: {
        participants: {
          include: {
            member: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    const conflicts = findConflicts(
      {
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        allDay: allDay || false,
        participantIds,
      },
      existingEvents.map((e) => ({
        id: e.id,
        title: e.title,
        startTime: e.startTime,
        endTime: e.endTime,
        allDay: e.allDay,
        participants: e.participants,
      })),
      excludeEventId
    );

    return NextResponse.json({
      hasConflicts: conflicts.length > 0,
      conflicts: conflicts.map((c) => ({
        eventId: c.event.id,
        eventTitle: c.event.title,
        eventStartTime: c.event.startTime.toISOString(),
        eventEndTime: c.event.endTime?.toISOString() || null,
        eventAllDay: c.event.allDay,
        conflictingMembers: c.conflictingMembers.map((memberId) => {
          const participant = c.event.participants.find(
            (p) => p.memberId === memberId
          );
          return {
            id: memberId,
            name: participant?.member.name || 'Unbekannt',
          };
        }),
      })),
    });
  } catch (error) {
    console.error('Check conflicts error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
