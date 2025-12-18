import { z } from 'zod';

export const BUDGET_ICONS = [
  { value: '🛒', label: 'Einkauf' },
  { value: '🏠', label: 'Haus/Wohnung' },
  { value: '🚗', label: 'Auto' },
  { value: '🎉', label: 'Freizeit' },
  { value: '✈️', label: 'Urlaub' },
  { value: '👕', label: 'Kleidung' },
  { value: '👶', label: 'Kinder' },
  { value: '💊', label: 'Gesundheit' },
  { value: '📺', label: 'Abos/Streaming' },
  { value: '🎁', label: 'Geschenke' },
  { value: '💡', label: 'Strom/Energie' },
  { value: '📱', label: 'Telefon/Internet' },
  { value: '🍽️', label: 'Restaurant' },
  { value: '🏋️', label: 'Sport/Fitness' },
  { value: '📚', label: 'Bildung' },
  { value: '🐕', label: 'Haustiere' },
  { value: '💰', label: 'Sonstiges' },
] as const;

export const BUDGET_COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#22c55e', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16', // Lime
  '#6366f1', // Indigo
] as const;

export const budgetSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(50, 'Name ist zu lang'),
  icon: z.string(),
  monthlyAmount: z.number().min(0, 'Betrag muss positiv sein'),
  resetDay: z.number().min(1).max(31),
  color: z.string(),
  showInDashboard: z.boolean(),
});

export const expenseSchema = z.object({
  amount: z.number().min(0.01, 'Betrag muss positiv sein'),
  vendor: z.string().min(1, 'Lieferant ist erforderlich').max(100, 'Lieferant ist zu lang'),
  description: z.string().max(500, 'Beschreibung ist zu lang').optional(),
  date: z.string(), // ISO date string
  budgetId: z.string(),
  memberId: z.string().optional(),
});

export type BudgetInput = z.infer<typeof budgetSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
