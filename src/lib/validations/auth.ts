import { z } from 'zod';

export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Aktuelles Passwort ist erforderlich'),
  newPassword: z
    .string()
    .min(8, 'Passwort muss mindestens 8 Zeichen haben')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Passwort muss Groß-/Kleinbuchstaben und eine Zahl enthalten'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
