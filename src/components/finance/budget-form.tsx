'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { budgetSchema, BUDGET_ICONS, BUDGET_COLORS, type BudgetInput } from '@/lib/validations/budget';

interface BudgetFormProps {
  budget?: {
    id: string;
    name: string;
    icon: string;
    monthlyAmount: number;
    resetDay: number;
    color: string;
    showInDashboard: boolean;
  } | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BudgetForm({ budget, onSuccess, onCancel }: BudgetFormProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: budget?.name || '',
      icon: budget?.icon || BUDGET_ICONS[0].value,
      monthlyAmount: budget?.monthlyAmount || 0,
      resetDay: budget?.resetDay || 1,
      color: budget?.color || BUDGET_COLORS[0],
      showInDashboard: budget?.showInDashboard ?? true,
    },
  });

  const selectedIcon = watch('icon');
  const selectedColor = watch('color');
  const showInDashboard = watch('showInDashboard');

  const onSubmit = async (data: BudgetInput) => {
    setLoading(true);
    try {
      const url = budget ? `/api/budgets/${budget.id}` : '/api/budgets';
      const method = budget ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving budget:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="z.B. Lebensmittel"
          {...register('name')}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Icon */}
      <div className="space-y-2">
        <Label>Icon</Label>
        <div className="flex flex-wrap gap-2">
          {BUDGET_ICONS.map((icon) => (
            <button
              key={icon.value}
              type="button"
              className={`w-10 h-10 text-xl rounded-lg border-2 transition-colors ${
                selectedIcon === icon.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setValue('icon', icon.value)}
              title={icon.label}
            >
              {icon.value}
            </button>
          ))}
        </div>
      </div>

      {/* Monatlicher Betrag */}
      <div className="space-y-2">
        <Label htmlFor="monthlyAmount">Monatliches Budget (€)</Label>
        <Input
          id="monthlyAmount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          {...register('monthlyAmount', { valueAsNumber: true })}
        />
        {errors.monthlyAmount && (
          <p className="text-sm text-destructive">{errors.monthlyAmount.message}</p>
        )}
      </div>

      {/* Reset Tag */}
      <div className="space-y-2">
        <Label htmlFor="resetDay">Zurücksetzen am</Label>
        <Select
          value={String(watch('resetDay'))}
          onValueChange={(value) => setValue('resetDay', parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Tag wählen" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <SelectItem key={day} value={String(day)}>
                {day}. des Monats
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Das Budget wird an diesem Tag jeden Monat zurückgesetzt
        </p>
      </div>

      {/* Farbe */}
      <div className="space-y-2">
        <Label>Farbe</Label>
        <div className="flex flex-wrap gap-2">
          {BUDGET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                selectedColor === color
                  ? 'ring-2 ring-primary ring-offset-2'
                  : 'border-transparent hover:scale-110'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setValue('color', color)}
            />
          ))}
        </div>
      </div>

      {/* Im Dashboard anzeigen */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="showInDashboard">Im Dashboard anzeigen</Label>
          <p className="text-xs text-muted-foreground">
            Zeigt dieses Budget im Dashboard-Widget an
          </p>
        </div>
        <Switch
          id="showInDashboard"
          checked={showInDashboard}
          onCheckedChange={(checked) => setValue('showInDashboard', checked)}
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Speichern...' : budget ? 'Speichern' : 'Erstellen'}
        </Button>
      </div>
    </form>
  );
}
