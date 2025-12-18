import { z } from 'zod';

export const CATEGORIES = [
  { value: 'DOCTOR', label: 'Arzt', icon: '🏥' },
  { value: 'SCHOOL', label: 'Schule', icon: '📚' },
  { value: 'SPORT', label: 'Sport', icon: '⚽' },
  { value: 'WORK', label: 'Arbeit', icon: '💼' },
  { value: 'LEISURE', label: 'Freizeit', icon: '🎮' },
  { value: 'BIRTHDAY', label: 'Geburtstag', icon: '🎂' },
  { value: 'HOLIDAY', label: 'Feiertag', icon: '🎄' },
  { value: 'OTHER', label: 'Sonstiges', icon: '📌' },
] as const;

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c])
);

export const FREQUENCIES = [
  { value: 'DAILY', label: 'Täglich' },
  { value: 'WEEKLY', label: 'Wöchentlich' },
  { value: 'MONTHLY', label: 'Monatlich' },
  { value: 'YEARLY', label: 'Jährlich' },
] as const;

export const WEEKDAYS = [
  { value: 'MO', label: 'Mo' },
  { value: 'TU', label: 'Di' },
  { value: 'WE', label: 'Mi' },
  { value: 'TH', label: 'Do' },
  { value: 'FR', label: 'Fr' },
  { value: 'SA', label: 'Sa' },
  { value: 'SU', label: 'So' },
] as const;

export const REMINDER_OPTIONS = [
  { value: 0, label: 'Zur Startzeit' },
  { value: 5, label: '5 Minuten vorher' },
  { value: 15, label: '15 Minuten vorher' },
  { value: 30, label: '30 Minuten vorher' },
  { value: 60, label: '1 Stunde vorher' },
  { value: 120, label: '2 Stunden vorher' },
  { value: 1440, label: '1 Tag vorher' },
  { value: 2880, label: '2 Tage vorher' },
  { value: 10080, label: '1 Woche vorher' },
] as const;

export const recurrenceSchema = z.object({
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  interval: z.number().min(1).max(99).default(1),
  daysOfWeek: z.array(z.string()).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  endType: z.enum(['never', 'date', 'count']).default('never'),
  endDate: z.string().optional(),
  count: z.number().min(1).max(365).optional(),
});

export const eventSchema = z.object({
  title: z
    .string()
    .min(1, 'Titel ist erforderlich')
    .max(100, 'Titel darf maximal 100 Zeichen haben'),
  description: z.string().max(500).optional().or(z.literal('')),
  startTime: z.string().min(1, 'Startzeit ist erforderlich'),
  endTime: z.string().optional().or(z.literal('')),
  allDay: z.boolean().default(false),
  location: z.string().max(200).optional().or(z.literal('')),
  travelTime: z.number().min(0).max(480).optional(),
  category: z.string().default('OTHER'),
  participantIds: z.array(z.string()).default([]),
  isRecurring: z.boolean().default(false),
  recurrence: recurrenceSchema.optional(),
  reminderMinutes: z.array(z.number()).default([15]), // Default: 15 min vorher
});

export const createEventSchema = eventSchema;

export const updateEventSchema = eventSchema.partial().extend({
  id: z.string(),
});

export type EventInput = z.input<typeof eventSchema>;
export type EventOutput = z.output<typeof eventSchema>;
export type EventFormData = z.infer<typeof eventSchema>;
export type CreateEventData = z.infer<typeof createEventSchema>;
export type UpdateEventData = z.infer<typeof updateEventSchema>;
export type RecurrenceInput = z.infer<typeof recurrenceSchema>;
