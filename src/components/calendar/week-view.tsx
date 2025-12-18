'use client';

import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  setHours,
  setMinutes,
} from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CATEGORY_MAP } from '@/lib/validations/event';
import type { CalendarEvent } from '@/types/calendar';
import { useTranslation } from '@/lib/i18n';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onTimeClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export function WeekView({
  currentDate,
  events,
  onTimeClick,
  onEventClick,
}: WeekViewProps) {
  const { t, language } = useTranslation();
  const dateLocale = language === 'de' ? de : enUS;

  const weekStart = startOfWeek(currentDate, { locale: dateLocale, weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { locale: dateLocale, weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForDayAndHour = (date: Date, hour: number) => {
    return events.filter((event) => {
      if (event.allDay) return false;
      const eventDate = new Date(event.startTime);
      return isSameDay(eventDate, date) && eventDate.getHours() === hour;
    });
  };

  const getAllDayEvents = (date: Date) => {
    return events.filter((event) => {
      if (!event.allDay) return false;
      const eventDate = new Date(event.startTime);
      return isSameDay(eventDate, date);
    });
  };

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-8 border-b">
        <div className="p-2 text-center text-sm font-medium text-muted-foreground border-r">
          {language === 'de' ? 'Zeit' : 'Time'}
        </div>
        {days.map((day, index) => (
          <div
            key={index}
            className={cn(
              'p-2 text-center border-r last:border-r-0',
              isToday(day) && 'bg-primary/5'
            )}
          >
            <div className="text-sm text-muted-foreground">
              {format(day, 'EEE', { locale: dateLocale })}
            </div>
            <div
              className={cn(
                'text-lg font-semibold',
                isToday(day) && 'text-primary'
              )}
            >
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* All-day Events */}
      <div className="grid grid-cols-8 border-b">
        <div className="p-2 text-xs text-muted-foreground border-r">
          {t('calendar.allDay')}
        </div>
        {days.map((day, index) => {
          const allDayEvents = getAllDayEvents(day);
          return (
            <div key={index} className="p-1 border-r last:border-r-0 min-h-[40px]">
              {allDayEvents.map((event) => {
                const category = CATEGORY_MAP[event.category];
                const firstParticipant = event.participants[0]?.member;

                return (
                  <div
                    key={event.id}
                    className="text-xs px-1 py-0.5 rounded truncate cursor-pointer mb-1"
                    style={{
                      backgroundColor: firstParticipant?.color
                        ? `${firstParticipant.color}30`
                        : '#e2e8f0',
                      color: firstParticipant?.color || '#64748b',
                    }}
                    onClick={() => onEventClick(event)}
                  >
                    {category?.icon} {event.title}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Time Grid */}
      <div className="max-h-[600px] overflow-y-auto">
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b last:border-b-0">
            <div className="p-1 text-xs text-muted-foreground text-right pr-2 border-r">
              {hour.toString().padStart(2, '0')}:00
            </div>
            {days.map((day, dayIndex) => {
              const hourEvents = getEventsForDayAndHour(day, hour);

              return (
                <div
                  key={dayIndex}
                  className={cn(
                    'min-h-[40px] border-r last:border-r-0 cursor-pointer hover:bg-accent relative',
                    isToday(day) && 'bg-primary/5'
                  )}
                  onClick={() => {
                    const clickedTime = setMinutes(setHours(day, hour), 0);
                    onTimeClick(clickedTime);
                  }}
                >
                  {hourEvents.map((event) => {
                    const category = CATEGORY_MAP[event.category];
                    const firstParticipant = event.participants[0]?.member;

                    return (
                      <div
                        key={event.id}
                        className="absolute inset-x-0 mx-0.5 text-xs px-1 py-0.5 rounded cursor-pointer z-10"
                        style={{
                          backgroundColor: firstParticipant?.color
                            ? `${firstParticipant.color}30`
                            : '#e2e8f0',
                          borderLeft: `3px solid ${firstParticipant?.color || '#94a3b8'}`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                      >
                        <span className="font-medium">
                          {format(new Date(event.startTime), 'HH:mm')}
                        </span>{' '}
                        {category?.icon} {event.title}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
