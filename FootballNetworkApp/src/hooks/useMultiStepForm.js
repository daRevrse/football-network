// ====== src/hooks/useMultiStepForm.js ======
import { useState, useCallback } from 'react';

export const useMultiStepForm = steps => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === steps.length;

  const updateField = useCallback(
    (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      // Clear error when field is updated
      if (errors[field]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors],
  );

  const setFieldErrors = useCallback(fieldErrors => {
    setErrors(fieldErrors);
  }, []);

  const nextStep = useCallback(() => {
    if (!isLastStep) {
      setCurrentStep(prev => prev + 1);
      setErrors({});
    }
  }, [isLastStep]);

  const previousStep = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
      setErrors({});
    }
  }, [isFirstStep]);

  const goToStep = useCallback(
    step => {
      if (step >= 1 && step <= steps.length) {
        setCurrentStep(step);
        setErrors({});
      }
    },
    [steps.length],
  );

  const reset = useCallback(() => {
    setCurrentStep(1);
    setFormData({});
    setErrors({});
  }, []);

  return {
    currentStep,
    formData,
    errors,
    isFirstStep,
    isLastStep,
    updateField,
    setFieldErrors,
    nextStep,
    previousStep,
    goToStep,
    reset,
  };
};
