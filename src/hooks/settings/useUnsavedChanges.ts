import { useEffect, useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { SettingsFormValues } from "./settingsFormSchema";

export const useUnsavedChanges = (form: UseFormReturn<SettingsFormValues>) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialValues, setInitialValues] = useState<SettingsFormValues | null>(null);

  // Track form changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (!initialValues) return;
      
      // Skip auto-saved fields
      if (name === "interests" || name === "importantDates") return;
      
      // Check if current values differ from initial values
      const hasChanges = JSON.stringify(value) !== JSON.stringify(initialValues);
      setHasUnsavedChanges(hasChanges);
    });
    
    return () => subscription.unsubscribe();
  }, [form, initialValues]);

  // Set initial values when form is populated
  const setInitialFormValues = useCallback((values: SettingsFormValues) => {
    setInitialValues(values);
    setHasUnsavedChanges(false);
  }, []);

  // Clear unsaved changes after successful save
  const clearUnsavedChanges = useCallback(() => {
    setInitialValues(form.getValues());
    setHasUnsavedChanges(false);
  }, [form]);

  // Browser warning for unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return {
    hasUnsavedChanges,
    setInitialFormValues,
    clearUnsavedChanges
  };
};