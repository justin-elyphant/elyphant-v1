
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from "react-hook-form";
import { AddEventFormValues } from "./types";

interface AutoGiftToggleProps {
  form: UseFormReturn<AddEventFormValues>;
}

const AutoGiftToggle = ({ form }: AutoGiftToggleProps) => {
  return (
    <FormField
      control={form.control}
      name="autoGift"
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel className="text-base">Automated Gifting</FormLabel>
            <FormDescription>
              Automatically send a gift when this event occurs
            </FormDescription>
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
  );
};

export default AutoGiftToggle;
