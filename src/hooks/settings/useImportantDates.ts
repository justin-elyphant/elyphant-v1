
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { SettingsFormValues } from "./settingsFormSchema";

// Define the NewImportantDateState interface
export interface NewImportantDateState {
  date: Date | undefined;
  description: string;
}

export const useImportantDates = (form: UseFormReturn<SettingsFormValues>) => {
  const [newImportantDate, setNewImportantDate] = useState<NewImportantDateState>({
    date: undefined,
    description: ""
  });

  const handleAddImportantDate = () => {
    if (!newImportantDate.date || !newImportantDate.description.trim()) return;
    
    const currentDates = form.getValues("importantDates");
    
    // Create a properly typed ImportantDate object
    const newDate: {date: Date, description: string} = {
      date: newImportantDate.date,
      description: newImportantDate.description.trim()
    };
    
    // Add the new date to the form
    form.setValue("importantDates", [...currentDates, newDate]);
    
    // Reset the form
    setNewImportantDate({
      date: undefined,
      description: ""
    });
  };

  const handleRemoveImportantDate = (index: number) => {
    const currentDates = form.getValues("importantDates");
    form.setValue(
      "importantDates", 
      currentDates.filter((_, i) => i !== index)
    );
  };

  return {
    newImportantDate,
    setNewImportantDate,
    handleAddImportantDate,
    handleRemoveImportantDate
  };
};
