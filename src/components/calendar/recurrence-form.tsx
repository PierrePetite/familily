'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FREQUENCIES, WEEKDAYS } from '@/lib/validations/event';
import type { RecurrenceInput } from '@/lib/validations/event';

interface RecurrenceFormProps {
  value: RecurrenceInput;
  onChange: (value: RecurrenceInput) => void;
  disabled?: boolean;
}

export function RecurrenceForm({ value, onChange, disabled }: RecurrenceFormProps) {
  const updateField = <K extends keyof RecurrenceInput>(
    field: K,
    fieldValue: RecurrenceInput[K]
  ) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const toggleWeekday = (day: string) => {
    const currentDays = value.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    updateField('daysOfWeek', newDays);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
      <div className="text-sm font-medium text-muted-foreground">Wiederholung</div>

      {/* Frequency */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Häufigkeit</Label>
          <Select
            value={value.frequency}
            onValueChange={(v) => updateField('frequency', v as RecurrenceInput['frequency'])}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map((freq) => (
                <SelectItem key={freq.value} value={freq.value}>
                  {freq.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Intervall</Label>
          <Input
            type="number"
            min={1}
            max={99}
            value={value.interval}
            onChange={(e) => updateField('interval', parseInt(e.target.value) || 1)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Weekly: Day selection */}
      {value.frequency === 'WEEKLY' && (
        <div className="space-y-2">
          <Label>An diesen Tagen</Label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleWeekday(day.value)}
                className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                  (value.daysOfWeek || []).includes(day.value)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white border hover:bg-slate-100'
                }`}
                disabled={disabled}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Monthly: Day of month */}
      {value.frequency === 'MONTHLY' && (
        <div className="space-y-2">
          <Label>Am Tag des Monats</Label>
          <Input
            type="number"
            min={1}
            max={31}
            value={value.dayOfMonth || ''}
            onChange={(e) => updateField('dayOfMonth', parseInt(e.target.value) || undefined)}
            placeholder="z.B. 15 für den 15."
            disabled={disabled}
          />
        </div>
      )}

      {/* End condition */}
      <div className="space-y-2">
        <Label>Ende der Wiederholung</Label>
        <Select
          value={value.endType}
          onValueChange={(v) => updateField('endType', v as RecurrenceInput['endType'])}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="never">Nie</SelectItem>
            <SelectItem value="date">An einem Datum</SelectItem>
            <SelectItem value="count">Nach Anzahl</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {value.endType === 'date' && (
        <div className="space-y-2">
          <Label>Enddatum</Label>
          <Input
            type="date"
            value={value.endDate || ''}
            onChange={(e) => updateField('endDate', e.target.value)}
            disabled={disabled}
          />
        </div>
      )}

      {value.endType === 'count' && (
        <div className="space-y-2">
          <Label>Anzahl Wiederholungen</Label>
          <Input
            type="number"
            min={1}
            max={365}
            value={value.count || ''}
            onChange={(e) => updateField('count', parseInt(e.target.value) || undefined)}
            placeholder="z.B. 10"
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
