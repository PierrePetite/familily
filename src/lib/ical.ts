import { format } from 'date-fns';

interface ICalEvent {
  id: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date | null;
  allDay: boolean;
  location: string | null;
  category: string;
  participants: Array<{
    member: {
      id: string;
      name: string;
    };
  }>;
  recurrence?: {
    frequency: string;
    interval: number;
    daysOfWeek: string | null;
    dayOfMonth: number | null;
    endDate: Date | null;
    count: number | null;
  } | null;
}

/**
 * Formats a date for iCal (YYYYMMDDTHHMMSS format)
 */
function formatICalDate(date: Date, allDay: boolean = false): string {
  if (allDay) {
    return format(date, "yyyyMMdd");
  }
  return format(date, "yyyyMMdd'T'HHmmss");
}

/**
 * Escapes special characters for iCal
 */
function escapeICalString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generates RRULE string from recurrence data
 */
function generateRRule(recurrence: ICalEvent['recurrence']): string | null {
  if (!recurrence) return null;

  const parts: string[] = [`FREQ=${recurrence.frequency}`];

  if (recurrence.interval > 1) {
    parts.push(`INTERVAL=${recurrence.interval}`);
  }

  if (recurrence.frequency === 'WEEKLY' && recurrence.daysOfWeek) {
    try {
      const days = JSON.parse(recurrence.daysOfWeek);
      if (Array.isArray(days) && days.length > 0) {
        parts.push(`BYDAY=${days.join(',')}`);
      }
    } catch {
      // Ignore parse errors
    }
  }

  if (recurrence.frequency === 'MONTHLY' && recurrence.dayOfMonth) {
    parts.push(`BYMONTHDAY=${recurrence.dayOfMonth}`);
  }

  if (recurrence.endDate) {
    parts.push(`UNTIL=${formatICalDate(recurrence.endDate)}`);
  } else if (recurrence.count) {
    parts.push(`COUNT=${recurrence.count}`);
  }

  return parts.join(';');
}

/**
 * Generates a complete iCalendar file content
 */
export function generateICalendar(
  events: ICalEvent[],
  familyName: string,
  feedName: string
): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//Familily//${familyName}//DE`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICalString(feedName)}`,
  ];

  for (const event of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.id}@familily`);
    lines.push(`DTSTAMP:${formatICalDate(new Date())}`);

    // Start/End time
    if (event.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${formatICalDate(event.startTime, true)}`);
      if (event.endTime) {
        lines.push(`DTEND;VALUE=DATE:${formatICalDate(event.endTime, true)}`);
      }
    } else {
      lines.push(`DTSTART:${formatICalDate(event.startTime)}`);
      if (event.endTime) {
        lines.push(`DTEND:${formatICalDate(event.endTime)}`);
      }
    }

    lines.push(`SUMMARY:${escapeICalString(event.title)}`);

    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICalString(event.description)}`);
    }

    if (event.location) {
      lines.push(`LOCATION:${escapeICalString(event.location)}`);
    }

    // Category
    lines.push(`CATEGORIES:${event.category}`);

    // Attendees
    for (const participant of event.participants) {
      lines.push(`ATTENDEE;CN=${escapeICalString(participant.member.name)}:mailto:${participant.member.id}@familily.local`);
    }

    // Recurrence rule
    if (event.recurrence) {
      const rrule = generateRRule(event.recurrence);
      if (rrule) {
        lines.push(`RRULE:${rrule}`);
      }
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}
