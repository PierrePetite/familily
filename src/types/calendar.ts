export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  allDay: boolean;
  category: string;
  location: string | null;
  isRecurring: boolean;
  recurrence?: {
    id: string;
    frequency: string;
    interval: number;
    daysOfWeek: string | null;
    dayOfMonth: number | null;
    endDate: string | null;
    count: number | null;
  } | null;
  participants: Array<{
    memberId: string;
    member: { id: string; name: string; color: string };
  }>;
  // For expanded recurring events
  originalEventId?: string;
  occurrenceDate?: string;
}
