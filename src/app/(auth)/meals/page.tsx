'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, UtensilsCrossed } from 'lucide-react';
import { format, startOfWeek, addWeeks, subWeeks, getWeek } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { WeekGrid } from '@/components/meals/week-grid';
import { MealForm } from '@/components/meals/meal-form';
import { useTranslation } from '@/lib/i18n';
import type { MealType } from '@/lib/validations/meal';

interface Meal {
  id: string;
  dayOfWeek: number;
  mealType: string;
  title: string;
  description?: string | null;
  recipeUrl?: string | null;
}

interface MealPlan {
  id: string;
  weekStart: string;
  meals: Meal[];
}

export default function MealsPage() {
  const { t, language } = useTranslation();
  const dateLocale = language === 'de' ? de : enUS;

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [showMealDialog, setShowMealDialog] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [defaultDay, setDefaultDay] = useState(0);
  const [defaultMealType, setDefaultMealType] = useState<MealType>('DINNER');

  const fetchMealPlan = useCallback(async () => {
    try {
      setLoading(true);
      const weekParam = format(currentWeekStart, 'yyyy-MM-dd');
      const response = await fetch(`/api/meals?week=${weekParam}`);

      if (response.ok) {
        const data = await response.json();
        setMealPlan(data);
      }
    } catch (error) {
      console.error('Error fetching meal plan:', error);
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart]);

  useEffect(() => {
    fetchMealPlan();
  }, [fetchMealPlan]);

  const goToPreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const isCurrentWeek =
    format(currentWeekStart, 'yyyy-MM-dd') ===
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const handleAddMeal = (dayOfWeek: number, mealType: MealType) => {
    setEditingMeal(null);
    setDefaultDay(dayOfWeek);
    setDefaultMealType(mealType);
    setShowMealDialog(true);
  };

  const handleEditMeal = (meal: Meal) => {
    setEditingMeal(meal);
    setShowMealDialog(true);
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (!mealPlan) return;

    try {
      const response = await fetch(
        `/api/meals/${mealPlan.id}/items/${mealId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        fetchMealPlan();
      }
    } catch (error) {
      console.error('Error deleting meal:', error);
    }
  };

  const handleMealSuccess = () => {
    setShowMealDialog(false);
    setEditingMeal(null);
    fetchMealPlan();
  };

  const weekNumber = getWeek(currentWeekStart, { locale: dateLocale, weekStartsOn: 1 });

  if (loading && !mealPlan) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6" />
            {t('meals.title')}
          </h1>
          <p className="text-muted-foreground">{t('meals.subtitle')}</p>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold min-w-[200px] text-center">
            {language === 'de' ? `KW ${weekNumber}` : `Week ${weekNumber}`} -{' '}
            {format(
              currentWeekStart,
              language === 'de' ? 'd. MMM' : 'MMM d',
              { locale: dateLocale }
            )}
          </h2>
          {!isCurrentWeek && (
            <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
              {t('common.today')}
            </Button>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={goToNextWeek}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Week Grid */}
      {mealPlan && (
        <WeekGrid
          meals={mealPlan.meals}
          weekStart={currentWeekStart}
          onAddMeal={handleAddMeal}
          onEditMeal={handleEditMeal}
          onDeleteMeal={handleDeleteMeal}
        />
      )}

      {/* Empty State */}
      {mealPlan && mealPlan.meals.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t('meals.noMeals')}</p>
          <p className="text-sm">{t('meals.clickToAdd')}</p>
        </div>
      )}

      {/* Meal Dialog */}
      <Dialog
        open={showMealDialog}
        onOpenChange={(open) => {
          setShowMealDialog(open);
          if (!open) setEditingMeal(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMeal ? t('meals.editMeal') : t('meals.addMeal')}
            </DialogTitle>
          </DialogHeader>
          {mealPlan && (
            <MealForm
              planId={mealPlan.id}
              meal={editingMeal}
              defaultDay={defaultDay}
              defaultMealType={defaultMealType}
              onSuccess={handleMealSuccess}
              onCancel={() => {
                setShowMealDialog(false);
                setEditingMeal(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
