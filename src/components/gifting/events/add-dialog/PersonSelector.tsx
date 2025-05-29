
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { AddEventFormValues, PersonContact } from "./types";

interface PersonSelectorProps {
  form: UseFormReturn<AddEventFormValues>;
  connectedPeople: PersonContact[];
  validationError?: string;
}

const PersonSelector = ({ form, connectedPeople, validationError }: PersonSelectorProps) => {
  return (
    <FormField
      control={form.control}
      name="personName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Person's Name</FormLabel>
          <FormControl>
            <Input 
              placeholder="Enter person's name" 
              {...field} 
              className={validationError ? 'border-red-500' : ''}
            />
          </FormControl>
          {validationError && (
            <p className="text-sm text-red-500">{validationError}</p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default PersonSelector;
