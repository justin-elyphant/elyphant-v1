
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { AddEventFormValues } from "./types";

interface PrivacySelectorProps {
  form: UseFormReturn<AddEventFormValues>;
}

const PrivacySelector = ({ form }: PrivacySelectorProps) => {
  const watchPrivacyLevel = form.watch("privacyLevel");

  return (
    <FormField
      control={form.control}
      name="privacyLevel"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Privacy Level</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select privacy level" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="private">
                Private (Only you can see)
              </SelectItem>
              <SelectItem value="shared">
                Shared (Only with connected users)
              </SelectItem>
              <SelectItem value="public">
                Public (Visible to all)
              </SelectItem>
            </SelectContent>
          </Select>
          <FormDescription>
            Controls who can see this event. Shared events are verified with connected users.
          </FormDescription>
          {watchPrivacyLevel === "shared" && (
            <FormDescription className="text-amber-600">
              Only the event type and date will be shared. Person's name remains private.
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default PrivacySelector;
