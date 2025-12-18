import { z } from 'zod';

export const PRIORITIES = [
  { value: 'LOW', label: 'Niedrig', color: '#94a3b8' },
  { value: 'NORMAL', label: 'Normal', color: '#3b82f6' },
  { value: 'HIGH', label: 'Hoch', color: '#ef4444' },
] as const;

export const LIST_ICONS = [
  { value: '📝', label: 'Notiz' },
  { value: '🛒', label: 'Einkauf' },
  { value: '🏠', label: 'Haushalt' },
  { value: '📚', label: 'Schule' },
  { value: '💼', label: 'Arbeit' },
  { value: '🎉', label: 'Party' },
  { value: '🏃', label: 'Sport' },
  { value: '🎁', label: 'Geschenke' },
  { value: '✈️', label: 'Reise' },
  { value: '🔧', label: 'Reparatur' },
] as const;

export const todoListSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100, 'Name ist zu lang'),
  description: z.string().max(500, 'Beschreibung ist zu lang').optional(),
  icon: z.string(),
  isShared: z.boolean(),
  visibleToIds: z.array(z.string()).optional(), // Member IDs who can see this list
});

export const todoItemSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').max(200, 'Titel ist zu lang'),
  description: z.string().max(1000, 'Beschreibung ist zu lang').optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH']).default('NORMAL'),
  assignedToId: z.string().optional(),
  listId: z.string(),
});

export type TodoListInput = z.infer<typeof todoListSchema>;
export type TodoItemInput = z.infer<typeof todoItemSchema>;
