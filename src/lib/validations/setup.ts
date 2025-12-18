import { z } from 'zod';

export const adminSchema = z.object({
  name: z
    .string()
    .min(2, 'Name muss mindestens 2 Zeichen haben')
    .max(50, 'Name darf maximal 50 Zeichen haben'),
  email: z
    .string()
    .email('Bitte eine gültige E-Mail-Adresse eingeben'),
  password: z
    .string()
    .min(8, 'Passwort muss mindestens 8 Zeichen haben')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Passwort muss Groß-/Kleinbuchstaben und eine Zahl enthalten'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
});

export const familySchema = z.object({
  familyName: z
    .string()
    .min(2, 'Familienname muss mindestens 2 Zeichen haben')
    .max(50, 'Familienname darf maximal 50 Zeichen haben'),
});

export const setupSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  familyName: z.string().min(2).max(50),
});

export type AdminFormData = z.infer<typeof adminSchema>;
export type FamilyFormData = z.infer<typeof familySchema>;
export type SetupData = z.infer<typeof setupSchema>;
