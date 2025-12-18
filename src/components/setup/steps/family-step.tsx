'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { familySchema, type FamilyFormData } from '@/lib/validations/setup';
import { type SetupData } from '@/hooks/use-setup-wizard';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';

interface FamilyStepProps {
  data: SetupData;
  onUpdate: (updates: Partial<SetupData>) => void;
  onBack: () => void;
  onComplete: () => void;
  isSubmitting: boolean;
}

export function FamilyStep({
  data,
  onUpdate,
  onBack,
  onComplete,
  isSubmitting,
}: FamilyStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FamilyFormData>({
    resolver: zodResolver(familySchema),
    defaultValues: {
      familyName: data.familyName,
    },
  });

  const onSubmit = (formData: FamilyFormData) => {
    onUpdate(formData);
    onComplete();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="familyName">Familienname</Label>
        <Input
          id="familyName"
          placeholder="Familie Mustermann"
          {...register('familyName')}
          className={errors.familyName ? 'border-destructive' : ''}
          disabled={isSubmitting}
        />
        {errors.familyName && (
          <p className="text-sm text-destructive">{errors.familyName.message}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Dieser Name wird im Kalender angezeigt
        </p>
      </div>

      <div className="rounded-lg border bg-muted/50 p-4">
        <h4 className="font-medium mb-2">Zusammenfassung</h4>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Admin:</dt>
            <dd>{data.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">E-Mail:</dt>
            <dd>{data.email}</dd>
          </div>
        </dl>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Wird erstellt...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Abschließen
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
