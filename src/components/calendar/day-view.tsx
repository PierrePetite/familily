'use client';

import {
  format,
  isSameDay,
  setHours,
  setMinutes,
} from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CATEGORY_MAP } from '@/lib/validations/event';
import type { CalendarEvent } from '@/types/calendar';
import { useTranslation } from '@/lib/i18n';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onTimeClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export function DayView({
  currentDate,
  events,
  onTimeClick,
  onEventClick,
}: DayViewProps) {
  const { t, language } = useTranslation();
  const dateLocale = language === 'de' ? de : enUS;

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const dayEvents = events.filter((event) =>
    isSameDay(new Date(event.startTime), currentDate)
  );

  const allDayEvents = dayEvents.filter((e) => e.allDay);
  const timedEvents = dayEvents.filter((e) => !e.allDay);

  const getEventsForHour = (hour: number) => {
    return timedEvents.filter((event) => {
      const eventHour = new Date(event.startTime).getHours();
      return eventHour === hour;
    });
  };

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b text-center">
        <div className="text-lg text-muted-foreground">
          {format(currentDate, 'EEEE', { locale: dateLocale })}
        </div>
        <div className="text-3xl font-bold">
          {format(currentDate, language === 'de' ? 'd. MMMM yyyy' : 'MMMM d, yyyy', { locale: dateLocale })}
        </div>
      </div>

      {/* All-day Events */}
      {allDayEvents.length > 0 && (
        <div className="p-4 border-b bg-muted">
          <div className="text-sm text-muted-foreground mb-2">{t('calendar.allDay')}</div>
          <div className="space-y-2">
            {allDayEvents.map((event) => {
              const category = CATEGORY_MAP[event.category];
              const firstParticipant = event.participants[0]?.member;

              return (
                <div
                  key={event.id}
                  className="p-2 rounded cursor-pointer hover:opacity-80"
                  style={{
                    backgroundColor: firstParticipant?.color
                      ? `${firstParticipant.color}20`
                      : '#e2e8f0',
                    borderLeft: `4px solid ${firstParticipant?.color || '#94a3b8'}`,
                  }}
                  onClick={() => onEventClick(event)}
                >
                  <div className="font-medium">
                    {category?.icon} {event.title}
                  </div>
                  {event.location && (
                    <div className="text-sm text-muted-foreground">
                      📍 {event.location}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Time Grid */}
      <div className="max-h-[600px] overflow-y-auto">
        {hours.map((hour) => {
          const hourEvents = getEventsForHour(hour);

          return (
            <div
              key={hour}
              className={cn(
                'flex border-b last:border-b-0 min-h-[60px] cursor-pointer hover:bg-accent',
                hour >= 8 && hour <= 18 && 'bg-card',
                (hour < 8 || hour > 18) && 'bg-muted/50'
              )}
              onClick={() => {
                const clickedTime = setMinutes(setHours(currentDate, hour), 0);
                onTimeClick(clickedTime);
              }}
            >
              <div className="w-20 p-2 text-sm text-muted-foreground text-right pr-4 border-r shrink-0">
                {hour.toString().padStart(2, '0')}:00
              </div>

              <div className="flex-1 p-1 relative">
                {hourEvents.map((event) => {
                  const category = CATEGORY_MAP[event.category];
                  const firstParticipant = event.participants[0]?.member;
                  const startTime = format(new Date(event.startTime), 'HH:mm');
                  const endTime = event.endTime
                    ? format(new Date(event.endTime), 'HH:mm')
                    : null;

                  return (
                    <div
                      key={event.id}
                      className="p-2 rounded cursor-pointer hover:opacity-80 mb-1"
                      style={{
                        backgroundColor: firstParticipant?.color
                          ? `${firstParticipant.color}20`
                          : '#e2e8f0',
                        borderLeft: `4px solid ${firstParticipant?.color || '#94a3b8'}`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold">
                          {startTime}
                          {endTime && ` - ${endTime}`}
                        </span>
                      </div>
                      <div className="font-medium">
                        {category?.icon} {event.title}
                      </div>
                      {event.location && (
                        <div className="text-sm text-muted-foreground">
                          📍 {event.location}
                        </div>
                      )}
                      {event.participants.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {event.participants.map((p) => (
                            <span
                              key={p.member.id}
                              className="text-xs px-1.5 py-0.5 rounded-full"
                              style={{
                                backgroundColor: p.member.color,
                                color: 'white',
                              }}
                            >
                              {p.member.name.split(' ')[0]}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
