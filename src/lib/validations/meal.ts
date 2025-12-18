import { z } from 'zod';

export const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER'] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_TYPE_MAP: Record<MealType, { icon: string; order: number }> = {
  BREAKFAST: { icon: '🌅', order: 0 },
  LUNCH: { icon: '☀️', order: 1 },
  DINNER: { icon: '🌙', order: 2 },
};

export const DAY_NAMES = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export const mealSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  mealType: z.enum(MEAL_TYPES),
  title: z.string().min(1, 'Titel ist erforderlich').max(200),
  description: z.string().max(500).optional().nullable(),
  recipeUrl: z
    .string()
    .url('Ungültige URL')
    .optional()
    .nullable()
    .or(z.literal('')),
});

export const mealUpdateSchema = mealSchema.partial();

export type MealInput = z.infer<typeof mealSchema>;
export type MealUpdateInput = z.infer<typeof mealUpdateSchema>;
