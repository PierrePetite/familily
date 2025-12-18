import { isBefore } from 'date-fns';

interface EventTimeSlot {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date | null;
  allDay: boolean;
  participants: Array<{ memberId: string; member: { name: string } }>;
}

interface ConflictInfo {
  event: EventTimeSlot;
  conflictingMembers: string[];
}

/**
 * Prüft ob zwei Zeiträume sich überschneiden
 */
function doTimeSlotsOverlap(
  start1: Date,
  end1: Date | null,
  start2: Date,
  end2: Date | null
): boolean {
  // Wenn ein Event kein Ende hat, nehmen wir an, es dauert 1 Stunde
  const effectiveEnd1 = end1 || new Date(start1.getTime() + 60 * 60 * 1000);
  const effectiveEnd2 = end2 || new Date(start2.getTime() + 60 * 60 * 1000);

  // Überschneidung: Start1 < End2 AND Start2 < End1
  return isBefore(start1, effectiveEnd2) && isBefore(start2, effectiveEnd1);
}

/**
 * Prüft ob zwei Events am selben Tag sind (für ganztägige Events)
 */
function areSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Findet alle Konflikte zwischen einem neuen Event und existierenden Events
 */
export function findConflicts(
  newEvent: {
    startTime: Date;
    endTime: Date | null;
    allDay: boolean;
    participantIds: string[];
  },
  existingEvents: EventTimeSlot[],
  excludeEventId?: string
): ConflictInfo[] {
  const conflicts: ConflictInfo[] = [];

  for (const event of existingEvents) {
    // Eigenes Event beim Bearbeiten ignorieren
    if (excludeEventId && event.id === excludeEventId) {
      continue;
    }

    // Prüfe ob Events zeitlich überschneiden
    let hasTimeConflict = false;

    if (newEvent.allDay || event.allDay) {
      // Ganztägige Events: Konflikt wenn am selben Tag
      hasTimeConflict = areSameDay(newEvent.startTime, event.startTime);
    } else {
      // Zeitbasierte Events: Prüfe Überschneidung
      hasTimeConflict = doTimeSlotsOverlap(
        newEvent.startTime,
        newEvent.endTime,
        event.startTime,
        event.endTime
      );
    }

    if (!hasTimeConflict) {
      continue;
    }

    // Prüfe ob gemeinsame Teilnehmer
    const eventMemberIds = event.participants.map((p) => p.memberId);
    const conflictingMembers = newEvent.participantIds.filter((id) =>
      eventMemberIds.includes(id)
    );

    if (conflictingMembers.length > 0) {
      conflicts.push({
        event,
        conflictingMembers,
      });
    }
  }

  return conflicts;
}

/**
 * Formatiert Konflikt-Informationen für die Anzeige
 */
export function formatConflictMessage(
  conflicts: ConflictInfo[],
  memberMap: Record<string, string>
): string {
  if (conflicts.length === 0) return '';

  const messages = conflicts.map((conflict) => {
    const memberNames = conflict.conflictingMembers
      .map((id) => memberMap[id] || 'Unbekannt')
      .join(', ');

    const time = conflict.event.allDay
      ? 'Ganztägig'
      : `${conflict.event.startTime.toLocaleTimeString('de-DE', {
          hour: '2-digit',
          minute: '2-digit',
        })}`;

    return `"${conflict.event.title}" (${time}) - ${memberNames}`;
  });

  return messages.join('\n');
}
