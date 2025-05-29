
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { AddEventFormValues } from "./types";

interface EventTypeSelectorProps {
  form: UseFormReturn<AddEventFormValues>;
  eventTypes: { value: string; label: string }[];
  validationError?: string;
}

const EventTypeSelector = ({ form, eventTypes, validationError }: EventTypeSelectorProps) => {
  return (
    <FormField
      control={form.control}
      name="eventType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Event Type</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger className={validationError ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {eventTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {validationError && (
            <p className="text-sm text-red-500">{validationError}</p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default EventTypeSelector;
