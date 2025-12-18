import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const settingsSchema = z.object({
  pushoverAppToken: z.string().optional().nullable(),
  defaultReminderMin: z.number().min(0).optional(),
  externalUrl: z.string().url().optional().nullable().or(z.literal('')),
});

// GET: App-Einstellungen abrufen
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    // Nur Admins dürfen Einstellungen sehen
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nur Admins können Einstellungen verwalten' },
        { status: 403 }
      );
    }

    let settings = await prisma.appSettings.findUnique({
      where: { id: 'default' },
    });

    // Erstelle Default-Einstellungen falls nicht vorhanden
    if (!settings) {
      settings = await prisma.appSettings.create({
        data: { id: 'default' },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Get app settings error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

// PUT: App-Einstellungen aktualisieren
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.familyId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    // Nur Admins dürfen Einstellungen ändern
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nur Admins können Einstellungen verwalten' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = settingsSchema.parse(body);

    const settings = await prisma.appSettings.upsert({
      where: { id: 'default' },
      update: {
        pushoverAppToken: validatedData.pushoverAppToken,
        defaultReminderMin: validatedData.defaultReminderMin,
        externalUrl: validatedData.externalUrl || null,
      },
      create: {
        id: 'default',
        pushoverAppToken: validatedData.pushoverAppToken,
        defaultReminderMin: validatedData.defaultReminderMin ?? 15,
        externalUrl: validatedData.externalUrl || null,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Update app settings error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
