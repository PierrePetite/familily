import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { updateEventSchema } from '@/lib/validations/event';

// GET: Einzelnes Event abrufen
export async function GET(
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

    const event = await prisma.event.findFirst({
      where: {
        id: params.id,
        familyId: session.user.familyId,
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

    if (!event) {
      return NextResponse.json(
        { error: 'Termin nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

// PUT: Event aktualisieren
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

    const body = await request.json();
    body.id = params.id;

    const validationResult = updateEventSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    // Prüfen ob Event zur Familie gehört
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: params.id,
        familyId: session.user.familyId,
      },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Termin nicht gefunden' },
        { status: 404 }
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
      reminderMinutes,
    } = validationResult.data;

    // Update-Daten vorbereiten
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description || null;
    if (location !== undefined) updateData.location = location || null;
    if (travelTime !== undefined) updateData.travelTime = travelTime || null;
    if (category !== undefined) updateData.category = category;
    if (allDay !== undefined) updateData.allDay = allDay;

    // Datum/Zeit aktualisieren
    if (startTime !== undefined) {
      updateData.startTime = new Date(startTime);
    }

    if (endTime !== undefined) {
      updateData.endTime = endTime ? new Date(endTime) : null;
    }

    // Participants aktualisieren
    if (participantIds !== undefined) {
      // Alte Participants löschen
      await prisma.eventParticipant.deleteMany({
        where: { eventId: params.id },
      });

      // Neue erstellen
      if (participantIds.length > 0) {
        await prisma.eventParticipant.createMany({
          data: participantIds.map((memberId) => ({
            eventId: params.id,
            memberId,
            isAccompanist: false,
          })),
        });
      }
    }

    // Reminders aktualisieren
    if (reminderMinutes !== undefined) {
      // Alte Reminders löschen (nur die noch nicht gesendeten)
      await prisma.eventReminder.deleteMany({
        where: { eventId: params.id, sent: false },
      });

      // Neue erstellen
      if (reminderMinutes.length > 0) {
        // Prüfe welche bereits existieren
        const existingReminders = await prisma.eventReminder.findMany({
          where: { eventId: params.id },
          select: { minutesBefore: true },
        });
        const existingMinutes = new Set(existingReminders.map(r => r.minutesBefore));

        const newReminders = reminderMinutes.filter(m => !existingMinutes.has(m));
        if (newReminders.length > 0) {
          await prisma.eventReminder.createMany({
            data: newReminders.map((minutes) => ({
              eventId: params.id,
              minutesBefore: minutes,
            })),
          });
        }
      }
    }

    const event = await prisma.event.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(event);
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

// DELETE: Event löschen
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

    // Prüfen ob Event zur Familie gehört
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: params.id,
        familyId: session.user.familyId,
      },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Termin nicht gefunden' },
        { status: 404 }
      );
    }

    await prisma.event.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
