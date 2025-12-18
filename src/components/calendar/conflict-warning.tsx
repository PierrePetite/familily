'use client';

import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Conflict {
  eventId: string;
  eventTitle: string;
  eventStartTime: string;
  eventEndTime: string | null;
  eventAllDay: boolean;
  conflictingMembers: Array<{ id: string; name: string }>;
}

interface ConflictWarningProps {
  conflicts: Conflict[];
}

export function ConflictWarning({ conflicts }: ConflictWarningProps) {
  if (conflicts.length === 0) return null;

  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="font-medium text-yellow-800 dark:text-yellow-200">
            Terminüberschneidung erkannt
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Folgende Termine überschneiden sich zeitlich:
          </p>
          <ul className="text-sm space-y-1">
            {conflicts.map((conflict) => (
              <li
                key={conflict.eventId}
                className="text-yellow-700 dark:text-yellow-300"
              >
                <span className="font-medium">{conflict.eventTitle}</span>
                {' - '}
                {conflict.eventAllDay
                  ? 'Ganztägig'
                  : format(new Date(conflict.eventStartTime), 'HH:mm', {
                      locale: de,
                    })}
                {conflict.eventEndTime &&
                  !conflict.eventAllDay &&
                  ` - ${format(new Date(conflict.eventEndTime), 'HH:mm', {
                    locale: de,
                  })}`}
                <span className="text-yellow-600 dark:text-yellow-400">
                  {' '}
                  ({conflict.conflictingMembers.map((m) => m.name).join(', ')})
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
            Du kannst den Termin trotzdem speichern.
          </p>
        </div>
      </div>
    </div>
  );
}
