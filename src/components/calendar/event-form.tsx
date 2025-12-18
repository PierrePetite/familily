'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { eventSchema, type EventInput, type RecurrenceInput, CATEGORIES, REMINDER_OPTIONS } from '@/lib/validations/event';
import { RecurrenceForm } from './recurrence-form';
import { ConflictWarning } from './conflict-warning';
import { Bell, Plus, X } from 'lucide-react';

interface Conflict {
  eventId: string;
  eventTitle: string;
  eventStartTime: string;
  eventEndTime: string | null;
  eventAllDay: boolean;
  conflictingMembers: Array<{ id: string; name: string }>;
}

interface FamilyMember {
  id: string;
  name: string;
  color: string;
}

interface EventFormProps {
  initialData?: {
    id: string;
    title: string;
    description: string | null;
    startTime: string;
    endTime: string | null;
    allDay: boolean;
    category: string;
    location: string | null;
    isRecurring?: boolean;
    recurrence?: {
      frequency: string;
      interval: number;
      daysOfWeek: string | null;
      dayOfMonth: number | null;
      endDate: string | null;
      count: number | null;
    } | null;
    participants: Array<{ memberId: string }>;
    reminders?: Array<{ minutesBefore: number }>;
  };
  initialDate?: Date;
  members: FamilyMember[];
  onSubmit: (data: EventInput) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}

export function EventForm({
  initialData,
  initialDate,
  members,
  onSubmit,
  onCancel,
  onDelete,
}: EventFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    initialData?.participants.map((p) => p.memberId) || []
  );
  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring || false);
  const [reminderMinutes, setReminderMinutes] = useState<number[]>(
    initialData?.reminders?.map((r) => r.minutesBefore) || [15] // Default: 15 Min
  );
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const conflictCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  const [recurrence, setRecurrence] = useState<RecurrenceInput>(() => {
    if (initialData?.recurrence) {
      return {
        frequency: initialData.recurrence.frequency as RecurrenceInput['frequency'],
        interval: initialData.recurrence.interval,
        daysOfWeek: initialData.recurrence.daysOfWeek
          ? JSON.parse(initialData.recurrence.daysOfWeek)
          : [],
        dayOfMonth: initialData.recurrence.dayOfMonth || undefined,
        endType: initialData.recurrence.endDate
          ? 'date'
          : initialData.recurrence.count
          ? 'count'
          : 'never',
        endDate: initialData.recurrence.endDate
          ? format(new Date(initialData.recurrence.endDate), 'yyyy-MM-dd')
          : undefined,
        count: initialData.recurrence.count || undefined,
      };
    }
    return {
      frequency: 'WEEKLY',
      interval: 1,
      daysOfWeek: [],
      endType: 'never',
    };
  });

  const defaultStartTime = initialDate
    ? format(initialDate, "yyyy-MM-dd'T'HH:mm")
    : format(new Date(), "yyyy-MM-dd'T'HH:mm");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EventInput>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      startTime: initialData?.startTime
        ? format(new Date(initialData.startTime), "yyyy-MM-dd'T'HH:mm")
        : defaultStartTime,
      endTime: initialData?.endTime
        ? format(new Date(initialData.endTime), "yyyy-MM-dd'T'HH:mm")
        : '',
      allDay: initialData?.allDay || false,
      category: initialData?.category || 'OTHER',
      location: initialData?.location || '',
      participantIds: initialData?.participants.map((p) => p.memberId) || [],
      isRecurring: initialData?.isRecurring || false,
    },
  });

  const allDay = watch('allDay');

  useEffect(() => {
    setValue('participantIds', selectedParticipants);
  }, [selectedParticipants, setValue]);

  const toggleParticipant = (memberId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Conflict check function
  const checkConflicts = useCallback(async (
    startTime: string,
    endTime: string | undefined,
    allDayValue: boolean,
    participantIds: string[]
  ) => {
    if (!startTime || participantIds.length === 0) {
      setConflicts([]);
      return;
    }

    setIsCheckingConflicts(true);
    try {
      const response = await fetch('/api/events/conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime,
          endTime: endTime || null,
          allDay: allDayValue,
          participantIds,
          excludeEventId: initialData?.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConflicts(data.conflicts || []);
      }
    } catch (error) {
      console.error('Error checking conflicts:', error);
    } finally {
      setIsCheckingConflicts(false);
    }
  }, [initialData?.id]);

  // Debounced conflict check when relevant fields change
  const startTime = watch('startTime');
  const endTime = watch('endTime');

  useEffect(() => {
    // Clear previous timeout
    if (conflictCheckTimeout.current) {
      clearTimeout(conflictCheckTimeout.current);
    }

    // Debounce the conflict check
    conflictCheckTimeout.current = setTimeout(() => {
      checkConflicts(startTime, endTime, allDay ?? false, selectedParticipants);
    }, 500);

    return () => {
      if (conflictCheckTimeout.current) {
        clearTimeout(conflictCheckTimeout.current);
      }
    };
  }, [startTime, endTime, allDay, selectedParticipants, checkConflicts]);

  const onFormSubmit = async (data: EventInput) => {
    setIsLoading(true);
    try {
      const submitData: EventInput = {
        ...data,
        isRecurring,
        recurrence: isRecurring ? recurrence : undefined,
        reminderMinutes: reminderMinutes.length > 0 ? reminderMinutes : undefined,
      };
      await onSubmit(submitData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm('Möchten Sie diesen Termin wirklich löschen?')) return;

    setIsLoading(true);
    try {
      await onDelete();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Titel *</Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="Termin-Titel"
          disabled={isLoading}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Kategorie</Label>
        <Select
          defaultValue={initialData?.category || 'OTHER'}
          onValueChange={(value) => setValue('category', value)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Kategorie wählen" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* All Day */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="allDay"
          checked={allDay}
          onCheckedChange={(checked) => setValue('allDay', checked as boolean)}
          disabled={isLoading}
        />
        <Label htmlFor="allDay" className="cursor-pointer">
          Ganztägig
        </Label>
      </div>

      {/* Start Time */}
      <div className="space-y-2">
        <Label htmlFor="startTime">
          {allDay ? 'Datum' : 'Startzeit'} *
        </Label>
        <Input
          id="startTime"
          type={allDay ? 'date' : 'datetime-local'}
          {...register('startTime')}
          disabled={isLoading}
        />
        {errors.startTime && (
          <p className="text-sm text-destructive">{errors.startTime.message}</p>
        )}
      </div>

      {/* End Time */}
      {!allDay && (
        <div className="space-y-2">
          <Label htmlFor="endTime">Endzeit</Label>
          <Input
            id="endTime"
            type="datetime-local"
            {...register('endTime')}
            disabled={isLoading}
          />
          {errors.endTime && (
            <p className="text-sm text-destructive">{errors.endTime.message}</p>
          )}
        </div>
      )}

      {/* Recurring */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isRecurring"
          checked={isRecurring}
          onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
          disabled={isLoading}
        />
        <Label htmlFor="isRecurring" className="cursor-pointer">
          Wiederholen
        </Label>
      </div>

      {isRecurring && (
        <RecurrenceForm
          value={recurrence}
          onChange={setRecurrence}
          disabled={isLoading}
        />
      )}

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location">Ort</Label>
        <Input
          id="location"
          {...register('location')}
          placeholder="Adresse oder Ort"
          disabled={isLoading}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Beschreibung</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Weitere Details zum Termin..."
          rows={3}
          disabled={isLoading}
        />
      </div>

      {/* Participants */}
      <div className="space-y-2">
        <Label>Teilnehmer</Label>
        <div className="flex flex-wrap gap-2">
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => toggleParticipant(member.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedParticipants.includes(member.id)
                  ? 'ring-2 ring-offset-2'
                  : 'opacity-50 hover:opacity-80'
              }`}
              style={{
                backgroundColor: member.color,
                color: 'white',
                '--tw-ring-color': member.color,
              } as React.CSSProperties}
              disabled={isLoading}
            >
              {member.name}
            </button>
          ))}
        </div>
        {members.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Keine Familienmitglieder vorhanden
          </p>
        )}
      </div>

      {/* Reminders */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Erinnerungen
        </Label>
        <div className="flex flex-wrap gap-2">
          {reminderMinutes.map((minutes) => {
            const option = REMINDER_OPTIONS.find((o) => o.value === minutes);
            return (
              <div
                key={minutes}
                className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
              >
                <span>{option?.label || `${minutes} Min`}</span>
                <button
                  type="button"
                  onClick={() =>
                    setReminderMinutes((prev) =>
                      prev.filter((m) => m !== minutes)
                    )
                  }
                  className="hover:text-destructive"
                  disabled={isLoading}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
        <Select
          value=""
          onValueChange={(value) => {
            const minutes = parseInt(value, 10);
            if (!reminderMinutes.includes(minutes)) {
              setReminderMinutes((prev) => [...prev, minutes].sort((a, b) => a - b));
            }
          }}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Erinnerung hinzufügen</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            {REMINDER_OPTIONS.filter(
              (opt) => !reminderMinutes.includes(opt.value)
            ).map((opt) => (
              <SelectItem key={opt.value} value={opt.value.toString()}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {reminderMinutes.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Keine Erinnerungen konfiguriert
          </p>
        )}
      </div>

      {/* Conflict Warning */}
      {isCheckingConflicts && (
        <p className="text-sm text-muted-foreground">Prüfe Konflikte...</p>
      )}
      <ConflictWarning conflicts={conflicts} />

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <div>
          {onDelete && initialData && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              Löschen
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Speichern...' : initialData ? 'Aktualisieren' : 'Erstellen'}
          </Button>
        </div>
      </div>
    </form>
  );
}
