import { useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { SettingsFormValues, ImportantDate } from "./settingsFormSchema";
import { ImportantDate as ProfileImportantDate } from "@/types/profile";

export interface NewImportantDateState {
  date: Date | undefined;
  description: string;
}

export const useAutoSaveImportantDates = (form: UseFormReturn<SettingsFormValues>) => {
  const [newImportantDate, setNewImportantDate] = useState<NewImportantDateState>({
    date: undefined,
    description: ""
  });
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const { updateProfile } = useProfile();

  const autoSaveImportantDates = useCallback(async (dates: ImportantDate[]) => {
    try {
      setIsAutoSaving(true);
      
      // Convert form format to profile format
      const profileDates: ProfileImportantDate[] = dates.map(date => ({
        title: date.description,
        date: date.date.toISOString(),
        type: 'custom'
      }));
      
      await updateProfile({ important_dates: profileDates });
      toast.success("Important date saved automatically");
    } catch (error) {
      console.error("Auto-save failed:", error);
      toast.error("Failed to save important date");
    } finally {
      setIsAutoSaving(false);
    }
  }, [updateProfile]);

  const handleAddImportantDate = useCallback(async () => {
    if (!newImportantDate.date || !newImportantDate.description.trim()) return;
    
    const currentDates = form.getValues("importantDates");
    
    const newDate: ImportantDate = {
      date: newImportantDate.date,
      description: newImportantDate.description.trim()
    };
    
    const newDates = [...currentDates, newDate];
    form.setValue("importantDates", newDates);
    
    // Filter out invalid dates and call auto-save
    const validDates = newDates.filter((date): date is ImportantDate => 
      date.date !== undefined && date.description !== undefined
    );
    await autoSaveImportantDates(validDates);
    
    setNewImportantDate({
      date: undefined,
      description: ""
    });
  }, [newImportantDate, form, autoSaveImportantDates]);

  const handleRemoveImportantDate = useCallback(async (index: number) => {
    const currentDates = form.getValues("importantDates");
    const newDates = currentDates.filter((_, i) => i !== index);
    form.setValue("importantDates", newDates);
    
    // Filter out invalid dates and call auto-save
    const validDates = newDates.filter((date): date is ImportantDate => 
      date.date !== undefined && date.description !== undefined
    );
    await autoSaveImportantDates(validDates);
  }, [form, autoSaveImportantDates]);

  return {
    newImportantDate,
    setNewImportantDate,
    handleAddImportantDate,
    handleRemoveImportantDate,
    isAutoSaving
  };
};