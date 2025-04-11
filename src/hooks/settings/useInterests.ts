
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { SettingsFormValues } from "./settingsFormSchema";

export const useInterests = (form: UseFormReturn<SettingsFormValues>) => {
  const [newInterest, setNewInterest] = useState("");

  const handleAddInterest = () => {
    if (!newInterest.trim()) return;
    const currentInterests = form.getValues("interests");
    if (!currentInterests.includes(newInterest.trim())) {
      form.setValue("interests", [...currentInterests, newInterest.trim()]);
    }
    setNewInterest("");
  };

  const handleRemoveInterest = (index: number) => {
    const currentInterests = form.getValues("interests");
    form.setValue(
      "interests", 
      currentInterests.filter((_, i) => i !== index)
    );
  };

  return {
    newInterest,
    setNewInterest,
    handleAddInterest,
    handleRemoveInterest
  };
};
