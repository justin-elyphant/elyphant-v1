
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { SettingsFormValues, ImportantDate } from "@/hooks/settings/settingsFormSchema";
import { NewImportantDateState } from "@/hooks/settings/useImportantDates";
import { MonthDayPicker } from "@/components/ui/month-day-picker";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Calendar } from "lucide-react";

interface ImportantDatesFormSectionProps {
  form: UseFormReturn<SettingsFormValues>;
  newImportantDate: NewImportantDateState;
  setNewImportantDate: (date: NewImportantDateState) => void;
  handleAddImportantDate: () => void;
  handleRemoveImportantDate: (index: number) => void;
}

const ImportantDatesFormSection: React.FC<ImportantDatesFormSectionProps> = ({
  form,
  newImportantDate,
  setNewImportantDate,
  handleAddImportantDate,
  handleRemoveImportantDate
}) => {
  const importantDates = form.watch("importantDates") || [];

  const formatDateDisplay = (date: Date) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  const handleDateChange = (value: { month: number; day: number } | null) => {
    if (value) {
      // Create a date object using the month/day - year doesn't matter for important dates
      const date = new Date(2000, value.month - 1, value.day);
      setNewImportantDate({
        ...newImportantDate,
        date
      });
    } else {
      setNewImportantDate({
        ...newImportantDate,
        date: undefined
      });
    }
  };

  const getMonthDayFromDate = (date: Date): { month: number; day: number } => {
    return {
      month: date.getMonth() + 1,
      day: date.getDate()
    };
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-base font-medium">Important Dates</h4>
        <p className="text-sm text-muted-foreground">
          Add birthdays, anniversaries, and other special occasions.
        </p>
      </div>

      {/* Current Important Dates */}
      {importantDates.length > 0 && (
        <div className="space-y-2">
          <FormLabel>Your Important Dates</FormLabel>
          <div className="space-y-2">
            {importantDates.map((date, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{date.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateDisplay(date.date)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveImportantDate(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Important Date */}
      <div className="space-y-3">
        <FormLabel>Add Important Date</FormLabel>
        <div className="grid gap-3">
          <div>
            <FormLabel className="text-sm">Date</FormLabel>
            <MonthDayPicker
              value={newImportantDate.date ? getMonthDayFromDate(newImportantDate.date) : null}
              onChange={handleDateChange}
              placeholder="Select date"
            />
          </div>
          <div>
            <FormLabel className="text-sm">Description</FormLabel>
            <Input
              placeholder="e.g., Wedding Anniversary, Mom's Birthday, Christmas"
              value={newImportantDate.description}
              onChange={(e) => setNewImportantDate({
                ...newImportantDate,
                description: e.target.value
              })}
            />
          </div>
          <Button
            type="button"
            onClick={handleAddImportantDate}
            disabled={!newImportantDate.date || !newImportantDate.description.trim()}
            variant="outline"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Important Date
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImportantDatesFormSection;
