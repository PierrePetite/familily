'use client';

import { useState, useCallback } from 'react';

export interface SetupData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  familyName: string;
}

const initialData: SetupData = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  familyName: '',
};

export function useSetupWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<SetupData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 3;

  const updateData = useCallback((updates: Partial<SetupData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    setStep((prev) => Math.min(prev + 1, totalSteps));
  }, []);

  const prevStep = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToStep = useCallback((targetStep: number) => {
    setStep(Math.max(1, Math.min(targetStep, totalSteps)));
  }, []);

  const reset = useCallback(() => {
    setStep(1);
    setData(initialData);
    setError(null);
    setIsSubmitting(false);
  }, []);

  return {
    step,
    totalSteps,
    data,
    isSubmitting,
    setIsSubmitting,
    error,
    setError,
    updateData,
    nextStep,
    prevStep,
    goToStep,
    reset,
  };
}
