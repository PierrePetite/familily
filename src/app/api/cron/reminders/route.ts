import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendPushoverNotification } from '@/lib/pushover';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// Sicherheitstoken für Cron-Aufrufe (optional, falls gewünscht)
const CRON_SECRET = process.env.CRON_SECRET;

export const dynamic = 'force-dynamic';

// GET: Fällige Erinnerungen verarbeiten
// Sollte alle 1-5 Minuten aufgerufen werden
export async function GET(request: NextRequest) {
  try {
    // Optionale Authentifizierung per Secret
    if (CRON_SECRET) {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json(
          { error: 'Nicht autorisiert' },
          { status: 401 }
        );
      }
    }

    const now = new Date();
    const results = {
      processed: 0,
      sent: 0,
      errors: 0,
    };

    // Alle fälligen, noch nicht gesendeten Erinnerungen finden
    const dueReminders = await prisma.eventReminder.findMany({
      where: {
        sent: false,
        event: {
          // Event muss in der Zukunft liegen (oder gerade jetzt sein)
          startTime: {
            gte: now,
          },
        },
      },
      include: {
        event: {
          include: {
            participants: {
              include: {
                member: {
                  select: { id: true, name: true },
                },
              },
            },
            family: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // App-Einstellungen (Pushover Token) laden
    const appSettings = await prisma.appSettings.findUnique({
      where: { id: 'default' },
    });

    if (!appSettings?.pushoverAppToken) {
      // Keine Pushover-Konfiguration - Erinnerungen überspringen, aber nicht als Fehler melden
      return NextResponse.json({
        success: true,
        message: 'Keine Pushover-Konfiguration vorhanden',
        ...results,
      });
    }

    for (const reminder of dueReminders) {
      results.processed++;

      // Prüfen ob Erinnerung jetzt fällig ist
      const reminderTime = new Date(
        reminder.event.startTime.getTime() - reminder.minutesBefore * 60 * 1000
      );

      // Erinnerung ist fällig wenn die Zeit erreicht oder überschritten ist
      // aber nicht mehr als 10 Minuten in der Vergangenheit
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

      if (reminderTime > now || reminderTime < tenMinutesAgo) {
        // Noch nicht fällig oder zu alt
        continue;
      }

      // Alle Teilnehmer des Events ermitteln
      const participantIds = reminder.event.participants.map(
        (p) => p.member.id
      );

      // Alle Devices finden, die für diese Teilnehmer abonniert sind
      const devices = await prisma.notificationDevice.findMany({
        where: {
          familyId: reminder.event.family.id,
          enabled: true,
          subscribedMembers: {
            some: {
              memberId: {
                in: participantIds,
              },
            },
          },
        },
      });

      // Benachrichtigungsnachricht formatieren
      const eventDate = format(
        reminder.event.startTime,
        "EEEE, d. MMMM 'um' HH:mm 'Uhr'",
        { locale: de }
      );

      const participantNames = reminder.event.participants
        .map((p) => p.member.name)
        .join(', ');

      let reminderText = '';
      if (reminder.minutesBefore === 0) {
        reminderText = 'Jetzt';
      } else if (reminder.minutesBefore < 60) {
        reminderText = `In ${reminder.minutesBefore} Minuten`;
      } else if (reminder.minutesBefore < 1440) {
        const hours = Math.round(reminder.minutesBefore / 60);
        reminderText = `In ${hours} Stunde${hours > 1 ? 'n' : ''}`;
      } else {
        const days = Math.round(reminder.minutesBefore / 1440);
        reminderText = `In ${days} Tag${days > 1 ? 'en' : ''}`;
      }

      const message = `${reminderText}: ${reminder.event.title}\n` +
        `Wann: ${eventDate}\n` +
        (reminder.event.location ? `Wo: ${reminder.event.location}\n` : '') +
        `Teilnehmer: ${participantNames}`;

      // An alle relevanten Devices senden
      for (const device of devices) {
        try {
          const result = await sendPushoverNotification({
            appToken: appSettings.pushoverAppToken,
            userKey: device.userKey,
            title: `📅 ${reminder.event.title}`,
            message,
            url: process.env.NEXTAUTH_URL
              ? `${process.env.NEXTAUTH_URL}/calendar`
              : undefined,
            urlTitle: 'Im Kalender öffnen',
          });

          if (result.success) {
            results.sent++;
          } else {
            console.error(
              `Pushover error for device ${device.id}:`,
              result.error
            );
            results.errors++;
          }
        } catch (error) {
          console.error(`Error sending to device ${device.id}:`, error);
          results.errors++;
        }
      }

      // Erinnerung als gesendet markieren
      await prisma.eventReminder.update({
        where: { id: reminder.id },
        data: {
          sent: true,
          sentAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('Cron reminder error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
