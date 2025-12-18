'use client';

import { Plus, Link as LinkIcon, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { differenceInDays, startOfDay } from 'date-fns';
import { useTranslation } from '@/lib/i18n';
import { MEAL_TYPES, MEAL_TYPE_MAP, DAY_NAMES } from '@/lib/validations/meal';
import type { MealType } from '@/lib/validations/meal';
import { cn } from '@/lib/utils';

interface Meal {
  id: string;
  dayOfWeek: number;
  mealType: string;
  title: string;
  description?: string | null;
  recipeUrl?: string | null;
}

interface WeekGridProps {
  meals: Meal[];
  weekStart: Date;
  onAddMeal: (dayOfWeek: number, mealType: MealType) => void;
  onEditMeal: (meal: Meal) => void;
  onDeleteMeal: (mealId: string) => void;
}

export function WeekGrid({
  meals,
  weekStart,
  onAddMeal,
  onEditMeal,
  onDeleteMeal,
}: WeekGridProps) {
  const { t } = useTranslation();
  const [deletingMeal, setDeletingMeal] = useState<Meal | null>(null);

  const getMeal = (dayOfWeek: number, mealType: string) => {
    return meals.find(
      (m) => m.dayOfWeek === dayOfWeek && m.mealType === mealType
    );
  };

  // Berechne welcher Tag heute ist (0-6, wobei 0=Montag)
  const today = startOfDay(new Date());
  const weekStartDay = startOfDay(weekStart);
  const daysDiff = differenceInDays(today, weekStartDay);
  const todayIndex = daysDiff >= 0 && daysDiff <= 6 ? daysDiff : -1;

  const handleDelete = async () => {
    if (deletingMeal) {
      onDeleteMeal(deletingMeal.id);
      setDeletingMeal(null);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header Row - Days */}
            <div className="grid grid-cols-8 border-b bg-muted/50">
              <div className="p-3 text-sm font-medium text-muted-foreground border-r" />
              {DAY_NAMES.map((day, index) => (
                <div
                  key={day}
                  className={cn(
                    "p-3 text-center text-sm font-medium border-r last:border-r-0",
                    index === todayIndex && "bg-primary/20 text-primary font-semibold"
                  )}
                >
                  {t(`meals.dayNames.${index}`)}
                </div>
              ))}
            </div>

            {/* Meal Rows */}
            {MEAL_TYPES.map((mealType) => (
              <div
                key={mealType}
                className="grid grid-cols-8 border-b last:border-b-0"
              >
                {/* Meal Type Label */}
                <div className="p-3 border-r bg-muted/30 flex items-center gap-2">
                  <span>{MEAL_TYPE_MAP[mealType].icon}</span>
                  <span className="text-sm font-medium">
                    {t(`meals.mealTypes.${mealType.toLowerCase()}`)}
                  </span>
                </div>

                {/* Day Cells */}
                {DAY_NAMES.map((_, dayIndex) => {
                  const meal = getMeal(dayIndex, mealType);
                  const isToday = dayIndex === todayIndex;

                  return (
                    <div
                      key={dayIndex}
                      className={cn(
                        "p-2 border-r last:border-r-0 min-h-[80px] hover:bg-muted/30 transition-colors group",
                        isToday && "bg-primary/5"
                      )}
                    >
                      {meal ? (
                        <div className="h-full">
                          <div
                            className="p-2 bg-primary/10 rounded-md cursor-pointer hover:bg-primary/20 transition-colors relative group/meal"
                            onClick={() => onEditMeal(meal)}
                          >
                            <div className="font-medium text-sm pr-6 break-words">
                              {meal.title}
                            </div>
                            {meal.recipeUrl && (
                              <a
                                href={meal.recipeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary flex items-center gap-1 mt-1 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <LinkIcon className="h-3 w-3" />
                                {t('meals.recipe')}
                              </a>
                            )}
                            {meal.description && (
                              <div className="text-xs text-muted-foreground mt-1 break-words">
                                {meal.description}
                              </div>
                            )}
                            {/* Action buttons */}
                            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover/meal:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditMeal(meal);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingMeal(meal);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          className="w-full h-full min-h-[60px] opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => onAddMeal(dayIndex, mealType)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingMeal} onOpenChange={() => setDeletingMeal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('meals.deleteMeal')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('meals.deleteMealConfirm', { title: deletingMeal?.title || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
