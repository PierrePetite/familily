import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { sendPushoverNotification } from '@/lib/pushover';

// POST: Test-Benachrichtigung senden
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
    const { deviceId } = body;

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID erforderlich' },
        { status: 400 }
      );
    }

    // Hole Device
    const device = await prisma.notificationDevice.findFirst({
      where: {
        id: deviceId,
        familyId: session.user.familyId,
      },
    });

    if (!device) {
      return NextResponse.json(
        { error: 'Gerät nicht gefunden' },
        { status: 404 }
      );
    }

    // Hole App Settings für Token
    const settings = await prisma.appSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings?.pushoverAppToken) {
      return NextResponse.json(
        { error: 'Pushover App Token nicht konfiguriert. Bitte in den Einstellungen hinterlegen.' },
        { status: 400 }
      );
    }

    // Sende Test-Nachricht
    const result = await sendPushoverNotification({
      appToken: settings.pushoverAppToken,
      userKey: device.userKey,
      title: 'Familily Test',
      message: `Test-Benachrichtigung für "${device.name}" erfolgreich!`,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test-Benachrichtigung gesendet!'
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Fehler beim Senden' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
