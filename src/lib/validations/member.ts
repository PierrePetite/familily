import { z } from 'zod';

export const memberSchema = z.object({
  name: z
    .string()
    .min(2, 'Name muss mindestens 2 Zeichen haben')
    .max(50, 'Name darf maximal 50 Zeichen haben'),
  email: z
    .string()
    .email('Bitte eine gültige E-Mail-Adresse eingeben')
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(8, 'Passwort muss mindestens 8 Zeichen haben')
    .optional()
    .or(z.literal('')),
  birthdate: z.string().optional().or(z.literal('')),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Ungültiges Farbformat'),
  role: z.enum(['ADMIN', 'ADULT', 'CHILD', 'MEMBER']),
});

export const createMemberSchema = memberSchema;

export const updateMemberSchema = memberSchema.partial().extend({
  id: z.string(),
});

export type MemberFormData = z.infer<typeof memberSchema>;
export type CreateMemberData = z.infer<typeof createMemberSchema>;
export type UpdateMemberData = z.infer<typeof updateMemberSchema>;

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator',
  ADULT: 'Erwachsener',
  CHILD: 'Kind',
  MEMBER: 'Mitglied',
};

export const MEMBER_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
];
