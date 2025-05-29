
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { Repeat } from "lucide-react";

interface RecurringSectionProps {
  form: UseFormReturn<any>;
}

const RecurringSection = ({ form }: RecurringSectionProps) => {
  const isRecurring = form.watch("isRecurring");

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Recurring Settings</h3>
      
      <FormField
        control={form.control}
        name="isRecurring"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base flex items-center">
                <Repeat className="h-4 w-4 mr-2" />
                Recurring Event
              </FormLabel>
              <div className="text-sm text-muted-foreground">
                Automatically create this event every year
              </div>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {isRecurring && (
        <FormField
          control={form.control}
          name="recurringType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recurring Frequency</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select how often this repeats" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="yearly">Every Year</SelectItem>
                  <SelectItem value="monthly">Every Month</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};

export default RecurringSection;
