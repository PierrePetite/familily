'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle2, Lock, Users } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const features = [
    {
      icon: Users,
      title: 'Für die ganze Familie',
      description: 'Termine für alle Familienmitglieder an einem Ort',
    },
    {
      icon: Lock,
      title: 'Volle Kontrolle',
      description: 'Deine Daten bleiben auf deinem Server',
    },
    {
      icon: CheckCircle2,
      title: 'Einfach zu bedienen',
      description: 'Intuitive Oberfläche für Groß und Klein',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {features.map((feature, index) => (
          <div key={index} className="flex gap-4 items-start">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <feature.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      <Button onClick={onNext} className="w-full" size="lg">
        Einrichtung starten
      </Button>
    </div>
  );
}
