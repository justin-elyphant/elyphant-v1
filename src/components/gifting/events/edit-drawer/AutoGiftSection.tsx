
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Gift, DollarSign } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

interface AutoGiftSectionProps {
  form: UseFormReturn<any>;
}

const AutoGiftSection = ({ form }: AutoGiftSectionProps) => {
  const autoGiftEnabled = form.watch("autoGiftEnabled");

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Auto-Gifting</h3>
      
      <FormField
        control={form.control}
        name="autoGiftEnabled"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base flex items-center">
                <Gift className="h-4 w-4 mr-2" />
                Enable Auto-Gifting
              </FormLabel>
              <div className="text-sm text-muted-foreground">
                Automatically send a gift on this date
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

      {autoGiftEnabled && (
        <FormField
          control={form.control}
          name="autoGiftAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Gift Budget
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="50"
                  min="1"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};

export default AutoGiftSection;
