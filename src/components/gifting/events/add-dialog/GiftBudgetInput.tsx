
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { AddEventFormValues } from "./types";

interface GiftBudgetInputProps {
  form: UseFormReturn<AddEventFormValues>;
}

const GiftBudgetInput = ({ form }: GiftBudgetInputProps) => {
  return (
    <FormField
      control={form.control}
      name="autoGiftAmount"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Gift Budget</FormLabel>
          <FormControl>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <Input 
                type="number" 
                placeholder="0.00" 
                className="pl-7" 
                {...field}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default GiftBudgetInput;
