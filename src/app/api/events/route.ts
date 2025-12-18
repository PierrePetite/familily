import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { createEventSchema } from '@/lib/validations/event';

// GET: Liste aller Events
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    const whereClause: Record<string, unknown> = {
      familyId: session.user.familyId,
    };

    // Filter nach Datumsbereich
    if (startDate && endDate) {
      whereClause.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: { id: true, name: true, color: true },
        },
        participants: {
          include: {
            member: {
              select: { id: true, name: true, color: true },
            },
            accompanist: {
              select: { id: true, name: true, color: true },
            },
          },
        },
        recurrence: true,
        reminders: {
          select: { id: true, minutesBefore: true, sent: true },
          orderBy: { minutesBefore: 'asc' },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

// POST: Neues Event erstellen
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

    const validationResult = createEventSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      startTime,
      endTime,
      allDay,
      location,
      travelTime,
      category,
      participantIds,
      isRecurring,
      recurrence,
      reminderMinutes,
    } = validationResult.data;

    // Parse datetime strings
    const startDateTime = new Date(startTime);
    const endDateTime = endTime ? new Date(endTime) : null;

    const event = await prisma.event.create({
      data: {
        title,
        description: description || null,
        startTime: startDateTime,
        endTime: endDateTime,
        allDay,
        location: location || null,
        travelTime: travelTime || null,
        category,
        isRecurring: isRecurring || false,
        familyId: session.user.familyId,
        createdById: session.user.id,
        participants: {
          create: participantIds.map((memberId) => ({
            memberId,
            isAccompanist: false,
          })),
        },
        recurrence: isRecurring && recurrence ? {
          create: {
            frequency: recurrence.frequency,
            interval: recurrence.interval,
            daysOfWeek: recurrence.daysOfWeek?.length
              ? JSON.stringify(recurrence.daysOfWeek)
              : null,
            dayOfMonth: recurrence.dayOfMonth || null,
            endDate: recurrence.endType === 'date' && recurrence.endDate
              ? new Date(recurrence.endDate)
              : null,
            count: recurrence.endType === 'count' ? recurrence.count : null,
          },
        } : undefined,
        reminders: reminderMinutes && reminderMinutes.length > 0 ? {
          create: reminderMinutes.map((minutes) => ({
            minutesBefore: minutes,
          })),
        } : undefined,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, color: true },
        },
        participants: {
          include: {
            member: {
              select: { id: true, name: true, color: true },
            },
            accompanist: {
              select: { id: true, name: true, color: true },
            },
          },
        },
        recurrence: true,
        reminders: {
          select: { id: true, minutesBefore: true, sent: true },
          orderBy: { minutesBefore: 'asc' },
        },
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
