'use client';

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CATEGORY_MAP } from '@/lib/validations/event';
import type { CalendarEvent } from '@/types/calendar';
import { useTranslation } from '@/lib/i18n';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export function MonthView({
  currentDate,
  events,
  onDateClick,
  onEventClick,
}: MonthViewProps) {
  const { t, language } = useTranslation();
  const dateLocale = language === 'de' ? de : enUS;

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: dateLocale, weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { locale: dateLocale, weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = [
    t('calendar.weekdays.mo'),
    t('calendar.weekdays.tu'),
    t('calendar.weekdays.we'),
    t('calendar.weekdays.th'),
    t('calendar.weekdays.fr'),
    t('calendar.weekdays.sa'),
    t('calendar.weekdays.su'),
  ];

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      return isSameDay(eventDate, date);
    });
  };

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={index}
              className={cn(
                'min-h-[100px] border-b border-r p-1 cursor-pointer hover:bg-accent transition-colors',
                !isCurrentMonth && 'bg-muted/50',
                index % 7 === 6 && 'border-r-0'
              )}
              onClick={() => onDateClick(day)}
            >
              <div
                className={cn(
                  'w-7 h-7 flex items-center justify-center rounded-full text-sm mb-1',
                  isCurrentDay && 'bg-primary text-primary-foreground font-semibold',
                  !isCurrentMonth && !isCurrentDay && 'text-muted-foreground'
                )}
              >
                {format(day, 'd')}
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => {
                  const category = CATEGORY_MAP[event.category];
                  const firstParticipant = event.participants[0]?.member;

                  return (
                    <div
                      key={event.id}
                      className={cn(
                        'text-xs px-1.5 py-0.5 rounded truncate cursor-pointer',
                        'hover:opacity-80 transition-opacity'
                      )}
                      style={{
                        backgroundColor: firstParticipant?.color
                          ? `${firstParticipant.color}20`
                          : '#e2e8f0',
                        borderLeft: `3px solid ${firstParticipant?.color || '#94a3b8'}`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                    >
                      {!event.allDay && (
                        <span className="text-muted-foreground mr-1">
                          {format(new Date(event.startTime), 'HH:mm')}
                        </span>
                      )}
                      {category?.icon} {event.title}
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground px-1.5">
                    +{dayEvents.length - 3} {language === 'de' ? 'weitere' : 'more'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
