'use client';

import { useState } from 'react';
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
import { useTranslation } from '@/lib/i18n';
import { MEAL_TYPES, MEAL_TYPE_MAP, DAY_NAMES } from '@/lib/validations/meal';
import type { MealType } from '@/lib/validations/meal';

interface Meal {
  id: string;
  dayOfWeek: number;
  mealType: string;
  title: string;
  description?: string | null;
  recipeUrl?: string | null;
}

interface MealFormProps {
  planId: string;
  meal?: Meal | null;
  defaultDay?: number;
  defaultMealType?: MealType;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MealForm({
  planId,
  meal,
  defaultDay = 0,
  defaultMealType = 'DINNER',
  onSuccess,
  onCancel,
}: MealFormProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dayOfWeek, setDayOfWeek] = useState(meal?.dayOfWeek ?? defaultDay);
  const [mealType, setMealType] = useState<MealType>(
    (meal?.mealType as MealType) ?? defaultMealType
  );
  const [title, setTitle] = useState(meal?.title ?? '');
  const [description, setDescription] = useState(meal?.description ?? '');
  const [recipeUrl, setRecipeUrl] = useState(meal?.recipeUrl ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url = meal
        ? `/api/meals/${planId}/items/${meal.id}`
        : `/api/meals/${planId}/items`;
      const method = meal ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayOfWeek,
          mealType,
          title,
          description: description || null,
          recipeUrl: recipeUrl || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save meal');
      }

      onSuccess();
    } catch {
      setError(t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('meals.day')}</Label>
          <Select
            value={dayOfWeek.toString()}
            onValueChange={(v) => setDayOfWeek(parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAY_NAMES.map((day, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {t(`meals.dayNames.${index}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('meals.mealType')}</Label>
          <Select
            value={mealType}
            onValueChange={(v) => setMealType(v as MealType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEAL_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {MEAL_TYPE_MAP[type].icon} {t(`meals.mealTypes.${type.toLowerCase()}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">{t('meals.title_field')}</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('meals.titlePlaceholder')}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recipeUrl">
          {t('meals.recipeUrl')} ({t('common.optional')})
        </Label>
        <Input
          id="recipeUrl"
          type="url"
          value={recipeUrl}
          onChange={(e) => setRecipeUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          {t('meals.notes')} ({t('common.optional')})
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('meals.notesPlaceholder')}
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting || !title.trim()}>
          {isSubmitting ? t('common.loading') : t('common.save')}
        </Button>
      </div>
    </form>
  );
}
