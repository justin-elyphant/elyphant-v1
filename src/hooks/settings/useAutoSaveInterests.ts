import { useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { SettingsFormValues } from "./settingsFormSchema";

export const useAutoSaveInterests = (form: UseFormReturn<SettingsFormValues>) => {
  const [newInterest, setNewInterest] = useState("");
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const { updateProfile } = useProfile();

  const autoSaveInterests = useCallback(async (interests: string[]) => {
    try {
      setIsAutoSaving(true);
      await updateProfile({ interests });
      toast.success("Interest saved automatically");
    } catch (error) {
      console.error("Auto-save failed:", error);
      toast.error("Failed to save interest");
    } finally {
      setIsAutoSaving(false);
    }
  }, [updateProfile]);

  const handleAddInterest = useCallback(async () => {
    if (!newInterest.trim()) return;
    
    const currentInterests = form.getValues("interests");
    if (!currentInterests.includes(newInterest.trim())) {
      const newInterests = [...currentInterests, newInterest.trim()];
      form.setValue("interests", newInterests);
      await autoSaveInterests(newInterests);
    }
    setNewInterest("");
  }, [newInterest, form, autoSaveInterests]);

  const handleRemoveInterest = useCallback(async (index: number) => {
    const currentInterests = form.getValues("interests");
    const newInterests = currentInterests.filter((_, i) => i !== index);
    form.setValue("interests", newInterests);
    await autoSaveInterests(newInterests);
  }, [form, autoSaveInterests]);

  return {
    newInterest,
    setNewInterest,
    handleAddInterest,
    handleRemoveInterest,
    isAutoSaving
  };
};