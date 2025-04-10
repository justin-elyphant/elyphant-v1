
import { useState } from "react";
import { ImportantDateType } from "../types";

export const useImportantDatesManager = (initialDates: ImportantDateType[] = []) => {
  const [importantDates, setImportantDates] = useState<ImportantDateType[]>(initialDates);

  // Handle adding an important date
  const addImportantDate = (date: ImportantDateType) => {
    if (!date.date || !date.description.trim()) return;
    setImportantDates(prev => [...prev, {
      date: date.date,
      description: date.description.trim()
    }]);
    return importantDates;
  };

  // Handle removing an important date
  const removeImportantDate = (index: number) => {
    setImportantDates(prev => prev.filter((_, i) => i !== index));
    return importantDates;
  };

  return {
    importantDates,
    setImportantDates,
    addImportantDate,
    removeImportantDate
  };
};
