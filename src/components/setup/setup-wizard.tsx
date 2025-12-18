'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSetupWizard } from '@/hooks/use-setup-wizard';
import { WelcomeStep } from './steps/welcome-step';
import { AdminStep } from './steps/admin-step';
import { FamilyStep } from './steps/family-step';
import { Calendar } from 'lucide-react';

export function SetupWizard() {
  const router = useRouter();
  const wizard = useSetupWizard();

  const handleComplete = async () => {
    wizard.setIsSubmitting(true);
    wizard.setError(null);

    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: wizard.data.name,
          email: wizard.data.email,
          password: wizard.data.password,
          familyName: wizard.data.familyName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Setup fehlgeschlagen');
      }

      router.push('/login?setup=success');
    } catch (error) {
      wizard.setError(error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten');
    } finally {
      wizard.setIsSubmitting(false);
    }
  };

  const progressValue = ((wizard.step - 1) / (wizard.totalSteps - 1)) * 100;

  return (
    <Card className="shadow-xl">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Calendar className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Willkommen bei Familily</CardTitle>
        <CardDescription>
          Richte deinen Familienkalender in wenigen Schritten ein
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Schritt {wizard.step} von {wizard.totalSteps}</span>
            <span>{Math.round(progressValue)}%</span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        {wizard.error && (
          <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {wizard.error}
          </div>
        )}

        {wizard.step === 1 && (
          <WelcomeStep onNext={wizard.nextStep} />
        )}

        {wizard.step === 2 && (
          <AdminStep
            data={wizard.data}
            onUpdate={wizard.updateData}
            onNext={wizard.nextStep}
            onBack={wizard.prevStep}
          />
        )}

        {wizard.step === 3 && (
          <FamilyStep
            data={wizard.data}
            onUpdate={wizard.updateData}
            onBack={wizard.prevStep}
            onComplete={handleComplete}
            isSubmitting={wizard.isSubmitting}
          />
        )}
      </CardContent>
    </Card>
  );
}
