
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { AddEventFormValues } from "./types";

interface GiftBudgetInputProps {
  form: UseFormReturn<AddEventFormValues>;
  validationError?: string;
}

const GiftBudgetInput = ({ form, validationError }: GiftBudgetInputProps) => {
  return (
    <FormField
      control={form.control}
      name="autoGiftAmount"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Gift Budget ($)</FormLabel>
          <FormControl>
            <Input 
              type="number" 
              placeholder="50" 
              min="1"
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

export default GiftBudgetInput;
