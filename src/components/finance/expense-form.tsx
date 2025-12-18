'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { expenseSchema, type ExpenseInput } from '@/lib/validations/budget';

interface Budget {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Member {
  id: string;
  name: string;
  color: string;
}

interface Expense {
  id: string;
  amount: number;
  vendor: string;
  description?: string;
  date: string;
  budget: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  member?: {
    id: string;
    name: string;
    color: string;
  };
}

interface ExpenseFormProps {
  budgets: Budget[];
  defaultBudgetId?: string;
  expense?: Expense | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ExpenseForm({ budgets, defaultBudgetId, expense, onSuccess, onCancel }: ExpenseFormProps) {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);

  const today = new Date().toISOString().split('T')[0];
  const isEditing = !!expense;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: expense?.amount || 0,
      vendor: expense?.vendor || '',
      description: expense?.description || '',
      date: expense ? new Date(expense.date).toISOString().split('T')[0] : today,
      budgetId: expense?.budget.id || defaultBudgetId || '',
      memberId: expense?.member?.id || undefined,
    },
  });

  const selectedBudgetId = watch('budgetId');
  const selectedMemberId = watch('memberId');

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/members');
        if (response.ok) {
          const data = await response.json();
          setMembers(data);
        }
      } catch (error) {
        console.error('Error fetching members:', error);
      }
    };

    fetchMembers();
  }, []);

  const onSubmit = async (data: ExpenseInput) => {
    setLoading(true);
    try {
      const url = isEditing ? `/api/expenses/${expense.id}` : '/api/expenses';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          memberId: data.memberId || undefined,
        }),
      });

      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedBudget = budgets.find(b => b.id === selectedBudgetId);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Budget */}
      <div className="space-y-2">
        <Label>Budget</Label>
        <Select
          value={selectedBudgetId}
          onValueChange={(value) => setValue('budgetId', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Budget wählen">
              {selectedBudget && (
                <span className="flex items-center gap-2">
                  <span>{selectedBudget.icon}</span>
                  <span>{selectedBudget.name}</span>
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {budgets.map((budget) => (
              <SelectItem key={budget.id} value={budget.id}>
                <span className="flex items-center gap-2">
                  <span>{budget.icon}</span>
                  <span>{budget.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.budgetId && (
          <p className="text-sm text-destructive">{errors.budgetId.message}</p>
        )}
      </div>

      {/* Betrag */}
      <div className="space-y-2">
        <Label htmlFor="amount">Betrag (€)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          {...register('amount', { valueAsNumber: true })}
        />
        {errors.amount && (
          <p className="text-sm text-destructive">{errors.amount.message}</p>
        )}
      </div>

      {/* Lieferant/Geschäft */}
      <div className="space-y-2">
        <Label htmlFor="vendor">Geschäft/Lieferant</Label>
        <Input
          id="vendor"
          placeholder="z.B. REWE, Amazon, ..."
          {...register('vendor')}
        />
        {errors.vendor && (
          <p className="text-sm text-destructive">{errors.vendor.message}</p>
        )}
      </div>

      {/* Datum */}
      <div className="space-y-2">
        <Label htmlFor="date">Datum</Label>
        <Input
          id="date"
          type="date"
          {...register('date')}
        />
        {errors.date && (
          <p className="text-sm text-destructive">{errors.date.message}</p>
        )}
      </div>

      {/* Familienmitglied (optional) */}
      <div className="space-y-2">
        <Label>Bezahlt von (optional)</Label>
        <Select
          value={selectedMemberId || 'none'}
          onValueChange={(value) => setValue('memberId', value === 'none' ? undefined : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Kein Mitglied zuordnen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Keine Zuordnung</SelectItem>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                <span className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: member.color }}
                  />
                  <span>{member.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Beschreibung (optional) */}
      <div className="space-y-2">
        <Label htmlFor="description">Beschreibung (optional)</Label>
        <Textarea
          id="description"
          placeholder="Zusätzliche Details..."
          rows={2}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={loading || !selectedBudgetId}>
          {loading ? 'Speichern...' : isEditing ? 'Speichern' : 'Ausgabe hinzufügen'}
        </Button>
      </div>
    </form>
  );
}
