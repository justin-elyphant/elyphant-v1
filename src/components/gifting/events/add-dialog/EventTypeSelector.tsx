
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { AddEventFormValues } from "./types";

interface EventTypeSelectorProps {
  form: UseFormReturn<AddEventFormValues>;
  eventTypes: Array<{ value: string; label: string }>;
}

const EventTypeSelector = ({ form, eventTypes }: EventTypeSelectorProps) => {
  return (
    <FormField
      control={form.control}
      name="eventType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Event Type</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
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
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default EventTypeSelector;
