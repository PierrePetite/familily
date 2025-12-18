'use client';

import { useState, useEffect, useCallback } from 'react';
import { addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { CalendarHeader } from '@/components/calendar/calendar-header';
import { MonthView } from '@/components/calendar/month-view';
import { WeekView } from '@/components/calendar/week-view';
import { DayView } from '@/components/calendar/day-view';
import { EventForm } from '@/components/calendar/event-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { EventInput } from '@/lib/validations/event';
import type { CalendarEvent } from '@/types/calendar';
import { useTranslation } from '@/lib/i18n';

type ViewType = 'month' | 'week' | 'day';

interface FamilyMember {
  id: string;
  name: string;
  color: string;
}

export default function CalendarPage() {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Filter events
  const filteredEvents = events.filter((event) => {
    // Member filter
    if (selectedMembers.length > 0) {
      const eventMemberIds = event.participants.map((p) => p.memberId);
      if (!selectedMembers.some((id) => eventMemberIds.includes(id))) {
        return false;
      }
    }

    // Category filter
    if (selectedCategories.length > 0) {
      if (!selectedCategories.includes(event.category)) {
        return false;
      }
    }

    return true;
  });

  // Filter handlers
  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleClearFilters = () => {
    setSelectedMembers([]);
    setSelectedCategories([]);
  };

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      } else {
        console.error('Failed to fetch events:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  }, []);

  // Fetch members
  const fetchMembers = useCallback(async () => {
    try {
      const response = await fetch('/api/members');
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      } else {
        console.error('Failed to fetch members:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        await Promise.all([fetchEvents(), fetchMembers()]);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [fetchEvents, fetchMembers]);

  // Navigation
  const goToToday = () => setCurrentDate(new Date());

  const goToPrevious = () => {
    switch (view) {
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(subDays(currentDate, 1));
        break;
    }
  };

  const goToNext = () => {
    switch (view) {
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
    }
  };

  // Event handlers
  const handleDateClick = (date: Date) => {
    setSelectedEvent(null);
    setSelectedDate(date);
    setDialogOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedDate(null);
    setDialogOpen(true);
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setSelectedDate(new Date());
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedEvent(null);
    setSelectedDate(null);
  };

  // API handlers
  const handleSubmit = async (data: EventInput) => {
    try {
      const url = selectedEvent ? `/api/events/${selectedEvent.id}` : '/api/events';
      const method = selectedEvent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchEvents();
        handleCloseDialog();
      } else {
        const error = await response.json();
        alert(error.message || t('common.error'));
      }
    } catch (error) {
      console.error('Failed to save event:', error);
      alert(t('common.error'));
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;

    try {
      const response = await fetch(`/api/events/${selectedEvent.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchEvents();
        handleCloseDialog();
      } else {
        const error = await response.json();
        alert(error.message || t('common.error'));
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert(t('common.error'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onViewChange={setView}
        onPrevious={goToPrevious}
        onNext={goToNext}
        onToday={goToToday}
        onCreateEvent={handleCreateEvent}
        members={members}
        selectedMembers={selectedMembers}
        selectedCategories={selectedCategories}
        onMemberToggle={handleMemberToggle}
        onCategoryToggle={handleCategoryToggle}
        onClearFilters={handleClearFilters}
      />

      {view === 'month' && (
        <MonthView
          currentDate={currentDate}
          events={filteredEvents}
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
        />
      )}

      {view === 'week' && (
        <WeekView
          currentDate={currentDate}
          events={filteredEvents}
          onTimeClick={handleDateClick}
          onEventClick={handleEventClick}
        />
      )}

      {view === 'day' && (
        <DayView
          currentDate={currentDate}
          events={filteredEvents}
          onTimeClick={handleDateClick}
          onEventClick={handleEventClick}
        />
      )}

      {/* Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent ? t('calendar.editEvent') : t('calendar.newEvent')}
            </DialogTitle>
          </DialogHeader>
          <EventForm
            initialData={
              selectedEvent
                ? {
                    id: selectedEvent.id,
                    title: selectedEvent.title,
                    description: selectedEvent.description,
                    startTime: selectedEvent.startTime,
                    endTime: selectedEvent.endTime,
                    allDay: selectedEvent.allDay,
                    category: selectedEvent.category,
                    location: selectedEvent.location,
                    isRecurring: selectedEvent.isRecurring,
                    recurrence: selectedEvent.recurrence,
                    participants: selectedEvent.participants.map((p) => ({
                      memberId: p.memberId,
                    })),
                  }
                : undefined
            }
            initialDate={selectedDate || undefined}
            members={members}
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
            onDelete={selectedEvent ? handleDelete : undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
