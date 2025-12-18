'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  memberSchema,
  type MemberFormData,
  ROLE_LABELS,
  MEMBER_COLORS,
} from '@/lib/validations/member';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface MemberFormProps {
  defaultValues?: Partial<MemberFormData>;
  onSubmit: (data: MemberFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  isEdit?: boolean;
}

export function MemberForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
  isEdit = false,
}: MemberFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      birthdate: '',
      color: MEMBER_COLORS[0],
      role: 'MEMBER',
      ...defaultValues,
    },
  });

  const selectedColor = watch('color');
  const selectedRole = watch('role');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          placeholder="Max Mustermann"
          {...register('name')}
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-Mail (optional)</Label>
        <Input
          id="email"
          type="email"
          placeholder="max@example.com"
          {...register('email')}
          className={errors.email ? 'border-destructive' : ''}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Mit E-Mail kann sich das Mitglied selbst anmelden
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          {isEdit ? 'Neues Passwort (leer lassen um nicht zu ändern)' : 'Passwort (optional)'}
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder={isEdit ? 'Neues Passwort' : 'Passwort'}
            {...register('password')}
            className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthdate">Geburtsdatum (optional)</Label>
        <Input
          id="birthdate"
          type="date"
          {...register('birthdate')}
          className={errors.birthdate ? 'border-destructive' : ''}
        />
      </div>

      <div className="space-y-2">
        <Label>Rolle</Label>
        <Select
          value={selectedRole}
          onValueChange={(value) => setValue('role', value as MemberFormData['role'])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Rolle auswählen" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Farbe</Label>
        <div className="flex gap-2 flex-wrap">
          {MEMBER_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue('color', color)}
              className={`w-8 h-8 rounded-full border-2 transition-transform ${
                selectedColor === color
                  ? 'border-foreground scale-110'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <input type="hidden" {...register('color')} />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Abbrechen
        </Button>
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEdit ? 'Wird gespeichert...' : 'Wird erstellt...'}
            </>
          ) : (
            isEdit ? 'Speichern' : 'Hinzufügen'
          )}
        </Button>
      </div>
    </form>
  );
}
