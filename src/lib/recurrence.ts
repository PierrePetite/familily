import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isBefore,
  isAfter,
  getDay,
  setDate,
} from 'date-fns';

interface RecurrenceRule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  daysOfWeek?: string[];
  dayOfMonth?: number;
  endDate?: Date;
  count?: number;
}

const WEEKDAY_MAP: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

/**
 * Generiert alle Termine basierend auf einer Wiederholungsregel
 * @param startDate - Startdatum des ersten Termins
 * @param rule - Wiederholungsregel
 * @param maxOccurrences - Maximale Anzahl der generierten Termine (Sicherheitslimit)
 * @returns Array mit allen Termindaten
 */
export function generateOccurrences(
  startDate: Date,
  rule: RecurrenceRule,
  maxOccurrences: number = 365
): Date[] {
  const occurrences: Date[] = [startDate];
  let currentDate = startDate;
  let count = 1;

  const endLimit = rule.endDate || addYears(startDate, 2); // Max 2 Jahre voraus
  const maxCount = rule.count || maxOccurrences;

  while (count < maxCount) {
    currentDate = getNextOccurrence(currentDate, rule);

    if (isAfter(currentDate, endLimit)) {
      break;
    }

    // Bei WEEKLY mit bestimmten Wochentagen: prüfen ob der Tag passt
    if (rule.frequency === 'WEEKLY' && rule.daysOfWeek && rule.daysOfWeek.length > 0) {
      const dayOfWeek = getDay(currentDate);
      const dayCode = Object.entries(WEEKDAY_MAP).find(([, v]) => v === dayOfWeek)?.[0];

      if (!dayCode || !rule.daysOfWeek.includes(dayCode)) {
        continue;
      }
    }

    occurrences.push(currentDate);
    count++;
  }

  return occurrences;
}

/**
 * Berechnet das nächste Vorkommen basierend auf der Regel
 */
function getNextOccurrence(currentDate: Date, rule: RecurrenceRule): Date {
  switch (rule.frequency) {
    case 'DAILY':
      return addDays(currentDate, rule.interval);

    case 'WEEKLY':
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        // Bei mehreren Wochentagen: zum nächsten passenden Tag
        return addDays(currentDate, 1);
      }
      return addWeeks(currentDate, rule.interval);

    case 'MONTHLY':
      if (rule.dayOfMonth) {
        const nextMonth = addMonths(currentDate, rule.interval);
        return setDate(nextMonth, rule.dayOfMonth);
      }
      return addMonths(currentDate, rule.interval);

    case 'YEARLY':
      return addYears(currentDate, rule.interval);

    default:
      return addDays(currentDate, 1);
  }
}

/**
 * Expandiert alle wiederkehrenden Termine für einen bestimmten Datumsbereich
 * Dies ist nützlich für die Kalenderansicht
 */
export function expandRecurringEvents<T extends {
  id: string;
  startTime: Date;
  endTime: Date | null;
  isRecurring: boolean;
  recurrence?: {
    frequency: string;
    interval: number;
    daysOfWeek: string | null;
    dayOfMonth: number | null;
    endDate: Date | null;
    count: number | null;
  } | null;
}>(
  events: T[],
  rangeStart: Date,
  rangeEnd: Date
): (T & { originalEventId?: string; occurrenceDate?: Date })[] {
  const expandedEvents: (T & { originalEventId?: string; occurrenceDate?: Date })[] = [];

  for (const event of events) {
    if (!event.isRecurring || !event.recurrence) {
      // Nicht wiederkehrender Termin: direkt hinzufügen wenn im Bereich
      if (
        (isAfter(event.startTime, rangeStart) || event.startTime >= rangeStart) &&
        isBefore(event.startTime, rangeEnd)
      ) {
        expandedEvents.push(event);
      }
      continue;
    }

    // Wiederkehrende Termine expandieren
    const rule: RecurrenceRule = {
      frequency: event.recurrence.frequency as RecurrenceRule['frequency'],
      interval: event.recurrence.interval,
      daysOfWeek: event.recurrence.daysOfWeek
        ? JSON.parse(event.recurrence.daysOfWeek)
        : undefined,
      dayOfMonth: event.recurrence.dayOfMonth || undefined,
      endDate: event.recurrence.endDate || undefined,
      count: event.recurrence.count || undefined,
    };

    const occurrences = generateOccurrences(event.startTime, rule);
    const duration = event.endTime
      ? event.endTime.getTime() - event.startTime.getTime()
      : 0;

    for (const occurrence of occurrences) {
      if (isBefore(occurrence, rangeStart)) continue;
      if (isAfter(occurrence, rangeEnd)) break;

      expandedEvents.push({
        ...event,
        startTime: occurrence,
        endTime: duration ? new Date(occurrence.getTime() + duration) : null,
        originalEventId: event.id,
        occurrenceDate: occurrence,
      });
    }
  }

  return expandedEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

/**
 * Formatiert die Wiederholungsregel als lesbare Beschreibung
 */
export function formatRecurrenceDescription(rule: RecurrenceRule): string {
  const intervalText = rule.interval > 1 ? `alle ${rule.interval} ` : '';

  switch (rule.frequency) {
    case 'DAILY':
      return rule.interval === 1 ? 'Täglich' : `Alle ${rule.interval} Tage`;

    case 'WEEKLY':
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        const days = rule.daysOfWeek
          .map(d => {
            const dayNames: Record<string, string> = {
              MO: 'Mo', TU: 'Di', WE: 'Mi', TH: 'Do', FR: 'Fr', SA: 'Sa', SU: 'So'
            };
            return dayNames[d] || d;
          })
          .join(', ');
        return `${intervalText}Wöchentlich (${days})`;
      }
      return rule.interval === 1 ? 'Wöchentlich' : `Alle ${rule.interval} Wochen`;

    case 'MONTHLY':
      if (rule.dayOfMonth) {
        return `${intervalText}Monatlich am ${rule.dayOfMonth}.`;
      }
      return rule.interval === 1 ? 'Monatlich' : `Alle ${rule.interval} Monate`;

    case 'YEARLY':
      return rule.interval === 1 ? 'Jährlich' : `Alle ${rule.interval} Jahre`;

    default:
      return 'Unbekannt';
  }
}
